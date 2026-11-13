import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const supabase = getAdminRouteSupabase();

  // Resolve user UUID and tenant ID robustly
  let authUserId = user.providerUserId || (typeof (user as any).id === 'string' && (user as any).id.includes('-') ? (user as any).id : null);
  let tenantId = user.tenantId;

  if (!authUserId || !tenantId) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, tenant_id, legacy_user_id')
      .or(`id.eq.${authUserId || user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (dbUser) {
      authUserId = authUserId || dbUser.id;
      tenantId = tenantId || dbUser.tenant_id;
    }
  }

  if (!authUserId || !tenantId) throw new BadRequestError('User context or tenant is missing');

  // 1. Get employee ID
  let employeeId: number | null = null;
  const { data: employee } = await supabase
    .from('employees')
    .select('id, user_id')
    .eq('user_id', authUserId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (employee) {
    employeeId = employee.id;
  } else {
    // Fallback: check if id matches legacy_user_id or user.id
    const legacyId = typeof user.id === 'number' ? user.id : ((user as any).legacy_user_id || null);
    if (legacyId) {
      const { data: empByLegacy } = await supabase
        .from('employees')
        .select('id, user_id')
        .eq('id', legacyId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (empByLegacy) {
        employeeId = empByLegacy.id;
      }
    }
  }

  let totalHoursMonth = 0;
  let totalHoursYear = 0;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const firstDayOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const firstDayOfYear = `${now.getFullYear()}-01-01`;

  if (employeeId) {
    // 2. Calculate Total Hours (Month/Year)
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
  // Get all project IDs where user is a member or has tasks assigned
  const memberConditions: string[] = [];
  if (authUserId) memberConditions.push(`user_id.eq.${authUserId}`);
  if (user?.id && String(user.id) !== String(authUserId)) memberConditions.push(`user_id.eq.${user.id}`);
  if (employeeId) memberConditions.push(`user_id.eq.${employeeId}`);

  let memberRows: any[] = [];
  try {
    const { data } = await supabase
      .from('project_members')
      .select('project_id, assigned_at')
      .eq('tenant_id', tenantId)
      .or(memberConditions.join(','))
      .order('assigned_at', { ascending: false });
    if (data) memberRows = data;
  } catch (err) {
    console.warn('Project members query info:', err);
  }

  let taskProjectRows: any[] = [];
  try {
    const taskConditions = memberConditions.map(c => c.replace('user_id.', 'assigned_to.'));
    const { data } = await supabase
      .from('tasks')
      .select('project_id, created_at')
      .eq('tenant_id', tenantId)
      .or(taskConditions.join(','));
    if (data) taskProjectRows = data;
  } catch (err) {
    console.warn('Tasks projects query info:', err);
  }

  const projectIds = Array.from(new Set([
    ...memberRows.map((m: any) => Number(m.project_id)),
    ...taskProjectRows.map((t: any) => Number(t.project_id))
  ])).filter(pId => Boolean(pId) && !isNaN(pId));

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
      activeProjects = projectsData.filter((p: any) => 
        (p.status === 'in_progress' || p.status === 'planning' || p.status === 'active') && p.is_active !== false
      ).length;
      
      // Merge with assignment date and sort
      recentProjects = (projectsData || [])
        .map((p: any) => ({
          ...p,
          assignedAt: memberRows.find((m: any) => Number(m.project_id) === Number(p.id))?.assigned_at || 
                      taskProjectRows.find((t: any) => Number(t.project_id) === Number(p.id))?.created_at || 
                      p.created_at
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
    dateList.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
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
    employeeId
      ? supabase
          .from('attendance_records')
          .select('date, duration')
          .eq('employee_id', employeeId)
          .gte('date', dateList[0])
          .eq('tenant_id', tenantId)
      : Promise.resolve({ data: [] }),
    supabase
      .from('daily_reports')
      .select('date')
      .eq('user_id', authUserId)
      .gte('date', dateList[0])
      .eq('tenant_id', tenantId),
    supabase
      .from('tasks')
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
          .select('*, employees(id, user_id)')
          .eq('status', 'pending')
          .eq('tenant_id', tenantId)
          .limit(10)
      : Promise.resolve({ data: [] }),
    ['Admin', 'SuperAdmin', 'hr_manager', 'accountant', 'management'].includes(user.role as string)
      ? supabase
          .from('reimbursements')
          .select('*, employees(id, user_id)')
          .eq('status', 'pending')
          .eq('tenant_id', tenantId)
          .limit(10)
      : Promise.resolve({ data: [] })
  ]);

  const attendanceMap = new Map((historyAttendanceRes.data || []).map((r: any) => [r.date, (r.duration || 0) / 60]));
  const reportsSet = new Set(
    (historyReportsRes.data || []).map((r: any) => {
      if (!r?.date) return '';
      const d = String(r.date);
      return d.includes('T') ? d.split('T')[0] : d;
    }).filter(Boolean)
  );

  const performance = {
    attendanceHistory: dateList.map(date => ({
      date: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      hours: Math.round(((attendanceMap.get(date) as number) || 0) * 10) / 10
    })),
    reportHistory: dateList.map(date => ({
      date: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      submitted: reportsSet.has(date) ? 1 : 0
    })),
    taskDistribution: (taskStatsRes.data || []).reduce((acc: any, t: any) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, { todo: 0, in_progress: 0, review: 0, done: 0 })
  };

  const notifications = (notificationsRes.data || []) as any[];
  const announcements = notifications.filter(n => n.type === 'info' || n.type === 'warning' || n.type === 'announcement' || n.type === 'broadcast');
  const alerts = notifications.filter(n => n.type === 'error' || n.type === 'success' || n.type === 'alert' || !['info', 'warning', 'announcement', 'broadcast'].includes(n.type));

  const pendingApprovals = [
    ...(pendingLeavesRes.data || []).map((l: any) => ({ 
      id: l.id, 
      type: 'leave', 
      title: 'Leave Request', 
      employee: l.employees?.user_id || `Employee #${l.employee_id}`,
      details: `${(l.leave_type || '').replace('_', ' ')}: ${l.start_date} to ${l.end_date}`,
      date: l.created_at 
    })),
    ...(pendingReimbursementsRes.data || []).map((r: any) => ({  
      id: r.id, 
      type: 'reimbursement', 
      title: 'Reimbursement', 
      employee: r.employees?.user_id || `Employee #${r.employee_id}`,
      details: `Amount: ₹${r.amount} - ${r.purpose}`,
      date: r.created_at 
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
}, { requireAuth: true });
