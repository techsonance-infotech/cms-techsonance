import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: offers, error } = await supabase
    .from('recruitment_offers')
    .select('*, job_applications(*, candidate_profiles(*))')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Insert seed offer letters if empty
  if (!offers || offers.length === 0) {
    const { data: apps } = await supabase
      .from('job_applications')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('current_stage', 'Offer');

    if (apps && apps.length > 0) {
      const seeds = [
        {
          tenant_id: tenantId,
          application_id: apps[0].id,
          base_salary: 1750000.00,
          joining_date: '2026-09-01',
          status: 'Pending Approval',
          approval_chain: [
            { approver: 'HR Manager', status: 'Approved' },
            { approver: 'VP of Engineering', status: 'Pending' }
          ],
          created_by: context.auth!.user.id
        }
      ];

      const { data: inserted, error: insertErr } = await supabase
        .from('recruitment_offers')
        .insert(seeds)
        .select('*, job_applications(*, candidate_profiles(*))');

      if (!insertErr && inserted) {
        offers = inserted;
      }
    }
  }

  return NextResponse.json({ success: true, data: offers });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { applicationId, baseSalary, joiningDate, status, approvalChain } = body;

  if (!applicationId || !baseSalary || !joiningDate) {
    throw new BadRequestError('Missing applicationId, baseSalary, or joiningDate');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('recruitment_offers')
    .insert({
      tenant_id: tenantId,
      application_id: applicationId,
      base_salary: baseSalary,
      joining_date: joiningDate,
      status: status || 'Draft',
      approval_chain: approvalChain || [],
      created_by: context.auth!.user.id
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { offerId, status } = body;

  if (!offerId || !status) {
    throw new BadRequestError('Missing offerId or status');
  }

  const supabase = getAdminRouteSupabase();

  // 1. Update the offer status
  const { data, error } = await supabase
    .from('recruitment_offers')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', offerId)
    .eq('tenant_id', tenantId)
    .select('*, job_applications(*, candidate_profiles(*))')
    .single();

  if (error) throw error;

  // 2. Integration: If offer is 'Accepted', automatically convert the candidate to 'Preboarding' stage
  if (status === 'Accepted' && data && data.application_id) {
    await supabase
      .from('job_applications')
      .update({
        current_stage: 'Preboarding',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.application_id)
      .eq('tenant_id', tenantId);

    if (data.job_applications?.candidate_id) {
      await supabase
        .from('candidate_profiles')
        .update({
          status: 'Hired',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.job_applications.candidate_id)
        .eq('tenant_id', tenantId);
    }
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
