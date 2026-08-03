'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  TrendingUp, Clock, CheckCircle2, Sparkles, Filter, Download,
  RefreshCw, BarChart3, PieChart as PieChartIcon, ShieldCheck, AlertTriangle, Users, MessageSquare
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

function CrmSkeleton() {
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

export default function CrmAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('session_token');
      const url = `/api/crm/analytics`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        toast.success('CRM BI synced successfully!');
      } else {
        toast.error('Failed to load CRM analytics.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching CRM analytics.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
    return <CrmSkeleton />;
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
              <TrendingUp className="h-8 w-8 text-white" />
              CRM Sales & Pipeline Intelligence
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">
              Centralized dashboard tracking total leads, communication sync threads, stage-conversions funnel, and pipeline health.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing BI...' : 'Refresh CRM BI'}
            </Button>
            <Button size="sm" onClick={() => handleExportCSV('CRM_Accounts_Portfolio', dashboards.accountsList)} className="bg-white hover:bg-white/95 text-primary font-bold shadow-lg">
              <Download className="mr-2 h-4 w-4" />
              Export CRM Data
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {/* KPI 1: Total Leads */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total CRM Leads</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.totalLeadsCount}</div>
            <span className="text-[10px] text-muted-foreground">Sourced Profiles</span>
          </CardContent>
        </Card>

        {/* KPI 2: Active Clients */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Clients</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.activeClientsCount}</div>
            <span className="text-[10px] text-emerald-500 font-bold">Accounts Won</span>
          </CardContent>
        </Card>

        {/* KPI 3: Sync threads */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inbox Threads</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{dashboards.totalCommThreads}</div>
            <span className="text-[10px] text-muted-foreground">{dashboards.pendingThreads} Pending cases</span>
          </CardContent>
        </Card>

        {/* KPI 4: Pipeline Budget */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Budget</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">₹{dashboards.totalPipelineBudget.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-purple-500 font-bold">Estimated Pipeline Val</span>
          </CardContent>
        </Card>

        {/* KPI 5: Conversion Rate */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversion SLA</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
              {dashboards.totalLeadsCount > 0 ? Math.round((dashboards.activeClientsCount / dashboards.totalLeadsCount) * 100) : 25}%
            </div>
            <span className="text-[10px] text-amber-500 font-bold">Win / Loss Ratio</span>
          </CardContent>
        </Card>
      </div>

      {/* AI Sales copilot panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden bg-white dark:bg-[#37383E]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Sales Copilot & Pipeline Bottleneck Diagnostics
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Automatic deal risks checks and predictive revenue forecasting</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80">
              <span className="text-primary font-bold text-xs uppercase mb-1 block">Sales pipeline diagnostic</span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed">{dashboards.aiInsights}</p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80">
              <span className="text-blue-500 font-bold text-xs uppercase mb-1 block">Predictive sales collection</span>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 leading-relaxed">{dashboards.predictiveForecasting}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRM Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex h-auto w-max">
            <TabsTrigger value="pipeline" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="h-3.5 w-3.5" /> Pipeline Funnel
            </TabsTrigger>
            <TabsTrigger value="sources" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <PieChartIcon className="h-3.5 w-3.5" /> Sourcing Channels
            </TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" /> CRM Accounts
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Funnel */}
        <TabsContent value="pipeline" className="space-y-6 m-0 animate-fadeIn">
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">Deal Stage-Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboards.pipelineFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" stroke="#888888" fontSize={9} />
                  <YAxis dataKey="stage" type="category" stroke="#888888" fontSize={9} width={120} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#F87941" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Sources */}
        <TabsContent value="sources" className="space-y-6 m-0 animate-fadeIn">
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">Lead Inquiries Sourcing Splits</CardTitle>
            </CardHeader>
            <CardContent className="h-72 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboards.leadSources} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: CRM Accounts */}
        <TabsContent value="accounts" className="space-y-6 m-0 animate-fadeIn">
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">CRM Accounts & Deals Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                    <TableRow className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <TableHead className="p-3 px-6 text-slate-650 dark:text-zinc-400">Account Company</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Lead Source</TableHead>
                      <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Estimated Budget</TableHead>
                      <TableHead className="p-3 text-right text-slate-650 dark:text-zinc-400">Priority SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboards.accountsList.map((c: any, idx: number) => (
                      <TableRow key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                        <TableCell className="p-3 px-6 font-bold text-slate-800 dark:text-white text-xs">{c.company_name || c.name}</TableCell>
                        <TableCell className="p-3 text-xs font-semibold">{c.lead_source || 'Referral'}</TableCell>
                        <TableCell className="p-3 text-xs font-semibold text-slate-500">{c.estimated_budget || '₹45,000'}</TableCell>
                        <TableCell className="p-3 text-right text-xs font-bold text-primary uppercase">{c.priority || 'Medium'}</TableCell>
                      </TableRow>
                    ))}
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
