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
  Award
} from 'lucide-react';

interface DealRisk {
  id: string;
  name: string;
  type: string;
  owner: string;
  ownerInitials: string;
  value: string;
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
      const res = await fetch('/api/crm/dashboard', {
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
  }, []);

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
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  const { stats, funnelData, revenueTrend, teamPerformance, dealsAtRisk, ai } = forecastData;

  // Calculate highest rep value for progress bars normalization
  const maxRepValue = teamPerformance.reduce((max: number, r: any) => r.wonAmount > max ? r.wonAmount : max, 1);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background text-foreground scrollbar-hide border-t border-border">
      
      {/* Title Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Opportunity Forecast</h1>
          <p className="text-muted-foreground text-xs mt-1">Real-time pipeline analytics, forecasting trends, and dynamic risk models</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex bg-accent/40 border border-border rounded-xl p-1 shadow-xs">
            <button 
              onClick={() => setForecastPeriod('month')}
              className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
                forecastPeriod === 'month' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Month
            </button>
            <button 
              onClick={() => setForecastPeriod('quarter')}
              className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
                forecastPeriod === 'quarter' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Quarter
            </button>
            <button 
              onClick={() => setForecastPeriod('year')}
              className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
                forecastPeriod === 'year' 
                  ? 'bg-primary text-white shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Year
            </button>
          </div>

          <div className="flex bg-accent/40 border border-border rounded-xl p-1 shadow-xs">
            {(['INR', 'USD'] as const).map(curr => (
              <button
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  currency === curr ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
          
          <Button variant="outline" className="border-border text-foreground font-bold py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-accent" onClick={fetchForecastData}>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            Refresh
          </Button>
        </div>
      </header>

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card border-border shadow-xs rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weighted Forecast</span>
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black leading-none">{formatVal(stats.pipelineValue)}</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-0.5">↑ {stats.conversionRate}% conversion target</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-xs rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Win Rate</span>
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black leading-none">{stats.winRate}%</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">{stats.lostDeals} lost deal categories</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-xs rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Deals</span>
              <Clock className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black leading-none">{stats.activeDeals}</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-0.5">Under active negotiation</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-xs rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Inquiries</span>
              <Wallet className="h-4.5 w-4.5 text-primary animate-pulse" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black leading-none">{stats.totalLeads}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1.5">Consolidated channels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Revenue Histograms Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Funnel Visualization */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-6 flex flex-col shadow-xs">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-6">Conversion Funnel</h2>
          
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
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Revenue Forecast</h2>
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
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-border flex justify-between items-center bg-card">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Deals at Risk</h2>
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
                    <td className="px-6 py-4 font-bold">{deal.value}</td>
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
          <Card className="bg-card border-border shadow-xs rounded-2xl flex-1 p-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Rep Performance</h3>
            <div className="space-y-4">
              {teamPerformance.map((rep: any, idx: number) => {
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
              })}
            </div>
          </Card>

          {/* AI Recommendation Banner */}
          <div className="bg-gradient-to-br from-primary to-primary-hover p-6 rounded-2xl text-white flex flex-col justify-between h-48 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-white" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-white">AI Recommendation</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-white/90">
                {ai.recommendation}
              </p>
            </div>
            
            <Button 
              onClick={() => {
                toast.success('Opportunity AI outreach initiated');
                router.push('/dashboard/inbox/composer');
              }}
              className="relative z-10 w-fit bg-white hover:bg-primary-soft text-primary px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98] border-none"
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
