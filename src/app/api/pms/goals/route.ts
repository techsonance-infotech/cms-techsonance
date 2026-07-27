import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const supabase = getAdminRouteSupabase();
  let query = supabase.from('pms_goals').select('*, pms_cycles(*)').eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query;
  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { employeeId, cycleId, title, description, goalType, parentGoalId, weightage, targetValue, currentValue, metricUnit, status } = body;

  if (!employeeId || !title) {
    throw new BadRequestError('employeeId and title are required');
  }

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('pms_goals')
    .insert({
      tenant_id: tenantId,
      employee_id: employeeId,
      cycle_id: cycleId || null,
      title,
      description: description || null,
      goal_type: goalType || 'individual',
      parent_goal_id: parentGoalId || null,
      weightage: weightage || 10,
      target_value: targetValue || 100.0,
      current_value: currentValue || 0.0,
      metric_unit: metricUnit || '%',
      status: status || 'pending',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
