import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: requests, error } = await supabase
    .from('purchase_requests')
    .select('*, requester:requested_by(first_name, last_name, email)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Auto-seed sample vendors and requests if empty
  if (!requests || requests.length === 0) {
    // 1. Seed vendors first
    const vendorEmail = 'sales@hp-enterprise.com';
    let vendorId = '';

    const { data: existingVendor } = await supabase
      .from('procurement_vendors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('contact_email', vendorEmail)
      .maybeSingle();

    if (existingVendor) {
      vendorId = existingVendor.id;
    } else {
      const { data: newVendor } = await supabase
        .from('procurement_vendors')
        .insert({
          tenant_id: tenantId,
          name: 'HP Enterprise India',
          contact_email: vendorEmail,
          phone: '+91 80 4125 4000',
          address: 'EPIP Zone, Whitefield, Bangalore, India',
          payment_terms: 'Net 30'
        })
        .select('id')
        .single();
      if (newVendor) vendorId = newVendor.id;
    }

    // 2. Seed requests
    const requesterUuid = await resolveActorUuid(context, supabase);
    const seeds = [
      {
        tenant_id: tenantId,
        requested_by: requesterUuid,
        item_name: 'HP ProBook 445 G10 Laptops',
        quantity: 5,
        estimated_cost: 325000.00,
        justification: 'Required for Q3 developer internship batches',
        status: 'Approved'
      },
      {
        tenant_id: tenantId,
        requested_by: requesterUuid,
        item_name: 'Cisco 24-Port Gigabit Switch',
        quantity: 2,
        estimated_cost: 95000.00,
        justification: 'Server room networking switch replacement',
        status: 'Pending'
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('purchase_requests')
      .insert(seeds)
      .select('*, requester:requested_by(first_name, last_name, email)');

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
  const { itemName, quantity, estimatedCost, justification } = body;

  if (!itemName || !quantity || !estimatedCost) {
    throw new BadRequestError('Missing required purchase request parameters');
  }

  const supabase = getAdminRouteSupabase();
  const requesterUuid = await resolveActorUuid(context, supabase);

  const { data, error } = await supabase
    .from('purchase_requests')
    .insert({
      tenant_id: tenantId,
      requested_by: requesterUuid,
      item_name: itemName,
      quantity: parseInt(quantity) || 1,
      estimated_cost: parseFloat(estimatedCost) || 0,
      justification,
      status: 'Pending'
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
  const { requestId, status } = body;

  if (!requestId || !status) {
    throw new BadRequestError('Missing requestId or status');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('purchase_requests')
    .update({ status })
    .eq('id', requestId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
