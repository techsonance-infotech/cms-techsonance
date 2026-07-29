import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  const { data: vendors, error } = await supabase
    .from('procurement_vendors')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json({ success: true, data: vendors });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { name, contactEmail, phone, address, paymentTerms } = body;

  if (!name || !contactEmail) {
    throw new BadRequestError('Missing vendor name or contactEmail');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('procurement_vendors')
    .insert({
      tenant_id: tenantId,
      name,
      contact_email: contactEmail,
      phone,
      address,
      payment_terms: paymentTerms || 'Net 30'
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
  const { vendorId, name, contactEmail, phone, address, paymentTerms } = body;

  if (!vendorId || !name || !contactEmail) {
    throw new BadRequestError('Missing vendorId, name, or contactEmail');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('procurement_vendors')
    .update({
      name,
      contact_email: contactEmail,
      phone,
      address,
      payment_terms: paymentTerms || 'Net 30'
    })
    .eq('id', vendorId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get('vendorId');

  if (!vendorId) {
    throw new BadRequestError('Missing vendorId parameter');
  }

  const supabase = getAdminRouteSupabase();

  const { error } = await supabase
    .from('procurement_vendors')
    .delete()
    .eq('id', vendorId)
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return NextResponse.json({ success: true, message: 'Vendor profile deleted' });
}, { requireAuth: true, roles: ['Employee'] });

