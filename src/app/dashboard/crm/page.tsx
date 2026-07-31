'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Award, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Bot, 
  Sparkles,
  Inbox,
  Filter,
  Search,
  CheckCircle,
  FileText,
  Loader2,
  Building2,
  Calendar,
  Ticket,
  X,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

export default function CRMDashboard() {
  const [loading, setLoading] = useState(true);
  const [crmData, setCrmData] = useState<any>(null);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const exchangeRates = {
    INR: 1,
    USD: 0.012
  };

  const getCurrencySymbol = () => {
    return currency === 'INR' ? '₹' : '$';
  };

  const formatVal = (valInINR: number) => {
    const rate = exchangeRates[currency];
    const converted = valInINR * rate;
    return `${getCurrencySymbol()}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const fetchCrmDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCrmData(json.data);
      }
    } catch (err) {
      console.error('Error fetching CRM dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchCrmDashboardData();
    toast.success('CRM metrics updated with latest lead pipelines.');
  };

  // High-Fidelity Custom loading skeleton matching the grid layouts
  if (loading || !crmData) {
    return (
      <div className="space-y-6 p-1 max-w-[1600px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-200 to-slate-350 dark:from-slate-800 dark:to-slate-950 p-6 border border-slate-250 dark:border-slate-850 h-32 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="h-4.5 w-40 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-8 w-80 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
          </div>
          <div className="h-3 w-96 bg-slate-300 dark:bg-slate-700 rounded-lg mt-1"></div>
        </div>

        {/* KPIs Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
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

        {/* Charts Split Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl h-[360px] p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-3.5 w-64 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
            </div>
            <div className="h-56 bg-slate-50 dark:bg-slate-850 rounded-xl"></div>
          </div>

          <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl h-[360px] p-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="h-3.5 w-48 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
            </div>
            <div className="h-56 w-56 rounded-full bg-slate-50 dark:bg-slate-850 mx-auto flex items-center justify-center">
              <div className="h-36 w-36 rounded-full bg-slate-100 dark:bg-slate-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { stats, funnelData, sourceSpread, revenueTrend, teamPerformance, dealsAtRisk, ai } = crmData;

  // Global theme primary variables
  const COLORS = [
    'var(--primary)', 
    '#10b981', 
    '#3b82f6', 
    '#f59e0b', 
    '#8b5cf6', 
    '#6366f1'
  ];

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto text-foreground">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 text-white shadow-xl border border-primary/20">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-soft">Sales Intelligence Hub</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
              CRM & Sales Pipeline Dashboard
            </h2>
            <p className="text-sm text-primary-soft mt-1 max-w-xl">
              Consolidated lead funnel, WhatsApp & LinkedIn opportunity forecasts, and AI sales velocity recommendations.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Currency Selector */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-0.5 flex rounded-xl">
              {(['INR', 'USD'] as const).map(curr => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    currency === curr ? 'bg-primary text-white shadow-sm' : 'text-primary-soft hover:text-white'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="border-primary/20 bg-primary/10 text-white hover:bg-primary rounded-xl" onClick={handleRefresh}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh Sales Data
            </Button>
          </div>
        </div>
      </div>

      {/* CRM KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Metric 1: Total Pipelines Value */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pipelines Value</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{formatVal(stats.pipelineValue)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">+{stats.conversionRate}%</span>
              <span className="text-[10px] text-muted-foreground">overall conversion</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Opportunity Win Rate */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opportunity Win Rate</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">{stats.winRate}%</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">{stats.lostDeals} lost deal categories</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Active Negotiating Deals */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Negotiating Deals</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{stats.activeDeals}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Under active qualification</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Total Inquiries Received */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Inquiries Received</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Inbox className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{stats.totalLeads}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Consolidated lead channels</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel & Conversion charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales conversion funnel (7 Columns) */}
        <Card className="lg:col-span-7 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md">Lead Conversion Funnel Stages</CardTitle>
            <CardDescription>Opportunity fallouts from marketing acquisition down to Won contracts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#888888" fontSize={10} />
                  <YAxis dataKey="stage" type="category" stroke="#888888" fontSize={10} width={80} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lead source allocation pie (5 Columns) */}
        <Card className="lg:col-span-5 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md">Acquisition Channel Share</CardTitle>
            <CardDescription>Deals source origin (WhatsApp, LinkedIn, Website forms)</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceSpread}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceSpread.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(val) => `${val} Leads`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue trends, leaderboards, and stagnation risks (3 Column Layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Forecast vs actual */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md">Monthly Weighted Pipeline Forecast</CardTitle>
            <CardDescription>Projected conversion estimates vs closed revenue margins.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={10} />
                  <YAxis stroke="#888888" fontSize={10} tickFormatter={(val) => `${formatVal(val).split('.')[0]}`} />
                  <ChartTooltip formatter={(val) => formatVal(Number(val))} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="forecast" name="Forecast Pipeline" stroke="var(--primary-light)" strokeWidth={3} dot />
                  <Line type="monotone" dataKey="actual" name="Closed Revenue" stroke="#10b981" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Representative leader boards */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md">Top Sales Representative Commitments</CardTitle>
            <CardDescription>Deals won and cumulative contract SOW values by representative.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto max-h-[300px]">
            {teamPerformance.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground italic">
                Awaiting first won inquiries to populate scoreboard.
              </div>
            ) : (
              teamPerformance.map((rep: any, idx: number) => (
                <div key={rep.name} className="flex items-center justify-between p-3 border border-border/60 rounded-xl hover:bg-accent/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center font-bold text-xs text-primary">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-foreground">{rep.name}</p>
                      <p className="text-[10px] text-muted-foreground">{rep.deals} deals finalized</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary text-xs">{formatVal(rep.wonAmount)}</p>
                    <p className="text-[8px] text-muted-foreground uppercase">Weighted SOW</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Critical Deals At Risk (Stagnant > 10 Days) */}
        <Card className="rounded-2xl border-rose-500/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-md flex items-center gap-1.5 text-rose-500">
                <span className="h-2 w-2 bg-rose-500 rounded-full animate-ping"></span>
                Stagnant Deals At Risk
              </CardTitle>
              <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[9px] rounded-lg px-2 border-none">
                Stagnation alert
              </Badge>
            </div>
            <CardDescription>Pipeline opportunities with zero activity for over 10 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto max-h-[300px]">
            {dealsAtRisk.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground italic bg-accent/5 border border-dashed border-border rounded-xl">
                All deal pipelines are moving smoothly!
              </div>
            ) : (
              dealsAtRisk.map((deal: any) => (
                <div key={deal.id} className="flex items-center justify-between p-3 border border-border rounded-xl bg-card hover:bg-rose-50/5 dark:hover:bg-rose-950/5 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {deal.ownerInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{deal.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{deal.type}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] bg-rose-100/60 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded-full">
                      {deal.stagnant}
                    </span>
                    <p className="font-black text-xs text-slate-800 dark:text-slate-200 mt-1">{formatVal(deal.value)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendation panel (Design Aligned to Header card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left AI summary box (8 columns) */}
        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 text-white shadow-xl border border-primary/20">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-white/5 blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary-soft mb-4">
                <Bot className="h-6 w-6 text-white animate-bounce" />
                <h3 className="text-lg font-black uppercase tracking-wider text-white">AI Sales Pipeline Advisory</h3>
              </div>
              
              <p className="text-md text-slate-200 leading-relaxed mb-6 font-medium">
                {ai.reasoning}
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-400 text-xs mb-1">AI Next Best Action Recommendation</h4>
                  <p className="text-xs text-slate-350 leading-relaxed">{ai.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Health Score Gauge (4 columns) */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col justify-between rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pipeline Health Index</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 text-center">
              <div className="relative flex items-center justify-center h-36 w-36 mb-4">
                <span className="text-4xl font-black text-primary">
                  {ai.healthScore}%
                </span>
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/20 animate-spin-slow" />
              </div>
              <p className="text-xs font-bold text-slate-500">AI Confidence: {Math.round(ai.confidence * 100)}% accuracy</p>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
