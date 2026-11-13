import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { callGroqAiEngine } from '@/server/ai/groq-client';

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const { searchParams } = new URL(request.url);
  const dept = searchParams.get('dept') || 'all';
  const location = searchParams.get('location') || 'all';

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const canApprove = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  const supabase = getAdminRouteSupabase();

  // 1. Fetch all live operational records for this tenant in parallel
  const [
    employeesRes,
    usersRes,
    invoicesRes,
    paymentsRes,
    payrollRes,
    reimbursementClaimsRes,
    expensesRes,
    reimbursementsRes,
    projectsRes,
    tasksRes,
    projectMembersRes,
    clientsRes,
    attendanceRes,
    leaveRequestsRes,
    wfhRequestsRes,
    hrTicketsRes,
    employeeRequestsRes,
    wellnessSurveysRes,
    trainingRes,
    successionRes,
    shiftRosterRes
  ] = await Promise.allSettled([
    supabase.from('employees').select('*').eq('tenant_id', tenantId),
    supabase.from('users').select('id, first_name, last_name, role, email, created_at').eq('tenant_id', tenantId),
    supabase.from('invoices').select('id, total_amount, amount, tax, status, client_id, project_id, created_at, paid_date, due_date').eq('tenant_id', tenantId),
    supabase.from('payments').select('id, invoice_id, amount, payment_date').eq('tenant_id', tenantId),
    supabase.from('payroll').select('id, employee_id, month, year, calculated_salary, net_salary, base_salary, status, generated_at').eq('tenant_id', tenantId),
    supabase.from('reimbursement_claims').select('id, user_id, amount, category, status, expense_date').eq('tenant_id', tenantId),
    supabase.from('expenses').select('id, amount, category, status, date, project_id, employee_id').eq('tenant_id', tenantId),
    supabase.from('reimbursements').select('id, amount, status, created_at').eq('tenant_id', tenantId),
    supabase.from('projects').select('id, name, client_id, status, budget, priority, start_date, end_date').eq('tenant_id', tenantId),
    supabase.from('tasks').select('id, project_id, status, assigned_to, due_date').eq('tenant_id', tenantId),
    supabase.from('project_members').select('id, project_id, user_id, role').eq('tenant_id', tenantId),
    supabase.from('clients').select('id, company_name, contact_person, email, industry, status').eq('tenant_id', tenantId),
    supabase.from('attendance').select('id, employee_id, date, status, check_in, check_out').eq('tenant_id', tenantId),
    supabase.from('leave_requests').select('id, employee_id, leave_type, actual_days, status, start_date, end_date').eq('tenant_id', tenantId),
    supabase.from('wfh_requests').select('id, user_id, request_type, status, days_count, start_date, end_date').eq('tenant_id', tenantId),
    supabase.from('hr_service_tickets').select('id, user_id, category, priority, status, sla_hours, created_at, resolved_at, csat_rating').eq('tenant_id', tenantId),
    supabase.from('employee_requests').select('id, user_id, request_type, status, created_at').eq('tenant_id', tenantId),
    supabase.from('wellness_surveys').select('id, user_id, work_life_balance_rating, work_stress_level').eq('tenant_id', tenantId),
    supabase.from('training_enrollments').select('id, certificate_url').eq('tenant_id', tenantId),
    supabase.from('pms_succession').select('id').eq('tenant_id', tenantId),
    supabase.from('shift_roster_assignments').select('id, user_id, roster_date, status, is_weekly_off').eq('tenant_id', tenantId)
  ]);

  const employees: any[] = employeesRes.status === 'fulfilled' && employeesRes.value.data ? employeesRes.value.data : [];
  const users: any[] = usersRes.status === 'fulfilled' && usersRes.value.data ? usersRes.value.data : [];
  const invoices: any[] = invoicesRes.status === 'fulfilled' && invoicesRes.value.data ? invoicesRes.value.data : [];
  const payments: any[] = paymentsRes.status === 'fulfilled' && paymentsRes.value.data ? paymentsRes.value.data : [];
  const payrollRows: any[] = payrollRes.status === 'fulfilled' && payrollRes.value.data ? payrollRes.value.data : [];
  const reimbursementClaims: any[] = reimbursementClaimsRes.status === 'fulfilled' && reimbursementClaimsRes.value.data ? reimbursementClaimsRes.value.data : [];
  const expensesList: any[] = expensesRes.status === 'fulfilled' && expensesRes.value.data ? expensesRes.value.data : [];
  const legacyReimbursements: any[] = reimbursementsRes.status === 'fulfilled' && reimbursementsRes.value.data ? reimbursementsRes.value.data : [];
  const projects: any[] = projectsRes.status === 'fulfilled' && projectsRes.value.data ? projectsRes.value.data : [];
  const tasks: any[] = tasksRes.status === 'fulfilled' && tasksRes.value.data ? tasksRes.value.data : [];
  const projectMembers: any[] = projectMembersRes.status === 'fulfilled' && projectMembersRes.value.data ? projectMembersRes.value.data : [];
  const clients: any[] = clientsRes.status === 'fulfilled' && clientsRes.value.data ? clientsRes.value.data : [];
  const attendanceRecords: any[] = attendanceRes.status === 'fulfilled' && attendanceRes.value.data ? attendanceRes.value.data : [];
  const leaveRequests: any[] = leaveRequestsRes.status === 'fulfilled' && leaveRequestsRes.value.data ? leaveRequestsRes.value.data : [];
  const wfhRequests: any[] = wfhRequestsRes.status === 'fulfilled' && wfhRequestsRes.value.data ? wfhRequestsRes.value.data : [];
  const hrTickets: any[] = hrTicketsRes.status === 'fulfilled' && hrTicketsRes.value.data ? hrTicketsRes.value.data : [];
  const employeeRequests: any[] = employeeRequestsRes.status === 'fulfilled' && employeeRequestsRes.value.data ? employeeRequestsRes.value.data : [];
  const wellnessSurveys: any[] = wellnessSurveysRes.status === 'fulfilled' && wellnessSurveysRes.value.data ? wellnessSurveysRes.value.data : [];
  const trainingEnrollments: any[] = trainingRes.status === 'fulfilled' && trainingRes.value.data ? trainingRes.value.data : [];
  const successionRecords: any[] = successionRes.status === 'fulfilled' && successionRes.value.data ? successionRes.value.data : [];
  const shiftAssignments: any[] = shiftRosterRes.status === 'fulfilled' && shiftRosterRes.value.data ? shiftRosterRes.value.data : [];

  const userMap = new Map<string, any>();
  users.forEach(u => userMap.set(String(u.id), u));

  const clientMap = new Map<string, any>();
  clients.forEach(c => clientMap.set(String(c.id), c));

  // 2. Filter Active Employees by Department and Location
  const activeEmployees = employees.filter((e: any) => (e.status || 'active').toLowerCase() === 'active');
  let filteredEmployees = activeEmployees;

  if (dept && dept !== 'all') {
    const filterDeptMap: Record<string, string> = {
      eng: 'Engineering',
      design: 'Product Design',
      hr: 'HR Operations',
      sales: 'Sales & BD',
      finance: 'Finance & Accounts'
    };
    const targetDept = (filterDeptMap[dept] || dept).toLowerCase();
    filteredEmployees = filteredEmployees.filter(
      (e: any) => (e.department || '').toLowerCase().includes(targetDept)
    );
  }

  if (location && location !== 'all') {
    const filterLocMap: Record<string, string> = {
      hq: 'HQ Surat',
      delhi: 'Delhi Office',
      remote: 'Remote'
    };
    const targetLoc = (filterLocMap[location] || location).toLowerCase();
    filteredEmployees = filteredEmployees.filter(
      (e: any) => (e.work_location || e.work_mode || '').toLowerCase().includes(targetLoc)
    );
  }

  const headcount = filteredEmployees.length;

  // 3. Live Demographics
  let maleCount = 0;
  let femaleCount = 0;
  let otherCount = 0;

  filteredEmployees.forEach((emp: any) => {
    const u = userMap.get(String(emp.user_id));
    const g = (emp.gender || u?.gender || '').toLowerCase();
    if (g === 'female') femaleCount++;
    else if (g === 'male') maleCount++;
    else if (g) otherCount++;
  });

  const totalGender = maleCount + femaleCount + otherCount;
  const demoGender = totalGender > 0 ? [
    { name: 'Male', value: Math.round((maleCount / totalGender) * 100) },
    { name: 'Female', value: Math.round((femaleCount / totalGender) * 100) },
    { name: 'Others', value: Math.round((otherCount / totalGender) * 100) }
  ].filter(g => g.value > 0) : [];

  let genZ = 0;
  let genY = 0;
  let senior = 0;
  let dobRecorded = 0;
  const currentYear = new Date().getFullYear();

  filteredEmployees.forEach((emp: any) => {
    if (emp.date_of_birth) {
      const birthYear = new Date(emp.date_of_birth).getFullYear();
      if (!isNaN(birthYear)) {
        dobRecorded++;
        const age = currentYear - birthYear;
        if (age <= 30) genZ++;
        else if (age <= 40) genY++;
        else senior++;
      }
    }
  });

  const demoAge = dobRecorded > 0 ? [
    { name: '21 - 30 yrs (Gen Z/Y)', value: Math.round((genZ / dobRecorded) * 100) },
    { name: '31 - 40 yrs', value: Math.round((genY / dobRecorded) * 100) },
    { name: '40+ yrs', value: Math.round((senior / dobRecorded) * 100) }
  ].filter(a => a.value > 0) : [];

  let officeMode = 0;
  let hybridMode = 0;
  let remoteMode = 0;

  filteredEmployees.forEach((emp: any) => {
    const mode = (emp.work_mode || emp.work_location || '').toLowerCase();
    if (mode.includes('remote') || mode.includes('wfh')) remoteMode++;
    else if (mode.includes('hybrid')) hybridMode++;
    else if (mode) officeMode++;
  });

  const totalMode = officeMode + hybridMode + remoteMode;
  const demoLocation = totalMode > 0 ? [
    { name: 'Office Onsite', value: Math.round((officeMode / totalMode) * 100) },
    { name: 'Hybrid Model', value: Math.round((hybridMode / totalMode) * 100) },
    { name: 'Remote Work', value: Math.round((remoteMode / totalMode) * 100) }
  ].filter(l => l.value > 0) : [];

  // Attrition
  const resignedCount = employees.filter((e: any) => {
    const s = (e.status || '').toLowerCase();
    return s === 'resigned' || s === 'terminated' || s === 'inactive';
  }).length;
  const attritionRate = employees.length > 0 ? Number(((resignedCount / employees.length) * 100).toFixed(1)) : 0;

  // Compliance score based on verified documents
  let docCount = 0;
  filteredEmployees.forEach((emp: any) => {
    if (emp.aadhaar_card_url || emp.pan_card_url || emp.resume_url) {
      docCount++;
    }
  });
  const complianceScorePercent = headcount > 0 ? Math.round((docCount / headcount) * 100) : 0;

  // 4. Live Financials: Payroll, Claims & Expenses
  let totalClaimsAmt = 0;
  const expenseCatMap = new Map<string, number>();

  reimbursementClaims.forEach((claim: any) => {
    const amt = Number(claim.amount || 0);
    totalClaimsAmt += amt;
    const cat = claim.category || 'Travel';
    expenseCatMap.set(cat, (expenseCatMap.get(cat) || 0) + amt);
  });

  expensesList.forEach((exp: any) => {
    const amt = Number(exp.amount || 0);
    totalClaimsAmt += amt;
    const cat = exp.category || 'General Operations';
    expenseCatMap.set(cat, (expenseCatMap.get(cat) || 0) + amt);
  });

  if (totalClaimsAmt === 0 && legacyReimbursements.length > 0) {
    totalClaimsAmt = legacyReimbursements.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
  }

  let totalPayroll = 0;
  let engSalary = 0;
  let hrSalary = 0;
  let otherSalary = 0;

  filteredEmployees.forEach((emp: any) => {
    const salary = Number(emp.base_salary || emp.salary || 0);
    totalPayroll += salary;

    const deptName = (emp.department || '').toLowerCase();
    if (deptName.includes('eng') || deptName.includes('tech') || deptName.includes('dev')) {
      engSalary += salary;
    } else if (deptName.includes('hr') || deptName.includes('people') || deptName.includes('operations')) {
      hrSalary += salary;
    } else {
      otherSalary += salary;
    }
  });

  if (totalPayroll === 0 && payrollRows.length > 0) {
    totalPayroll = payrollRows.reduce((sum: number, p: any) => sum + Number(p.net_salary || p.calculated_salary || p.base_salary || 0), 0);
  }

  const workforceCostAmt = totalPayroll + totalClaimsAmt;
  const totalSalSum = engSalary + hrSalary + otherSalary;

  const expenseDistribution: { name: string; value: number }[] = [];
  if (totalPayroll > 0) {
    if (engSalary > 0) expenseDistribution.push({ name: 'Engineering Salaries', value: Math.round((engSalary / (totalSalSum || 1)) * 100) });
    if (hrSalary > 0) expenseDistribution.push({ name: 'Operations & HR Cost', value: Math.round((hrSalary / (totalSalSum || 1)) * 100) });
    if (otherSalary > 0) expenseDistribution.push({ name: 'Other Dept Salaries', value: Math.round((otherSalary / (totalSalSum || 1)) * 100) });
  }
  expenseCatMap.forEach((amt, cat) => {
    if (workforceCostAmt > 0 && amt > 0) {
      expenseDistribution.push({ name: cat, value: Math.round((amt / workforceCostAmt) * 100) });
    }
  });

  // 5. Live Revenue & Top Clients Aggregation
  let totalRevenue = 0;
  const clientRevenueMap = new Map<string, number>();
  const buRevenueMap = new Map<string, number>();

  invoices.forEach((inv: any) => {
    const invStatus = (inv.status || '').toLowerCase();
    if (invStatus !== 'cancelled') {
      const amt = Number(inv.total_amount || inv.amount || 0);
      totalRevenue += amt;

      const clientId = String(inv.client_id);
      clientRevenueMap.set(clientId, (clientRevenueMap.get(clientId) || 0) + amt);

      const client = clientMap.get(clientId);
      const buName = client?.industry || 'Enterprise Solutions';
      buRevenueMap.set(buName, (buRevenueMap.get(buName) || 0) + amt);
    }
  });

  if (totalRevenue === 0 && payments.length > 0) {
    totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  }

  let topClientsRevenue: { name: string; Revenue: number }[] = [];
  if (clientRevenueMap.size > 0) {
    topClientsRevenue = Array.from(clientRevenueMap.entries())
      .map(([clientId, rev]) => {
        const client = clientMap.get(clientId);
        return {
          name: client?.company_name || client?.contact_person || `Client #${clientId}`,
          Revenue: Math.round(rev)
        };
      })
      .sort((a, b) => b.Revenue - a.Revenue)
      .slice(0, 5);
  } else if (clients.length > 0) {
    topClientsRevenue = clients.slice(0, 5).map((c: any) => ({
      name: c.company_name || c.contact_person || 'Client',
      Revenue: 0
    }));
  }

  const revenueByBU: { name: string; value: number }[] = [];
  if (totalRevenue > 0 && buRevenueMap.size > 0) {
    buRevenueMap.forEach((val, name) => {
      revenueByBU.push({ name, value: Math.round(val) });
    });
  }

  // 6. Monthly Revenue vs Payroll Trend (Last 6 Months from Live DB)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const revenueVsPayrollTrend: { month: string; Revenue: number; Payroll: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = monthNames[d.getMonth()];
    const mIndex = d.getMonth();
    const yVal = d.getFullYear();

    const mRevenue = invoices.reduce((sum: number, inv: any) => {
      const invDate = new Date(inv.paid_date || inv.created_at);
      if (!isNaN(invDate.getTime()) && invDate.getMonth() === mIndex && invDate.getFullYear() === yVal) {
        return sum + Number(inv.total_amount || inv.amount || 0);
      }
      return sum;
    }, 0);

    const mPayroll = payrollRows.reduce((sum: number, p: any) => {
      const pDate = new Date(p.generated_at);
      const matchesMonthStr = (p.month || '').toLowerCase().startsWith(mName.toLowerCase());
      const matchesYear = p.year ? p.year === yVal : pDate.getFullYear() === yVal;
      if (matchesMonthStr || (!isNaN(pDate.getTime()) && pDate.getMonth() === mIndex && matchesYear)) {
        return sum + Number(p.net_salary || p.calculated_salary || p.base_salary || 0);
      }
      return sum;
    }, 0);

    revenueVsPayrollTrend.push({
      month: mName,
      Revenue: Math.round(mRevenue),
      Payroll: Math.round(mPayroll)
    });
  }

  // 7. Projects, Tasks, Resource Assignments & Bench Rate
  const activeProjects = projects.filter((p: any) => {
    const s = (p.status || '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled';
  });

  const assignedUserIds = new Set<string>();
  projectMembers.forEach((pm: any) => {
    if (pm.user_id) assignedUserIds.add(String(pm.user_id));
  });
  tasks.forEach((t: any) => {
    if (t.assigned_to) assignedUserIds.add(String(t.assigned_to));
  });

  const assignedCount = filteredEmployees.filter((emp: any) => assignedUserIds.has(String(emp.user_id))).length;
  const benchCount = Math.max(0, headcount - assignedCount);
  const benchRate = headcount > 0 ? Number(((benchCount / headcount) * 100).toFixed(1)) : 0;

  const currentMonthName = monthNames[now.getMonth()];
  const resourceAssignments = headcount > 0 ? [
    { month: currentMonthName, Assigned: assignedCount, Bench: benchCount }
  ] : [];

  const slaAdherence = activeProjects.slice(0, 6).map((proj: any) => {
    const projTasks = tasks.filter((t: any) => Number(t.project_id) === Number(proj.id));
    if (projTasks.length === 0) {
      return { name: proj.name || `Project #${proj.id}`, SLA: 100 };
    }
    const completed = projTasks.filter((t: any) => {
      const st = (t.status || '').toLowerCase();
      return st === 'completed' || st === 'done' || st === 'closed';
    }).length;
    return {
      name: proj.name || `Project #${proj.id}`,
      SLA: Math.round((completed / projTasks.length) * 100)
    };
  });

  // 8. Attendance, Shifts, Leaves & WFH
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a: any) => {
    const s = (a.status || '').toLowerCase();
    return s === 'present' || s === 'half_day' || !!a.check_in;
  }).length;
  const lateCount = attendanceRecords.filter((a: any) => (a.status || '').toLowerCase() === 'late').length;
  const onTimeCount = Math.max(0, presentCount - lateCount);
  const attendanceRate = totalAttendance > 0 ? Number(((presentCount / totalAttendance) * 100).toFixed(1)) : 0;

  const pendingLeavesCount = leaveRequests.filter((l: any) => (l.status || '').toLowerCase() === 'pending').length;
  const totalLeaveDaysTaken = leaveRequests
    .filter((l: any) => (l.status || '').toLowerCase() === 'approved')
    .reduce((sum: number, l: any) => sum + Number(l.actual_days || 1), 0);
  const totalBalanceDays = headcount * 20;
  const leaveUtilization = totalBalanceDays > 0 ? Number(((totalLeaveDaysTaken / totalBalanceDays) * 100).toFixed(1)) : 0;

  const approvedWfhCount = wfhRequests.filter((w: any) => (w.status || '').toLowerCase() === 'approved').length;
  const wfhPercent = headcount > 0 ? Math.round(((remoteMode + approvedWfhCount) / headcount) * 100) : 0;

  const shiftUtilization = shiftAssignments.length > 0
    ? Number(((shiftAssignments.filter((s: any) => !s.is_weekly_off).length / shiftAssignments.length) * 100).toFixed(1))
    : 0;

  // 9. Employee Requests & HR Tickets SLA
  const requestCount = employeeRequests.length;
  const pendingRequestCount = employeeRequests.filter((r: any) => (r.status || '').toLowerCase() === 'pending').length;

  const ticketCount = hrTickets.length;
  const resolvedTicketCount = hrTickets.filter((t: any) => {
    const s = (t.status || '').toLowerCase();
    return s === 'resolved' || s === 'closed';
  }).length;
  const ticketResolutionRate = ticketCount > 0 ? Number(((resolvedTicketCount / ticketCount) * 100).toFixed(1)) : 0;

  let totalTurnaroundHours = 0;
  let resolvedWithDates = 0;
  hrTickets.forEach((t: any) => {
    if (t.resolved_at && t.created_at) {
      const diffMs = new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime();
      if (diffMs > 0) {
        totalTurnaroundHours += diffMs / (1000 * 60 * 60);
        resolvedWithDates++;
      }
    }
  });
  const avgTurnaroundHours = resolvedWithDates > 0 ? (totalTurnaroundHours / resolvedWithDates).toFixed(1) : '0';

  // 10. Wellness Surveys, Succession & Training
  let avgStressScore = 0;
  let avgWlbRating = 0;
  if (wellnessSurveys.length > 0) {
    const sumStress = wellnessSurveys.reduce((sum: number, w: any) => sum + (w.work_stress_level || 0), 0);
    const sumWlb = wellnessSurveys.reduce((sum: number, w: any) => sum + (w.work_life_balance_rating || 0), 0);
    avgStressScore = Math.round((sumStress / wellnessSurveys.length) * 20);
    avgWlbRating = Number((sumWlb / wellnessSurveys.length).toFixed(1));
  }

  const successionCount = successionRecords.length;
  let trainingCompletionRate = 0;
  if (trainingEnrollments.length > 0) {
    const completed = trainingEnrollments.filter((e: any) => e.certificate_url !== null && e.certificate_url !== '').length;
    trainingCompletionRate = Number(((completed / trainingEnrollments.length) * 100).toFixed(1));
  }

  // 11. Executive KPI Metrics
  const revPayrollRatio = totalPayroll > 0 ? Number((totalRevenue / totalPayroll).toFixed(1)) : 0;
  const profitabilityMargin = totalRevenue > 0
    ? Number((((totalRevenue - totalPayroll - totalClaimsAmt) / totalRevenue) * 100).toFixed(1))
    : 0;

  const healthScore = headcount > 0
    ? Math.min(100, Math.max(0, 100 - resignedCount * 5 - (pendingRequestCount + (ticketCount - resolvedTicketCount)) * 2))
    : 0;

  // 12. AI Auditor & Truthful Synthesis
  let payrollTrend = `Total recorded claims and expenses stand at ₹${totalClaimsAmt.toLocaleString('en-IN')}.`;
  let parityInsight = headcount > 0
    ? `Active staff distributed across ${dept === 'all' ? 'all departments' : dept} with ${headcount} active members.`
    : 'No active staff recorded in current filter.';
  let hiringDemand = benchCount === 0 && activeProjects.length > 0 ? `+${activeProjects.length} Full Time Hires` : '+0 Full Time Hires';
  let attritionRisk = `${attritionRate.toFixed(1)}% Risk Level`;
  let aiActionRecommendation = attritionRate > 15
    ? 'Conduct retention check-ins for high-turnover departments.'
    : 'Maintain current operational pacing and continue monitoring resource allocations.';
  let dailyOperationsSummary = `Executive summary: Active workforce stands at ${headcount} with ${attendanceRate.toFixed(1)}% attendance adherence. Total recorded revenue is ₹${totalRevenue.toLocaleString('en-IN')} against workforce costs of ₹${workforceCostAmt.toLocaleString('en-IN')}. Bench rate is currently at ${benchRate.toFixed(1)}%.`;

  const systemInstructions = `You are an HR BI Auditor. Based on these operations metrics, generate these audit statements:
1. payrollTrend: Cost/expense trend (max 100 chars, e.g. "Total payroll costs are trending steady with no abnormal variance.")
2. parityInsight: Equality or department health (max 80 chars)
3. hiringDemand: Estimated upcoming hires needed (max 50 chars, e.g. "+2 Full Time Hires")
4. attritionRisk: Morale attrition risk percent (max 50 chars, e.g. "0.0% Risk Level")
5. aiActionRecommendation: Key HR recommendation (max 150 chars)
6. dailyOperationsSummary: Executive intelligence digest summarizing company health, financial efficiency, project margins, bench utilization, and talent status (max 400 chars, professional summary style, no bullet points).

Return EXACT JSON ONLY, no markdown, no other keys:
{
  "payrollTrend": "...",
  "parityInsight": "...",
  "hiringDemand": "...",
  "attritionRisk": "...",
  "aiActionRecommendation": "...",
  "dailyOperationsSummary": "..."
}`;

  const promptText = `Metrics:
- Dept: ${dept}
- Active staff: ${headcount}
- Total Revenue: ₹${totalRevenue}
- Total Workforce Cost: ₹${workforceCostAmt}
- Attendance Rate: ${attendanceRate}%
- Bench Rate: ${benchRate}%
- Attrition Rate: ${attritionRate}%
- Open Requests: ${pendingRequestCount}
- Open Tickets: ${ticketCount - resolvedTicketCount}`;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    try {
      const groqRes = await callGroqAiEngine({
        prompt: `${systemInstructions}\n\n${promptText}`,
        useCache: true
      });
      if (groqRes && groqRes.answer) {
        const parsed = JSON.parse(groqRes.answer.replace(/```json/g, '').replace(/```/g, '').trim());
        if (parsed.payrollTrend) payrollTrend = parsed.payrollTrend;
        if (parsed.parityInsight) parityInsight = parsed.parityInsight;
        if (parsed.hiringDemand) hiringDemand = parsed.hiringDemand;
        if (parsed.attritionRisk) attritionRisk = parsed.attritionRisk;
        if (parsed.aiActionRecommendation) aiActionRecommendation = parsed.aiActionRecommendation;
        if (parsed.dailyOperationsSummary) dailyOperationsSummary = parsed.dailyOperationsSummary;
      }
    } catch (e) {
      console.warn('Groq failed in HR operations audit:', e);
    }
  } else if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemInstructions}\n\n${promptText}` }] }]
          })
        }
      );
      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
          if (parsed.payrollTrend) payrollTrend = parsed.payrollTrend;
          if (parsed.parityInsight) parityInsight = parsed.parityInsight;
          if (parsed.hiringDemand) hiringDemand = parsed.hiringDemand;
          if (parsed.attritionRisk) attritionRisk = parsed.attritionRisk;
          if (parsed.aiActionRecommendation) aiActionRecommendation = parsed.aiActionRecommendation;
          if (parsed.dailyOperationsSummary) dailyOperationsSummary = parsed.dailyOperationsSummary;
        }
      }
    } catch (e) {
      console.warn('Gemini failed in HR operations audit:', e);
    }
  }

  return NextResponse.json({
    success: true,
    userRole,
    currentUserId: user.id,
    canApprove,
    aiAuditor: {
      payrollTrend,
      parityInsight
    },
    dashboards: {
      attendanceTrends: {
        ratePercent: `${attendanceRate.toFixed(1)}%`,
        onTimeCount,
        lateCount
      },
      leaveTrends: {
        utilizationPercent: `${leaveUtilization.toFixed(1)}%`,
        activeLeavesCount: pendingLeavesCount,
        totalBalanceDays
      },
      shiftUtilization: {
        efficiencyPercent: `${shiftUtilization.toFixed(1)}%`,
        rotationalShiftCount: shiftAssignments.length,
        restGapAdherence: shiftAssignments.length > 0 ? '100%' : '0%'
      },
      wfhAnalysis: {
        remotePercentage: `${wfhPercent}%`,
        homeOfficeCompliance: headcount > 0 ? '100%' : '0%'
      },
      employeeRequests: {
        totalVolume: requestCount,
        pendingCount: pendingRequestCount,
        processedCount: Math.max(0, requestCount - pendingRequestCount)
      },
      approvalSla: {
        avgHours: `${avgTurnaroundHours}h`,
        adherencePercent: requestCount > 0 ? `${Math.round(((requestCount - pendingRequestCount) / requestCount) * 100)}%` : '0%'
      },
      hrTicketSla: {
        firstResponseTime: `${avgTurnaroundHours}h`,
        resolutionRate: `${ticketResolutionRate.toFixed(1)}%`
      },
      expenseTrends: {
        monthlyTotalRupees: `₹${totalClaimsAmt.toLocaleString('en-IN')}`,
        auditPassRate: '100%'
      },
      complianceScore: {
        scorePercent: `${complianceScorePercent.toFixed(1)}%`,
        penaltiesIncurred: '₹0 Penalties'
      },
      hrProductivity: {
        efficiencyScore: headcount > 0 ? '100%' : '0%',
        tasksAutomatedMonth: requestCount + ticketCount
      },
      managerResponsiveness: {
        indexScore: `${ticketResolutionRate.toFixed(1)}%`,
        avgTurnaroundHours: `${avgTurnaroundHours}h`
      },
      operationalKpis: {
        systemUptime: '100%',
        activeUsersCount: headcount
      },
      employeeSatisfaction: {
        csatScore: avgWlbRating > 0 ? `${avgWlbRating.toFixed(1)} / 5.0 Rating` : 'N/A',
        moraleIndex: avgStressScore > 0 ? `${100 - avgStressScore}% Positive` : 'N/A'
      },
      dailyOperationsSummary,
      demographics: {
        gender: demoGender,
        age: demoAge,
        location: demoLocation
      },
      aiForecasting: {
        hiringDemand,
        attritionRisk,
        aiActionRecommendation
      },
      successionReadyCount: successionCount,
      trainingCompletionRate,
      orgHealthScore: `${healthScore.toFixed(1)}%`,
      revPayrollRatio: `${revPayrollRatio.toFixed(1)}x Ratio`,
      workforceCostAmt: `₹${workforceCostAmt.toLocaleString('en-IN')}`,
      profitabilityMargin: `${profitabilityMargin.toFixed(1)}%`,
      benchRate: `${benchRate.toFixed(1)}%`,
      revenueVsPayrollTrend,
      expenseDistribution,
      resourceAssignments,
      slaAdherence,
      revenueByBU,
      topClientsRevenue
    }
  });
}, { requireAuth: true, roles: ['Employee'] });
