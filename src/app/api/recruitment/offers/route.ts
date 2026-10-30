import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();
  const creatorUuid = await resolveActorUuid(context, supabase);

  // 1. Find all candidate applications currently in 'Offer' or 'Preboarding' stage
  const { data: offerApps } = await supabase
    .from('job_applications')
    .select('id, job_requisitions(title, salary_range_min, salary_range_max)')
    .eq('tenant_id', tenantId)
    .in('current_stage', ['Offer', 'Preboarding']);

  // 2. Query existing offers
  let { data: offers, error } = await supabase
    .from('recruitment_offers')
    .select('*, job_applications(*, candidate_profiles(*), job_requisitions(*))')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // 3. Auto-sync: Ensure every candidate application moved to 'Offer' has an active offer record
  if (offerApps && offerApps.length > 0) {
    const existingAppIds = new Set((offers || []).map((o: any) => o.application_id));
    const missingApps = offerApps.filter((app: any) => !existingAppIds.has(app.id));

    if (missingApps.length > 0) {
      const newOffers = missingApps.map((app: any) => {
        const baseSalary = app.job_requisitions?.salary_range_max || app.job_requisitions?.salary_range_min || 1650000.00;
        const joiningDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        return {
          tenant_id: tenantId,
          application_id: app.id,
          base_salary: baseSalary,
          joining_date: joiningDate,
          status: 'Pending Approval',
          approval_chain: [
            { approver: 'HR Manager', status: 'Approved' },
            { approver: 'VP of Engineering', status: 'Pending' }
          ],
          created_by: creatorUuid
        };
      });

      const { data: insertedNew, error: insertErr } = await supabase
        .from('recruitment_offers')
        .insert(newOffers)
        .select('*, job_applications(*, candidate_profiles(*), job_requisitions(*))');

      if (!insertErr && insertedNew) {
        offers = [...(offers || []), ...insertedNew];
      }
    }
  }

  // 4. Fallback seeding if table is completely empty and no candidate has been moved to Offer yet
  if (!offers || offers.length === 0) {
    const { data: anyApps } = await supabase
      .from('job_applications')
      .select('id, job_requisitions(salary_range_min, salary_range_max)')
      .eq('tenant_id', tenantId)
      .limit(1);

    if (anyApps && anyApps.length > 0) {
      const seeds = [
        {
          tenant_id: tenantId,
          application_id: anyApps[0].id,
          base_salary: anyApps[0].job_requisitions?.salary_range_max || 1750000.00,
          joining_date: '2026-09-01',
          status: 'Pending Approval',
          approval_chain: [
            { approver: 'HR Manager', status: 'Approved' },
            { approver: 'VP of Engineering', status: 'Pending' }
          ],
          created_by: creatorUuid
        }
      ];

      const { data: inserted, error: insertErr } = await supabase
        .from('recruitment_offers')
        .insert(seeds)
        .select('*, job_applications(*, candidate_profiles(*), job_requisitions(*))');

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
  const creatorUuid = await resolveActorUuid(context, supabase);

  const { data, error } = await supabase
    .from('recruitment_offers')
    .insert({
      tenant_id: tenantId,
      application_id: applicationId,
      base_salary: baseSalary,
      joining_date: joiningDate,
      status: status || 'Pending Approval',
      approval_chain: approvalChain || [
        { approver: 'HR Manager', status: 'Approved' },
        { approver: 'VP of Engineering', status: 'Pending' }
      ],
      created_by: creatorUuid
    })
    .select('*, job_applications(*, candidate_profiles(*), job_requisitions(*))')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { offerId, status, baseSalary, joiningDate } = body;

  if (!offerId) {
    throw new BadRequestError('Missing offerId');
  }

  const supabase = getAdminRouteSupabase();

  const updateFields: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (status) {
    updateFields.status = status;
    if (status === 'Approved') {
      const { data: cur } = await supabase
        .from('recruitment_offers')
        .select('approval_chain')
        .eq('id', offerId)
        .single();
      if (cur?.approval_chain && Array.isArray(cur.approval_chain)) {
        updateFields.approval_chain = cur.approval_chain.map((c: any) => ({
          ...c,
          status: 'Approved'
        }));
      }
    }
  }

  if (baseSalary !== undefined && baseSalary !== null) {
    updateFields.base_salary = baseSalary;
  }

  if (joiningDate) {
    updateFields.joining_date = joiningDate;
  }

  // 1. Update the offer
  const { data, error } = await supabase
    .from('recruitment_offers')
    .update(updateFields)
    .eq('id', offerId)
    .eq('tenant_id', tenantId)
    .select('*, job_applications(*, candidate_profiles(*), job_requisitions(*))')
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
