import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { getDashboardType, type UserRole } from '@/lib/permissions';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveUserUuid(
  supabase: any,
  tenantId: string | null | undefined,
  identifier: any
): Promise<string | null> {
  if (!identifier) return null;
  const str = String(identifier).trim();

  if (UUID_REGEX.test(str)) {
    return str;
  }

  // 1. Try public.users by legacy_user_id
  if (str && !isNaN(Number(str))) {
    try {
      const { data: userByLegacy } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('legacy_user_id', Number(str))
        .maybeSingle();

      if (userByLegacy?.id && UUID_REGEX.test(userByLegacy.id)) {
        return userByLegacy.id;
      }
    } catch (e) {
      console.warn('users by legacy_user_id error:', e);
    }
  }

  // 2. Try public.employees by id
  if (str && !isNaN(Number(str))) {
    try {
      const { data: empRecord } = await supabase
        .from('employees')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('id', Number(str))
        .maybeSingle();

      if (empRecord?.user_id && UUID_REGEX.test(empRecord.user_id)) {
        return empRecord.user_id;
      }
    } catch (e) {
      console.warn('employees by id error:', e);
    }
  }

  return null;
}

// GET handler: Relational queries for timesheet entries, weekly grid, project breakdown, and overtime stats
export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Role validation to segregate access (case-insensitive)
  const roleStr = String(user.role || '').toLowerCase();
  const isManagerOrAdmin = ['super_admin', 'superadmin', 'admin', 'hr_manager', 'finance', 'owner', 'manager', 'project_manager'].includes(roleStr);

  // 1. Relational Query: Active employee roster joined with public.users
  let employees: any[] = [];
  try {
    let query = supabase
      .from('employees')
      .select('id, user_id, employee_id, department, branch, designation, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (!isManagerOrAdmin) {
      query = query.eq('user_id', user.providerUserId);
    }

    const { data } = await query;
    if (data) employees = data;
  } catch (err) {
    console.warn('Employees query info:', err);
  }

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

  const employeeRoster = employees.map((e: any) => {
    const u = userMap.get(e.user_id) || {};
    return {
      id: e.user_id || e.id,
      employeeTableId: e.id,
      name: `${u.first_name || 'Employee'} ${u.last_name || ''}`.trim(),
      email: u.email || '',
      department: e.department || 'Engineering',
      designation: e.designation || 'Software Engineer'
    };
  });

  // 2. Query Timesheet Entries from DB `timesheet_entries` table
  let dbEntries: any[] = [];
  try {
    let query = supabase
      .from('timesheet_entries')
      .select('*')
      .eq('tenant_id', tenantId);

    if (!isManagerOrAdmin) {
      query = query.eq('user_id', user.providerUserId);
    }

    const { data } = await query.order('entry_date', { ascending: false });
    if (data) dbEntries = data;
  } catch (err) {
    console.warn('Timesheet entries DB query info:', err);
  }

  const timesheetEntries = dbEntries.map((t: any) => {
    const targetUser = userMap.get(t.user_id);
    const empName = targetUser ? `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() : 'Employee';
    const empEmail = targetUser?.email || '';

    return {
      id: t.id,
      userId: t.user_id,
      employeeName: empName,
      employeeEmail: empEmail,
      projectName: t.project_name || 'Enterprise SaaS Portal',
      taskName: t.task_name || 'API Integration',
      activityCategory: t.activity_category || 'Development',
      entryDate: t.entry_date,
      billableHours: parseFloat(t.billable_hours) || 0,
      nonBillableHours: parseFloat(t.non_billable_hours) || 0,
      overtimeHours: parseFloat(t.overtime_hours) || 0,
      totalHours: (parseFloat(t.billable_hours) || 0) + (parseFloat(t.non_billable_hours) || 0) + (parseFloat(t.overtime_hours) || 0),
      billingRate: parseFloat(t.billing_rate) || 85.00,
      billableAmount: ((parseFloat(t.billable_hours) || 0) + (parseFloat(t.overtime_hours) || 0) * 1.5) * (parseFloat(t.billing_rate) || 85.00),
      status: t.status,
      isLateSubmission: !!t.is_late_submission,
      lateSubmissionReason: t.late_submission_reason,
      correctionNotes: t.correction_notes,
      createdAt: t.created_at
    };
  });

  // 3. Query Timesheet Periods (Lock Status) from DB `timesheet_periods`
  let dbPeriods: any[] = [];
  try {
    const { data } = await supabase
      .from('timesheet_periods')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('start_date', { ascending: false });
    if (data) dbPeriods = data;
  } catch (err) {
    console.warn('Timesheet periods DB query info:', err);
  }

  // Aggregate stats calculations
  const totalBillable = timesheetEntries.reduce((sum, t) => sum + t.billableHours, 0);
  const totalNonBillable = timesheetEntries.reduce((sum, t) => sum + t.nonBillableHours, 0);
  const totalOvertime = timesheetEntries.reduce((sum, t) => sum + t.overtimeHours, 0);
  const pendingApprovalsCount = timesheetEntries.filter(t => t.status === 'Submitted' || t.status === 'Correction_Requested').length;

  return NextResponse.json({
    success: true,
    employeeRoster,
    summaryStats: {
      totalLoggedHours: totalBillable + totalNonBillable + totalOvertime,
      billableHours: totalBillable,
      nonBillableHours: totalNonBillable,
      overtimeHours: totalOvertime,
      pendingApprovals: pendingApprovalsCount,
      billablePercentage: (totalBillable + totalNonBillable + totalOvertime) > 0 
        ? `${((totalBillable / (totalBillable + totalNonBillable + totalOvertime)) * 100).toFixed(1)}%` 
        : '0%',
      periodLocked: dbPeriods.some((p: any) => p.is_locked)
    },
    timesheetEntries,
    timesheetPeriods: dbPeriods
  });
}, { requireAuth: true });

// POST handler: Submits a new Daily/Weekly Timesheet entry with overtime calculation & compliance checks
export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    userId,
    projectName = 'Enterprise SaaS Portal',
    taskName,
    activityCategory = 'Development',
    entryDate,
    billableHours = 0,
    nonBillableHours = 0,
    billingRate = 85.00,
    isLateSubmission = false,
    lateSubmissionReason = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  const supabase = getAdminRouteSupabase();

  // Role validation to segregate access (case-insensitive)
  const roleStr = String(user.role || '').toLowerCase();
  const isManagerOrAdmin = ['super_admin', 'superadmin', 'admin', 'hr_manager', 'finance', 'owner', 'manager', 'project_manager'].includes(roleStr);

  const rawUserId = isManagerOrAdmin ? (userId || user.providerUserId) : user.providerUserId;
  let targetUserId: string | null = rawUserId ? await resolveUserUuid(supabase, tenantId, rawUserId) : null;
  if (!targetUserId && user.providerUserId) {
    targetUserId = user.providerUserId;
  }

  const finalTaskName = taskName && taskName.trim().length > 0
    ? taskName.trim()
    : `${activityCategory || 'Development'} - ${projectName || 'Work'}`;

  if (!targetUserId || !entryDate) {
    throw new BadRequestError('Target User ID and Entry Date are required');
  }

  // Automatic Overtime Calculation (> 8 hours per day is classified as Overtime)
  const bHours = Number(billableHours) || 0;
  const nbHours = Number(nonBillableHours) || 0;
  const totalDailyLogged = bHours + nbHours;
  
  let finalBillable = bHours;
  let finalOvertime = 0;
  if (totalDailyLogged > 8) {
    // excess is overtime
    finalOvertime = totalDailyLogged - 8;
    finalBillable = Math.max(0, bHours - finalOvertime);
  }

  // Insert into DB `timesheet_entries`
  const { data: newEntry, error } = await supabase
    .from('timesheet_entries')
    .insert({
      tenant_id: tenantId,
      user_id: targetUserId,
      project_name: projectName,
      task_name: finalTaskName,
      activity_category: activityCategory,
      entry_date: entryDate,
      billable_hours: finalBillable,
      non_billable_hours: nbHours,
      overtime_hours: finalOvertime,
      billing_rate: billingRate,
      status: 'Submitted',
      is_late_submission: !!isLateSubmission,
      late_submission_reason: isLateSubmission ? lateSubmissionReason : null
    })
    .select('*')
    .single();

  if (error || !newEntry) {
    console.error('Timesheet entry insert error:', error);
    throw error ?? new Error('Failed to insert timesheet entry');
  }

  return NextResponse.json({
    success: true,
    message: 'Timesheet logged successfully!',
    overtimeCalculated: finalOvertime,
    entry: newEntry
  });
}, { requireAuth: true });
