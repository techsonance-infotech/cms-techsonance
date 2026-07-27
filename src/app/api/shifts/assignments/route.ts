import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { employeeShiftSchema } from '@/server/validation/shifts';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const supabase = getAdminRouteSupabase();
  let query = supabase
    .from('employee_shifts')
    .select('*, shifts(*)')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query.order('start_date', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = employeeShiftSchema.parse(body);

  const supabase = getAdminRouteSupabase();

  await supabase
    .from('employee_shifts')
    .update({ is_active: false })
    .eq('employee_id', validated.employeeId)
    .eq('tenant_id', tenantId);

  const { data, error } = await supabase
    .from('employee_shifts')
    .insert({
      tenant_id: tenantId,
      employee_id: validated.employeeId,
      shift_id: validated.shiftId,
      start_date: validated.startDate,
      end_date: validated.endDate || null,
      is_active: validated.isActive,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
