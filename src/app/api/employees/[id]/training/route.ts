import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { createTrainingSchema, updateTrainingSchema } from '@/server/validation/elm';
import { denormalizePayload, buildListResponse, buildSingleResponse } from '@/server/supabase/elm-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);
  const status = url.searchParams.get('status');

  const supabase = getAdminRouteSupabase();

  let query = supabase
    .from('employee_training')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('employee_id', Number(employeeId));

  if (status) query = query.eq('status', status);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return NextResponse.json(buildListResponse(
    (data as Record<string, unknown>[] | null) ?? [],
    Number(count ?? 0),
    Math.floor(offset / limit) + 1,
    limit,
    'Training records fetched successfully'
  ));
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const authUserId = context.auth?.user.id;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const payload = createTrainingSchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();

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
    .from('employee_training')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new Error('Failed to create training record');

  // Timeline
  await supabase.from('employee_timeline').insert({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    event_type: payload.status === 'completed' ? 'training_completed' : 'other',
    event_title: `Training: ${payload.courseName}`,
    event_description: `${payload.trainingType} - ${payload.provider || 'N/A'}`,
    event_data: { trainingId: data.id },
    triggered_by: authUserId,
    created_at: now,
  }).then(() => {}).catch(() => {});

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Training record created'), { status: 201 });
}, { requireAuth: true, roles: ['Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const trainingId = Number(url.searchParams.get('trainingId'));
  if (!trainingId || isNaN(trainingId)) throw new BadRequestError('Valid trainingId required');

  const payload = updateTrainingSchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();

  const updatePayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('employee_training')
    .update(updatePayload)
    .eq('id', trainingId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new NotFoundError('Training not found');

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Training updated'));
}, { requireAuth: true, roles: ['Manager'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const trainingId = Number(url.searchParams.get('trainingId'));
  if (!trainingId || isNaN(trainingId)) throw new BadRequestError('Valid trainingId required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_training')
    .delete()
    .eq('id', trainingId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true, message: 'Training deleted successfully' });
}, { requireAuth: true, roles: ['Manager'] });
