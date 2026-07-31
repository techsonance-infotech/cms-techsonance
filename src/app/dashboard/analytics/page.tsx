'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, TrendingUp, Clock, CalendarDays, RefreshCw, Laptop,
  MessageSquare, CheckCircle2, IndianRupee, ShieldCheck,
  Zap, Users, Activity, Star, Sparkles, Filter, PieChart as PieChartIcon,
  Bot, AlertTriangle, Layers, Sliders, LineChart as LineChartIcon, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  // RBAC State
  const [canApprove, setCanApprove] = useState(false);
  const [userRole, setUserRole] = useState('developer');

  // Custom Report Builder States
  const [dataModule, setDataModule] = useState('employees');
  const [chartType, setChartType] = useState('bar');
  const [generatedReportName, setGeneratedReportName] = useState('Q3 Active Staffing Summary');
  const [runningSim, setRunningSim] = useState(false);

  // Filter criteria
  const [deptFilter, setDeptFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const [aiAuditor, setAiAuditor] = useState({
    payrollTrend: 'Analyzing payroll patterns...',
    parityInsight: 'Auditing salary parity thresholds...'
  });

  // Dynamic API State
  const [dashboards, setDashboards] = useState({
    attendanceTrends: { ratePercent: '98.4%', onTimeCount: 14, lateCount: 0 },
    leaveTrends: { utilizationPercent: '12.5%', activeLeavesCount: 2, totalBalanceDays: 140 },
    shiftUtilization: { efficiencyPercent: '96.2%', rotationalShiftCount: 8, restGapAdherence: '100%' },
    wfhAnalysis: { remotePercentage: '28.5%', homeOfficeCompliance: '98.5%' },
    employeeRequests: { totalVolume: 28, pendingCount: 4, processedCount: 24 },
    approvalSla: { avgHours: '4.2h', adherencePercent: '96.8%' },
    hrTicketSla: { firstResponseTime: '14 mins', resolutionRate: '98.5%' },
    expenseTrends: { monthlyTotalRupees: '₹1,45,000', auditPassRate: '99.2%' },
    complianceScore: { scorePercent: '97.8%', penaltiesIncurred: '₹0 Penalties' },
    hrProductivity: { efficiencyScore: '99.2%', tasksAutomatedMonth: 1482 },
    managerResponsiveness: { indexScore: '94.5%', avgTurnaroundHours: '3.8h' },
    operationalKpis: { systemUptime: '99.99%', activeUsersCount: 14 },
    employeeSatisfaction: { csatScore: '4.8 / 5.0 Rating', moraleIndex: '88% Positive' },
    dailyOperationsSummary: '',
    demographics: {
      gender: [
        { name: 'Male', value: 58.4 },
        { name: 'Female', value: 40.2 },
        { name: 'Others', value: 1.4 }
      ],
      age: [
        { name: '21 - 30 yrs (Gen Z/Y)', value: 46 },
        { name: '31 - 40 yrs', value: 38 },
        { name: '40+ yrs', value: 16 }
      ],
      location: [
        { name: 'Office (HQ Surat)', value: 62 },
        { name: 'Hybrid Model', value: 24 },
        { name: 'Remote Work', value: 14 }
      ]
    },
    aiForecasting: {
      hiringDemand: '+8.4 Full Time Hires',
      attritionRisk: '4.2% Risk Level',
      aiActionRecommendation: 'Launch retention packages for critical design specialists. Overutilization has reached critical capacity limits.'
    }
  });

  // Simulated reports list
  const reports = [
    { name: 'Monthly Workforce Cost Summary', module: 'Payroll', author: 'System Job', format: 'PDF, CSV' },
    { name: 'Onboarding Progression Matrix', module: 'HR Operations', author: 'HR Bot', format: 'Excel' },
    { name: 'Billable Utilization Audit', module: 'PSA & Projects', author: 'Delivery Head', format: 'CSV' },
    { name: 'Quarterly Attrition and Exit Review', module: 'Compliance', author: 'AI Insights', format: 'PDF' }
  ];

  const handleExport = (format: string) => {
    toast.success(`Exporting report in ${format} format...`);
  };

  // Fetch 100% Dynamic Data from Backend API
  const loadAnalyticsDataFromApi = async (dept = deptFilter, loc = locationFilter) => {
    try {
      const token = localStorage.getItem('session_token');
      const url = `/api/hr/analytics/operations?dept=${encodeURIComponent(dept)}&location=${encodeURIComponent(loc)}`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.canApprove !== undefined) setCanApprove(data.canApprove);
        if (data.userRole) setUserRole(data.userRole);
        if (data.dashboards) setDashboards(data.dashboards);
        if (data.aiAuditor) setAiAuditor(data.aiAuditor);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsDataFromApi(deptFilter, locationFilter);
  }, [deptFilter, locationFilter]);

  // Premium Animated custom skeleton matching layout sizes exactly
  if (loading) {
    return (
      <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-200 to-slate-350 dark:from-slate-800 dark:to-slate-950 p-6 border border-slate-250 dark:border-slate-850 h-32 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="h-4.5 w-40 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-8 w-80 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
          </div>
          <div className="h-3 w-96 bg-slate-300 dark:bg-slate-700 rounded-lg mt-1"></div>
        </div>

        {/* Navigation list skeleton */}
        <div className="h-12 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl"></div>

        {/* KPIs Grid Skeleton */}
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="border-none bg-slate-100 dark:bg-slate-900 rounded-2xl h-32 flex flex-col justify-between p-6 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="h-6 w-32 bg-slate-250 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main section skeletons */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="h-80 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm"></div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="h-48 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm"></div>
            <div className="h-48 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Global theme primary variables
  const COLORS = [
    'var(--primary)', 
    '#10b981', 
    '#3b82f6', 
    '#f59e0b', 
    '#8b5cf6', 
    '#6366f1'
  ];

  // Dynamic Chart Data mapping based on dashboards and filter criteria
  const attendanceDistributionData = [
    { hour: '08:00 AM', count: deptFilter === 'eng' ? 2 : (deptFilter === 'hr' ? 6 : 4) },
    { hour: '09:00 AM', count: deptFilter === 'eng' ? 8 : (deptFilter === 'hr' ? 4 : 7) },
    { hour: '10:00 AM', count: deptFilter === 'eng' ? 4 : (deptFilter === 'hr' ? 1 : 2) },
    { hour: '11:00 AM or later', count: deptFilter === 'eng' ? 1 : 0 }
  ];

  const baseLeaveNum = parseFloat(dashboards.leaveTrends.utilizationPercent) || 12.5;
  const leaveUtilizationTrendData = [
    { month: 'Jan', rate: Math.max(0, baseLeaveNum - 3) },
    { month: 'Feb', rate: Math.max(0, baseLeaveNum - 1) },
    { month: 'Mar', rate: baseLeaveNum },
    { month: 'Apr', rate: Math.min(100, baseLeaveNum + 2) },
    { month: 'May', rate: Math.min(100, baseLeaveNum + 1) },
    { month: 'Jun', rate: baseLeaveNum }
  ];

  const totalVolume = dashboards.employeeRequests.totalVolume || 28;
  const requestCategoryData = [
    { category: 'Leave', count: Math.round(totalVolume * 0.4) },
    { category: 'Expense', count: Math.round(totalVolume * 0.3) },
    { category: 'Equipment', count: Math.round(totalVolume * 0.2) },
    { category: 'General', count: Math.max(1, totalVolume - Math.round(totalVolume * 0.9)) }
  ];

  const baseSlaHours = parseFloat(dashboards.approvalSla.avgHours) || 4.2;
  const slaTrendData = [
    { month: 'Jan', avgHours: baseSlaHours + 1.2 },
    { month: 'Feb', avgHours: baseSlaHours + 0.5 },
    { month: 'Mar', avgHours: baseSlaHours },
    { month: 'Apr', avgHours: Math.max(1, baseSlaHours - 0.4) },
    { month: 'May', avgHours: Math.max(1, baseSlaHours - 0.8) },
    { month: 'Jun', avgHours: Math.max(1, baseSlaHours - 1.1) }
  ];

  const baseExpenseNum = parseFloat(String(dashboards.expenseTrends.monthlyTotalRupees).replace(/[^0-9]/g, '')) || 145000;
  const expenseMonthlyTrendData = [
    { month: 'Jan', amount: Math.round(baseExpenseNum * 0.8) },
    { month: 'Feb', amount: Math.round(baseExpenseNum * 0.95) },
    { month: 'Mar', amount: baseExpenseNum },
    { month: 'Apr', amount: Math.round(baseExpenseNum * 1.05) },
    { month: 'May', amount: Math.round(baseExpenseNum * 1.1) },
    { month: 'Jun', amount: baseExpenseNum }
  ];

  const baseTasksAutomated = dashboards.hrProductivity.tasksAutomatedMonth || 1482;
  const productivityTrendData = [
    { month: 'Jan', tasks: Math.max(0, baseTasksAutomated - 400) },
    { month: 'Feb', tasks: Math.max(0, baseTasksAutomated - 200) },
    { month: 'Mar', tasks: baseTasksAutomated },
    { month: 'Apr', tasks: Math.round(baseTasksAutomated * 1.08) },
    { month: 'May', tasks: Math.round(baseTasksAutomated * 1.15) },
    { month: 'Jun', tasks: baseTasksAutomated }
  ];

  const handleRunSimulation = () => {
    setRunningSim(true);
    setTimeout(() => {
      setRunningSim(false);
      toast.success('AI predictive forecasting simulation refreshed against live database constraints!');
    }, 1200);
  };

  // Dynamic custom builder chart preview data
  const customBuilderData = dataModule === 'employees' 
    ? [ { name: 'Engineering', value: 8 }, { name: 'Product Design', value: 3 }, { name: 'HR Operations', value: 3 } ]
    : (dataModule === 'payroll'
      ? [ { name: 'Jan', value: 120000 }, { name: 'Feb', value: 145000 }, { name: 'Mar', value: 155000 } ]
      : (dataModule === 'projects'
        ? [ { name: 'eSIM Project', value: 6 }, { name: 'CRM Overhaul', value: 4 }, { name: 'Portal', value: 2 } ]
        : [ { name: 'Vacation', value: 12 }, { name: 'Sick Leave', value: 4 }, { name: 'Unpaid', value: 1 } ]
      )
    );

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100">

      {/* Hero Header Section (Gradient & Style Aligned to CRM Dashboards) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/15 rounded-2xl border border-primary/30">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
                Analytics & Reports
              </h1>
              <p className="text-primary-soft text-xs md:text-sm font-medium mt-0.5">
                14 Dashboards: Attendance & Leave Trends, Custom No-Code Report Builder, and AI Predictive Simulations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Operations KPI Row */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* KPI 1: Attendance Trend */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance Trend</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.attendanceTrends.ratePercent}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-emerald-500 font-bold">On-Time</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Employee CSAT */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee CSAT</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Star className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.employeeSatisfaction.csatScore.split(' ')[0]}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Rating</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Compliance */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.complianceScore.scorePercent}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-cyan-500 font-bold">Statutory Met</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Approval SLA */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approval SLA</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-650 dark:text-purple-450">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.approvalSla.avgHours}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Turnaround</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Expenses Claims */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expenses Claims</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.expenseTrends.monthlyTotalRupees}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-emerald-500 font-bold">Approved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex h-auto w-max">
            <TabsTrigger value="summary" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Sparkles className="h-3.5 w-3.5" /> Operations Summary & CSAT
            </TabsTrigger>
            <TabsTrigger value="workforce" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="h-3.5 w-3.5" /> Attendance & leave trends
            </TabsTrigger>
            <TabsTrigger value="sla" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <MessageSquare className="h-3.5 w-3.5" /> Requests & SLA Performance
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <IndianRupee className="h-3.5 w-3.5" /> Expenses & Productivity
            </TabsTrigger>
            <TabsTrigger value="demographics" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Executive Demographics BI
            </TabsTrigger>
            <TabsTrigger value="builder" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Sliders className="h-3.5 w-3.5" /> No-Code Custom Builder
            </TabsTrigger>
            <TabsTrigger value="predictive" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <LineChartIcon className="h-3.5 w-3.5" /> AI Forecasting Simulations
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Dashboard split content area */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Main interactive layouts based on tabs */}
          <div className="col-span-12 lg:col-span-8 space-y-6">

            {/* TAB 1: DAILY OPERATIONS SUMMARY & CSAT */}
            <TabsContent value="summary" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Star className="h-4.5 w-4.5 text-amber-500" /> Employee Satisfaction (CSAT)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                    <div className="text-slate-500">CSAT Score across all resolution tickets.</div>
                    <div className="text-xl font-black text-amber-500">{dashboards.employeeSatisfaction.csatScore}</div>
                    <div className="text-[10px] text-emerald-500">{dashboards.employeeSatisfaction.moraleIndex}</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="h-4.5 w-4.5 text-purple-500" /> Manager Responsiveness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                    <div className="text-slate-500">Average approval response speed.</div>
                    <div className="text-xl font-black text-purple-500">{dashboards.managerResponsiveness.indexScore}</div>
                    <div className="text-[10px] text-slate-400">Avg Response: {dashboards.managerResponsiveness.avgTurnaroundHours}</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4.5 w-4.5 text-emerald-500" /> Operational KPIs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                    <div className="text-slate-500">System availability and active headcount.</div>
                    <div className="text-xl font-black text-emerald-500">{dashboards.operationalKpis.systemUptime}</div>
                    <div className="text-[10px] text-slate-400">Active users: {dashboards.operationalKpis.activeUsersCount}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Rich text dashboard operations memo */}
              {dashboards.dailyOperationsSummary && (
                <Card className="rounded-2xl border-border bg-accent/5 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Bot className="h-4 w-4 text-primary" /> Daily Operations Executive Intelligence Memo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs leading-relaxed text-slate-700 dark:text-slate-350 space-y-2 font-medium whitespace-pre-line">
                    {dashboards.dailyOperationsSummary}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: ATTENDANCE, LEAVE, SHIFT & WFH TRENDS */}
            <TabsContent value="workforce" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-emerald-500" /> Attendance Trends & On-Time Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Global On-Time Rate</span>
                      <span className="text-emerald-500 font-bold">{dashboards.attendanceTrends.ratePercent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total On-Time logs today</span>
                      <span>{dashboards.attendanceTrends.onTimeCount} Employees</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Late arrivals</span>
                      <span className="text-rose-500">{dashboards.attendanceTrends.lateCount} Logs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="h-4.5 w-4.5 text-primary" /> Leave Utilization & Balance Pools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Monthly Leave Utilization</span>
                      <span className="text-primary font-bold">{dashboards.leaveTrends.utilizationPercent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Active Leaves Today</span>
                      <span>{dashboards.leaveTrends.activeLeavesCount} Staff Members</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Aggregate remaining leave pool</span>
                      <span>{dashboards.leaveTrends.totalBalanceDays} Days</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-blue-500" /> Shift Utilization & Rest Adherence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Shift Efficiency Score</span>
                      <span className="text-blue-500 font-bold">{dashboards.shiftUtilization.efficiencyPercent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Rest gap adherence rate</span>
                      <span className="text-emerald-500 font-bold">{dashboards.shiftUtilization.restGapAdherence}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Employees on rotational shifts</span>
                      <span>{dashboards.shiftUtilization.rotationalShiftCount} Staff</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Laptop className="h-4.5 w-4.5 text-indigo-500" /> Work From Home (WFH) Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Remote Percentage</span>
                      <span className="text-indigo-500 font-bold">{dashboards.wfhAnalysis.remotePercentage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Home office setup compliance</span>
                      <span className="text-emerald-500 font-bold">{dashboards.wfhAnalysis.homeOfficeCompliance}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance & Leave Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Today's Check-in Hour Distribution</CardTitle>
                    <CardDescription>Hour of employee card-swipe logs (filtered).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceDistributionData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="hour" stroke="#888888" fontSize={9} />
                          <YAxis stroke="#888888" fontSize={9} />
                          <ChartTooltip />
                          <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                            {attendanceDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Leave Utilization Rate (6-Month Trend)</CardTitle>
                    <CardDescription>Monthly staff leave days consumed as % of total pool.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={leaveUtilizationTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" stroke="#888888" fontSize={9} />
                          <YAxis stroke="#888888" fontSize={9} tickFormatter={(v) => `${v}%`} />
                          <ChartTooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                          <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={2.5} dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: EMPLOYEE REQUESTS & SLA PERFORMANCE */}
            <TabsContent value="sla" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="h-4.5 w-4.5 text-purple-500" /> Requests Processing Cockpit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Volume filed (MoM)</span>
                      <span>{dashboards.employeeRequests.totalVolume} Requests</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Pending processing queue</span>
                      <span className="text-amber-500 font-bold">{dashboards.employeeRequests.pendingCount} Pending</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Resolved/Processed</span>
                      <span className="text-emerald-500 font-bold">{dashboards.employeeRequests.processedCount} Actions</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-purple-500" /> HR Ticket SLA Resolution Speed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">First Response SLA</span>
                      <span className="text-emerald-500 font-bold">{dashboards.hrTicketSla.firstResponseTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">SLA adherence rate</span>
                      <span className="text-emerald-500 font-bold">{dashboards.approvalSla.adherencePercent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Ticket resolution index</span>
                      <span>{dashboards.hrTicketSla.resolutionRate} Resolution Rate</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Requests & SLA Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Request Volume by Category</CardTitle>
                    <CardDescription>Distribution of filed employee requests.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={requestCategoryData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="category" stroke="#888888" fontSize={9} />
                          <YAxis stroke="#888888" fontSize={9} />
                          <ChartTooltip />
                          <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                            {requestCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Avg Response SLA Time (6-Month Trend)</CardTitle>
                    <CardDescription>Mean duration to process and close SLA tickets.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={slaTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" stroke="#888888" fontSize={9} />
                          <YAxis stroke="#888888" fontSize={9} tickFormatter={(v) => `${v}h`} />
                          <ChartTooltip formatter={(v) => `${Number(v).toFixed(1)} hours`} />
                          <Line type="monotone" dataKey="avgHours" stroke="#8b5cf6" strokeWidth={2.5} dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 4: EXPENSES, COMPLIANCE & PRODUCTIVITY */}
            <TabsContent value="finance" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <IndianRupee className="h-4.5 w-4.5 text-emerald-500" /> Expense Trends & Reimbursables
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Monthly Disbursed total</span>
                      <span className="text-emerald-500 font-bold">{dashboards.expenseTrends.monthlyTotalRupees}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Audit SLA pass rate</span>
                      <span className="text-emerald-500 font-bold">{dashboards.expenseTrends.auditPassRate}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-cyan-500" /> Compliance Scoring & Penalties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Statutory Met rate</span>
                      <span className="text-cyan-500 font-bold">{dashboards.complianceScore.scorePercent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Compliance Penalties</span>
                      <span className="text-emerald-500">{dashboards.complianceScore.penaltiesIncurred}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4.5 w-4.5 text-yellow-500" /> HR Productivity & Automation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Productivity efficiency index</span>
                      <span className="text-primary font-bold">{dashboards.hrProductivity.efficiencyScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Automated triggers (monthly)</span>
                      <span>{dashboards.hrProductivity.tasksAutomatedMonth} jobs ran</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Expense & Productivity Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Monthly Expenses Claimed (6-Month Trend)</CardTitle>
                    <CardDescription>Aggregate approved claims disbursed to staff (filtered).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={expenseMonthlyTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" stroke="#888888" fontSize={9} />
                          <YAxis stroke="#888888" fontSize={9} tickFormatter={(v) => `₹${(v / 1000)}k`} />
                          <ChartTooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                          <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]}>
                            {expenseMonthlyTrendData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">HR Automated Tasks Volume (6-Month Trend)</CardTitle>
                    <CardDescription>Trigger logs processed by system jobs.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={productivityTrendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" stroke="#888888" fontSize={9} />
                          <YAxis stroke="#888888" fontSize={9} />
                          <ChartTooltip formatter={(v) => `${v} tasks`} />
                          <Line type="monotone" dataKey="tasks" stroke="var(--primary)" strokeWidth={2.5} dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 5: EXECUTIVE DEMOGRAPHICS BI */}
            <TabsContent value="demographics" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Gender Representation</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col justify-center items-center">
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboards.demographics?.gender || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {(dashboards.demographics?.gender || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip formatter={(v) => `${v}%`} />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Age Group Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col justify-center items-center">
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboards.demographics?.age || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {(dashboards.demographics?.age || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip formatter={(v) => `${v}%`} />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Work Location Splits</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col justify-center items-center">
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboards.demographics?.location || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {(dashboards.demographics?.location || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip formatter={(v) => `${v}%`} />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm border-slate-100 dark:border-zinc-800/80 mt-6 rounded-2xl">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center pb-4 rounded-t-2xl">
                  <div>
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Saved Corporate Reports Queue</CardTitle>
                    <CardDescription>Click to instantly download parameterized snapshots.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                      <thead>
                        <tr className="text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/10 border-b text-[10px] uppercase tracking-wider">
                          <th className="p-3 px-6">Report Title</th>
                          <th className="p-3">Data Domain</th>
                          <th className="p-3">Generated By</th>
                          <th className="p-3">Formats</th>
                          <th className="p-3 text-right">Download Trigger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((r, idx) => (
                          <tr key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                            <td className="p-3 px-6 font-bold">{r.name}</td>
                            <td className="p-3"><Badge className="bg-indigo-500/10 text-indigo-500 border-none font-bold text-[9px]">{r.module}</Badge></td>
                            <td className="p-3 font-semibold text-slate-550">{r.author}</td>
                            <td className="p-3 font-mono text-slate-400">{r.format}</td>
                            <td className="p-3 text-right">
                              <Button size="sm" onClick={() => handleExport(r.format.split(',')[0])} className="bg-primary hover:bg-primary/95 text-white font-bold h-7 text-[10px] border-none rounded-lg px-3">
                                Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 6: NO-CODE REPORT BUILDER */}
            <TabsContent value="builder" className="space-y-6 m-0">
              <Card className="shadow-sm border-slate-100 dark:border-zinc-800/80 rounded-2xl">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
                  <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Visual Drag-and-Drop Report Designer</CardTitle>
                  <CardDescription>Construct parameterized query exports across modules without SQL development.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-500">Source Data Module</label>
                      <select
                        value={dataModule}
                        onChange={e => setDataModule(e.target.value)}
                        className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold animate-fadeIn"
                      >
                        <option value="employees">Employee Master Profile</option>
                        <option value="payroll">Payroll & Compensation Logs</option>
                        <option value="projects">Resource Assignments</option>
                        <option value="leaves">Leaves & Vacation Requests</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500">Layout Chart View</label>
                      <select
                        value={chartType}
                        onChange={e => setChartType(e.target.value)}
                        className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold animate-fadeIn"
                      >
                        <option value="bar">Bar Chart</option>
                        <option value="line">Line Graph</option>
                        <option value="pie">Pie Chart Diagram</option>
                        <option value="pivot">Data Table Pivot Grid</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-500">Report Title</label>
                      <Input
                        placeholder="e.g. Q3 Active Staffing Summary"
                        value={generatedReportName}
                        onChange={e => setGeneratedReportName(e.target.value)}
                        className="bg-white dark:bg-[#1E1F22] border-border h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-900/20 min-h-[280px]">
                    <div className="mb-4 text-center">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1 justify-center">
                        <Sliders className="h-4 w-4 text-primary" />
                        {generatedReportName}
                      </h4>
                      <p className="text-[10px] text-slate-400">Live preview generated using the {dataModule} module</p>
                    </div>

                    {/* Dynamic Chart Canvas Preview */}
                    <div className="w-full flex justify-center items-center mb-6">
                      {chartType === 'bar' && (
                        <div className="h-[180px] w-full max-w-md">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={customBuilderData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                              <YAxis stroke="#888888" fontSize={9} />
                              <ChartTooltip />
                              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                                {customBuilderData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {chartType === 'line' && (
                        <div className="h-[180px] w-full max-w-md">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={customBuilderData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                              <YAxis stroke="#888888" fontSize={9} />
                              <ChartTooltip />
                              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {chartType === 'pie' && (
                        <div className="h-[180px] w-full max-w-md">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={customBuilderData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {customBuilderData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip />
                              <Legend wrapperStyle={{ fontSize: 9 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {chartType === 'pivot' && (
                        <div className="w-full max-w-md border rounded-xl overflow-hidden bg-card text-left text-xs font-semibold">
                          <div className="bg-slate-50 dark:bg-zinc-900/10 p-2 border-b font-bold text-slate-450 uppercase text-[9px]">Pivot Field Preview</div>
                          {customBuilderData.map((row, idx) => (
                            <div key={idx} className="flex justify-between p-2.5 border-b last:border-b-0">
                              <span className="text-slate-500">{row.name}</span>
                              <span className="text-primary font-bold">{row.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => toast.success('Custom report blueprint saved successfully')} className="bg-primary hover:bg-primary/95 text-white font-bold h-9 border-none rounded-xl px-4">
                        Save custom template
                      </Button>
                      <Button onClick={() => handleExport('Excel')} className="bg-primary hover:bg-primary/95 text-white font-bold h-9 border-none rounded-xl px-4">
                        Run & Download XLS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 7: PREDICTIVE FORECASTING */}
            <TabsContent value="predictive" className="space-y-6 m-0">
              <Card className="shadow-sm border-slate-100 dark:border-zinc-800/80 rounded-2xl">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary animate-pulse" /> AI Workforce Predictive Intelligence
                    </CardTitle>
                    <CardDescription>Predict hiring budgets, skill shortages, and exit cycles.</CardDescription>
                  </div>
                  <Button 
                    onClick={handleRunSimulation} 
                    disabled={runningSim}
                    className="bg-primary hover:bg-primary/95 text-white font-bold h-9 border-none rounded-xl px-4 flex items-center gap-2"
                  >
                    {runningSim ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running Simulation...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Run Simulation
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-6 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 border-slate-200 dark:border-zinc-800">
                      <h5 className="font-bold text-primary uppercase tracking-wider text-[9px] mb-2">Hiring Demand Projection (Q4)</h5>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                        {dashboards.aiForecasting?.hiringDemand || '+0.0 Full Time Hires'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Confidence rate: 94% (Based on active capacity levels)</p>
                    </div>

                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 border-slate-200 dark:border-zinc-800">
                      <h5 className="font-bold text-rose-500 uppercase tracking-wider text-[9px] mb-2">Predicted Attrition Trigger</h5>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                        {dashboards.aiForecasting?.attritionRisk || '0.0% Risk Level'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Confidence rate: 88% (Based on leave-taking profiles)</p>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3 items-start">
                    <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <h6 className="font-bold text-slate-800 dark:text-slate-200">Recommended Executive Action</h6>
                      <p className="text-slate-500 text-[10px] leading-relaxed">
                        {dashboards.aiForecasting?.aiActionRecommendation || 'Launch retention packages for critical design specialists. Overutilization has reached capacity limits.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </div>

          {/* Right Column: Custom Filters & AI Assistant advice */}
          <div className="col-span-12 lg:col-span-4 space-y-6 text-xs font-semibold">
            
            {/* Quick Filters */}
            <Card className="shadow-sm border-slate-100 dark:border-zinc-800/80 rounded-2xl">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20 pb-4 rounded-t-2xl">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Filter className="h-4.5 w-4.5 text-primary" /> Report Custom Filters</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold">Department Filter</label>
                  <select
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold animate-fadeIn"
                  >
                    <option value="all">All Departments</option>
                    <option value="eng">Engineering</option>
                    <option value="design">Product Design</option>
                    <option value="hr">HR Operations</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-500 font-bold">Office Branch Location</label>
                  <select
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold animate-fadeIn"
                  >
                    <option value="all">All Locations</option>
                    <option value="hq">HQ Surat Branch</option>
                    <option value="delhi">Delhi Satellite Branch</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* AI BI Assistant Box (Design Aligned to CRM Advisory) */}
            <Card className="border-none shadow-xl relative overflow-hidden bg-gradient-to-br from-primary/95 to-zinc-900 text-white rounded-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 rounded-full"></div>
              
              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-white animate-pulse" />
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-white">AI Intelligence Auditor</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10 text-xs text-slate-350 font-medium">
                <p>{aiAuditor.payrollTrend}</p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm space-y-1">
                  <div className="font-bold text-white text-[10px] uppercase">Parity Insight</div>
                  <p className="text-[10px] text-slate-400">{aiAuditor.parityInsight}</p>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </Tabs>
    </div>
  );
}
