import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { assetSchema } from '@/server/validation/assets';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get('status');

  const supabase = getAdminRouteSupabase();
  let query = supabase
    .from('assets')
    .select('*, asset_categories(*)')
    .eq('tenant_id', tenantId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = assetSchema.parse(body);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('assets')
    .insert({
      tenant_id: tenantId,
      category_id: validated.categoryId,
      name: validated.name,
      serial_number: validated.serialNumber,
      model_number: validated.modelNumber,
      purchase_date: validated.purchaseDate || null,
      warranty_expiry: validated.warrantyExpiry || null,
      amc_details: validated.amcDetails,
      status: validated.status,
      notes: validated.notes,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { id, ...updateFields } = body;
  if (!id) throw new BadRequestError('Asset ID is required');

  const validated = assetSchema.partial().parse(updateFields);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('assets')
    .update({
      category_id: validated.categoryId,
      name: validated.name,
      serial_number: validated.serialNumber,
      model_number: validated.modelNumber,
      purchase_date: validated.purchaseDate || null,
      warranty_expiry: validated.warrantyExpiry || null,
      amc_details: validated.amcDetails,
      status: validated.status,
      notes: validated.notes,
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
