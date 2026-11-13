'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart3, TrendingUp, Clock, CalendarDays, RefreshCw, Laptop,
  MessageSquare, CheckCircle2, IndianRupee, ShieldCheck,
  Zap, Users, Activity, Star, Sparkles, Filter, PieChart as PieChartIcon,
  Bot, AlertTriangle, Layers, Sliders, LineChart as LineChartIcon, Loader2, X, FolderKanban, Briefcase, UserCheck, Download, Inbox
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
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';

function ExecutiveSkeleton() {
  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-pulse">
      {/* Banner Skeleton */}
      <div className="rounded-2xl bg-slate-100 dark:bg-[#37383E] h-36 flex flex-col justify-between p-6 md:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-3">
          <div className="h-6 w-60 bg-slate-200 dark:bg-zinc-800/80 rounded-lg"></div>
          <div className="h-3.5 w-96 bg-slate-200 dark:bg-zinc-800/80 rounded-lg"></div>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="h-8.5 w-28 bg-slate-200 dark:bg-zinc-800/80 rounded-xl"></div>
          <div className="h-8.5 w-36 bg-slate-200 dark:bg-zinc-800/80 rounded-xl"></div>
        </div>
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#37383E] h-32 flex flex-col justify-between p-6">
            <div className="flex justify-between">
              <div className="h-3.5 w-20 bg-slate-150 dark:bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 bg-slate-150 dark:bg-zinc-800 rounded-xl"></div>
            </div>
            <div className="space-y-2">
              <div className="h-6 w-16 bg-slate-150 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-24 bg-slate-150 dark:bg-zinc-800 rounded"></div>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Executive Health Summary Card Skeleton */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-150 dark:bg-zinc-800 rounded"></div>
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-slate-150 dark:bg-zinc-800 rounded"></div>
          <div className="h-3.5 w-5/6 bg-slate-150 dark:bg-zinc-800 rounded"></div>
          <div className="h-3.5 w-4/5 bg-slate-150 dark:bg-zinc-800 rounded"></div>
        </div>
      </Card>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-zinc-800">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-36 bg-slate-150 dark:bg-zinc-800 rounded-xl shrink-0"></div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] p-6 h-80 flex flex-col justify-between">
          <div className="h-4.5 w-44 bg-slate-150 dark:bg-zinc-800 rounded"></div>
          <div className="h-full w-full bg-slate-100 dark:bg-zinc-900/30 rounded-xl mt-4 flex items-center justify-center">
            <BarChart3 className="h-10 w-10 text-slate-350 dark:text-zinc-700" />
          </div>
        </Card>
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] p-6 h-80 flex flex-col justify-between">
          <div className="h-4.5 w-44 bg-slate-150 dark:bg-zinc-800 rounded"></div>
          <div className="h-full w-full bg-slate-100 dark:bg-zinc-900/30 rounded-xl mt-4 flex items-center justify-center">
            <PieChartIcon className="h-10 w-10 text-slate-350 dark:text-zinc-700" />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState('financials');
  const [loading, setLoading] = useState(true);

  // Custom Report Builder States
  const [dataModule, setDataModule] = useState('employees');
  const [chartType, setChartType] = useState('bar');
  const [generatedReportName, setGeneratedReportName] = useState('Active Staffing Summary');
  const [syncing, setSyncing] = useState(false);

  // Filter criteria
  const [deptFilter, setDeptFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const [aiAuditor, setAiAuditor] = useState({
    payrollTrend: 'Analyzing payroll patterns...',
    parityInsight: 'Auditing salary parity thresholds...'
  });

  // Dynamic API State initialized to clean live zero/empty defaults
  const [dashboards, setDashboards] = useState<any>({
    orgHealthScore: '0.0%',
    revPayrollRatio: '0.0x Ratio',
    workforceCostAmt: '₹0',
    profitabilityMargin: '0.0%',
    benchRate: '0.0%',
    revenueVsPayrollTrend: [],
    expenseDistribution: [],
    resourceAssignments: [],
    slaAdherence: [],
    revenueByBU: [],
    topClientsRevenue: [],
    attendanceTrends: { ratePercent: '0.0%', onTimeCount: 0, lateCount: 0 },
    leaveTrends: { utilizationPercent: '0.0%', activeLeavesCount: 0, totalBalanceDays: 0 },
    shiftUtilization: { efficiencyPercent: '0.0%', rotationalShiftCount: 0, restGapAdherence: '0%' },
    wfhAnalysis: { remotePercentage: '0%', homeOfficeCompliance: '0%' },
    employeeRequests: { totalVolume: 0, pendingCount: 0, processedCount: 0 },
    approvalSla: { avgHours: '0h', adherencePercent: '0%' },
    hrTicketSla: { firstResponseTime: '0h', resolutionRate: '0.0%' },
    expenseTrends: { monthlyTotalRupees: '₹0', auditPassRate: '100%' },
    complianceScore: { scorePercent: '0.0%', penaltiesIncurred: '₹0 Penalties' },
    hrProductivity: { efficiencyScore: '0%', tasksAutomatedMonth: 0 },
    managerResponsiveness: { indexScore: '0.0%', avgTurnaroundHours: '0h' },
    operationalKpis: { systemUptime: '100%', activeUsersCount: 0 },
    employeeSatisfaction: { csatScore: 'N/A', moraleIndex: 'N/A' },
    dailyOperationsSummary: '',
    demographics: {
      gender: [],
      age: [],
      location: []
    },
    aiForecasting: {
      hiringDemand: '+0 Full Time Hires',
      attritionRisk: '0.0% Risk Level',
      aiActionRecommendation: 'No critical operational interventions required.'
    },
    trainingCompletionRate: 0,
    successionReadyCount: 0
  });

  // Curated reports list based on modules
  const reports = [
    { name: 'Monthly Workforce Cost Summary', module: 'Payroll', author: 'System Job', format: 'PDF, CSV' },
    { name: 'Onboarding Progression Matrix', module: 'HR Operations', author: 'HR Service Desk', format: 'CSV' },
    { name: 'Billable Utilization & Project SLA Audit', module: 'PSA & Projects', author: 'Delivery PMO', format: 'CSV' },
    { name: 'Quarterly Attrition and Exit Review', module: 'Compliance', author: 'Executive BI', format: 'PDF, CSV' }
  ];

  const handleExport = (reportName: string, format: string) => {
    toast.success(`Exporting ${reportName} in ${format}...`);

    let exportData: any[] = [];
    if (reportName.includes('Workforce Cost')) {
      if (dashboards.expenseDistribution && dashboards.expenseDistribution.length > 0) {
        exportData = dashboards.expenseDistribution.map((exp: any) => ({
          Category: exp.name,
          'Share (%)': `${exp.value}%`,
          'Total Workforce Cost': dashboards.workforceCostAmt,
          'Rev/Payroll Ratio': dashboards.revPayrollRatio,
          'Profitability Margin': dashboards.profitabilityMargin
        }));
      } else {
        exportData = [
          { Metric: 'Total Workforce Cost', Value: dashboards.workforceCostAmt },
          { Metric: 'Total Claims & Expenses', Value: dashboards.expenseTrends?.monthlyTotalRupees || '₹0' },
          { Metric: 'Profitability Margin', Value: dashboards.profitabilityMargin },
          { Metric: 'Rev/Payroll Ratio', Value: dashboards.revPayrollRatio },
          { Metric: 'Active Headcount', Value: dashboards.operationalKpis?.activeUsersCount || 0 }
        ];
      }
    } else if (reportName.includes('Onboarding') || reportName.includes('Compliance')) {
      exportData = [
        { Metric: 'Active Workforce Count', Value: dashboards.operationalKpis?.activeUsersCount || 0 },
        { Metric: 'Compliance Score', Value: dashboards.complianceScore?.scorePercent || '0%' },
        { Metric: 'Training Completion Rate', Value: `${dashboards.trainingCompletionRate || 0}%` },
        { Metric: 'Succession Ready Count', Value: dashboards.successionReadyCount || 0 },
        { Metric: 'Penalties Incurred', Value: dashboards.complianceScore?.penaltiesIncurred || '₹0 Penalties' }
      ];
    } else if (reportName.includes('Utilization') || reportName.includes('Project') || reportName.includes('Delivery')) {
      if (dashboards.slaAdherence && dashboards.slaAdherence.length > 0) {
        exportData = dashboards.slaAdherence.map((item: any) => ({
          Project: item.name,
          'Delivery SLA': `${item.SLA}%`,
          'Active Bench Rate': dashboards.benchRate
        }));
      } else {
        exportData = [
          { Metric: 'Active Bench Rate', Value: dashboards.benchRate },
          { Metric: 'Assigned Resources', Value: dashboards.resourceAssignments?.[0]?.Assigned || 0 },
          { Metric: 'Bench Count', Value: dashboards.resourceAssignments?.[0]?.Bench || 0 }
        ];
      }
    } else {
      // Attrition / Org Health review
      exportData = [
        { Metric: 'Organization Health Score', Value: dashboards.orgHealthScore },
        { Metric: 'Attrition Risk Level', Value: dashboards.aiForecasting?.attritionRisk || '0%' },
        { Metric: 'Forecasted Hiring Demand', Value: dashboards.aiForecasting?.hiringDemand || '+0' },
        { Metric: 'Strategic AI Recommendation', Value: dashboards.aiForecasting?.aiActionRecommendation || 'N/A' },
        { Metric: 'Attendance Adherence', Value: dashboards.attendanceTrends?.ratePercent || '0%' }
      ];
    }

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(row =>
      Object.values(row).map(val => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const filename = `${reportName.toLowerCase().replace(/\s+/g, '_')}.csv`;
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${reportName} download completed!`);
  };

  // Fetch 100% Dynamic Data from Backend API
  const loadAnalyticsDataFromApi = async (dept = deptFilter, loc = locationFilter) => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('session_token');
      const url = `/api/hr/analytics/operations?dept=${encodeURIComponent(dept)}&location=${encodeURIComponent(loc)}`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.dashboards) setDashboards(data.dashboards);
        if (data.aiAuditor) setAiAuditor(data.aiAuditor);
        toast.success('Corporate BI synced successfully!');
      }
    } catch (err) {
      console.error('API Fetch error:', err);
      toast.error('Sync failed.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadAnalyticsDataFromApi(deptFilter, locationFilter);
  }, [deptFilter, locationFilter]);

  if (loading) {
    return <ExecutiveSkeleton />;
  }

  // Curated corporate palettes
  const COLORS = ['#F87941', '#F9B095', '#FFE7DC', '#37383E', '#B1B1B1', '#6B6C70'];

  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto">
      {/* Premium CEO/CXO Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="h-8 w-8 text-white" />
              Executive BI & Corporate Analytics
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">
              Real-time CEO/CXO decision cockpit. Monitor organization health indices, revenue vs payroll margins, project delivery SLAs, and client growth.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => loadAnalyticsDataFromApi()} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing BI...' : 'Sync Corporate BI'}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {/* KPI 1: Org Health Score */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Org Health Score</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary">
              <Star className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.orgHealthScore || '0.0%'}</div>
            <span className="text-[10px] text-emerald-500 font-bold">
              {parseFloat(dashboards.orgHealthScore || '0') >= 75 ? 'Healthy Organization' : 'Attention Required'}
            </span>
          </CardContent>
        </Card>

        {/* KPI 2: Revenue vs Payroll */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue/Payroll</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.revPayrollRatio || '0.0x Ratio'}</div>
            <span className="text-[10px] text-muted-foreground">Operating Ratio</span>
          </CardContent>
        </Card>

        {/* KPI 3: Total Workforce Cost */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workforce Cost</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.workforceCostAmt || '₹0'}</div>
            <span className="text-[10px] text-emerald-500 font-bold">Approved claims & salaries</span>
          </CardContent>
        </Card>

        {/* KPI 4: Profitability */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profitability Margin</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.profitabilityMargin || '0.0%'}</div>
            <span className="text-[10px] text-amber-500 font-bold">Net Operational Margin</span>
          </CardContent>
        </Card>

        {/* KPI 5: Active Bench Strength */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Bench</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.benchRate || '0.0%'}</div>
            <span className="text-[10px] text-purple-500 font-bold">Available Resource Pool</span>
          </CardContent>
        </Card>
      </div>

      {/* AI Executive Summary */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden bg-white dark:bg-[#37383E]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Executive Health Summary
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Live operational digest generated from client accounts, billing, and project milestones</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
            {dashboards.dailyOperationsSummary || 'Executing analysis of company health indices...'}
          </p>
        </CardContent>
      </Card>

      {/* Executive Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex h-auto w-max">
            <TabsTrigger value="financials" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <IndianRupee className="h-3.5 w-3.5" /> Financials & Costs
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <FolderKanban className="h-3.5 w-3.5" /> Projects & Delivery
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Clients & BUs
            </TabsTrigger>
            <TabsTrigger value="builder" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Sliders className="h-3.5 w-3.5" /> Reports Builder
            </TabsTrigger>
            <TabsTrigger value="predictive" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <LineChartIcon className="h-3.5 w-3.5" /> AI Forecasting
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Financials & Costs */}
        <TabsContent value="financials" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Revenue vs Payroll Cost Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {dashboards.revenueVsPayrollTrend && dashboards.revenueVsPayrollTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboards.revenueVsPayrollTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" stroke="#888888" fontSize={9} />
                      <YAxis stroke="#888888" fontSize={9} />
                      <ChartTooltip />
                      <Legend />
                      <Bar dataKey="Revenue" fill="#F87941" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Payroll" fill="#37383E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-2">
                    <Inbox className="h-6 w-6 text-muted-foreground/40" />
                    <span>No financial trend records found</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Workforce Expense Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex justify-center items-center">
                {dashboards.expenseDistribution && dashboards.expenseDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboards.expenseDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-2">
                    <Inbox className="h-6 w-6 text-muted-foreground/40" />
                    <span>No expense or payroll distributions logged</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Projects & Delivery */}
        <TabsContent value="projects" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Resource Assignments & Bench Rate</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {dashboards.resourceAssignments && dashboards.resourceAssignments.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboards.resourceAssignments}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" stroke="#888888" fontSize={9} />
                      <YAxis stroke="#888888" fontSize={9} />
                      <ChartTooltip />
                      <Bar dataKey="Assigned" fill="#F87941" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Bench" fill="#B1B1B1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-2">
                    <Inbox className="h-6 w-6 text-muted-foreground/40" />
                    <span>No resource assignments found</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">SLA Adherence by Delivery Units</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {dashboards.slaAdherence && dashboards.slaAdherence.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboards.slaAdherence} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis type="number" stroke="#888888" fontSize={9} />
                      <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} width={90} />
                      <ChartTooltip />
                      <Bar dataKey="SLA" fill="#F87941" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-2">
                    <Inbox className="h-6 w-6 text-muted-foreground/40" />
                    <span>No active delivery units or projects found</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Clients & BUs */}
        <TabsContent value="clients" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Revenue by Business Units</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex justify-center items-center">
                {dashboards.revenueByBU && dashboards.revenueByBU.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboards.revenueByBU} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                        {COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-2">
                    <Inbox className="h-6 w-6 text-muted-foreground/40" />
                    <span>No business unit revenue recorded</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Top Clients Revenue Splits</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {dashboards.topClientsRevenue && dashboards.topClientsRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboards.topClientsRevenue}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                      <YAxis stroke="#888888" fontSize={9} />
                      <ChartTooltip />
                      <Bar dataKey="Revenue" fill="#F87941" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground gap-2">
                    <Inbox className="h-6 w-6 text-muted-foreground/40" />
                    <span>No client revenue recorded</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Reports Builder */}
        <TabsContent value="builder" className="space-y-6 m-0 animate-fadeIn">
          <Card className="shadow-sm border-slate-100 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-[#37383E]">
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
                  <label className="text-slate-500">File Output Name</label>
                  <input
                    type="text"
                    value={generatedReportName}
                    onChange={e => setGeneratedReportName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-slate-800 dark:text-zinc-200 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => handleExport(generatedReportName, 'csv')} className="border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                  <Download className="mr-2 h-4 w-4" /> Export CSV Sheet
                </Button>
                <Button size="sm" onClick={() => toast.success(`Layout matching updated to: ${chartType}`)} className="bg-primary hover:bg-primary/95 text-white font-bold">
                  Update Preview Grid
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Reports Queue */}
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Saved Corporate Reports Queue</CardTitle>
              <CardDescription>Click to instantly download parameterized snapshots.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                    <TableRow className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <TableHead className="p-3 px-6 text-slate-650 dark:text-zinc-400">Report Title</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Data Domain</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Generated By</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Formats</TableHead>
                      <TableHead className="p-3 text-right text-slate-650 dark:text-zinc-400">Download Trigger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r, idx) => (
                      <TableRow key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                        <TableCell className="p-3 px-6 font-bold text-slate-800 dark:text-white text-xs">{r.name}</TableCell>
                        <TableCell className="p-3 text-xs"><Badge className="bg-indigo-500/10 text-indigo-500 border-none font-bold text-[9px]">{r.module}</Badge></TableCell>
                        <TableCell className="p-3 font-semibold text-slate-550 dark:text-zinc-400 text-xs">{r.author}</TableCell>
                        <TableCell className="p-3 font-mono text-slate-400 text-xs">{r.format}</TableCell>
                        <TableCell className="p-3 text-right">
                          <Button size="sm" onClick={() => handleExport(r.name, r.format.split(',')[0])} className="bg-primary hover:opacity-95 text-white font-bold h-7 text-[10px] border-none rounded-lg px-3">
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: AI Forecasting */}
        <TabsContent value="predictive" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-primary" /> Forecasted Hiring Demand
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500">Predicted full-time additions needed over next 90 days.</div>
                <div className="text-2xl font-black text-primary">{dashboards.aiForecasting.hiringDemand}</div>
                <span className="text-[10px] text-muted-foreground">Based on current client orders queue</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500" /> Morale & Attrition risk
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500">Morale level attrition threshold model.</div>
                <div className="text-2xl font-black text-rose-500">{dashboards.aiForecasting.attritionRisk}</div>
                <span className="text-[10px] text-rose-500 font-bold">Standard Risk Zone</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-amber-500" /> AI Strategic Action
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500">Corporate intervention recommendations.</div>
                <p className="text-xs font-semibold text-amber-600 leading-relaxed">{dashboards.aiForecasting.aiActionRecommendation}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
