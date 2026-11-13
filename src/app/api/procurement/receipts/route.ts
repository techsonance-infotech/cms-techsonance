import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: receipts, error } = await supabase
    .from('goods_receipts')
    .select('*, purchase_order:purchase_order_id(*)')
    .eq('tenant_id', tenantId)
    .order('received_at', { ascending: false });

  if (error) throw error;

  // Seed sample receipt if empty and PO exists
  if (!receipts || receipts.length === 0) {
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('id, purchase_request:purchase_request_id(quantity)')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (po && po.purchase_request) {
      const receiverUuid = await resolveActorUuid(context, supabase);
      const { data: inserted, error: insertErr } = await supabase
        .from('goods_receipts')
        .insert({
          tenant_id: tenantId,
          purchase_order_id: po.id,
          received_by: receiverUuid,
          received_quantity: po.purchase_request.quantity,
          condition: 'Good'
        })
        .select('*, purchase_order:purchase_order_id(*)');

      if (!insertErr && inserted) {
        receipts = inserted;
      }
    }
  }

  return NextResponse.json({ success: true, data: receipts });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { purchaseOrderId, receivedQuantity, condition } = body;

  if (!purchaseOrderId || !receivedQuantity) {
    throw new BadRequestError('Missing purchaseOrderId or receivedQuantity');
  }

  const supabase = getAdminRouteSupabase();
  const receiverUuid = await resolveActorUuid(context, supabase);

  const { data, error } = await supabase
    .from('goods_receipts')
    .insert({
      tenant_id: tenantId,
      purchase_order_id: purchaseOrderId,
      received_by: receiverUuid,
      received_quantity: parseInt(receivedQuantity) || 1,
      condition: condition || 'Good'
    })
    .select('*')
    .single();

  if (error) throw error;

  // Also update PO status to Fulfilled
  await supabase
    .from('purchase_orders')
    .update({ status: 'Fulfilled' })
    .eq('id', purchaseOrderId);

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
