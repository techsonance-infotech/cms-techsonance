import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { assetAssignmentSchema } from '@/server/validation/assets';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const supabase = getAdminRouteSupabase();
  let query = supabase
    .from('asset_assignments')
    .select('*, assets(*)')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query.order('assigned_date', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = assetAssignmentSchema.parse(body);

  const supabase = getAdminRouteSupabase();

  const { error: assetError } = await supabase
    .from('assets')
    .update({ status: 'assigned' })
    .eq('id', validated.assetId)
    .eq('tenant_id', tenantId);

  if (assetError) throw new BadRequestError('Failed to update asset status');

  const { data, error } = await supabase
    .from('asset_assignments')
    .insert({
      tenant_id: tenantId,
      asset_id: validated.assetId,
      employee_id: validated.employeeId,
      assigned_date: validated.assignedDate,
      condition_on_assign: validated.conditionOnAssign,
      status: 'active',
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
  const { id, returnedDate, conditionOnReturn } = body;
  if (!id || !returnedDate) throw new BadRequestError('id and returnedDate are required');

  const supabase = getAdminRouteSupabase();

  const { data: assignment, error: getErr } = await supabase
    .from('asset_assignments')
    .select('asset_id')
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .single();

  if (getErr || !assignment) throw new BadRequestError('Assignment not found');

  const { error: assetError } = await supabase
    .from('assets')
    .update({ status: 'available' })
    .eq('id', assignment.asset_id)
    .eq('tenant_id', tenantId);

  if (assetError) throw new BadRequestError('Failed to reset asset status');

  const { data, error } = await supabase
    .from('asset_assignments')
    .update({
      returned_date: returnedDate,
      condition_on_return: conditionOnReturn,
      status: 'returned',
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
