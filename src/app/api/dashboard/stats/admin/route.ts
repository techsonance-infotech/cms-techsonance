import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { getDashboardType, type UserRole } from '@/lib/permissions';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const authUserId = user.id;
  const tenantId = user.tenantId;

  if (!authUserId || !tenantId) throw new BadRequestError('User context or tenant is missing');

  // Dynamic role validation - ONLY allow access if the user's role maps to 'admin' dashboard type
  if (getDashboardType(user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getAdminRouteSupabase();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

  // Run all counts in parallel for maximum performance
  const [
    clientsRes,
    projectsRes,
    invoicesRes,
    employeesRes,
    attendanceTodayRes,
    reportsYesterdayRes,
    leavesRes,
    claimsRes,
    attendanceRequestsRes,
    recentProjectsRes,
    purchasesRes,
    expensesRes
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('tenant_id', tenantId),
    supabase.from('projects').select('id, status').eq('tenant_id', tenantId),
    supabase.from('invoices').select('*').eq('tenant_id', tenantId),
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
    supabase.from('attendance_records').select('employee_id').eq('tenant_id', tenantId).eq('date', todayStr),
    supabase.from('daily_reports').select('user_id').eq('tenant_id', tenantId).eq('date', yesterdayStr),
    supabase.from('leave_requests').select('*, employees!inner(id, user_id, employees:users!inner(first_name, last_name))').eq('tenant_id', tenantId).eq('status', 'pending').limit(10),
    supabase.from('reimbursements').select('*, employees!inner(id, user_id, employees:users!inner(first_name, last_name))').eq('tenant_id', tenantId),
    supabase.from('attendance_requests').select('*, employees!inner(id, user_id, employees:users!inner(first_name, last_name))').eq('tenant_id', tenantId).eq('status', 'pending').limit(10),
    supabase.from('projects').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    supabase.from('purchases').select('*').eq('tenant_id', tenantId),
    supabase.from('expenses').select('*').eq('tenant_id', tenantId)
  ]);

  const clientMap = new Map<number, any>();
  (clientsRes.data || []).forEach((c: any) => {
    clientMap.set(c.id, {
      id: c.id,
      companyName: c.company_name,
      contactPerson: c.contact_person,
      industry: c.industry,
      revenue: 0,
      invoiceCount: 0
    });
  });

  // Aggregate specialized stats
  const allProjects = projectsRes.data || [];
  const activeProjectsCount = allProjects.filter((p: any) => p.status === 'in_progress').length;
  
  const allInvoices = invoicesRes.data || [];
  const totalRevenue = allInvoices.reduce((acc: number, inv: any) => acc + (Number(inv.total_amount) || 0), 0);
  const totalEmployees = employeesRes.count || 0;
  const activeClientsCount = (clientsRes.data || []).filter((c: any) => c.status === 'active').length;

  // Monthly Revenue (Paid invoices in current month)
  const monthlyRevenueInvoices = allInvoices.filter((inv: any) => inv.status === 'paid' && (inv.created_at || inv.paid_date) >= startOfMonthStr);
  const monthlyRevenue = monthlyRevenueInvoices.reduce((acc: number, inv: any) => acc + (Number(inv.total_amount) || 0), 0);

  // Monthly Expenses (Approved claims/reimbursements + Approved expenses in current month)
  const monthlyReimbursements = (claimsRes.data || []).filter((c: any) => c.status === 'approved' && c.created_at >= startOfMonthStr);
  const monthlyExpensesAmount = (expensesRes.data || []).filter((e: any) => e.status === 'approved' && (e.created_at || e.date) >= startOfMonthStr);

  const monthlyExpenses = monthlyReimbursements.reduce((acc: number, c: any) => acc + (Number(c.amount) || 0), 0) +
                           monthlyExpensesAmount.reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);

  // Net Cash Flow
  const netCashFlow = monthlyRevenue - monthlyExpenses;

  // Pending Invoices
  const pendingInvoicesList = allInvoices.filter((inv: any) => inv.status === 'pending' || inv.status === 'sent' || inv.status === 'draft');
  const pendingInvoicesCount = pendingInvoicesList.length;
  const pendingInvoicesValue = pendingInvoicesList.reduce((acc: number, inv: any) => acc + (Number(inv.total_amount) || 0), 0);

  // Low Stock / Procurement alerts from pending purchases
  const pendingPurchases = (purchasesRes.data || []).filter((p: any) => p.status === 'pending');
  const lowStockAlertsCount = pendingPurchases.length;

  // Top Customers by paid revenue
  allInvoices.forEach((inv: any) => {
    const c = clientMap.get(inv.client_id);
    if (c) {
      c.invoiceCount += 1;
      if (inv.status === 'paid') {
        c.revenue += Number(inv.total_amount) || 0;
      }
    }
  });

  const topCustomers = Array.from(clientMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  // Unique employees present today
  const presentEmployeeIds = new Set((attendanceTodayRes.data || []).map((r: any) => r.employee_id));
  const presentToday = presentEmployeeIds.size;
  const absentToday = Math.max(0, totalEmployees - presentToday);

  // Missing reports calculation
  const usersWithReports = new Set((reportsYesterdayRes.data || []).map((r: any) => r.user_id));
  const missingReportsCount = Math.max(0, totalEmployees - usersWithReports.size);

  const pendingApprovals = [
    ...(leavesRes.data || []).map((l: any) => ({ 
      id: l.id, 
      type: 'leave', 
      title: 'Leave Request', 
      employee: `${l.employees?.employees?.first_name} ${l.employees?.employees?.last_name}`,
      details: `${l.leave_type?.replace('_', ' ')}: ${l.start_date} to ${l.end_date}`,
      date: l.created_at 
    })),
    ...(claimsRes.data || []).filter((r: any) => r.status === 'pending').map((r: any) => ({ 
      id: r.id, 
      type: 'reimbursement', 
      title: 'Reimbursement', 
      employee: `${r.employees?.employees?.first_name} ${r.employees?.employees?.last_name}`,
      details: `Amount: ₹${r.amount} - ${r.purpose}`,
      date: r.created_at 
    })),
    ...(attendanceRequestsRes.data || []).map((a: any) => ({
      id: a.id,
      type: 'attendance',
      title: 'Weekend Attendance',
      employee: `${a.employees?.employees?.first_name} ${a.employees?.employees?.last_name}`,
      details: `${a.date}: ${a.notes || 'No reason provided'}`,
      date: a.created_at
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Recent Activity Feed (combination of recent invoices, claims, and projects)
  const recentActivityInvoices = allInvoices.slice(0, 5).map((inv: any) => ({
    id: `inv-${inv.id}`,
    type: 'invoice',
    title: `Invoice ${inv.invoice_number}`,
    description: `Client: ${clientMap.get(inv.client_id)?.companyName || 'Unknown'} • ${inv.status.toUpperCase()}`,
    amount: Number(inv.total_amount),
    status: inv.status,
    date: inv.created_at || inv.due_date
  }));

  const recentActivityClaims = (claimsRes.data || []).slice(0, 5).map((c: any) => ({
    id: `claim-${c.id}`,
    type: 'reimbursement',
    title: `Claim by ${c.employees?.employees?.first_name || 'Staff'}`,
    description: `Purpose: ${c.purpose} • ${c.status.toUpperCase()}`,
    amount: Number(c.amount),
    status: c.status,
    date: c.created_at
  }));

  const recentActivityProjects = (recentProjectsRes.data || []).map((p: any) => ({
    id: `project-${p.id}`,
    type: 'project',
    title: `Project: ${p.name}`,
    description: `Priority: ${p.priority.toUpperCase()} • ${p.status.toUpperCase().replace('_', ' ')}`,
    status: p.status,
    date: p.created_at
  }));

  const recentActivity = [
    ...recentActivityInvoices,
    ...recentActivityClaims,
    ...recentActivityProjects
  ]
    .filter(item => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // 6-Month Financial Run Rate Calculation
  const sixMonthsAgoDate = new Date();
  sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - 5);
  sixMonthsAgoDate.setDate(1); // First day of that month
  const sixMonthsAgoStr = sixMonthsAgoDate.toISOString().split('T')[0];

  const [historicalInvoicesRes, historicalClaimsRes] = await Promise.all([
    supabase.from('invoices').select('total_amount, created_at').eq('tenant_id', tenantId).eq('status', 'paid').gte('created_at', sixMonthsAgoStr),
    supabase.from('reimbursements').select('amount, created_at').eq('tenant_id', tenantId).eq('status', 'approved').gte('created_at', sixMonthsAgoStr)
  ]);

  const financialRunRate = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue: 0,
      expenses: 0,
      _yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    };
  });

  (historicalInvoicesRes.data || []).forEach((inv: any) => {
    const d = new Date(inv.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const target = financialRunRate.find(f => f._yearMonth === key);
    if (target) target.revenue += Number(inv.total_amount) || 0;
  });

  (historicalClaimsRes.data || []).forEach((claim: any) => {
    const d = new Date(claim.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const target = financialRunRate.find(f => f._yearMonth === key);
    if (target) target.expenses += Number(claim.amount) || 0;
  });

  financialRunRate.forEach(f => {
    // @ts-ignore
    delete f._yearMonth; // Cleanup
  });

  // Calculate dynamic insights based on current tenant database records
  const completedProjectsCount = allProjects.filter((p: any) => p.status === 'completed').length;
  const totalProjects = allProjects.length;
  const projectDeliveryRate = totalProjects > 0 
    ? Math.round((completedProjectsCount / totalProjects) * 100) 
    : 100;

  const attendanceRate = totalEmployees > 0 
    ? Math.round((presentToday / totalEmployees) * 100) 
    : 100;

  const allClaims = claimsRes.data || [];
  const approvedClaimsCount = allClaims.filter((c: any) => c.status === 'approved').length;
  const settledClaimsCount = allClaims.filter((c: any) => c.status === 'approved' || c.status === 'rejected').length;
  const complianceRate = settledClaimsCount > 0 
    ? Math.round((approvedClaimsCount / settledClaimsCount) * 100) 
    : 100;

  // RBAC check definitions
  const rawRole = (context.auth!.user.rawRole || user.role) as UserRole;
  
  const canSeeFinance = [
    'super_admin', 'superadmin', 'admin', 'owner', 'business_owner', 'tenant_owner', 
    'ceo', 'cto', 'director', 'cms_administrator', 'management', 'finance', 'accountant'
  ].includes(rawRole);

  const canSeeHR = [
    'super_admin', 'superadmin', 'admin', 'owner', 'business_owner', 'tenant_owner', 
    'ceo', 'cto', 'director', 'cms_administrator', 'management', 'hr_manager', 'hr_executive'
  ].includes(rawRole);

  const canSeeOps = [
    'super_admin', 'superadmin', 'admin', 'owner', 'business_owner', 'tenant_owner', 
    'ceo', 'cto', 'director', 'cms_administrator', 'management', 'project_manager', 'manager', 
    'devops_engineer', 'business_analyst'
  ].includes(rawRole);

  // Filter approvals by role
  let filteredApprovals = pendingApprovals;
  if (!canSeeHR && rawRole !== 'project_manager' && rawRole !== 'manager') {
    filteredApprovals = filteredApprovals.filter((a: any) => a.type !== 'leave' && a.type !== 'attendance');
  }
  if (!canSeeFinance && rawRole !== 'project_manager' && rawRole !== 'manager') {
    filteredApprovals = filteredApprovals.filter((a: any) => a.type !== 'reimbursement');
  }

  // Filter recent activities by role
  let filteredActivity = recentActivity;
  if (!canSeeFinance) {
    filteredActivity = filteredActivity.filter((a: any) => a.type !== 'invoice' && a.type !== 'reimbursement');
  }
  if (!canSeeOps) {
    filteredActivity = filteredActivity.filter((a: any) => a.type !== 'project');
  }

  let recommendationTitle = 'Optimal Operations Confirmed';
  let recommendationMessage = 'All tenant metrics are within normal bounds. Keep up the great work!';
  
  if (canSeeFinance && pendingInvoicesCount > 0) {
    recommendationTitle = 'Awaiting Settlement Action';
    recommendationMessage = `You have ${pendingInvoicesCount} pending invoices totaling ₹${pendingInvoicesValue.toLocaleString()}. We suggest sending automated reminders to clients to accelerate cash inflow.`;
  } else if (filteredApprovals.length > 0) {
    recommendationTitle = 'Pending Approvals Pending Review';
    recommendationMessage = `There are ${filteredApprovals.length} pending team requests (leaves, reimbursements, or attendance) in your queue. Resolving these will maintain team productivity.`;
  } else if (canSeeHR && attendanceRate < 80) {
    recommendationTitle = 'Schedule Coverage Adjustment';
    recommendationMessage = `Today's attendance is at ${attendanceRate}%. Review shift schedules to ensure client deliverables are unaffected.`;
  }

  return NextResponse.json({
    activeClients: canSeeOps ? activeClientsCount : 0,
    activeProjects: canSeeOps ? activeProjectsCount : 0,
    totalRevenue: canSeeFinance ? totalRevenue : 0,
    totalEmployees: canSeeHR ? totalEmployees : 0,
    monthlyRevenue: canSeeFinance ? monthlyRevenue : 0,
    netCashFlow: canSeeFinance ? netCashFlow : 0,
    pendingInvoicesCount: canSeeFinance ? pendingInvoicesCount : 0,
    pendingInvoicesValue: canSeeFinance ? pendingInvoicesValue : 0,
    lowStockAlertsCount: canSeeOps ? lowStockAlertsCount : 0,
    topCustomers: canSeeFinance ? topCustomers : [],
    recentActivity: filteredActivity,
    workforce: canSeeHR ? {
      presentToday,
      absentToday,
      missingReportsCount
    } : {
      presentToday: 0,
      absentToday: 0,
      missingReportsCount: 0
    },
    pendingApprovals: filteredApprovals,
    recentProjects: canSeeOps ? (recentProjectsRes.data || []) : [],
    financialRunRate: canSeeFinance ? financialRunRate : [],
    insights: {
      projectDeliveryRate: canSeeOps ? projectDeliveryRate : 0,
      attendanceRate: canSeeHR ? attendanceRate : 0,
      complianceRate: canSeeFinance ? complianceRate : 0,
      recommendationTitle,
      recommendationMessage
    }
  });
}, { requireAuth: true });
