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
    .from('shift_roster_assignments')
    .select('*, shift_definitions(*)')
    .eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_table_id', Number(employeeId));
  }

  const { data, error } = await query.order('roster_date', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = employeeShiftSchema.parse(body);

  const supabase = getAdminRouteSupabase();

  // Retrieve user_id from employee record
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('user_id')
    .eq('id', validated.employeeId)
    .eq('tenant_id', tenantId)
    .single();

  if (empError || !employee) throw new BadRequestError('Employee not found');

  const startDate = new Date(validated.startDate);
  const endDate = validated.endDate ? new Date(validated.endDate) : new Date(validated.startDate);
  const rowsToInsert: any[] = [];
  const curr = new Date(startDate);

  while (curr <= endDate) {
    const dateStr = curr.toISOString().split('T')[0];
    const isWeekend = curr.getDay() === 0 || curr.getDay() === 6;

    rowsToInsert.push({
      tenant_id: tenantId,
      user_id: employee.user_id,
      employee_table_id: validated.employeeId,
      shift_id: validated.shiftId,
      roster_date: dateStr,
      is_weekly_off: isWeekend,
      status: 'Assigned',
    });

    curr.setDate(curr.getDate() + 1);
  }

  const { data, error } = await supabase
    .from('shift_roster_assignments')
    .insert(rowsToInsert)
    .select();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });
