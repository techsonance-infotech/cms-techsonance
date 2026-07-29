import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: requests, error } = await supabase
    .from('travel_requests')
    .select('*, employee:employee_id(first_name, last_name, email)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Insert seed travel requests if empty
  if (!requests || requests.length === 0) {
    const seeds = [
      {
        tenant_id: tenantId,
        employee_id: context.auth!.user.id,
        destination: 'San Francisco, USA',
        purpose: 'Annual Partner Conference & Product Launch keynotes',
        departure_date: '2026-09-10',
        return_date: '2026-09-18',
        status: 'Pending',
        visa_required: true,
        visa_status: 'Pending',
        advance_amount: 80000.00,
        advance_status: 'Requested'
      },
      {
        tenant_id: tenantId,
        employee_id: context.auth!.user.id,
        destination: 'Bangalore, India',
        purpose: 'Workforce Onboarding & Team Alignment Meetups',
        departure_date: '2026-08-01',
        return_date: '2026-08-05',
        status: 'Approved',
        visa_required: false,
        visa_status: 'N/A',
        advance_amount: 15000.00,
        advance_status: 'Disbursed'
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('travel_requests')
      .insert(seeds)
      .select('*, employee:employee_id(first_name, last_name, email)');

    if (!insertErr && inserted) {
      requests = inserted;
    }
  }

  return NextResponse.json({ success: true, data: requests });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { destination, purpose, departureDate, returnDate, visaRequired, advanceAmount } = body;

  if (!destination || !purpose || !departureDate || !returnDate) {
    throw new BadRequestError('Missing required travel request parameters');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('travel_requests')
    .insert({
      tenant_id: tenantId,
      employee_id: context.auth!.user.id,
      destination,
      purpose,
      departure_date: departureDate,
      return_date: returnDate,
      status: 'Pending',
      visa_required: !!visaRequired,
      visa_status: visaRequired ? 'Pending' : 'N/A',
      advance_amount: advanceAmount || 0,
      advance_status: advanceAmount > 0 ? 'Requested' : 'N/A'
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
  const { requestId, status, visaStatus, advanceStatus } = body;

  if (!requestId) {
    throw new BadRequestError('Missing requestId parameter');
  }

  const supabase = getAdminRouteSupabase();

  let updateFields: any = {
    updated_at: new Date().toISOString()
  };
  if (status) updateFields.status = status;
  if (visaStatus) updateFields.visa_status = visaStatus;
  if (advanceStatus) updateFields.advance_status = advanceStatus;

  const { data, error } = await supabase
    .from('travel_requests')
    .update(updateFields)
    .eq('id', requestId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
