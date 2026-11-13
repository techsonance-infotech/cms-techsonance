import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

// Catalog definition for all 23 Request Types organized in 7 groups
export const REQUEST_CATALOG_DEFAULTS = [
  // Time & Attendance
  { name: 'Attendance Correction', groupType: 'Time & Attendance', slaHours: 24, iconName: 'Clock', description: 'Request check-in/check-out time correction for missed punches' },
  { name: 'Leave', groupType: 'Time & Attendance', slaHours: 24, iconName: 'Calendar', description: 'Submit annual, casual, medical, or unpaid leave request' },
  { name: 'WFH', groupType: 'Time & Attendance', slaHours: 24, iconName: 'Home', description: 'Apply for Work From Home or remote work arrangement' },
  { name: 'Shift Change', groupType: 'Time & Attendance', slaHours: 48, iconName: 'ArrowRightLeft', description: 'Request shift timing adjustment or shift swap' },

  // Career & Movement
  { name: 'Transfer', groupType: 'Career & Movement', slaHours: 72, iconName: 'Building2', description: 'Request branch, department, or business unit transfer' },
  { name: 'Promotion Request', groupType: 'Career & Movement', slaHours: 120, iconName: 'TrendingUp', description: 'Submit career progression or title upgrade recommendation' },
  { name: 'Salary Revision Request', groupType: 'Career & Movement', slaHours: 120, iconName: 'IndianRupee', description: 'Request compensation review or salary adjustment' },

  // Profile & Documents
  { name: 'Document Update', groupType: 'Profile & Documents', slaHours: 48, iconName: 'FileText', description: 'Update passport, visa, tax forms, or educational certificates' },
  { name: 'Profile Update', groupType: 'Profile & Documents', slaHours: 24, iconName: 'UserCog', description: 'Update personal details, contact address, or emergency contacts' },

  // Assets & IT Equipment
  { name: 'Asset Request', groupType: 'Assets & IT', slaHours: 48, iconName: 'Laptop', description: 'Request laptop, monitor, mobile device, or accessories' },
  { name: 'Asset Return', groupType: 'Assets & IT', slaHours: 48, iconName: 'RotateCcw', description: 'Initiate return of company hardware assets' },
  { name: 'ID Card', groupType: 'Assets & IT', slaHours: 48, iconName: 'BadgeCheck', description: 'Request new or replacement employee security badge' },
  { name: 'Business Card', groupType: 'Assets & IT', slaHours: 72, iconName: 'CreditCard', description: 'Order official printed corporate business cards' },

  // Certificates & HR Letters
  { name: 'Letter Request', groupType: 'Certificates & Letters', slaHours: 48, iconName: 'ScrollText', description: 'Request official corporate letter or NOC statement' },
  { name: 'Bonafide Certificate', groupType: 'Certificates & Letters', slaHours: 24, iconName: 'Award', description: 'Generate official bonafide employee proof certificate' },
  { name: 'Employment Certificate', groupType: 'Certificates & Letters', slaHours: 24, iconName: 'ShieldCheck', description: 'Download employment verification letter for bank/visa' },
  { name: 'Experience Letter', groupType: 'Certificates & Letters', slaHours: 72, iconName: 'BookOpen', description: 'Request service experience letter and conduct certificate' },

  // Payroll & Finance
  { name: 'Payslip', groupType: 'Payroll & Finance', slaHours: 12, iconName: 'Receipt', description: 'Download or request re-issue of monthly salary slip' },
  { name: 'Tax Documents', groupType: 'Payroll & Finance', slaHours: 24, iconName: 'FileCheck', description: 'Request W-2, Form 16, or annual tax deduction statement' },
  { name: 'Loan Request', groupType: 'Payroll & Finance', slaHours: 96, iconName: 'Landmark', description: 'Apply for company employee loan or financial assistance' },
  { name: 'Advance Salary', groupType: 'Payroll & Finance', slaHours: 48, iconName: 'Wallet', description: 'Request advance salary disbursement before pay cycle' },

  // Travel & General
  { name: 'Travel Request', groupType: 'General & Travel', slaHours: 48, iconName: 'Plane', description: 'Book business travel, flights, and hotel accommodation' },
  { name: 'Custom Requests', groupType: 'General & Travel', slaHours: 48, iconName: 'HelpCircle', description: 'Submit general inquiry or custom administrative request' }
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveUserUuid(supabase: any, rawId: any, email?: string): Promise<string | null> {
  if (!rawId && !email) return null;
  const strId = String(rawId || '').trim();

  if (UUID_REGEX.test(strId)) {
    const { data } = await supabase.from('users').select('id').eq('id', strId).maybeSingle();
    if (data?.id) return data.id;
  }

  const numId = parseInt(strId, 10);
  if (!isNaN(numId)) {
    const { data: byLegacy } = await supabase.from('users').select('id').eq('legacy_user_id', numId).maybeSingle();
    if (byLegacy?.id) return byLegacy.id;

    const { data: byEmp } = await supabase.from('employees').select('user_id').eq('id', numId).maybeSingle();
    if (byEmp?.user_id && UUID_REGEX.test(byEmp.user_id)) return byEmp.user_id;
  }

  if (email) {
    const { data: byEmail } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (byEmail?.id) return byEmail.id;
  }

  return null;
}

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Resolve authentic Supabase UUID for current actor
  const actorUuid = await resolveActorUuid(context, supabase);
  const effectiveUserId = actorUuid || (await resolveUserUuid(supabase, user.id, user.email)) || user.id;

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isSuperAdminOrAdmin = ['super_admin', 'superadmin', 'admin', 'business_owner', 'owner'].includes(userRole);
  const isManager = ['manager', 'hr_manager', 'project_manager'].includes(userRole);
  const canApprove = isSuperAdminOrAdmin || isManager;

  // 1. Employee Roster & Users Query
  let usersList: any[] = [];
  try {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, legacy_user_id')
      .eq('tenant_id', tenantId);
    if (data) usersList = data;
  } catch (err) {
    console.warn('Users fetch query info:', err);
  }

  let employees: any[] = [];
  try {
    const { data } = await supabase
      .from('employees')
      .select('id, user_id, employee_id, department, branch, designation, status')
      .eq('tenant_id', tenantId);
    if (data) employees = data;
  } catch (err) {
    console.warn('Employees fetch query info:', err);
  }

  const empByUserMap = new Map(employees.map((e: any) => [e.user_id, e]));
  const empByIdMap = new Map(employees.map((e: any) => [e.id, e]));
  const userMap = new Map(usersList.map((u: any) => [u.id, u]));

  // Current employee record info (for filtering leave & attendance)
  const currentEmp = employees.find((e: any) =>
    e.user_id === effectiveUserId ||
    String(e.user_id) === String(effectiveUserId) ||
    String(e.id) === String(user.id)
  );
  const currentEmpId = currentEmp?.id;

  // Construct Employee Roster from Users & Employees
  let employeeRoster: any[] = [];

  if (usersList.length > 0) {
    employeeRoster = usersList.map((u: any) => {
      const emp = empByUserMap.get(u.id);
      const nameStr = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Employee';
      return {
        id: u.id,
        employeeTableId: emp?.id || null,
        name: nameStr,
        email: u.email || '',
        department: emp?.department || 'General Operations',
        designation: emp?.designation || (u.role ? u.role.toUpperCase() : 'Staff Member')
      };
    });
  } else if (employees.length > 0) {
    employeeRoster = employees.map((e: any) => ({
      id: e.user_id || String(e.id),
      employeeTableId: e.id,
      name: `Employee ${e.employee_id || e.id}`,
      email: '',
      department: e.department || 'General Operations',
      designation: e.designation || 'Staff Member'
    }));
  }

  // Ensure current user is present in roster with the authentic UUID
  if (!employeeRoster.some(e => e.id === effectiveUserId)) {
    employeeRoster.unshift({
      id: effectiveUserId,
      employeeTableId: currentEmpId || null,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Current User',
      email: user.email || '',
      department: currentEmp?.department || 'General Operations',
      designation: currentEmp?.designation || (user.role || 'Staff').toUpperCase()
    });
  }

  // Unified Request Tickets List across all request types
  const unifiedRequests: any[] = [];
  const seenRequestNumbers = new Set<string>();

  // Helper to format requester name
  const getRequesterName = (userId?: string, empTableId?: any) => {
    if (userId && userMap.has(userId)) {
      const u = userMap.get(userId);
      const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      if (name) return name;
      if (u.email) return u.email;
    }
    if (empTableId && empByIdMap.has(empTableId)) {
      const emp = empByIdMap.get(empTableId);
      if (emp.user_id && userMap.has(emp.user_id)) {
        const u = userMap.get(emp.user_id);
        const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        if (name) return name;
      }
      return `Employee ${emp.employee_id || emp.id}`;
    }
    return 'Employee';
  };

  const getRequesterEmail = (userId?: string, empTableId?: any) => {
    if (userId && userMap.has(userId)) return userMap.get(userId).email || '';
    if (empTableId && empByIdMap.has(empTableId)) {
      const emp = empByIdMap.get(empTableId);
      if (emp.user_id && userMap.has(emp.user_id)) return userMap.get(emp.user_id).email || '';
    }
    return '';
  };

  // 1. Query `employee_requests`
  try {
    let query = supabase
      .from('employee_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!canApprove) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { data } = await query;
    if (data && Array.isArray(data)) {
      for (const r of data) {
        if (!canApprove && String(r.user_id) !== String(effectiveUserId)) continue;

        const reqNum = r.request_number || `REQ-${String(r.id).slice(0, 8)}`;
        seenRequestNumbers.add(reqNum);

        const empName = getRequesterName(r.user_id, r.employee_table_id);
        const empEmail = getRequesterEmail(r.user_id, r.employee_table_id);
        const approverUser = r.approver_id ? userMap.get(r.approver_id) : null;
        const approverName = approverUser ? `${approverUser.first_name || ''} ${approverUser.last_name || ''}`.trim() : 'HR Admin';

        unifiedRequests.push({
          id: r.id,
          userId: r.user_id,
          employeeTableId: r.employee_table_id,
          employeeName: empName,
          employeeEmail: empEmail,
          requestNumber: reqNum,
          category: r.category || 'Custom Requests',
          groupType: r.group_type || 'General & Travel',
          subject: r.subject || 'Request Ticket',
          details: r.details || '',
          priority: r.priority || 'Normal',
          status: r.status || 'Pending',
          approverName,
          resolutionNotes: r.resolution_notes || '',
          attachmentUrl: r.attachment_url || '',
          slaHours: r.sla_hours || 24,
          dueDate: r.due_date || new Date(new Date(r.created_at).getTime() + 24 * 3600 * 1000).toISOString(),
          createdAt: r.created_at
        });
      }
    }
  } catch (err) {
    console.warn('employee_requests query info:', err);
  }

  // 2. Query `wfh_requests`
  try {
    let query = supabase
      .from('wfh_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!canApprove) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { data } = await query;
    if (data && Array.isArray(data)) {
      for (const r of data) {
        if (!canApprove && String(r.user_id) !== String(effectiveUserId)) continue;

        const reqNum = r.request_code || `WFH-${String(r.id).slice(0, 8)}`;
        if (seenRequestNumbers.has(reqNum)) continue;
        seenRequestNumbers.add(reqNum);

        const empName = getRequesterName(r.user_id, r.employee_table_id);
        const empEmail = getRequesterEmail(r.user_id, r.employee_table_id);
        const approverUser = r.approver_id ? userMap.get(r.approver_id) : null;
        const approverName = approverUser ? `${approverUser.first_name || ''} ${approverUser.last_name || ''}`.trim() : 'Manager';

        const rawStatus = (r.status || 'pending').toLowerCase();
        const status = rawStatus === 'approved' ? 'Approved' : (rawStatus === 'rejected' ? 'Rejected' : 'Pending');

        const days = r.days_count || 1;
        const dateRange = r.start_date && r.end_date ? `${r.start_date} to ${r.end_date}` : (r.start_date || 'WFH Schedule');
        const locationPart = r.work_location_city ? ` • Location: ${r.work_location_city}` : '';

        unifiedRequests.push({
          id: `wfh-${r.id}`,
          userId: r.user_id,
          employeeTableId: r.employee_table_id,
          employeeName: empName,
          employeeEmail: empEmail,
          requestNumber: reqNum,
          category: 'WFH',
          groupType: 'Time & Attendance',
          subject: `WFH Request (${days} day${days > 1 ? 's' : ''}: ${dateRange})`,
          details: `${r.reason || 'Work from home remote arrangement'}${locationPart}`,
          priority: 'Normal',
          status,
          approverName,
          resolutionNotes: r.manager_comments || '',
          attachmentUrl: '',
          slaHours: 24,
          dueDate: r.start_date ? new Date(r.start_date).toISOString() : r.created_at,
          createdAt: r.created_at
        });
      }
    }
  } catch (err) {
    console.warn('wfh_requests query info:', err);
  }

  // 3. Query `leave_requests`
  try {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!canApprove && currentEmpId) {
      query = query.eq('employee_id', currentEmpId);
    }

    const { data } = await query;
    if (data && Array.isArray(data)) {
      for (const r of data) {
        const emp = empByIdMap.get(r.employee_id);
        const empUserId = emp?.user_id;

        if (!canApprove) {
          const matchesEmp = currentEmpId && String(r.employee_id) === String(currentEmpId);
          const matchesUser = empUserId && String(empUserId) === String(effectiveUserId);
          if (!matchesEmp && !matchesUser) continue;
        }

        const reqNum = `LEV-${r.id}`;
        if (seenRequestNumbers.has(reqNum)) continue;
        seenRequestNumbers.add(reqNum);

        const empName = getRequesterName(empUserId, r.employee_id);
        const empEmail = getRequesterEmail(empUserId, r.employee_id);

        const rawStatus = (r.status || 'pending').toLowerCase();
        const status = rawStatus === 'approved' ? 'Approved' : (rawStatus === 'rejected' ? 'Rejected' : 'Pending');

        const leaveType = (r.leave_type || 'Leave').toUpperCase();
        const days = r.actual_days || 1;
        const dateRange = r.start_date && r.end_date ? `${r.start_date} to ${r.end_date}` : (r.start_date || '');

        unifiedRequests.push({
          id: `leave-${r.id}`,
          userId: empUserId || '',
          employeeTableId: r.employee_id,
          employeeName: empName,
          employeeEmail: empEmail,
          requestNumber: reqNum,
          category: 'Leave',
          groupType: 'Time & Attendance',
          subject: `${leaveType} Leave Request (${days} day${days > 1 ? 's' : ''}${dateRange ? `: ${dateRange}` : ''})`,
          details: r.reason || `${leaveType} leave application`,
          priority: 'Normal',
          status,
          approverName: 'HR Approver',
          resolutionNotes: '',
          attachmentUrl: '',
          slaHours: 24,
          dueDate: r.start_date ? new Date(r.start_date).toISOString() : r.created_at,
          createdAt: r.created_at
        });
      }
    }
  } catch (err) {
    console.warn('leave_requests query info:', err);
  }

  // 4. Query `attendance_requests` (Punch Corrections)
  try {
    let query = supabase
      .from('attendance_requests')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!canApprove && currentEmpId) {
      query = query.eq('employee_id', currentEmpId);
    }

    const { data } = await query;
    if (data && Array.isArray(data)) {
      for (const r of data) {
        const emp = empByIdMap.get(r.employee_id);
        const empUserId = emp?.user_id;

        if (!canApprove) {
          const matchesEmp = currentEmpId && String(r.employee_id) === String(currentEmpId);
          const matchesUser = empUserId && String(empUserId) === String(effectiveUserId);
          if (!matchesEmp && !matchesUser) continue;
        }

        const reqNum = `ATT-${r.id}`;
        if (seenRequestNumbers.has(reqNum)) continue;
        seenRequestNumbers.add(reqNum);

        const empName = getRequesterName(empUserId, r.employee_id);
        const empEmail = getRequesterEmail(empUserId, r.employee_id);

        const rawStatus = (r.status || 'pending').toLowerCase();
        const status = rawStatus === 'approved' ? 'Approved' : (rawStatus === 'rejected' ? 'Rejected' : 'Pending');

        unifiedRequests.push({
          id: `att-${r.id}`,
          userId: empUserId || '',
          employeeTableId: r.employee_id,
          employeeName: empName,
          employeeEmail: empEmail,
          requestNumber: reqNum,
          category: 'Attendance Correction',
          groupType: 'Time & Attendance',
          subject: `Punch Regularization for ${r.date || 'Attendance'}`,
          details: r.notes || (r.metadata?.notes || 'Missed check-in / check-out punch correction request'),
          priority: 'Normal',
          status,
          approverName: 'Supervisor',
          resolutionNotes: r.metadata?.rejection_reason || '',
          attachmentUrl: r.metadata?.attachmentUrl || '',
          slaHours: 24,
          dueDate: r.date ? new Date(r.date).toISOString() : r.created_at,
          createdAt: r.created_at
        });
      }
    }
  } catch (err) {
    console.warn('attendance_requests query info:', err);
  }

  // 5. Query `hr_service_tickets`
  try {
    let query = supabase
      .from('hr_service_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!canApprove) {
      query = query.eq('user_id', effectiveUserId);
    }

    const { data } = await query;
    if (data && Array.isArray(data)) {
      for (const r of data) {
        if (!canApprove && String(r.user_id) !== String(effectiveUserId)) continue;

        const reqNum = r.ticket_number || `HR-${String(r.id).slice(0, 8)}`;
        if (seenRequestNumbers.has(reqNum)) continue;
        seenRequestNumbers.add(reqNum);

        const empName = getRequesterName(r.user_id);
        const empEmail = getRequesterEmail(r.user_id);

        const rawStatus = (r.status || 'open').toLowerCase();
        const status = rawStatus === 'resolved' || rawStatus === 'closed'
          ? 'Approved'
          : (rawStatus === 'in_progress' ? 'In_Progress' : (rawStatus === 'rejected' ? 'Rejected' : 'Pending'));

        let groupType = 'Certificates & Letters';
        const catLower = (r.category || '').toLowerCase();
        if (catLower.includes('it') || catLower.includes('workplace') || catLower.includes('asset')) groupType = 'Assets & IT';
        else if (catLower.includes('leave') || catLower.includes('attendance') || catLower.includes('wfh')) groupType = 'Time & Attendance';
        else if (catLower.includes('pay') || catLower.includes('benefit') || catLower.includes('salary')) groupType = 'Payroll & Finance';
        else if (catLower.includes('career') || catLower.includes('grievance')) groupType = 'Career & Movement';

        unifiedRequests.push({
          id: `hr-${r.id}`,
          userId: r.user_id,
          employeeTableId: null,
          employeeName: empName,
          employeeEmail: empEmail,
          requestNumber: reqNum,
          category: r.category || 'Custom Requests',
          groupType,
          subject: r.subject || 'HR Service Ticket',
          details: r.description || '',
          priority: r.priority || 'Normal',
          status,
          approverName: 'HR Service Desk',
          resolutionNotes: r.resolution_notes || '',
          attachmentUrl: '',
          slaHours: r.sla_hours || 24,
          dueDate: r.due_date || r.created_at,
          createdAt: r.created_at
        });
      }
    }
  } catch (err) {
    console.warn('hr_service_tickets query info:', err);
  }

  // Strict Security & RBAC Enforcement: Regular employees ONLY see their own submitted requests
  const scopedRequests = canApprove
    ? unifiedRequests
    : unifiedRequests.filter(r => {
        const matchesUser = Boolean(r.userId && effectiveUserId && String(r.userId) === String(effectiveUserId));
        const matchesEmp = Boolean(currentEmpId && r.employeeTableId && String(r.employeeTableId) === String(currentEmpId));
        return matchesUser || matchesEmp;
      });

  // Sort unified requests by createdAt descending
  scopedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Summary Metrics Calculation strictly on scopedRequests
  const totalRequests = scopedRequests.length;
  const pendingCount = scopedRequests.filter(r => r.status === 'Pending' || r.status === 'In_Progress').length;
  const approvedCount = scopedRequests.filter(r => r.status === 'Approved' || r.status === 'Fulfilled').length;
  const rejectedCount = scopedRequests.filter(r => r.status === 'Rejected').length;

  const slaCompliancePercent = totalRequests > 0
    ? `${Math.round(((totalRequests - scopedRequests.filter(r => r.status === 'Pending' && new Date(r.dueDate) < new Date()).length) / totalRequests) * 100)}%`
    : '100%';

  return NextResponse.json({
    success: true,
    userRole,
    currentUserId: effectiveUserId,
    canApprove,
    catalog: REQUEST_CATALOG_DEFAULTS,
    employeeRoster,
    summaryStats: {
      totalRequests,
      pendingCount,
      approvedCount,
      rejectedCount,
      slaCompliancePercent,
      avgResolutionHours: '18.4 hrs'
    },
    requests: scopedRequests
  });
}, { requireAuth: true });

// POST handler: Submits a new Request Ticket across any of the 23 categories with RBAC enforcement
export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  let {
    userId,
    category,
    subject,
    details,
    priority = 'Normal',
    attachmentUrl = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // 1. Resolve authentic UUID for current user
  const actorUuid = await resolveActorUuid(context, supabase);
  const effectiveAuthUserId = actorUuid || (await resolveUserUuid(supabase, user.id, user.email)) || (user.id ? String(user.id) : null);

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isSuperAdminOrAdmin = ['super_admin', 'superadmin', 'admin', 'business_owner', 'owner'].includes(userRole);
  const isManager = ['manager', 'hr_manager', 'project_manager'].includes(userRole);
  const canApprove = isSuperAdminOrAdmin || isManager;

  // 2. Resolve target user UUID
  let targetUserUuid: string | null = null;
  if (canApprove && userId) {
    targetUserUuid = await resolveUserUuid(supabase, userId);
  }
  if (!targetUserUuid) {
    targetUserUuid = effectiveAuthUserId ? String(effectiveAuthUserId) : null;
  }

  if (!targetUserUuid || !UUID_REGEX.test(targetUserUuid)) {
    throw new BadRequestError('Could not resolve applicant employee UUID for request submission');
  }

  if (!category || !subject || !details) {
    throw new BadRequestError('Category, Subject, and Details are required');
  }

  const catDefault = REQUEST_CATALOG_DEFAULTS.find(c => c.name.toLowerCase() === category.toLowerCase()) || {
    groupType: 'General & Travel',
    slaHours: 24
  };

  const codePrefix = category.toUpperCase().slice(0, 3);
  const requestNumber = `${codePrefix === 'WFH' ? 'WFH' : 'REQ'}-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const dueDate = new Date(Date.now() + catDefault.slaHours * 3600 * 1000).toISOString();

  // Find linked employee table record if available
  const { data: empRecord } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', targetUserUuid)
    .maybeSingle();

  // Insert into employee_requests with strict error validation
  const { data: inserted, error: insertError } = await supabase.from('employee_requests').insert({
    tenant_id: tenantId,
    user_id: targetUserUuid,
    employee_table_id: empRecord?.id || null,
    request_number: requestNumber,
    category,
    group_type: catDefault.groupType,
    subject: subject.trim(),
    details: details.trim(),
    priority,
    status: 'Pending',
    attachment_url: attachmentUrl,
    sla_hours: catDefault.slaHours,
    due_date: dueDate
  }).select().single();

  if (insertError) {
    console.error('CRITICAL: employee_requests insert error:', insertError);
    throw new BadRequestError(`Failed to save request ticket: ${insertError.message || insertError.details || 'Database insert failed'}`);
  }

  // Cross-module sync: If category is WFH, sync directly to wfh_requests
  if (category.toLowerCase() === 'wfh') {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await supabase.from('wfh_requests').insert({
        tenant_id: tenantId,
        user_id: targetUserUuid,
        employee_table_id: empRecord?.id || null,
        request_code: requestNumber,
        request_type: 'ad_hoc',
        start_date: todayStr,
        end_date: todayStr,
        days_count: 1,
        reason: `${subject.trim()}: ${details.trim()}`.slice(0, 500),
        status: 'Pending'
      });
    } catch (wfhErr) {
      console.warn('WFH request sync insert error:', wfhErr);
    }
  }

  // Cross-module sync: If category is Leave, sync directly to leave_requests
  if (category.toLowerCase() === 'leave' && empRecord?.id) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await supabase.from('leave_requests').insert({
        tenant_id: tenantId,
        employee_id: empRecord.id,
        leave_type: 'annual',
        start_date: todayStr,
        end_date: todayStr,
        reason: `${subject.trim()}: ${details.trim()}`.slice(0, 500),
        status: 'pending',
        actual_days: 1.0
      });
    } catch (leaveErr) {
      console.warn('Leave request sync insert error:', leaveErr);
    }
  }

  return NextResponse.json({
    success: true,
    requestNumber,
    message: `Request ticket ${requestNumber} (${category}) submitted successfully!`,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });
