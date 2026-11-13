'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  Calendar, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Calculator,
  CheckCircle2,
  Users,
  Coins,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { PageHeaderSkeleton, StatsSkeleton } from '@/components/ui/dashboard-skeleton';
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
  Line
} from 'recharts';

export default function FinancialExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [reconciling, setReconciling] = useState(false);
  const [financeData, setFinanceData] = useState<any>(null);
  const [lastAudit, setLastAudit] = useState<any>(null);

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/finance/executive', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setFinanceData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/finance/executive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'reconcile' })
      });

      if (res.ok) {
        const json = await res.json();
        setLastAudit(json.data);
        toast.success(json.data?.message || 'Ledger reconciliation completed successfully.');
        await fetchDashboardData();
      } else {
        toast.error('Failed to run ledger reconciliation.');
      }
    } catch (err) {
      console.error('Reconciliation error:', err);
      toast.error('An error occurred during ledger reconciliation.');
    } finally {
      setReconciling(false);
    }
  };

  if (loading || !financeData) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  const { metrics, departmentSpend, cashFlowHistory, ai } = financeData;

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 to-zinc-950 p-6 text-white shadow-xl border border-emerald-900/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-teal-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Financial Intelligence Tier</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
              Financial Executive Dashboard
            </h2>
            <p className="text-sm text-emerald-200 mt-1 max-w-xl">
              C-suite multi-tenant ledger overview, future liquid liabilities forecast, and aging balance sheet reviews.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Currency Selector */}
            <div className="bg-emerald-950/80 border border-emerald-800 p-0.5 flex rounded-xl">
              {(['INR', 'USD'] as const).map(curr => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    currency === curr ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300 hover:text-emerald-100'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="border-emerald-700 bg-emerald-800 text-white hover:bg-emerald-700 font-bold" onClick={handleReconcile} disabled={reconciling}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${reconciling ? 'animate-spin' : ''}`} /> Reconcile Ledger
            </Button>
          </div>
        </div>
      </div>

      {/* Live Reconciliation Audit Alert */}
      {lastAudit && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span><strong>Live Audit Result:</strong> {lastAudit.message}</span>
          </div>
          <span className="text-emerald-400/80">Audited at {new Date(lastAudit.auditedAt).toLocaleTimeString()}</span>
        </div>
      )}

      {/* Financial Bento KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Metric 1 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue recognized</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatVal(metrics.revenue)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">+{metrics.collectionEfficiency}%</span>
              <span className="text-[10px] text-muted-foreground">collection efficiency</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Profit Margin</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Calculator className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatVal(metrics.netProfit)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground">EBITDA is {formatVal(metrics.ebitda)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Cash Flow</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatVal(metrics.cashFlow)}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Working Capital: {formatVal(metrics.workingCapital)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Burn-Rate</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">{formatVal(metrics.burnRate)}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Overhead A/R Outstanding: {formatVal(metrics.outstandingInvoices)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash flow history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Cash Flow Inflows vs Outflows History</CardTitle>
            <CardDescription>Monthly collections (inflows) against payroll + claims expenses (outflows).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cashFlowHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} tickFormatter={(val) => `${formatVal(val).split('.')[0]}`} />
                  <ChartTooltip formatter={(val) => formatVal(Number(val))} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="inflow" name="Inflows" stroke="#10b981" strokeWidth={3} dot />
                  <Line type="monotone" dataKey="outflow" name="Outflows" stroke="#f43f5e" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Spends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Department Operational Cost Allocations</CardTitle>
            <CardDescription>Direct breakdown of corporate payroll costs and business reimbursements.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentSpend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} tickFormatter={(val) => `${formatVal(val).split('.')[0]}`} />
                  <ChartTooltip formatter={(val) => formatVal(Number(val))} />
                  <Bar dataKey="value" name="Allocated Budget Spent" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Financial Health Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left AI summary box (8 columns) */}
        <div className="lg:col-span-8">
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-indigo-900 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full"></div>
            <div className="flex items-center gap-2 text-indigo-400 mb-4">
              <Bot className="h-6 w-6 text-indigo-400" />
              <h3 className="text-lg font-black uppercase tracking-wider">AI Executive Financial Summary</h3>
            </div>
            
            <p className="text-md text-slate-200 leading-relaxed mb-6 font-medium">
              {ai.reasoning}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-400 text-xs mb-1">AI Recommendation</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{ai.recommendation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Health Score Gauge (4 columns) */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financial Health Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 text-center">
              <div className="relative flex items-center justify-center h-36 w-36 mb-4">
                <span className={`text-4xl font-black ${ai.healthScore > 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {ai.healthScore}%
                </span>
                <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-spin-slow ${
                  ai.healthScore > 75 ? 'border-emerald-500/20' : 'border-amber-500/20'
                }`} />
              </div>
              <p className="text-xs font-bold text-slate-500">Confidence Accuracy: {Math.round(ai.confidence * 100)}%</p>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
