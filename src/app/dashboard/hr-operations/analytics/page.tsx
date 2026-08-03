'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, Clock, CheckCircle2, TrendingUp, Sparkles, Filter, Download,
  RefreshCw, BarChart3, PieChart as PieChartIcon, ShieldCheck, Star, Award, Laptop, Calendar, BadgeCheck
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
  PieChart,
  Pie
} from 'recharts';

function HrAnalyticsSkeleton() {
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

      {/* AI Copilot Diagnostics Card Skeleton */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] p-6 space-y-4">
        <div className="h-5 w-52 bg-slate-150 dark:bg-zinc-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-16 bg-slate-100 dark:bg-zinc-900/30 rounded-xl border border-slate-150 dark:border-zinc-800"></div>
          <div className="h-16 bg-slate-100 dark:bg-zinc-900/30 rounded-xl border border-slate-150 dark:border-zinc-800"></div>
        </div>
      </Card>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-zinc-800">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-36 bg-slate-150 dark:bg-zinc-800 rounded-xl shrink-0"></div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] p-6 h-80 flex flex-col justify-between">
            <div className="h-4.5 w-40 bg-slate-150 dark:bg-zinc-800 rounded"></div>
            <div className="h-full w-full bg-slate-100 dark:bg-zinc-900/30 rounded-xl mt-4 flex items-center justify-center">
              <PieChartIcon className="h-10 w-10 text-slate-350 dark:text-zinc-700" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function HrAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [data, setData] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('session_token');
      const url = `/api/hr/analytics/operations?dept=${deptFilter}&location=${locationFilter}`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        toast.success('HR BI synced successfully!');
      } else {
        toast.error('Failed to load HR analytics.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching HR analytics.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [deptFilter, locationFilter]);

  const handleExportCSV = (reportName: string, exportData: any[]) => {
    if (!exportData || exportData.length === 0) {
      toast.error('No data available to export.');
      return;
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
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded successfully!');
  };

  if (loading || !data) {
    return <HrAnalyticsSkeleton />;
  }

  const dashboards = data.dashboards;
  const COLORS = ['#F87941', '#F9B095', '#FFE7DC', '#37383E', '#B1B1B1', '#6B6C70'];

  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto">
      {/* Premium Corporate Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent flex items-center gap-2">
              <Users className="h-8 w-8 text-white" />
              Workforce BI & HR Operations Analytics
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">
              Centralized dashboard tracking headcount performance, leave utilization, dynamic recruitment metrics, document compliance SLAs, and employee sentiment.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing BI...' : 'Refresh BI Data'}
            </Button>
            <Button size="sm" onClick={() => handleExportCSV('Workforce_Overview_Report', dashboards.demographics.gender)} className="bg-white hover:bg-white/95 text-primary font-bold shadow-lg">
              <Download className="mr-2 h-4 w-4" />
              Export Overview
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Filters Row */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl">
        <span className="text-slate-550 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="h-4.5 w-4.5 text-slate-400" />
          Filter Operations
        </span>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-300 font-bold"
        >
          <option value="all">All Departments</option>
          <option value="eng">Engineering</option>
          <option value="hr">HR Operations</option>
          <option value="mkt">Marketing & Sales</option>
        </select>
        <select
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-300 font-bold"
        >
          <option value="all">All Locations</option>
          <option value="hq">Headquarters (Surat)</option>
          <option value="remote">Remote Work</option>
        </select>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {/* KPI 1: Headcount */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Headcount</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.operationalKpis.activeUsersCount}</div>
            <span className="text-[10px] text-muted-foreground">Active Members</span>
          </CardContent>
        </Card>

        {/* KPI 2: On-time Attendance */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-in Rate</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.attendanceTrends.ratePercent}</div>
            <span className="text-[10px] text-emerald-500 font-bold">On-time logs today</span>
          </CardContent>
        </Card>

        {/* KPI 3: Leaves */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Leaves</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
              <Calendar className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.leaveTrends.activeLeavesCount}</div>
            <span className="text-[10px] text-muted-foreground">Approved Today</span>
          </CardContent>
        </Card>

        {/* KPI 4: Compliance */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Compliance</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.complianceScore.scorePercent}</div>
            <span className="text-[10px] text-amber-500 font-bold">Verified uploads</span>
          </CardContent>
        </Card>

        {/* KPI 5: CSAT / Morale */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Morale & CSAT</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
              <Star className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.employeeSatisfaction.csatScore.split(' ')[0]} / 5.0</div>
            <span className="text-[10px] text-purple-500 font-bold">{dashboards.employeeSatisfaction.moraleIndex}</span>
          </CardContent>
        </Card>
      </div>

      {/* AI HR Copilot Insights */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden bg-white dark:bg-[#37383E]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI HR Copilot Operations Diagnostics
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Automatic payroll audit alerts and equal opportunity pay parity checks</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80">
              <span className="text-primary font-bold text-xs uppercase mb-1 block">Expense & Payroll Audit</span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed">{data.aiAuditor?.payrollTrend || 'No anomalies detected.'}</p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80">
              <span className="text-blue-500 font-bold text-xs uppercase mb-1 block">Pay Equity & Parity Audit</span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed">{data.aiAuditor?.parityInsight || 'Parity threshold auditing active.'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HR Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex h-auto w-max">
            <TabsTrigger value="profile" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Profile & Demographics
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Clock className="h-3.5 w-3.5" /> Attendance & WFH
            </TabsTrigger>
            <TabsTrigger value="lms" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Award className="h-3.5 w-3.5" /> Learning & Succession
            </TabsTrigger>
            <TabsTrigger value="sla" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <BadgeCheck className="h-3.5 w-3.5" /> Compliance & HR SLA
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Profile & Demographics */}
        <TabsContent value="profile" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Gender Diversity Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-56 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboards.demographics.gender} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {dashboards.demographics.gender.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center text-[10px] font-bold">
                  {dashboards.demographics.gender.map((item: any, idx: number) => (
                    <span key={item.name} className="text-slate-500 dark:text-zinc-400">
                      {item.name}: {item.value}%
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Age Distribution Splits</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-56 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboards.demographics.age} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {dashboards.demographics.age.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center text-[10px] font-bold">
                  {dashboards.demographics.age.map((item: any, idx: number) => (
                    <span key={item.name} className="text-slate-500 dark:text-zinc-400">
                      {item.name}: {item.value}%
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase text-muted-foreground">Office Model Location splits</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-56 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboards.demographics.location} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {dashboards.demographics.location.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center text-[10px] font-bold">
                  {dashboards.demographics.location.map((item: any, idx: number) => (
                    <span key={item.name} className="text-slate-550 dark:text-zinc-400">
                      {item.name}: {item.value}%
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Attendance & WFH */}
        <TabsContent value="attendance" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-emerald-500" /> Attendance rate
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">On-Time Rate</span>
                  <span className="text-emerald-500 font-bold">{dashboards.attendanceTrends.ratePercent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">On-Time Logs</span>
                  <span>{dashboards.attendanceTrends.onTimeCount} Staff</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Late check-ins</span>
                  <span className="text-rose-500 font-bold">{dashboards.attendanceTrends.lateCount} Logs</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Laptop className="h-4.5 w-4.5 text-indigo-500" /> WFH Analysis
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

        {/* Tab 3: Learning & Succession */}
        <TabsContent value="lms" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-rose-500" /> LMS Course Completions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Training Completion Rate</span>
                  <span className="text-rose-500 font-bold">{dashboards.trainingCompletionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Certifications Issued</span>
                  <span>Active Dynamic tracking</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Star className="h-4.5 w-4.5 text-amber-500" /> Succession Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Succession-Ready Personnel</span>
                  <span className="text-amber-500 font-bold">{dashboards.successionReadyCount} Key Roles</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Active Talent Projections</span>
                  <span className="text-emerald-500 font-bold">100% Calibrated</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Compliance & HR SLA */}
        <TabsContent value="sla" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-purple-500" /> HR Case Resolutions SLA
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Pending Requests Queue</span>
                  <span className="text-purple-500 font-bold">{dashboards.employeeRequests.pendingCount} Cases</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">First-Response Time</span>
                  <span>{dashboards.hrTicketSla.firstResponseTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Resolution SLA rate</span>
                  <span className="text-emerald-500 font-bold">{dashboards.hrTicketSla.resolutionRate}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-amber-500" /> Document Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Compliance score</span>
                  <span className="text-amber-500 font-bold">{dashboards.complianceScore.scorePercent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Penalties incurred</span>
                  <span className="text-rose-500 font-bold">{dashboards.complianceScore.penaltiesIncurred}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
