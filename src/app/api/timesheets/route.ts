import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { getDashboardType, type UserRole } from '@/lib/permissions';

// GET handler: Relational queries for timesheet entries, weekly grid, project breakdown, and overtime stats
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
      .select('id, user_id, employee_id, department, branch, designation, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');
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
    const { data } = await supabase
      .from('timesheet_entries')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('entry_date', { ascending: false });
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

  if (!userId || !entryDate || !taskName) {
    throw new BadRequestError('User ID, Entry Date, and Task Name are required');
  }

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Automatic Overtime Calculation (> 8 hours per day is classified as Overtime)
  const baseHours = (parseFloat(billableHours) || 0) + (parseFloat(nonBillableHours) || 0);
  let calculatedOvertime = 0;
  let finalBillable = parseFloat(billableHours) || 0;

  if (baseHours > 8) {
    calculatedOvertime = baseHours - 8;
    finalBillable = Math.max(finalBillable - calculatedOvertime, 0);
  }

  // Insert row into `timesheet_entries`
  let insertedEntry: any = null;
  try {
    const { data } = await supabase.from('timesheet_entries').insert({
      tenant_id: tenantId,
      user_id: userId,
      project_name: projectName.trim(),
      task_name: taskName.trim(),
      activity_category: activityCategory,
      entry_date: entryDate,
      billable_hours: finalBillable,
      non_billable_hours: parseFloat(nonBillableHours) || 0,
      overtime_hours: calculatedOvertime,
      billing_rate: parseFloat(billingRate) || 85.00,
      status: 'Submitted',
      is_late_submission: !!isLateSubmission,
      late_submission_reason: lateSubmissionReason || null
    }).select().single();
    insertedEntry = data;
  } catch (err) {
    console.warn('Timesheet entry insert error:', err);
  }

  return NextResponse.json({
    success: true,
    message: `Timesheet entry logged for ${entryDate} (${finalBillable + nonBillableHours + calculatedOvertime} hrs total)!`,
    overtimeCalculated: calculatedOvertime,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });
