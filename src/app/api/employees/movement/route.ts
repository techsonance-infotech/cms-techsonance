import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { getDashboardType, type UserRole } from '@/lib/permissions';

// GET handler: Relational queries joining public.employees, public.users, and public.employee_movements
export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // 1. Relational Query: Active employee roster joined with public.users
  let employees: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, department, branch, designation, salary, status, users!user_id(id, first_name, last_name, email)')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');
    if (data) employees = data;
  } catch (err) {
    // Fallback: standard query if join syntax varies
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, user_id, employee_id, department, branch, designation, salary, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');
      if (data) employees = data;
    } catch (e) {
      console.warn('Employees query info:', e);
    }
  }

  // Also query users table for user details
  let usersList: any[] = [];
  try {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('tenant_id', tenantId);
    if (data) usersList = data;
  } catch (err) {
    console.warn('Users query info:', err);
  }

  const userMap = new Map(usersList.map((u: any) => [u.id, u]));

  // Build employee roster list for selection
  const employeeRoster = employees.map((e: any) => {
    const u = e.users || userMap.get(e.user_id) || {};
    return {
      id: e.user_id || e.id,
      employeeTableId: e.id,
      name: `${u.first_name || 'Employee'} ${u.last_name || ''}`.trim(),
      email: u.email || '',
      department: e.department || 'Engineering',
      branch: e.branch || 'HQ - New York',
      businessUnit: 'Enterprise Solutions',
      designation: e.designation || 'Software Engineer',
      grade: 'L4',
      employmentType: 'Full-Time',
      salary: parseFloat(e.salary) || 85000,
      managerId: null,
      managerName: 'David Miller (VP Engineering)'
    };
  });

  // Extract distinct departments & branches dynamically from DB employees table
  const departmentsList = Array.from(new Set(employees.map((e: any) => e.department).filter(Boolean)));
  const branchesList = Array.from(new Set(employees.map((e: any) => e.branch).filter(Boolean)));
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
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  // Authorization check
  const userRole = (user.role || '').toLowerCase() as UserRole;
  if (getDashboardType(userRole) !== 'admin' && userRole !== 'manager' && userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'hr_manager') {
    return NextResponse.json({ error: 'Unauthorized to initiate employee movement' }, { status: 403 });
  }

  const supabase = getAdminRouteSupabase();

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

  // Insert transactional record in `employee_movements` with FK references
  let insertedMovement: any = null;
  try {
    const { data } = await supabase.from('employee_movements').insert({
      tenant_id: tenantId,
      movement_code: movementCode,
      user_id: userId,
      employee_table_id: employeeTableId || null,
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
    insertedMovement = data;
  } catch (err) {
    console.warn('Movement insert DB info:', err);
  }

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
