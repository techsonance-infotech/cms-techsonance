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

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      // Fallback: read from employees.skills JSONB
      const { data: employee } = await supabase
        .from('employees')
        .select('skills')
        .eq('id', Number(employeeId))
        .single();
      const skillsObj = typeof employee?.skills === 'object' && employee.skills ? (employee.skills as Record<string, any>) : {};
      const list = Array.isArray(skillsObj.skills_list) ? skillsObj.skills_list : [];
      return NextResponse.json(buildListResponse(list, list.length, 1, limit, 'Skills fetched successfully'));
    }
    throw new Error(error.message);
  }

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

  const rawJson = await request.json().catch(() => ({}));
  const payload = createSkillSchema.parse({
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
    .from('employee_skills')
    .insert(insertPayload)
    .select('*')
    .single();

  let finalSkill: Record<string, unknown>;

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.code === 'PGRST205') {
      const existingSkills = typeof employee.skills === 'object' && employee.skills ? (employee.skills as Record<string, any>) : {};
      const existingList = Array.isArray(existingSkills.skills_list) ? existingSkills.skills_list : [];
      const newSkill: Record<string, unknown> = {
        id: Date.now(),
        employeeId: Number(employeeId),
        employee_id: Number(employeeId),
        skillName: payload.skillName,
        skill_name: payload.skillName,
        category: payload.category,
        proficiencyLevel: payload.proficiencyLevel,
        proficiency_level: payload.proficiencyLevel,
        yearsExperience: payload.yearsExperience ?? 0,
        years_experience: payload.yearsExperience ?? 0,
        certified: payload.certified ?? false,
        assessmentScore: payload.assessmentScore ?? null,
        assessment_score: payload.assessmentScore ?? null,
        created_at: now,
        updated_at: now,
      };
      const updatedList = [newSkill, ...existingList];
      await supabase
        .from('employees')
        .update({
          skills: {
            ...existingSkills,
            skills_list: updatedList,
          },
          updated_at: now,
        })
        .eq('id', Number(employeeId));

      finalSkill = newSkill;
    } else {
      throw new Error(error.message);
    }
  } else if (data) {
    finalSkill = data as Record<string, unknown>;
  } else {
    throw new Error('Failed to create skill');
  }

  // Timeline event (non-blocking)
  await supabase.from('employee_timeline').insert({
    tenant_id: tenantId,
    employee_id: Number(employeeId),
    event_type: 'skill_added',
    event_title: `Skill added: ${payload.skillName}`,
    event_description: `${payload.category} - ${payload.proficiencyLevel}`,
    event_data: { skillId: finalSkill.id },
    triggered_by: authUserId,
    created_at: now,
  }).then(() => {}).catch(() => {});

  return NextResponse.json(buildSingleResponse(finalSkill, 'Skill added successfully'), { status: 201 });
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
  const employeeId = url.pathname.split('/').at(-2);
  const skillId = Number(url.searchParams.get('skillId'));
  if (!skillId || isNaN(skillId)) throw new BadRequestError('Valid skillId required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_skills')
    .delete()
    .eq('id', skillId)
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
        const existingList = Array.isArray(existingSkills.skills_list) ? existingSkills.skills_list : [];
        const updatedList = existingList.filter((s: any) => Number(s.id) !== skillId);
        await supabase
          .from('employees')
          .update({
            skills: {
              ...existingSkills,
              skills_list: updatedList,
            },
          })
          .eq('id', Number(employeeId));
        return NextResponse.json({ success: true, message: 'Skill deleted successfully' });
      }
    }
    throw new Error(error.message);
  }

  return NextResponse.json({ success: true, message: 'Skill deleted successfully' });
}, { requireAuth: true, roles: ['Employee'] });
