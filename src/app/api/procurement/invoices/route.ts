import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: invoices, error } = await supabase
    .from('purchase_invoices')
    .select('*, purchase_order:purchase_order_id(*, purchase_request:purchase_request_id(*), vendor:vendor_id(*))')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Seed sample invoice if empty and fulfilled PO exists
  if (!invoices || invoices.length === 0) {
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('id, total_amount')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (po) {
      const invNum = 'INV-2026-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Calculate matches automatically based on receipts
      const { data: receipt } = await supabase
        .from('goods_receipts')
        .select('received_quantity')
        .eq('purchase_order_id', po.id)
        .maybeSingle();

      const isMatched = !!receipt; // Simulates match if receipt exists

      const { data: inserted, error: insertErr } = await supabase
        .from('purchase_invoices')
        .insert({
          tenant_id: tenantId,
          purchase_order_id: po.id,
          invoice_number: invNum,
          amount: po.total_amount,
          is_matched: isMatched,
          status: 'Unpaid'
        })
        .select('*, purchase_order:purchase_order_id(*, purchase_request:purchase_request_id(*), vendor:vendor_id(*))');

      if (!insertErr && inserted) {
        invoices = inserted;
      }
    }
  }

  return NextResponse.json({ success: true, data: invoices });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { purchaseOrderId, invoiceNumber, amount, payNow } = body;

  if (!purchaseOrderId || !invoiceNumber || !amount) {
    throw new BadRequestError('Missing purchaseOrderId, invoiceNumber, or amount');
  }

  const supabase = getAdminRouteSupabase();

  // 1. Retrieve PO and linked Request details
  const { data: po, error: poErr } = await supabase
    .from('purchase_orders')
    .select('*, purchase_request:purchase_request_id(*)')
    .eq('id', purchaseOrderId)
    .single();

  if (poErr || !po) {
    throw new BadRequestError('Purchase order not found');
  }

  // 2. Retrieve Goods Receipt details
  const { data: receipts, error: receiptErr } = await supabase
    .from('goods_receipts')
    .select('received_quantity')
    .eq('purchase_order_id', purchaseOrderId);

  const totalReceived = (receipts || []).reduce((acc: number, r: any) => acc + r.received_quantity, 0);

  // 3. Run 3-Way Match Check
  // Match condition A: PO cost matches Invoice cost
  const priceMatches = parseFloat(po.total_amount) === parseFloat(amount);
  // Match condition B: PO requested quantity matches Received quantity
  const qtyMatches = po.purchase_request ? po.purchase_request.quantity === totalReceived : false;
  
  const isMatched = priceMatches && qtyMatches;

  // 4. Save Invoice
  const { data: invoice, error } = await supabase
    .from('purchase_invoices')
    .insert({
      tenant_id: tenantId,
      purchase_order_id: purchaseOrderId,
      invoice_number: invoiceNumber,
      amount: parseFloat(amount),
      is_matched: isMatched,
      status: payNow ? 'Paid' : 'Unpaid'
    })
    .select('*')
    .single();

  if (error) throw error;

  return NextResponse.json({ success: true, data: invoice, matchingResults: { priceMatches, qtyMatches, isMatched } });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { invoiceId, status } = body;

  if (!invoiceId || !status) {
    throw new BadRequestError('Missing invoiceId or status');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('purchase_invoices')
    .update({ status })
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
