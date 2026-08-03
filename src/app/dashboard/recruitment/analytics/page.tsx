'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Briefcase, Users, Clock, CheckCircle2, TrendingUp, Sparkles, Filter,
  Download, RefreshCw, BarChart3, PieChart as PieChartIcon, ArrowUpRight, Search, Activity, UserCheck
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

function RecruitmentSkeleton() {
  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto animate-pulse">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#37383E]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="h-3.5 w-24 bg-slate-150 dark:bg-zinc-800 rounded"></div>
              <div className="h-9 w-9 bg-slate-150 dark:bg-zinc-800 rounded-xl"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-7 w-12 bg-slate-150 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-28 bg-slate-150 dark:bg-zinc-800 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights Skeleton */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
        <CardHeader className="p-6 pb-2">
          <div className="h-5 w-48 bg-slate-150 dark:bg-zinc-800 rounded"></div>
          <div className="h-3 w-64 bg-slate-150 dark:bg-zinc-800 rounded mt-1.5"></div>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80 h-24 flex flex-col justify-between">
                <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded"></div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-2 bg-white dark:bg-[#37383E]">
          <CardHeader className="p-6 pb-2">
            <div className="h-4.5 w-44 bg-slate-150 dark:bg-zinc-800 rounded"></div>
            <div className="h-3 w-60 bg-slate-150 dark:bg-zinc-800 rounded mt-1.5"></div>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center h-80">
            <div className="h-full w-full bg-slate-100 dark:bg-zinc-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-slate-300 dark:text-zinc-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
          <CardHeader className="p-6 pb-2">
            <div className="h-4.5 w-32 bg-slate-150 dark:bg-zinc-800 rounded"></div>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center h-80">
            <div className="h-48 w-48 rounded-full border-12 border-slate-150 dark:border-zinc-800 flex items-center justify-center">
              <PieChartIcon className="h-8 w-8 text-slate-350 dark:text-zinc-700" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RecruitmentAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/recruitment/analytics', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        toast.success('Recruitment BI synced successfully!');
      } else {
        toast.error('Failed to load recruitment analytics.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching analytics.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = (exportData: any[], filename: string) => {
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
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded successfully!');
  };

  if (loading || !data) {
    return <RecruitmentSkeleton />;
  }

  // Brand-aligned curated HSL colors: Primary (orange: #F87941), Soft, Secondary shades
  const COLORS = ['#F87941', '#F9B095', '#FFE7DC', '#37383E', '#B1B1B1', '#6B6C70', '#E53935'];

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      {/* Premium Corporate Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-white" />
              Recruitment & Talent Analytics
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">
              Track open requisitions, candidate sourcing, application pipeline stage conversions, recruiter throughput, and AI-powered vacancy matching.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing BI...' : 'Sync Live Data'}
            </Button>
            <Button size="sm" onClick={() => handleExportCSV(data.recruiterPerformance, 'recruiter_performance_audit.csv')} className="bg-white hover:bg-white/95 text-primary font-bold shadow-lg">
              <Download className="mr-2 h-4 w-4" />
              Export Performance
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Open Positions */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Open Requisitions</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{data.requisitions.open}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">{data.requisitions.total} Total Created</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total Candidates */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Candidates Audited</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{data.candidates.total}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-emerald-500 font-bold">Avg screening: {data.candidates.averageScreeningScore}%</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Avg Time-to-Hire */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Time-to-Hire</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{data.timeToHireDays} Days</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-amber-500 font-bold">SLA Target 21 Days</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Offer Acceptance */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offer Acceptance Rate</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{data.offers.acceptanceRate}%</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-emerald-500 font-bold">{data.offers.accepted} Accepted of {data.offers.total} Extended</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Talent Copilot Diagnostics
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Automated candidate matching checks and pipeline throughput alerts</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {data.insights.map((insight: string, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80">
                <span className="text-primary font-bold text-xs uppercase mb-1 block">Insight #{idx+1}</span>
                <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruitment Stage Funnel */}
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-2">
          <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Active Candidate Pipeline Funnel
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">Candidate volume distribution by current stages</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleExportCSV(data.pipelineFunnel, 'recruitment_funnel_stages.csv')} className="text-slate-400 hover:text-slate-800 dark:hover:text-white">
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pipelineFunnel} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark-stroke="#27272a" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#71717a" fontSize={10} />
                  <YAxis dataKey="stage" type="category" stroke="#71717a" fontSize={10} width={90} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                    labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#F87941" radius={[0, 6, 6, 0]} barSize={20}>
                    {data.pipelineFunnel.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Sources & Distribution */}
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
              Candidate Sourcing Splits
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Applications by channel</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="h-60 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.candBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.candBySource.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-2 text-[10px] font-bold">
              {data.candBySource.map((item: any, idx: number) => (
                <div key={item.name} className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span>{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recruiter Performance Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Recruiter Output & Yield Performance Audit
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Yield conversion metrics of open job roles to successfully accepted candidates</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner bg-slate-50/50 dark:bg-transparent">
            <Table>
              <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                <TableRow className="border-b border-slate-200 dark:border-zinc-800">
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs">User / Recruiter</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-center">Job Requisitions</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-center">Offers Created</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-center">Accepted Hires</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-right">Yield Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recruiterPerformance.length === 0 ? (
                  <TableRow className="border-b border-slate-100 dark:border-zinc-800 hover:bg-transparent">
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8 text-xs">
                      No performance tracking logged.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recruiterPerformance.map((row: any, idx: number) => {
                    const yieldPercent = row.offers ? Math.round((row.hires / row.offers) * 100) : 0;
                    return (
                      <TableRow key={idx} className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-100/10 dark:hover:bg-zinc-900/10">
                        <TableCell className="font-bold text-slate-800 dark:text-white flex items-center gap-2 py-3 text-xs">
                          <div className="w-6.5 h-6.5 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
                            {row.name.charAt(0)}
                          </div>
                          {row.name}
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-700 dark:text-zinc-300 text-xs">{row.requisitions}</TableCell>
                        <TableCell className="text-center font-bold text-slate-700 dark:text-zinc-300 text-xs">{row.offers}</TableCell>
                        <TableCell className="text-center font-bold text-emerald-500 text-xs">{row.hires}</TableCell>
                        <TableCell className="text-right py-3 text-xs">
                          <Badge className={`text-[10px] font-bold ${
                            yieldPercent >= 50 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                          }`} variant="outline">
                            {yieldPercent}% Yield
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
