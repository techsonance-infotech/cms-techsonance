'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeaderSkeleton, StatsSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Wallet, 
  Filter, 
  ArrowDown, 
  Mail, 
  AlertTriangle,
  Phone,
  Sparkles,
  ArrowRight,
  BellRing,
  RefreshCw,
  Award,
  Layers,
  BarChart3
} from 'lucide-react';

interface DealRisk {
  id: string;
  name: string;
  type: string;
  owner: string;
  ownerInitials: string;
  value: number;
  stagnant: string;
  action: 'mail' | 'alert' | 'phone';
}

export default function CRMOpportunityForecastPage() {
  const router = useRouter();
  
  const [forecastPeriod, setForecastPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<any>(null);

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

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/crm/dashboard?period=${forecastPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setForecastData(json.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch opportunity forecasting models.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, [forecastPeriod]);

  const handleAction = (dealName: string, actionType: string) => {
    if (actionType === 'mail') {
      toast.success(`Mail draft created for ${dealName} owner`);
      router.push('/dashboard/inbox/composer');
    } else if (actionType === 'alert') {
      toast.success(`Alert dispatched to supervisor for ${dealName}`);
    } else {
      toast.success(`Outgoing client call initialized for ${dealName}`);
    }
  };

  if (loading || !forecastData) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-100 p-1 animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 p-6 border border-slate-250 dark:border-slate-800 h-32 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-8 w-80 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
          </div>
          <div className="h-3 w-96 bg-slate-300 dark:bg-slate-700 rounded-lg mt-1"></div>
        </div>

        {/* 4 KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border border-slate-150 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5 rounded-2xl h-28 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                <div className="h-4.5 w-4.5 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-7 w-28 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Split Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Funnel card skeleton */}
          <div className="lg:col-span-5 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-6 h-96 flex flex-col justify-between">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-850 rounded-lg border-b border-slate-100 dark:border-slate-800 pb-3"></div>
            <div className="flex-1 space-y-4 mt-6">
              {[1, 2, 3, 4, 5].map(j => (
                <div key={j} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-8 rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart card skeleton */}
          <div className="lg:col-span-7 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-6 h-96 flex flex-col justify-between">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-850 rounded-lg border-b border-slate-100 dark:border-slate-800 pb-3"></div>
            <div className="h-64 flex items-end justify-between gap-4 border-b border-l border-slate-250 dark:border-slate-800 pb-2 pl-2 mt-6">
              {[1, 2, 3, 4, 5, 6].map(k => (
                <div key={k} className="flex-1 flex gap-1 items-end h-full justify-center">
                  <div className="w-4 bg-slate-200 dark:bg-slate-850 rounded-t-md h-2/3"></div>
                  <div className="w-4 bg-slate-100 dark:bg-slate-850 rounded-t-md h-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lower Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Risk table skeleton */}
          <div className="lg:col-span-8 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl h-80 flex flex-col justify-between overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 h-16 flex items-center">
              <div className="h-4.5 w-32 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
            </div>
            <div className="flex-1 p-6 space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
                  <div className="space-y-1">
                    <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                    <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                  </div>
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Rep performance + AI Recommendation skeleton */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-80">
            <div className="border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex-1 p-6 flex flex-col justify-between">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-850 rounded-lg border-b border-slate-100 dark:border-slate-800 pb-3"></div>
              <div className="space-y-4 mt-4">
                {[1, 2, 3].map(m => (
                  <div key={m} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { stats, funnelData, revenueTrend, teamPerformance, dealsAtRisk, ai } = forecastData;

  // Calculate highest rep value for progress bars normalization
  const maxRepValue = teamPerformance.reduce((max: number, r: any) => r.wonAmount > max ? r.wonAmount : max, 1);

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 p-1">
      
      {/* Page Header */}
      <div className="shrink-0">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 text-white shadow-xl border border-primary/20">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-soft">Predictive CRM Insights</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
                Opportunity Forecasting Intelligence
              </h2>
              <p className="text-sm text-primary-soft mt-1 max-w-xl">
                Real-time pipeline analytics, dynamic risk models, and revenue forecast estimations.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              {/* Forecast period selector */}
              <div className="flex bg-white/10 border border-white/15 rounded-xl p-1 shadow-xs">
                {(['month', 'quarter', 'year'] as const).map(p => (
                  <button 
                    key={p}
                    onClick={() => setForecastPeriod(p)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize ${
                      forecastPeriod === p 
                        ? 'bg-primary text-white shadow-xs' 
                        : 'text-primary-soft hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Currency selector */}
              <div className="flex bg-white/10 border border-white/15 rounded-xl p-1 shadow-xs">
                {(['INR', 'USD'] as const).map(curr => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      currency === curr ? 'bg-primary text-white shadow-xs' : 'text-primary-soft hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                onClick={fetchForecastData}
                className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-9 border-white/15 shrink-0"
              >
                <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Weighted Forecast</span>
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black leading-none text-slate-900 dark:text-white">{formatVal(stats.pipelineValue)}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-0.5">↑ {stats.conversionRate}% conversion target</p>
          </div>
        </Card>
        
        <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Win Rate</span>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black leading-none text-slate-900 dark:text-white">{stats.winRate}%</p>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">{stats.lostDeals} lost deal categories</p>
          </div>
        </Card>
        
        <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Deals</span>
            <Clock className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black leading-none text-slate-900 dark:text-white">{stats.activeDeals}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-0.5">Under active negotiation</p>
          </div>
        </Card>
        
        <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Inquiries</span>
            <Wallet className="h-4.5 w-4.5 text-primary animate-pulse" />
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black leading-none text-slate-900 dark:text-white">{stats.totalLeads}</p>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">Consolidated channels</p>
          </div>
        </Card>
      </div>

      {/* Funnel + Revenue Histograms Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Funnel Visualization */}
        <div className="lg:col-span-5 bg-card border border-slate-150 dark:border-slate-800 rounded-2xl p-6 flex flex-col shadow-xs">
          <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 border-b border-border/60 pb-3 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" /> Conversion Funnel
          </h2>
          
          <div className="flex-1 space-y-4">
            {funnelData.map((stage: any, idx: number) => {
              const maxVal = funnelData[0]?.count || 1;
              const percentOfMax = Math.round((stage.count / maxVal) * 100);
              
              return (
                <div key={idx} className="relative">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1 text-muted-foreground">
                    <span>{stage.stage}</span>
                    <span className="font-bold text-foreground">{stage.count} leads</span>
                  </div>
                  <div className="w-full bg-accent/50 h-8 rounded-xl overflow-hidden flex relative items-center px-3">
                    <div 
                      className="absolute left-0 top-0 bg-primary/20 h-full transition-all rounded-r-lg" 
                      style={{ width: `${percentOfMax}%` }}
                    ></div>
                    <span className="relative z-10 text-[10px] font-bold text-primary">{percentOfMax}% pipeline volume</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Forecast Comparison Charts */}
        <div className="lg:col-span-7 bg-card border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-primary" /> Revenue Forecast
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Weighted target vs actual realized revenue</p>
            </div>
            
            <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span>Weighted</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary/20"></span>
                <span>Actual</span>
              </div>
            </div>
          </div>

          {/* Histogram bar charts */}
          <div className="h-64 flex items-end justify-between gap-4 border-b border-l border-border relative pb-2 pl-2">
            {revenueTrend.map((bar: any, idx: number) => {
              // Normalize chart bar heights relative to max forecast value
              const maxVal = Math.max(...revenueTrend.map((r: any) => Math.max(r.forecast, r.actual)), 1);
              const forecastPct = Math.round((bar.forecast / maxVal) * 100);
              const actualPct = Math.round((bar.actual / maxVal) * 100);
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end relative">
                  <div className="w-full flex gap-1 items-end h-full">
                    <div 
                      title={`Forecast: ${formatVal(bar.forecast)}`}
                      className="flex-1 bg-primary rounded-t-md hover:bg-primary/95 transition-opacity"
                      style={{ height: `${forecastPct}%` }}
                    ></div>
                    <div 
                      title={`Actual: ${formatVal(bar.actual)}`}
                      className="flex-1 bg-primary/20 rounded-t-md hover:bg-primary/30 transition-colors"
                      style={{ height: `${actualPct}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">{bar.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deals at Risk Table + Rep Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Deals at Risk Table */}
        <div className="lg:col-span-8 bg-card border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-border flex justify-between items-center bg-card">
            <div>
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-500" /> Deals at Risk
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Stagnant opportunities with zero activity (&gt;10 days)</p>
            </div>
            <Button variant="link" className="text-primary hover:text-primary/90 text-xs font-bold p-0 h-auto" onClick={() => router.push('/dashboard/inquiry')}>
              View Inquiry Board
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-accent/40 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                  <th className="px-6 py-3">Opportunity</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Stagnant</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground font-medium">
                {dealsAtRisk.map((deal: DealRisk) => (
                  <tr key={deal.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{deal.name}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{deal.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-[10px] shadow-xs">
                          {deal.ownerInitials}
                        </div>
                        <span className="font-semibold">{deal.owner}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">{formatVal(Number(deal.value))}</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {deal.stagnant}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleAction(deal.name, deal.action)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary rounded-xl hover:bg-accent"
                      >
                        {deal.action === 'mail' && <Mail className="h-4.5 w-4.5" />}
                        {deal.action === 'alert' && <BellRing className="h-4.5 w-4.5" />}
                        {deal.action === 'phone' && <Phone className="h-4.5 w-4.5" />}
                      </Button>
                    </td>
                  </tr>
                ))}
                {dealsAtRisk.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-muted-foreground italic">No deals flagged at risk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rep Performance + AI Recommendation */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-card border border-slate-150 dark:border-slate-800 shadow-xs rounded-2xl flex-1 p-6">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4 border-b border-border/60 pb-3 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" /> Rep Performance
            </h3>
            <div className="space-y-4">
              {teamPerformance.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground/60 italic font-semibold">
                  No active won deals logged for reps.
                </div>
              ) : (
                teamPerformance.map((rep: any, idx: number) => {
                  const repValPct = Math.round((rep.wonAmount / maxRepValue) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                        <span>{rep.name}</span>
                        <span className="font-bold text-foreground">{formatVal(rep.wonAmount)}</span>
                      </div>
                      <Progress value={repValPct} className="h-2 bg-accent [&>div]:bg-primary rounded-full" />
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* AI Recommendation Banner */}
          <div className="bg-gradient-to-br from-primary to-zinc-900 p-6 rounded-2xl text-white flex flex-col justify-between h-48 relative overflow-hidden shadow-xl border border-primary/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary-soft" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-primary-soft">AI Recommendation</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-100 font-semibold mt-1">
                {ai.recommendation}
              </p>
            </div>
            
            <Button 
              onClick={() => {
                toast.success('Opportunity AI outreach initiated');
                router.push('/dashboard/inbox/composer');
              }}
              className="relative z-10 w-fit bg-primary hover:bg-primary/95 text-white border-none shadow-sm flex items-center gap-2 h-9 rounded-lg text-xs font-bold px-4 transition-all"
            >
              Draft Outreach
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
