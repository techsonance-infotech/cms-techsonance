import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { assetRequestSchema } from '@/server/validation/assets';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const supabase = getAdminRouteSupabase();
  let query = supabase
    .from('asset_requests')
    .select('*, asset_categories(*)')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = assetRequestSchema.parse(body);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('asset_requests')
    .insert({
      tenant_id: tenantId,
      employee_id: validated.employeeId,
      category_id: validated.categoryId,
      reason: validated.reason,
      status: 'pending',
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
  const { id, status, managerComments } = body;
  if (!id || !status) throw new BadRequestError('id and status are required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('asset_requests')
    .update({
      status,
      manager_comments: managerComments,
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
