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

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      const { data: employee } = await supabase
        .from('employees')
        .select('skills')
        .eq('id', Number(employeeId))
        .single();
      const skillsObj = typeof employee?.skills === 'object' && employee.skills ? (employee.skills as Record<string, any>) : {};
      const list = Array.isArray(skillsObj.training_list) ? skillsObj.training_list : [];
      return NextResponse.json(buildListResponse(list, list.length, 1, limit, 'Training records fetched successfully'));
    }
    throw new Error(error.message);
  }

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

  const rawJson = await request.json().catch(() => ({}));
  const payload = createTrainingSchema.parse({
    employeeId: Number(employeeId),
    ...rawJson,
  });
  const supabase = getAdminRouteSupabase();

  const { data: employee } = await supabase
    .from('employees')
    .select('id, skills')
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

  let finalTraining: Record<string, unknown>;

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      const existingSkills = typeof employee.skills === 'object' && employee.skills ? (employee.skills as Record<string, any>) : {};
      const existingList = Array.isArray(existingSkills.training_list) ? existingSkills.training_list : [];
      const newTraining: Record<string, unknown> = {
        id: Date.now(),
        employeeId: Number(employeeId),
        employee_id: Number(employeeId),
        courseName: payload.courseName,
        course_name: payload.courseName,
        provider: payload.provider || null,
        trainingType: payload.trainingType,
        training_type: payload.trainingType,
        startDate: payload.startDate || now.split('T')[0],
        start_date: payload.startDate || now.split('T')[0],
        endDate: payload.endDate || null,
        end_date: payload.endDate || null,
        status: payload.status,
        score: payload.score ?? null,
        certificateUrl: payload.certificateUrl || null,
        expiryDate: payload.expiryDate || null,
        cost: payload.cost ?? null,
        currency: payload.currency || 'INR',
        notes: payload.notes || null,
        created_at: now,
        updated_at: now,
      };
      const updatedList = [newTraining, ...existingList];
      await supabase
        .from('employees')
        .update({
          skills: {
            ...existingSkills,
            training_list: updatedList,
          },
          updated_at: now,
        })
        .eq('id', Number(employeeId));

      finalTraining = newTraining;
    } else {
      throw new Error(error.message);
    }
  } else if (data) {
    finalTraining = data as Record<string, unknown>;
  } else {
    throw new Error('Failed to create training record');
  }

  // Timeline (non-blocking)
  await supabase.from('employee_timeline').insert({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    event_type: payload.status === 'completed' ? 'training_completed' : 'other',
    event_title: `Training: ${payload.courseName}`,
    event_description: `${payload.trainingType} - ${payload.provider || 'N/A'}`,
    event_data: { trainingId: finalTraining.id },
    triggered_by: authUserId,
    created_at: now,
  }).then(() => {}).catch(() => {});

  return NextResponse.json(buildSingleResponse(finalTraining, 'Training record created'), { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

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
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  const trainingId = Number(url.searchParams.get('trainingId') || url.searchParams.get('id'));
  if (!trainingId || isNaN(trainingId)) throw new BadRequestError('Valid trainingId required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_training')
    .delete()
    .eq('id', trainingId)
    .eq('tenant_id', tenantId);

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      if (employeeId && !isNaN(Number(employeeId))) {
        const { data: employee } = await supabase
          .from('employees')
          .select('skills')
          .eq('id', Number(employeeId))
          .single();
        const existingSkills = typeof employee?.skills === 'object' && employee?.skills ? (employee.skills as Record<string, any>) : {};
        const existingList = Array.isArray(existingSkills.training_list) ? existingSkills.training_list : [];
        const updatedList = existingList.filter((t: any) => Number(t.id) !== trainingId);
        await supabase
          .from('employees')
          .update({
            skills: {
              ...existingSkills,
              training_list: updatedList,
            },
          })
          .eq('id', Number(employeeId));
        return NextResponse.json({ success: true, message: 'Training deleted successfully' });
      }
    }
    throw new Error(error.message);
  }

  return NextResponse.json({ success: true, message: 'Training deleted successfully' });
}, { requireAuth: true, roles: ['Employee'] });
