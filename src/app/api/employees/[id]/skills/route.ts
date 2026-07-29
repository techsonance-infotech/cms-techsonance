import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { createSkillSchema, updateSkillSchema } from '@/server/validation/elm';
import { denormalizePayload, buildListResponse, buildSingleResponse } from '@/server/supabase/elm-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const limit = Math.min(Number(url.searchParams.get('limit') ?? '100'), 200);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);
  const category = url.searchParams.get('category');

  const supabase = getAdminRouteSupabase();

  let query = supabase
    .from('employee_skills')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('employee_id', Number(employeeId));

  if (category) query = query.eq('category', category);

  const { data, count, error } = await query
    .order('category', { ascending: true })
    .order('skill_name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return NextResponse.json(buildListResponse(
    (data as Record<string, unknown>[] | null) ?? [],
    Number(count ?? 0),
    Math.floor(offset / limit) + 1,
    limit,
    'Skills fetched successfully'
  ));
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const authUserId = context.auth?.user.id;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const payload = createSkillSchema.parse(await request.json());
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
    .from('employee_skills')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new Error('Failed to create skill');

  // Timeline event
  await supabase.from('employee_timeline').insert({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    event_type: 'skill_added',
    event_title: `Skill added: ${payload.skillName}`,
    event_description: `${payload.category} - ${payload.proficiencyLevel}`,
    event_data: { skillId: data.id },
    triggered_by: authUserId,
    created_at: now,
  }).then(() => {}).catch(() => {});

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Skill added successfully'), { status: 201 });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const skillId = Number(url.searchParams.get('skillId'));
  if (!skillId || isNaN(skillId)) throw new BadRequestError('Valid skillId required');

  const payload = updateSkillSchema.parse(await request.json());
  const supabase = getAdminRouteSupabase();

  const updatePayload = {
    ...denormalizePayload(payload as unknown as Record<string, unknown>),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('employee_skills')
    .update(updatePayload)
    .eq('id', skillId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new NotFoundError('Skill not found');

  return NextResponse.json(buildSingleResponse(data as Record<string, unknown>, 'Skill updated successfully'));
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const skillId = Number(url.searchParams.get('skillId'));
  if (!skillId || isNaN(skillId)) throw new BadRequestError('Valid skillId required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_skills')
    .delete()
    .eq('id', skillId)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true, message: 'Skill deleted successfully' });
}, { requireAuth: true, roles: ['Employee'] });
