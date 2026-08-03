import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Get quotation prefix from company settings
  const { data: settings } = await supabase
    .from('company_settings')
    .select('quotation_prefix, gst_rate_default, tax_configuration, invoice_terms, default_payment_terms, gst_enabled')
    .eq('tenant_id', tenantId)
    .single();

  // Fetch quotations with their quotation items
  const { data: quotations, error } = await supabase
    .from('quotations')
    .select('*, quotation_items(*)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) console.error('Quotations fetch error:', error);

  // Sort quotation items by sort_order for consistency
  if (quotations) {
    quotations.forEach(q => {
      if (q.quotation_items) {
        q.quotation_items.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
      }
    });
  }

  // Fetch clients for mapping
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, company_name, company_email, company_phone')
    .eq('tenant_id', tenantId);

  // Fetch inquiries for linking
  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('id, alias_name, company_name, work_email, estimated_value')
    .eq('tenant_id', tenantId);

  const clientMap = new Map((clients || []).map(c => [c.id, c]));

  const mapped = (quotations || []).map(q => ({
    ...q,
    client_name: q.client_id ? (clientMap.get(q.client_id)?.company_name || clientMap.get(q.client_id)?.name || '') : '',
  }));

  // Get next quotation number
  const prefix = settings?.quotation_prefix || 'TS-QTN-';
  const totalQuotations = (quotations || []).length;
  const nextNumber = `${prefix}${String(totalQuotations + 1).padStart(4, '0')}`;

  return NextResponse.json({
    success: true,
    quotations: mapped,
    clients: clients || [],
    inquiries: inquiries || [],
    nextNumber,
    settings: {
      prefix,
      defaultTaxRate: settings?.gst_rate_default ?? 18,
      gstEnabled: settings?.gst_enabled ?? false,
      defaultTerms: settings?.invoice_terms || '',
      defaultPaymentTerms: settings?.default_payment_terms || 'Net 15',
      taxConfiguration: settings?.tax_configuration || []
    }
  });
}, { requireAuth: true, roles: ['Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();
  const body = await request.json();

  // Validation
  if (!body.subject?.trim()) {
    return NextResponse.json({ success: false, error: 'Quotation subject is required.' }, { status: 400 });
  }
  if (!body.quotation_number?.trim()) {
    return NextResponse.json({ success: false, error: 'Quotation number is required.' }, { status: 400 });
  }

  const items: any[] = body.items || [];

  // Calculate totals from line items
  const subtotal = items.reduce((s: number, item: any) => s + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);
  const discountValue = Number(body.discount_value) || 0;
  const discountType = body.discount_type || 'percentage';
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue / 100) : discountValue;
  const afterDiscount = subtotal - discountAmount;
  const taxRate = Number(body.tax_rate) || 0;
  const taxAmount = afterDiscount * taxRate / 100;
  const total = afterDiscount + taxAmount;

  // Calculate valid_until
  const validityDays = Number(body.validity_days) || 30;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validityDays);

  const insertPayload = {
    tenant_id: tenantId,
    quotation_number: body.quotation_number.trim(),
    client_id: body.client_id ? Number(body.client_id) : null,
    inquiry_id: body.inquiry_id ? Number(body.inquiry_id) : null,
    contact_name: body.contact_name?.trim() || null,
    contact_email: body.contact_email?.trim() || null,
    contact_phone: body.contact_phone?.trim() || null,
    subject: body.subject.trim(),
    status: body.status || 'Draft',
    subtotal: Math.round(subtotal * 100) / 100,
    discount_type: discountType,
    discount_value: discountValue,
    tax_rate: taxRate,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: body.currency || 'INR',
    validity_days: validityDays,
    valid_until: validUntil.toISOString().split('T')[0],
    payment_terms: body.payment_terms?.trim() || null,
    delivery_timeline: body.delivery_timeline?.trim() || null,
    terms_conditions: body.terms_conditions?.trim() || null,
    notes: body.notes?.trim() || null,
    version: 1,
    created_by: user.id || null
  };

  const { data: quotation, error } = await supabase
    .from('quotations')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    console.error('Quotation insert failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to create quotation. Please try again.' }, { status: 500 });
  }

  // Insert line items
  if (items.length > 0 && quotation) {
    const itemRows = items.map((item: any, idx: number) => ({
      quotation_id: quotation.id,
      tenant_id: tenantId,
      description: item.description?.trim() || '',
      quantity: Number(item.quantity) || 1,
      unit: item.unit?.trim() || 'Unit',
      unit_price: Number(item.unit_price) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      sort_order: idx
    }));

    const { error: itemError } = await supabase
      .from('quotation_items')
      .insert(itemRows);

    if (itemError) console.error('Quotation items insert failed:', itemError);
  }

  return NextResponse.json({ success: true, data: quotation });
}, { requireAuth: true, roles: ['Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();
  const body = await request.json();
  if (!body.id) throw new BadRequestError('Missing quotation ID');

  // If only status update
  if (body.statusOnly) {
    const { data, error } = await supabase
      .from('quotations')
      .update({
        status: body.status,
        ...(body.status === 'Sent' ? { sent_at: new Date().toISOString() } : {}),
        ...(body.status === 'Accepted' ? { accepted_at: new Date().toISOString() } : {}),
        ...(body.status === 'Rejected' ? { rejected_at: new Date().toISOString() } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to update status.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  }

  // Full update
  if (!body.subject?.trim()) {
    return NextResponse.json({ success: false, error: 'Subject is required.' }, { status: 400 });
  }

  const items: any[] = body.items || [];
  const subtotal = items.reduce((s: number, item: any) => s + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);
  const discountValue = Number(body.discount_value) || 0;
  const discountType = body.discount_type || 'percentage';
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue / 100) : discountValue;
  const afterDiscount = subtotal - discountAmount;
  const taxRate = Number(body.tax_rate) || 0;
  const taxAmount = afterDiscount * taxRate / 100;
  const total = afterDiscount + taxAmount;
  const validityDays = Number(body.validity_days) || 30;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validityDays);

  const updatePayload = {
    client_id: body.client_id ? Number(body.client_id) : null,
    inquiry_id: body.inquiry_id ? Number(body.inquiry_id) : null,
    contact_name: body.contact_name?.trim() || null,
    contact_email: body.contact_email?.trim() || null,
    contact_phone: body.contact_phone?.trim() || null,
    subject: body.subject.trim(),
    status: body.status || 'Draft',
    subtotal: Math.round(subtotal * 100) / 100,
    discount_type: discountType,
    discount_value: discountValue,
    tax_rate: taxRate,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: body.currency || 'INR',
    validity_days: validityDays,
    valid_until: validUntil.toISOString().split('T')[0],
    payment_terms: body.payment_terms?.trim() || null,
    delivery_timeline: body.delivery_timeline?.trim() || null,
    terms_conditions: body.terms_conditions?.trim() || null,
    notes: body.notes?.trim() || null,
    version: (body.version || 1) + 1,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('quotations')
    .update(updatePayload)
    .eq('id', body.id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to update quotation.' }, { status: 500 });
  }

  // Replace line items
  if (data) {
    await supabase.from('quotation_items').delete().eq('quotation_id', data.id).eq('tenant_id', tenantId);

    if (items.length > 0) {
      const itemRows = items.map((item: any, idx: number) => ({
        quotation_id: data.id,
        tenant_id: tenantId,
        description: item.description?.trim() || '',
        quantity: Number(item.quantity) || 1,
        unit: item.unit?.trim() || 'Unit',
        unit_price: Number(item.unit_price) || 0,
        amount: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
        sort_order: idx
      }));
      await supabase.from('quotation_items').insert(itemRows);
    }
  }

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('Missing quotation ID');

  // Delete items first (cascade should handle but explicit is safer)
  await supabase.from('quotation_items').delete().eq('quotation_id', id).eq('tenant_id', tenantId);

  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete quotation.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}, { requireAuth: true, roles: ['Manager'] });
