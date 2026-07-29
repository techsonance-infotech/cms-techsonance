import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const authUserId = user.id; // This is the UUID
  const tenantId = user.tenantId;

  if (!authUserId || !tenantId) throw new BadRequestError('User context or tenant is missing');

  const supabase = getAdminRouteSupabase();

  // 1. Get employee ID
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', authUserId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const employeeId = employee?.id;
  let totalHoursMonth = 0;
  let totalHoursYear = 0;

  if (employeeId) {
    // 2. Calculate Total Hours (Month/Year)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

    const [monthHoursRes, yearHoursRes] = await Promise.all([
      supabase
        .from('attendance_records')
        .select('duration')
        .eq('employee_id', employeeId)
        .eq('tenant_id', tenantId)
        .gte('date', firstDayOfMonth),
      supabase
        .from('attendance_records')
        .select('duration')
        .eq('employee_id', employeeId)
        .eq('tenant_id', tenantId)
        .gte('date', firstDayOfYear),
    ]);

    totalHoursMonth = (monthHoursRes.data || []).reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0) / 60;
    totalHoursYear = (yearHoursRes.data || []).reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0) / 60;
  }

  // 3. Project Metrics
  // Get all project IDs where user is a member
  const { data: memberRows } = await supabase
    .from('project_members')
    .select('project_id, assigned_at')
    .eq('user_id', authUserId)
    .eq('tenant_id', tenantId)
    .order('assigned_at', { ascending: false });

  const projectIds = (memberRows || []).map((m: any) => m.project_id);
  
  let activeProjects = 0;
  let totalAssignedProjects = projectIds.length;
  let recentProjects: any[] = [];

  if (projectIds.length > 0) {
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .eq('tenant_id', tenantId);

    if (projectsData) {
      activeProjects = projectsData.filter((p: any) => p.status === 'in_progress').length;
      
      // Merge with assignment date and sort
      recentProjects = (projectsData || [])
        .map((p: any) => ({
          ...p,
          assignedAt: memberRows?.find((m: any) => m.project_id === p.id)?.assigned_at || p.created_at
        }))
        .sort((a: any, b: any) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
        .slice(0, 5);
    }
  }

  // 4. Performance History (Last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  const dateList: string[] = [];
  for (let d = new Date(fourteenDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
    dateList.push(d.toISOString().split('T')[0]);
  }

  // Parallel requests for activity history & pending items
  const [
    historyAttendanceRes,
    historyReportsRes,
    taskStatsRes,
    notificationsRes,
    pendingLeavesRes,
    pendingReimbursementsRes
  ] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('date, duration')
      .eq('employee_id', employeeId)
      .gte('date', dateList[0])
      .eq('tenant_id', tenantId),
    supabase
      .from('daily_work_reports')
      .select('date')
      .eq('employee_id', employeeId)
      .gte('date', dateList[0])
      .eq('tenant_id', tenantId),
    supabase
      .from('project_tasks')
      .select('status, due_date')
      .eq('assigned_to', authUserId)
      .eq('tenant_id', tenantId),
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authUserId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20),
    // Pending Approvals (Leaves & Reimbursements)
    ['Admin', 'SuperAdmin', 'hr_manager', 'project_manager', 'management'].includes(user.role as string)
      ? supabase
          .from('leave_requests')
          .select('*, employees!inner(id, user_id, employees:users!inner(first_name, last_name))')
          .eq('status', 'pending')
          .eq('tenant_id', tenantId)
          .limit(10)
      : Promise.resolve({ data: [] }),
    ['Admin', 'SuperAdmin', 'hr_manager', 'accountant', 'management'].includes(user.role as string)
      ? supabase
          .from('reimbursements')
          .select('*, employees!inner(id, user_id, employees:users!inner(first_name, last_name))')
          .eq('status', 'pending')
          .eq('tenant_id', tenantId)
          .limit(10)
      : Promise.resolve({ data: [] })
  ]);

  const attendanceMap = new Map((historyAttendanceRes.data || []).map((r: any) => [r.date, (r.duration || 0) / 60]));
  const reportsSet = new Set((historyReportsRes.data || []).map((r: any) => r.date));

  const performance = {
    attendanceHistory: dateList.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      hours: Math.round(((attendanceMap.get(date) as number) || 0) * 10) / 10
    })),
    reportHistory: dateList.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      submitted: reportsSet.has(date) ? 1 : 0
    })),
    taskDistribution: (taskStatsRes.data || []).reduce((acc: any, t: any) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, { todo: 0, in_progress: 0, review: 0, done: 0 })
  };

  const notifications = (notificationsRes.data || []) as any[];
  const announcements = notifications.filter(n => n.type === 'info' || n.type === 'warning');
  const alerts = notifications.filter(n => n.type === 'error' || n.type === 'success');

  const pendingApprovals = [
    ...(pendingLeavesRes.data || []).map((l: any) => ({ 
      id: l.id, 
      type: 'leave', 
      title: 'Leave Request', 
      employee: `${l.employees?.employees?.first_name} ${l.employees?.employees?.last_name}`,
      details: `${l.leave_type.replace('_', ' ')}: ${l.start_date} to ${l.end_date}`,
      date: l.created_at 
    })),
    ...(pendingReimbursementsRes.data || []).map((r: any) => ({  
      id: r.id, 
      type: 'reimbursement', 
      title: 'Reimbursement', 
      employee: `${r.employees?.employees?.first_name} ${r.employees?.employees?.last_name}`,
      details: `Amount: ₹${r.amount} - ${r.purpose}`,
      date: r.created_at 
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayStr = new Date().toISOString().split('T')[0];
  const assignedTasksDueToday = (taskStatsRes.data || []).filter(
    (t: any) => t.due_date === todayStr
  ).length;

  return NextResponse.json({
    stats: {
      totalHoursMonth: Math.round(totalHoursMonth * 10) / 10,
      totalHoursYear: Math.round(totalHoursYear * 10) / 10,
      totalAssignedProjects,
      activeProjects,
      assignedTasksTotal: taskStatsRes.data?.length || 0,
      assignedTasksDueToday
    },
    performance,
    announcements,
    alerts,
    pendingApprovals,
    recentProjects,
  }, { status: 200 });
}, { requireAuth: true, roles: ['Employee'] });
