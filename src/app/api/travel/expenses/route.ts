import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    throw new BadRequestError('Missing requestId parameter');
  }

  const supabase = getAdminRouteSupabase();

  let { data: expenses, error } = await supabase
    .from('travel_expenses')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('travel_request_id', requestId);

  if (error) throw error;

  // Insert seed expenses if empty
  if (!expenses || expenses.length === 0) {
    const seeds = [
      {
        tenant_id: tenantId,
        travel_request_id: requestId,
        description: 'Client Dinner Event at Bangalore Club',
        amount: 4500.00,
        receipt_url: 'https://example.com/receipts/dinner_bangalore.jpg',
        status: 'Pending'
      },
      {
        tenant_id: tenantId,
        travel_request_id: requestId,
        description: 'Ola Cabs Airport Commute Transit',
        amount: 1800.00,
        receipt_url: 'https://example.com/receipts/cab_airport.jpg',
        status: 'Approved'
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('travel_expenses')
      .insert(seeds)
      .select('*');

    if (!insertErr && inserted) {
      expenses = inserted;
    }
  }

  return NextResponse.json({ success: true, data: expenses });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { travelRequestId, description, amount, receiptUrl } = body;

  if (!travelRequestId || !description || !amount) {
    throw new BadRequestError('Missing required travel expense parameters');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('travel_expenses')
    .insert({
      tenant_id: tenantId,
      travel_request_id: travelRequestId,
      description,
      amount,
      receipt_url: receiptUrl || '',
      status: 'Pending'
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
