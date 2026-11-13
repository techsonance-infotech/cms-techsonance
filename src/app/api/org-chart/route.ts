import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';

export const GET = withApiHandler(async (_request, context) => {
  const supabase = getAdminRouteSupabase();
  const accessToken = context.auth?.accessToken;
  let tenantId = context.auth?.user?.tenantId;

  // Fallback tenant resolution if not directly on auth user
  if (!tenantId && context.auth?.user) {
    const userIdentifier = context.auth.user.providerUserId || context.auth.user.id;
    if (userIdentifier) {
      const { data: u } = await supabase
        .from('users')
        .select('tenant_id')
        .or(`id.eq.${userIdentifier},legacy_user_id.eq.${typeof userIdentifier === 'number' ? userIdentifier : 0}`)
        .maybeSingle();
      tenantId = u?.tenant_id;
    }
  }

  if (!accessToken && !tenantId) throw new BadRequestError('Authorization credentials required');
  if (!tenantId) throw new BadRequestError('Tenant isolation ID could not be identified');

  // 1. Fetch all active employees for this tenant
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null);

  if (empErr) {
    console.error('Failed to fetch employees for org chart:', empErr);
    throw new Error('Failed to load organization hierarchy');
  }

  // 2. Fetch corresponding user profiles to match names/emails
  const { data: profiles, error: profileErr } = await supabase
    .from('users')
    .select('id, legacy_user_id, first_name, last_name, email, avatar_url')
    .eq('tenant_id', tenantId);

  if (profileErr) {
    console.error('Failed to fetch user profiles for org chart:', profileErr);
  }

  const profileMap = new Map<string, any>();
  if (profiles) {
    profiles.forEach((p: any) => {
      if (p.id) profileMap.set(String(p.id), p);
      if (p.legacy_user_id) profileMap.set(String(p.legacy_user_id), p);
    });
  }

  // 3. Format the nodes
  const formattedNodes = (employees || []).map((emp: any) => {
    const profile = emp.user_id ? profileMap.get(String(emp.user_id)) : null;

    let parsedSkills: any = null;
    if (typeof emp.skills === 'string') {
      try {
        parsedSkills = JSON.parse(emp.skills);
      } catch {
        parsedSkills = emp.skills;
      }
    } else {
      parsedSkills = emp.skills;
    }
    const isSkillsObj = parsedSkills && typeof parsedSkills === 'object' && !Array.isArray(parsedSkills);

    const getField = (col: string, camel: string, fallback: any = null) => {
      if (emp[col] !== undefined && emp[col] !== null) return emp[col];
      if (isSkillsObj && parsedSkills[camel] !== undefined && parsedSkills[camel] !== null) return parsedSkills[camel];
      if (isSkillsObj && parsedSkills[col] !== undefined && parsedSkills[col] !== null) return parsedSkills[col];
      return fallback;
    };

    const profileName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null;
    const skillsName = (isSkillsObj && (parsedSkills.firstName || parsedSkills.first_name))
      ? `${parsedSkills.firstName || parsedSkills.first_name} ${parsedSkills.lastName || parsedSkills.last_name || ''}`.trim()
      : null;
    const resolvedName = profileName || skillsName || emp.preferred_name || (emp.employee_id ? `Employee ${emp.employee_id}` : `Employee #${emp.id}`);

    const officeLocation = getField('office', 'office') || getField('work_location', 'workLocation') || getField('branch_name', 'branchName') || 'Surat HQ';
    const workMode = getField('work_mode', 'workMode') || 'office';
    const employmentType = getField('employment_type', 'employmentType') || 'full_time';

    return {
      id: Number(emp.id),
      employeeId: emp.employee_id || `EMP-${emp.id}`,
      userId: emp.user_id || `temp-${emp.id}`,
      managerId: emp.manager_id || null, // manager's user_id UUID or legacy ID or null
      designation: emp.designation || 'Staff',
      department: emp.department || 'General',
      subDepartment: emp.sub_department || null,
      costCenter: emp.cost_center || null,
      businessUnit: emp.business_unit || null,
      division: emp.division || null,
      office: officeLocation,
      floor: emp.floor || null,
      cabin: emp.cabin || null,
      grade: emp.grade || null,
      band: emp.band || null,
      jobLevel: emp.job_level || null,
      team: emp.team || null,
      workMode,
      employmentType,
      name: resolvedName,
      email: profile?.email || getField('office_email', 'officeEmail') || getField('email', 'email') || null,
      avatarUrl: profile?.avatar_url || getField('avatar_url', 'avatarUrl') || null,
      skills: emp.skills || null,
    };
  });

  return apiSuccess(formattedNodes, 'Organization chart loaded successfully', {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const userRole = (context.auth?.user?.role || '').toLowerCase();
  const canRestructure = ['admin', 'super_admin', 'owner', 'ceo', 'cto', 'business_owner', 'hr_manager'].includes(userRole);
  if (!canRestructure) {
    throw new ForbiddenError('Access Denied: Only administrators and HR managers have permission to restructure the organization hierarchy');
  }

  const payload = await request.json();
  const { employeeId, parentEmployeeId } = payload;

  if (!employeeId) {
    throw new BadRequestError('employeeId is required');
  }

  const supabase = getAdminRouteSupabase();
  const accessToken = context.auth?.accessToken;
  let tenantId = context.auth?.user?.tenantId;

  if (!tenantId && context.auth?.user) {
    const userIdentifier = context.auth.user.providerUserId || context.auth.user.id;
    if (userIdentifier) {
      const { data: u } = await supabase
        .from('users')
        .select('tenant_id')
        .or(`id.eq.${userIdentifier},legacy_user_id.eq.${typeof userIdentifier === 'number' ? userIdentifier : 0}`)
        .maybeSingle();
      tenantId = u?.tenant_id;
    }
  }

  if (!accessToken && !tenantId) throw new BadRequestError('Authorization credentials required');
  if (!tenantId) throw new BadRequestError('Tenant isolation ID could not be identified');

  // 1. Verify target employee exists and belongs to the tenant
  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('id, user_id')
    .eq('id', Number(employeeId))
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (empErr || !employee) {
    throw new NotFoundError('Employee not found or unauthorized');
  }

  // 2. Resolve manager's UUID (user_id) if parentEmployeeId is specified
  let managerAuthId: string | null = null;
  if (parentEmployeeId) {
    const { data: parentEmployee, error: parentErr } = await supabase
      .from('employees')
      .select('id, user_id')
      .eq('id', Number(parentEmployeeId))
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (parentErr || !parentEmployee) {
      throw new NotFoundError('Parent manager employee not found or unauthorized');
    }

    // Prevent cycles (cannot report to self)
    if (Number(employeeId) === Number(parentEmployeeId)) {
      throw new BadRequestError('An employee cannot report to themselves');
    }

    managerAuthId = parentEmployee.user_id;
  }

  // 3. Update employee's manager_id link
  const { error: updateErr } = await supabase
    .from('employees')
    .update({
      manager_id: managerAuthId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', Number(employeeId))
    .eq('tenant_id', tenantId);

  if (updateErr) {
    console.error('Failed to update reporting hierarchy manager_id:', updateErr);
    throw new Error('Failed to update reporting hierarchy');
  }

  return apiSuccess({ employeeId, managerId: managerAuthId }, 'Reporting hierarchy updated successfully');
}, { requireAuth: true, roles: ['Manager'] });
