import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: orders, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_request:purchase_request_id(*), vendor:vendor_id(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Seed sample PO if empty and approved request exists
  if (!orders || orders.length === 0) {
    const { data: approvedReq } = await supabase
      .from('purchase_requests')
      .select('id, estimated_cost')
      .eq('tenant_id', tenantId)
      .eq('status', 'Approved')
      .maybeSingle();

    const { data: vendor } = await supabase
      .from('procurement_vendors')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (approvedReq && vendor) {
      const poNum = 'PO-2026-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: inserted, error: insertErr } = await supabase
        .from('purchase_orders')
        .insert({
          tenant_id: tenantId,
          purchase_request_id: approvedReq.id,
          vendor_id: vendor.id,
          po_number: poNum,
          total_amount: approvedReq.estimated_cost,
          status: 'Sent'
        })
        .select('*, purchase_request:purchase_request_id(*), vendor:vendor_id(*)');

      if (!insertErr && inserted) {
        orders = inserted;

        // Also update request to 'Ordered'
        await supabase
          .from('purchase_requests')
          .update({ status: 'Ordered' })
          .eq('id', approvedReq.id);
      }
    }
  }

  return NextResponse.json({ success: true, data: orders });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { purchaseRequestId, vendorId, totalAmount } = body;

  if (!purchaseRequestId || !vendorId || !totalAmount) {
    throw new BadRequestError('Missing purchaseRequestId, vendorId, or totalAmount');
  }

  const supabase = getAdminRouteSupabase();

  const poNumber = 'PO-2026-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      tenant_id: tenantId,
      purchase_request_id: purchaseRequestId,
      vendor_id: vendorId,
      po_number: poNumber,
      total_amount: totalAmount,
      status: 'Sent'
    })
    .select('*')
    .single();

  if (error) throw error;

  // Update original request to Ordered status
  await supabase
    .from('purchase_requests')
    .update({ status: 'Ordered' })
    .eq('id', purchaseRequestId);

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
