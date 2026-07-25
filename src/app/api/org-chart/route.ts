import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { apiSuccess } from '@/server/http/response';

export const GET = withApiHandler(async (_request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization credentials required');

  const supabase = getAdminRouteSupabase();

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
    .select('id, first_name, last_name, email, avatar_url')
    .eq('tenant_id', tenantId);

  if (profileErr) {
    console.error('Failed to fetch user profiles for org chart:', profileErr);
  }

  const profileMap = new Map<string, any>();
  if (profiles) {
    profiles.forEach((p: any) => profileMap.set(p.id, p));
  }

  // 3. Format the nodes
  const formattedNodes = (employees || []).map((emp: any) => {
    const profile = emp.user_id ? profileMap.get(emp.user_id) : null;
    return {
      id: Number(emp.id),
      employeeId: emp.employee_id,
      userId: emp.user_id,
      managerId: emp.manager_id, // manager's user_id (UUID)
      designation: emp.designation || 'Staff',
      department: emp.department || 'General',
      subDepartment: emp.sub_department || null,
      costCenter: emp.cost_center || null,
      businessUnit: emp.business_unit || null,
      division: emp.division || null,
      office: emp.office || null,
      floor: emp.floor || null,
      cabin: emp.cabin || null,
      grade: emp.grade || null,
      band: emp.band || null,
      jobLevel: emp.job_level || null,
      team: emp.team || null,
      workMode: emp.work_mode || 'office',
      employmentType: emp.employment_type || 'full_time',
      name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : emp.preferred_name || 'Anonymous Employee',
      email: profile?.email || null,
      avatarUrl: profile?.avatar_url || null,
    };
  });

  return apiSuccess(formattedNodes, 'Organization chart loaded successfully');
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { employeeId, parentEmployeeId } = payload;

  if (!employeeId) {
    throw new BadRequestError('employeeId is required');
  }

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization credentials required');

  const supabase = getAdminRouteSupabase();

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
}, { requireAuth: true, roles: ['Admin'] });
