import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { getDashboardType, type UserRole } from '@/lib/permissions';

// GET handler: Relational queries joining public.employees, public.users, and public.employee_movements
export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const supabase = getAdminRouteSupabase();
  let tenantId = user.tenantId;

  if (!tenantId) {
    const userIdentifier = user.providerUserId || user.id;
    if (userIdentifier) {
      const { data: u } = await supabase
        .from('users')
        .select('tenant_id')
        .or(`id.eq.${userIdentifier},legacy_user_id.eq.${typeof userIdentifier === 'number' ? userIdentifier : 0}`)
        .maybeSingle();
      tenantId = u?.tenant_id;
    }
  }

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  // 1. Relational Query: Active employee roster
  let employees: any[] = [];
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, department, designation, salary, status, skills, date_of_joining, created_at')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);
    if (!error && data) {
      employees = data;
    }
  } catch (err) {
    console.warn('Employees query error:', err);
  }

  // Also query users table for user details
  let usersList: any[] = [];
  try {
    const { data } = await supabase
      .from('users')
      .select('id, legacy_user_id, first_name, last_name, email')
      .eq('tenant_id', tenantId);
    if (data) usersList = data;
  } catch (err) {
    console.warn('Users query info:', err);
  }

  const userMap = new Map();
  usersList.forEach((u: any) => {
    if (u.id) userMap.set(String(u.id), u);
    if (u.legacy_user_id) userMap.set(String(u.legacy_user_id), u);
  });

  // Build employee roster list for selection
  const employeeRoster = employees.map((e: any) => {
    const u = userMap.get(String(e.user_id)) || {};
    let parsedSkills: any = null;
    if (typeof e.skills === 'string') {
      try {
        parsedSkills = JSON.parse(e.skills);
      } catch {
        parsedSkills = e.skills;
      }
    } else {
      parsedSkills = e.skills;
    }
    const isSkillsObj = parsedSkills && typeof parsedSkills === 'object' && !Array.isArray(parsedSkills);
    const branch = (isSkillsObj && (parsedSkills.branchName || parsedSkills.workLocation || parsedSkills.office)) || 'Surat HQ';
    const businessUnit = (isSkillsObj && parsedSkills.businessUnit) || 'Enterprise Solutions';
    const grade = (isSkillsObj && parsedSkills.grade) || 'L4';
    const empType = (isSkillsObj && (parsedSkills.employmentType || parsedSkills.employment_type)) || 'Full-Time';
    const managerName = (isSkillsObj && (parsedSkills.mentorName || parsedSkills.managerName)) || 'Department Head';

    const empName = (u.first_name || u.last_name)
      ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
      : (isSkillsObj && (parsedSkills.firstName || parsedSkills.first_name))
        ? `${parsedSkills.firstName || parsedSkills.first_name} ${parsedSkills.lastName || parsedSkills.last_name || ''}`.trim()
        : (e.employee_id ? `Employee ${e.employee_id}` : `Employee #${e.id}`);

    return {
      id: String(e.id),
      employeeTableId: String(e.id),
      userId: e.user_id || String(e.id),
      name: empName,
      email: u.email || (isSkillsObj && (parsedSkills.officeEmail || parsedSkills.email)) || '',
      department: e.department || 'Engineering',
      branch,
      businessUnit,
      designation: e.designation || 'Software Engineer',
      grade,
      employmentType: empType,
      salary: parseFloat(e.salary) || 0,
      managerId: e.manager_id || null,
      managerName,
      dateOfJoining: e.date_of_joining || (e.created_at ? new Date(e.created_at).toISOString().split('T')[0] : '2025-01-01')
    };
  });

  // Extract distinct departments & branches dynamically from DB employees table
  const departmentsList = Array.from(new Set(['Engineering', 'HR', 'Product', 'Sales', 'Marketing', 'Finance', ...employees.map((e: any) => e.department).filter(Boolean)]));
  const branchesList = Array.from(new Set(['Surat HQ', 'Pandesara', 'Vesu', ...employeeRoster.map((e: any) => e.branch).filter(Boolean)]));
  const businessUnitsList = ['Enterprise Solutions', 'Cloud & Infrastructure', 'Digital Products', 'Global Sales', 'Corporate Shared Services'];

  const searchParams = new URL(request.url).searchParams;
  const filterEmployeeId = searchParams.get('employeeId');
  const filterUserId = searchParams.get('userId');

  // 2. Relational Query: Movement transactions joined with public.users
  let dbMovements: any[] = [];
  try {
    let query = supabase
      .from('employee_movements')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filterEmployeeId) {
      query = query.eq('employee_table_id', Number(filterEmployeeId));
    } else if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) dbMovements = data;
  } catch (err) {
    console.warn('Movements DB query info:', err);
  }

  const movements = dbMovements.map((m: any) => {
    const targetUser = userMap.get(m.user_id);
    const empName = targetUser ? `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() : 'Employee';
    const empEmail = targetUser?.email || '';

    const prevMgr = m.previous_manager_id ? userMap.get(m.previous_manager_id) : null;
    const newMgr = m.new_manager_id ? userMap.get(m.new_manager_id) : null;

    return {
      id: m.id,
      movementCode: m.movement_code,
      userId: m.user_id,
      employeeTableId: m.employee_table_id,
      employeeName: empName,
      employeeEmail: empEmail,
      movementType: m.movement_type,
      effectiveDate: m.effective_date,
      reason: m.reason,
      notes: m.notes,
      previousDepartment: m.previous_department,
      newDepartment: m.new_department,
      previousBranch: m.previous_branch,
      newBranch: m.new_branch,
      previousBusinessUnit: m.previous_business_unit,
      newBusinessUnit: m.new_business_unit,
      previousManagerName: prevMgr ? `${prevMgr.first_name} ${prevMgr.last_name}` : 'Current Manager',
      newManagerName: newMgr ? `${newMgr.first_name} ${newMgr.last_name}` : 'New Manager',
      previousDesignation: m.previous_designation,
      newDesignation: m.new_designation,
      previousGrade: m.previous_grade,
      newGrade: m.new_grade,
      previousEmploymentType: m.previous_employment_type,
      newEmploymentType: m.new_employment_type,
      previousSalary: parseFloat(m.previous_salary) || 0,
      newSalary: parseFloat(m.new_salary) || 0,
      salaryIncrementPercentage: parseFloat(m.salary_increment_percentage) || 0,
      status: m.status,
      approvalStage: m.approval_stage,
      approvalHistory: m.approval_history || [],
      createdAt: m.created_at
    };
  });

  // Compute live aggregate stats from DB
  const pendingApprovalsCount = movements.filter((m: any) => m.status.toLowerCase().includes('pending') || m.status.toLowerCase().includes('draft')).length;
  const promotionsCount = movements.filter((m: any) => m.movementType.toLowerCase().includes('promotion')).length;
  const transfersCount = movements.filter((m: any) => m.movementType.toLowerCase().includes('transfer') || m.movementType.toLowerCase().includes('branch')).length;
  const salaryRevisionsCount = movements.filter((m: any) => m.movementType.toLowerCase().includes('salary') || m.salaryIncrementPercentage > 0).length;

  return NextResponse.json({
    success: true,
    employeeRoster,
    departmentsList,
    branchesList,
    businessUnitsList,
    summaryStats: {
      totalMovements: movements.length,
      pendingApprovals: pendingApprovalsCount,
      promotionsProcessed: promotionsCount,
      transfersActive: transfersCount,
      salaryRevisionsTriggered: salaryRevisionsCount
    },
    movements
  });
}, { requireAuth: true });

// POST handler: Initiates a new Employee Movement Order linking foreign keys
export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    userId,
    employeeTableId,
    movementTypes = [],
    effectiveDate,
    reason,
    notes,
    previousDepartment,
    newDepartment,
    previousBranch,
    newBranch,
    previousBusinessUnit,
    newBusinessUnit,
    previousManagerId,
    newManagerId,
    previousDesignation,
    newDesignation,
    previousGrade,
    newGrade,
    previousEmploymentType,
    newEmploymentType,
    previousSalary = 0,
    newSalary = 0,
    salaryIncrementPercentage = 0,
    autoUpdateProfile = true
  } = payload;

  if (!userId || !effectiveDate) {
    throw new BadRequestError('User ID and Effective Date are required');
  }

  const user = context.auth!.user;
  const supabase = getAdminRouteSupabase();
  let tenantId = user.tenantId;

  if (!tenantId) {
    const userIdentifier = user.providerUserId || user.id;
    if (userIdentifier) {
      const { data: u } = await supabase
        .from('users')
        .select('tenant_id')
        .or(`id.eq.${userIdentifier},legacy_user_id.eq.${typeof userIdentifier === 'number' ? userIdentifier : 0}`)
        .maybeSingle();
      tenantId = u?.tenant_id;
    }
  }

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  // Authorization check
  const userRole = (user.role || '').toLowerCase() as UserRole;
  if (getDashboardType(userRole) !== 'admin' && userRole !== 'manager' && userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'hr_manager') {
    return NextResponse.json({ error: 'Unauthorized to initiate employee movement' }, { status: 403 });
  }

  const movementCode = `MOV-${Math.floor(1000 + Math.random() * 9000)}`;
  const combinedMovementType = Array.isArray(movementTypes) ? movementTypes.join(', ') : (payload.movementType || 'movement');

  const initialApprovalHistory = [
    {
      stage: 'HR Initiation',
      actor: user.email || 'HR Manager',
      status: 'Initiated',
      timestamp: new Date().toISOString(),
      comments: 'Movement order initiated.'
    }
  ];

  // Resolve UUID for user_id in case employee table ID or legacy ID was passed
  let resolvedUserId = userId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(resolvedUserId || ''));
  if (!isUuid) {
    const { data: empRecord } = await supabase
      .from('employees')
      .select('id, user_id')
      .or(`id.eq.${Number(userId) || 0},employee_id.eq.${userId}`)
      .maybeSingle();

    if (empRecord?.user_id) {
      resolvedUserId = empRecord.user_id;
    }
  }

  const numericEmployeeTableId = employeeTableId ? Number(employeeTableId) : null;

  // Insert transactional record in `employee_movements` with FK references
  let insertedMovement: any = null;
  const { data: insertedData, error: insertError } = await supabase.from('employee_movements').insert({
    tenant_id: tenantId,
    movement_code: movementCode,
    user_id: resolvedUserId,
    employee_table_id: numericEmployeeTableId,
    movement_type: combinedMovementType,
    effective_date: effectiveDate,
    reason: reason || '',
    notes: notes || '',
    previous_department: previousDepartment || null,
    new_department: newDepartment || null,
    previous_branch: previousBranch || null,
    new_branch: newBranch || null,
    previous_business_unit: previousBusinessUnit || null,
    new_business_unit: newBusinessUnit || null,
    previous_manager_id: previousManagerId || null,
    new_manager_id: newManagerId || null,
    previous_designation: previousDesignation || null,
    new_designation: newDesignation || null,
    previous_grade: previousGrade || null,
    new_grade: newGrade || null,
    previous_employment_type: previousEmploymentType || null,
    new_employment_type: newEmploymentType || null,
    previous_salary: previousSalary,
    new_salary: newSalary,
    salary_increment_percentage: salaryIncrementPercentage,
    status: 'Pending Manager Approval',
    approval_stage: 'Manager Approval',
    approval_history: initialApprovalHistory,
    auto_update_profile: autoUpdateProfile,
    created_by: user.id
  }).select().single();

  if (insertError) {
    console.error('Movement insert DB error:', insertError);
    throw new BadRequestError(`Failed to save movement order: ${insertError.message}`);
  }
  insertedMovement = insertedData;

  // Insert history record in `employee_movement_history`
  if (insertedMovement?.id) {
    try {
      await supabase.from('employee_movement_history').insert({
        tenant_id: tenantId,
        movement_id: insertedMovement.id,
        user_id: userId,
        action_taken: 'Initiated Movement Order',
        actor_id: user.id,
        previous_status: 'Draft',
        new_status: 'Pending Manager Approval',
        comments: reason || 'Movement initiated'
      });
    } catch (err) {
      console.warn('History insert DB info:', err);
    }
  }

  return NextResponse.json({
    success: true,
    movementCode,
    message: `Employee Movement request ${movementCode} initiated successfully!`,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });
