'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FolderKanban, Clock, CheckCircle2, TrendingUp, Sparkles, Filter, Download,
  RefreshCw, BarChart3, PieChart as PieChartIcon, ShieldCheck, AlertTriangle, Users, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getStoredUser } from '@/lib/client-session';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  Cell
} from 'recharts';

function ProjectSkeleton() {
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

      {/* AI Panel Skeleton */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] p-6 space-y-4">
        <div className="h-5 w-52 bg-slate-150 dark:bg-zinc-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-16 bg-slate-100 dark:bg-zinc-900/30 rounded-xl border border-slate-150 dark:border-zinc-800"></div>
          <div className="h-16 bg-slate-100 dark:bg-zinc-900/30 rounded-xl border border-slate-150 dark:border-zinc-800"></div>
        </div>
      </Card>
    </div>
  );
}

const hasAnalyticsAccess = (roleStr?: string) => {
  if (!roleStr) return false;
  const r = roleStr.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return ['admin', 'super_admin', 'superadmin', 'owner', 'tenant_owner', 'business_owner', 'ceo', 'cto', 'director', 'manager', 'project_manager'].includes(r);
};

export default function ProjectAnalyticsPage() {
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('backlog');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setSyncing(true);
      setError(null);
      const token = typeof window !== 'undefined' 
        ? (sessionStorage.getItem('session_token') || localStorage.getItem('session_token')) 
        : null;
      const url = `/api/projects/analytics`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        toast.success('Project BI synced successfully!');
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.message || `HTTP ${res.status}: Failed to load project analytics.`;
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error fetching project analytics.');
      toast.error('Error fetching project analytics.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      const allowed = hasAnalyticsAccess(user.role);
      setCanAccess(allowed);
      if (allowed) {
        fetchAnalytics();
      } else {
        setLoading(false);
      }
    } else {
      fetchAnalytics();
    }
  }, []);

  const handleExportCSV = (reportName: string, exportData: any[]) => {
    if (!exportData || exportData.length === 0) {
      toast.error('No data available to export.');
      return;
    }
    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(row => 
      Object.values(row).map(val => {
        const str = String(val).replaceAll('"', '""');
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

  if (error && !data) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-4">
        <div className="h-16 w-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold">Unable to load Project Analytics</h3>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button onClick={fetchAnalytics} className="font-bold bg-primary hover:bg-primary-focus text-white">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry Sync
        </Button>
      </div>
    );
  }

  if (canAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-border rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto my-8">
        <div className="p-4 bg-destructive/10 text-destructive rounded-full">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-foreground">Access Restricted</h3>
          <p className="text-xs text-muted-foreground max-w-md mt-2 leading-relaxed">
            Project Analytics and BI reporting are restricted to Management and Administrators.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-xl px-5 text-xs font-bold h-10 border-border">
              Return to Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/tasks">
            <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl px-5 text-xs font-bold h-10">
              Go to Task Board
            </Button>
          </Link>
        </div>
      </div>
    );
  }

    if (loading || !data) {
    return <ProjectSkeleton />;
  }

  const dashboards = data.dashboards;
  const COLORS = ['#F87941', '#F9B095', '#FFE7DC', '#37383E', '#B1B1B1'];

  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-fadeIn">
      {/* Premium Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent flex items-center gap-2">
              <FolderKanban className="h-8 w-8 text-white" />
              Project BI & PMO Delivery Analytics
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">
              Centralized dashboard tracking sprint velocity, backlog trends, capacity planning, and project delivery SLAs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing BI...' : 'Refresh PMO BI'}
            </Button>
            <Button size="sm" onClick={() => handleExportCSV('PMO_Client_Performance', dashboards.clientPerformance)} className="bg-white hover:bg-white/95 text-primary font-bold shadow-lg">
              <Download className="mr-2 h-4 w-4" />
              Export PMO Data
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {/* KPI 1: Active Projects */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Projects</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.activeProjectsCount}</div>
            <span className="text-[10px] text-muted-foreground">Currently In Progress</span>
          </CardContent>
        </Card>

        {/* KPI 2: Project Completion Rate */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completion Rate</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.projectCompletionRate}%</div>
            <span className="text-[10px] text-emerald-500 font-bold">Completed Milestones</span>
          </CardContent>
        </Card>

        {/* KPI 3: Task Completion Rate */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task Completion</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.taskCompletionRate}%</div>
            <span className="text-[10px] text-muted-foreground">Tasks Closed</span>
          </CardContent>
        </Card>

        {/* KPI 4: Project Profitability */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profit Margin</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.projectProfitability}%</div>
            <span className="text-[10px] text-purple-500 font-bold">Planned vs Actual Cost</span>
          </CardContent>
        </Card>

        {/* KPI 5: Active Risks */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Risks</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.totalRisks}</div>
            <span className="text-[10px] text-rose-500 font-bold">{dashboards.criticalRisks} Critical Risks</span>
          </CardContent>
        </Card>
      </div>

      {/* AI project copilot diagnostics */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden bg-white dark:bg-[#37383E]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Project Copilot & Bottleneck Diagnostics
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Automatic sprint bottleneck alerts and delivery risk predictions</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80">
              <span className="text-primary font-bold text-xs uppercase mb-1 block">PMO Bottleneck Diagnostic</span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed">{dashboards.aiInsights}</p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80">
              <span className="text-blue-500 font-bold text-xs uppercase mb-1 block">Predictive Delivery Confidence</span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed">{dashboards.predictiveForecasting}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex h-auto w-max">
            <TabsTrigger value="backlog" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Clock className="h-3.5 w-3.5" /> Backlog & Sprints
            </TabsTrigger>
            <TabsTrigger value="resources" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Resource Allocation
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> Client Performance
            </TabsTrigger>
            <TabsTrigger value="risks" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <AlertTriangle className="h-3.5 w-3.5" /> Risks Registry
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Backlog & Sprints */}
        <TabsContent value="backlog" className="space-y-6 m-0 animate-fadeIn">
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">Sprint Completion vs Backlog Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {dashboards.backlogTrends && dashboards.backlogTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboards.backlogTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="sprint" stroke="#888888" fontSize={9} />
                    <YAxis stroke="#888888" fontSize={9} />
                    <ChartTooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#F87941" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="backlog" fill="#37383E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <Clock className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold">No sprint or task velocity data recorded yet</p>
                  <p className="text-[11px] text-muted-foreground/70">Create sprints and assign tasks to visualize live backlog trends.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Resource Allocation */}
        <TabsContent value="resources" className="space-y-6 m-0 animate-fadeIn">
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">Capacity Planning by Core Projects</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {dashboards.resourceAllocation && dashboards.resourceAllocation.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboards.resourceAllocation}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                    <YAxis stroke="#888888" fontSize={9} />
                    <ChartTooltip />
                    <Legend />
                    <Bar dataKey="devs" fill="#F87941" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="QA" fill="#F9B095" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="PM" fill="#37383E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold">No resource allocations mapped to projects yet</p>
                  <p className="text-[11px] text-muted-foreground/70">Assign team members to projects to populate capacity planning.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Client Performance */}
        <TabsContent value="clients" className="space-y-6 m-0 animate-fadeIn">
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Client Portfolio Performance Directory</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                    <TableRow className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <TableHead className="p-3 px-6 text-slate-650 dark:text-zinc-400">Client Name</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Active projects</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Completed Projects</TableHead>
                      <TableHead className="p-3 text-right text-slate-650 dark:text-zinc-400">Portfolio Delivery Health</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboards.clientPerformance && dashboards.clientPerformance.length > 0 ? (
                      dashboards.clientPerformance.map((c: any, idx: number) => (
                        <TableRow key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                          <TableCell className="p-3 px-6 font-bold text-slate-800 dark:text-white text-xs">{c.client}</TableCell>
                          <TableCell className="p-3 text-xs font-semibold">{c.active}</TableCell>
                          <TableCell className="p-3 text-xs font-semibold text-slate-500">{c.completed}</TableCell>
                          <TableCell className="p-3 text-right text-xs font-bold text-emerald-500">{c.health}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                          No client-associated projects found in database.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Risks Registry */}
        <TabsContent value="risks" className="space-y-6 m-0 animate-fadeIn">
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Active Risks & Issues log</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                    <TableRow className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <TableHead className="p-3 px-6 text-slate-650 dark:text-zinc-400">Risk/Issue Statement</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Type</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Severity</TableHead>
                      <TableHead className="p-3 text-right text-slate-650 dark:text-zinc-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboards.risksList && dashboards.risksList.length > 0 ? (
                      dashboards.risksList.map((r: any, idx: number) => (
                        <TableRow key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                          <TableCell className="p-3 px-6 font-bold text-slate-800 dark:text-white text-xs">{r.title || r.statement}</TableCell>
                          <TableCell className="p-3 text-xs"><Badge className="bg-amber-500/10 text-amber-500 border-none font-bold text-[9px] uppercase">{r.type}</Badge></TableCell>
                          <TableCell className="p-3 text-xs"><Badge className="bg-rose-500/10 text-rose-500 border-none font-bold text-[9px] uppercase">{r.severity}</Badge></TableCell>
                          <TableCell className="p-3 text-right text-xs font-bold uppercase text-slate-500">{r.status}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">
                          No active project risks or issues recorded in database.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
