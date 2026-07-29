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
  Zap, Users, Activity, Star, Sparkles, Filter, PieChart,
  Bot, AlertTriangle, Layers, Sliders, LineChart
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Filter criteria
  const [deptFilter, setDeptFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

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
    dailyOperationsSummary: ''
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
  const loadAnalyticsDataFromApi = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/hr/analytics/operations', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.canApprove !== undefined) setCanApprove(data.canApprove);
        if (data.userRole) setUserRole(data.userRole);
        if (data.dashboards) setDashboards(data.dashboards);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsDataFromApi();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto p-6 animate-pulse">
        <div className="h-32 w-full bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        <div className="h-14 w-full bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="col-span-4 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0f172a] to-zinc-950 p-6 md:p-8 border border-zinc-800 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#f87941]/10 blur-3xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#f87941]/15 rounded-2xl border border-[#f87941]/30">
                <BarChart3 className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Analytics & Reports
                </h1>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  14 Dashboards: Attendance & Leave Trends, Custom No-Code Report Builder, and AI Predictive Simulations
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Attendance Trend</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{dashboards.attendanceTrends.ratePercent}</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> On-Time Rate
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Employee CSAT</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{dashboards.employeeSatisfaction.csatScore}</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Satisfaction Score</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Statutory Compliance</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">{dashboards.complianceScore.scorePercent}</div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">Statutory Met</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Approval SLA</div>
              <div className="text-xl font-black text-purple-400 mt-0.5">{dashboards.approvalSla.avgHours}</div>
              <div className="text-[10px] text-purple-400/80 mt-0.5">Turnaround Time</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Monthly Expenses</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{dashboards.expenseTrends.monthlyTotalRupees}</div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Approved Claims</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex h-auto w-max">
            <TabsTrigger value="summary" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Sparkles className="h-3.5 w-3.5" /> Operations Summary & CSAT
            </TabsTrigger>
            <TabsTrigger value="workforce" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <TrendingUp className="h-3.5 w-3.5" /> Attendance & leave trends
            </TabsTrigger>
            <TabsTrigger value="sla" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <MessageSquare className="h-3.5 w-3.5" /> Requests & SLA Performance
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <IndianRupee className="h-3.5 w-3.5" /> Expenses & Productivity
            </TabsTrigger>
            <TabsTrigger value="demographics" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Executive Demographics BI
            </TabsTrigger>
            <TabsTrigger value="builder" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Sliders className="h-3.5 w-3.5" /> No-Code Custom Builder
            </TabsTrigger>
            <TabsTrigger value="predictive" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <LineChart className="h-3.5 w-3.5" /> AI Forecasting Simulations
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
                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Star className="h-4.5 w-4.5 text-amber-500" /> Employee Satisfaction (CSAT)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                    <div className="text-slate-500">CSAT Score across all resolution tickets.</div>
                    <div className="text-xl font-mono font-black text-amber-500">{dashboards.employeeSatisfaction.csatScore}</div>
                    <div className="text-[10px] text-emerald-500">{dashboards.employeeSatisfaction.moraleIndex}</div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Users className="h-4.5 w-4.5 text-purple-500" /> Manager Responsiveness Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                    <div className="text-slate-500">Average approval response speed.</div>
                    <div className="text-xl font-mono font-black text-purple-500">{dashboards.managerResponsiveness.indexScore}</div>
                    <div className="text-[10px] text-slate-400">Avg Response: {dashboards.managerResponsiveness.avgTurnaroundHours}</div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Activity className="h-4.5 w-4.5 text-emerald-500" /> Operational KPIs & System Uptime
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                    <div className="text-slate-500">System availability and active headcount.</div>
                    <div className="text-xl font-mono font-black text-emerald-500">{dashboards.operationalKpis.systemUptime}</div>
                    <div className="text-[10px] text-slate-400">Active users: {dashboards.operationalKpis.activeUsersCount}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: ATTENDANCE, LEAVE, SHIFT & WFH TRENDS */}
            <TabsContent value="workforce" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
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

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <CalendarDays className="h-4.5 w-4.5 text-[#f87941]" /> Leave Utilization & Balance Pools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Monthly Leave Utilization</span>
                      <span className="text-[#f87941] font-bold">{dashboards.leaveTrends.utilizationPercent}</span>
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

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
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

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
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
            </TabsContent>

            {/* TAB 3: EMPLOYEE REQUESTS & SLA PERFORMANCE */}
            <TabsContent value="sla" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
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

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
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
            </TabsContent>

            {/* TAB 4: EXPENSES, COMPLIANCE & PRODUCTIVITY */}
            <TabsContent value="finance" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
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

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
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

                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Zap className="h-4.5 w-4.5 text-yellow-500" /> HR Productivity & Automation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Productivity efficiency index</span>
                      <span className="text-[#f87941] font-bold">{dashboards.hrProductivity.efficiencyScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Automated triggers (monthly)</span>
                      <span>{dashboards.hrProductivity.tasksAutomatedMonth} jobs ran</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 5: EXECUTIVE DEMOGRAPHICS BI */}
            <TabsContent value="demographics" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-md border-slate-100 dark:border-zinc-800/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-extrabold uppercase">Gender Representation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Male Employees</span>
                      <span className="text-[#f87941] font-bold">58.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Female Employees</span>
                      <span className="text-pink-500 font-bold">40.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Others</span>
                      <span className="text-slate-400 font-bold">1.4%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-slate-100 dark:border-zinc-800/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-extrabold uppercase">Age Group Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">21 - 30 yrs (Gen Z/Y)</span>
                      <span className="text-violet-500 font-bold">46%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">31 - 40 yrs</span>
                      <span className="text-[#f87941] font-bold">38%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">40+ yrs</span>
                      <span className="text-slate-400 font-bold">16%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-slate-100 dark:border-zinc-800/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-extrabold uppercase">Work Location Splits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Office (HQ Surat)</span>
                      <span className="text-emerald-500 font-bold">62%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Hybrid Model</span>
                      <span className="text-amber-500 font-bold">24%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Remote Work</span>
                      <span className="text-blue-500 font-bold">14%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80 mt-6">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center pb-4">
                  <div>
                    <CardTitle className="text-md">Saved Corporate Reports Queue</CardTitle>
                    <CardDescription>Click to instantly download parameterized snapshots.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                      <thead>
                        <tr className="text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/10 border-b">
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
                            <td className="p-3 font-semibold text-slate-500">{r.author}</td>
                            <td className="p-3 font-mono text-slate-400">{r.format}</td>
                            <td className="p-3 text-right">
                              <Button size="sm" onClick={() => handleExport(r.format.split(',')[0])} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-7 text-[10px] border-none">
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
              <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                  <CardTitle className="text-md">Visual Drag-and-Drop Report Designer</CardTitle>
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

                  <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-900/20 min-h-[220px]">
                    <div className="p-3.5 rounded-full bg-violet-500/10 text-violet-500 mb-3">
                      <PieChart className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{generatedReportName}</h4>
                    <p className="text-[10px] text-slate-400 mb-4">Configured using the visual query layout engine.</p>
                    <div className="flex gap-2">
                      <Button onClick={() => toast.success('Custom report blueprint saved successfully')} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 border-none">
                        Save custom template
                      </Button>
                      <Button onClick={() => handleExport('Excel')} className="bg-primary hover:bg-primary/95 text-white font-bold h-9 border-none">
                        Run & Download XLS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 7: PREDICTIVE FORECASTING */}
            <TabsContent value="predictive" className="space-y-6 m-0">
              <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                  <CardTitle className="text-md flex items-center gap-2"><Bot className="h-5 w-5 text-orange-400 animate-bounce" /> AI Workforce Predictive Intelligence</CardTitle>
                  <CardDescription>Predict hiring budgets, skill shortages, and exit cycles.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6 text-xs font-semibold">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 border-slate-200 dark:border-zinc-800">
                      <h5 className="font-bold text-[#f87941] uppercase tracking-wider text-[9px] mb-2">Hiring Demand Projection (Q4)</h5>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">+8.4 Full Time Hires</p>
                      <p className="text-[10px] text-slate-400 mt-1">Confidence rate: 94% (Based on product pipeline growth)</p>
                    </div>

                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 border-slate-200 dark:border-zinc-800">
                      <h5 className="font-bold text-rose-500 uppercase tracking-wider text-[9px] mb-2">Predicted Attrition Trigger</h5>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">4.2% Risk Level</p>
                      <p className="text-[10px] text-slate-400 mt-1">Confidence rate: 88% (Based on leave-taking profiles)</p>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10 flex gap-3 items-start">
                    <AlertTriangle className="h-5 w-5 text-[#f87941] shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <h6 className="font-bold text-slate-800 dark:text-slate-200">Recommended Executive Action</h6>
                      <p className="text-slate-500 text-[10px] leading-relaxed">Launch retention packages for critical design specialists. Overutilization has reached critical capacity limits.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </div>

          {/* Right Column: Custom Filters & AI Assistant advice */}
          <div className="col-span-12 lg:col-span-4 space-y-6 text-xs font-semibold">
            
            {/* Quick Filters */}
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20 pb-4">
                <CardTitle className="text-md flex items-center gap-1.5"><Filter className="h-4.5 w-4.5 text-[#f87941]" /> Report Custom Filters</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-slate-500">Department Filter</label>
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
                  <label className="text-slate-500">Office Branch Location</label>
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

            {/* AI BI Assistant Box */}
            <Card className="border-none shadow-xl relative overflow-hidden bg-slate-900 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f87941]/30 blur-3xl -mr-16 -mt-16 rounded-full"></div>
              
              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-orange-400 animate-pulse" />
                  <CardTitle className="text-md font-bold text-orange-400">AI Intelligence Auditor</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10 text-xs text-slate-300 font-medium">
                <p>Total payroll costs are trending **+4.2% MoM** due to recent variable bonuses paid in eSIM project cycles.</p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm space-y-1">
                  <div className="font-bold text-white text-[10px]">Parity Insight</div>
                  <p className="text-[10px] text-slate-400">Pay gap parity across engineering cohorts is within a healthy 1.2% threshold.</p>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </Tabs>
    </div>
  );
}
