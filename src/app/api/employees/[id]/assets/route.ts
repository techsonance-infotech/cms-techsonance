import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { createAssetSchema, updateAssetSchema } from '@/server/validation/elm';
import { normalizeRow, denormalizePayload, buildListResponse, buildSingleResponse } from '@/server/supabase/elm-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2); // /api/employees/[id]/assets
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);
  const status = url.searchParams.get('status');
  const assetType = url.searchParams.get('type');

  const supabase = getAdminRouteSupabase();

  let query = supabase
    .from('employee_assets')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('employee_id', Number(employeeId));

  if (status) query = query.eq('status', status);
  if (assetType) query = query.eq('asset_type', assetType);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
      console.warn('employee_assets table missing in schema cache, returning empty list');
      return NextResponse.json(buildListResponse([], 0, 1, limit, 'Assets fetched successfully (fallback)'));
    }
    throw new Error(error.message);
  }

  return NextResponse.json(buildListResponse(
    (data as Record<string, unknown>[] | null) ?? [],
    Number(count ?? 0),
    Math.floor(offset / limit) + 1,
    limit,
    'Assets fetched successfully'
  ));
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const authUserId = context.auth?.user.id;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const payload = createAssetSchema.parse(await request.json());

  const supabase = getAdminRouteSupabase();

  // Verify employee exists and belongs to tenant
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('id', Number(employeeId))
    .eq('tenant_id', tenantId)
    .single();
  if (!employee) throw new NotFoundError('Employee not found');

  const now = new Date().toISOString();
  const insertPayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>, ['employeeId']),
    employee_id: Number(employeeId),
    tenant_id: tenantId,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('employee_assets')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new Error('Failed to create asset');

  // Log to timeline
  await supabase.from('employee_timeline').insert({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    event_type: 'asset_issued',
    event_title: `Asset issued: ${payload.assetName}`,
    event_description: `${payload.assetType} - ${payload.assetName}${payload.serialNumber ? ` (S/N: ${payload.serialNumber})` : ''}`,
    event_data: { assetId: data.id, assetType: payload.assetType },
    triggered_by: authUserId,
    created_at: now,
  }).then(() => {}).catch(() => {}); // Non-blocking

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Asset created successfully'), { status: 201 });
}, { requireAuth: true, roles: ['Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const assetId = Number(url.searchParams.get('assetId'));
  if (!assetId || isNaN(assetId)) throw new BadRequestError('Valid assetId query parameter required');

  const payload = updateAssetSchema.parse(await request.json());

  const supabase = getAdminRouteSupabase();

  const updatePayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('employee_assets')
    .update(updatePayload)
    .eq('id', assetId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new NotFoundError('Asset not found');

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Asset updated successfully'));
}, { requireAuth: true, roles: ['Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const assetId = Number(url.searchParams.get('assetId'));
  if (!assetId || isNaN(assetId)) throw new BadRequestError('Valid assetId query parameter required');

  const supabase = getAdminRouteSupabase();

  const { error } = await supabase
    .from('employee_assets')
    .delete()
    .eq('id', assetId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true, message: 'Asset deleted successfully' });
}, { requireAuth: true, roles: ['Manager'] });
