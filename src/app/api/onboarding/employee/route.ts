import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const supabase = getAdminRouteSupabase();

  if (employeeId) {
    const { data, error } = await supabase
      .from('employee_onboarding')
      .select('*, onboarding_tasks(*)')
      .eq('tenant_id', tenantId)
      .eq('employee_id', Number(employeeId));
    if (error) throw new BadRequestError(error.message);
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from('employee_onboarding')
    .select('employee_id, status')
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { employeeId, checklistId } = body;
  if (!employeeId || !checklistId) throw new BadRequestError('employeeId and checklistId are required');

  const supabase = getAdminRouteSupabase();

  const { data: tasks, error: tasksError } = await supabase
    .from('onboarding_tasks')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('checklist_id', Number(checklistId));

  if (tasksError || !tasks) throw new BadRequestError('Failed to fetch tasks for this checklist');

  const insertRows = tasks.map((task: any) => ({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    task_id: task.id,
    status: 'pending',
  }));

  const { data, error } = await supabase
    .from('employee_onboarding')
    .insert(insertRows)
    .select();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { id, status, notes, details } = body;
  if (!id || !status) throw new BadRequestError('id and status are required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('employee_onboarding')
    .update({
      status,
      notes,
      details: details ?? {},
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
