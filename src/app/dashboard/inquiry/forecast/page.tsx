'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  BellRing
} from 'lucide-react';

export default function CRMOpportunityForecastPage() {
  const router = useRouter();
  
  const [forecastPeriod, setForecastPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const [dealsAtRisk, setDealsAtRisk] = useState([
    { id: '1', name: 'Global Logistics Q3', type: 'Tier 1 • Discovery', owner: 'Sarah Chen', ownerInitials: 'SC', value: '$450,000', stagnant: '24 Days', action: 'mail' },
    { id: '2', name: 'Cloud-Native Expansion', type: 'SaaS • Proposal', owner: 'Marcus Johnson', ownerInitials: 'MJ', value: '$128,000', stagnant: '18 Days', action: 'alert' },
    { id: '3', name: 'Vertex Systems Audit', type: 'Services • Negotiation', owner: 'Anna Lopez', ownerInitials: 'AL', value: '$89,500', stagnant: '16 Days', action: 'phone' }
  ]);

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

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-slate-900 scrollbar-hide">
      
      {/* Title Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Opportunity Forecast</h1>
          <p className="text-slate-500 text-xs mt-1">Real-time pipeline analytics and revenue projection</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setForecastPeriod('month')}
              className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
                forecastPeriod === 'month' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month
            </button>
            <button 
              onClick={() => setForecastPeriod('quarter')}
              className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
                forecastPeriod === 'quarter' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quarter
            </button>
            <button 
              onClick={() => setForecastPeriod('year')}
              className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${
                forecastPeriod === 'year' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Year
            </button>
          </div>
          
          <Button variant="outline" className="border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-50">
            <Filter className="h-4 w-4 text-slate-400" />
            Filters
          </Button>
        </div>
      </header>

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weighted Forecast</span>
              <TrendingUp className="h-4.5 w-4.5 text-indigo-600" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-extrabold text-slate-800 leading-none">$2.4M</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-0.5">↑ 12% vs last month</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Win Rate</span>
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-extrabold text-slate-800 leading-none">34.2%</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-0.5">↑ 2.1% trend</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Deal Cycle</span>
              <Clock className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-extrabold text-slate-800 leading-none">42 Days</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-0.5">↓ 5 days improved</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pipeline</span>
              <Wallet className="h-4.5 w-4.5 text-indigo-500" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-extrabold text-slate-800 leading-none">$8.12M</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1.5">112 Opportunities</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Revenue Histograms Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Funnel Visualization */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Conversion Funnel</h2>
          
          <div className="flex-1 space-y-4">
            {[
              { label: 'Awareness / Lead', count: '1,200', percentage: '100%', width: '100%', opacity: 'bg-indigo-600' },
              { label: 'Discovery / Meeting', count: '480', percentage: '40%', width: '40%', opacity: 'bg-indigo-600/80', dropOff: '60%' },
              { label: 'Proposal Sent', count: '124', percentage: '25%', width: '25%', opacity: 'bg-indigo-600/60' },
              { label: 'Negotiation', count: '62', percentage: '50%', width: '12%', opacity: 'bg-indigo-600/40' },
              { label: 'Closed Won', count: '42', percentage: '68%', width: '8%', opacity: 'bg-emerald-500' }
            ].map((stage, idx) => (
              <div key={idx} className="relative">
                <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-600">
                  <span>{stage.label}</span>
                  <span>{stage.count} ({stage.percentage})</span>
                </div>
                <div className="w-full bg-slate-100 h-8 rounded-xl overflow-hidden flex">
                  <div className={`${stage.opacity} h-full transition-all`} style={{ width: stage.width }}></div>
                </div>
                {stage.dropOff && (
                  <div className="absolute -right-2 top-8 text-red-500 text-[9px] font-bold flex flex-col items-center leading-none">
                    <ArrowDown className="h-3 w-3" />
                    {stage.dropOff} Drop
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Forecast Comparison Charts */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Forecast</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Weighted vs. Cumulative Target Pipeline</p>
            </div>
            
            <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span>Weighted</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-100"></span>
                <span>Target</span>
              </div>
            </div>
          </div>

          {/* Histogram bar charts */}
          <div className="h-64 flex items-end justify-between gap-4 border-b border-l border-slate-200 relative pb-2 pl-2">
            {[
              { month: 'Jan', val: 'h-[30%]', targetVal: 'h-[40%]' },
              { month: 'Feb', val: 'h-[45%]', targetVal: 'h-[50%]' },
              { month: 'Mar', val: 'h-[55%]', targetVal: 'h-[60%]' },
              { month: 'Apr', val: 'h-[75%]', targetVal: 'h-[70%]' },
              { month: 'May', val: 'h-[85%]', targetVal: 'h-[80%]' },
              { month: 'Jun', val: 'h-[95%]', targetVal: 'h-[90%]' }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end relative">
                {/* Dual bar overlay */}
                <div className="w-full flex gap-1 items-end h-full">
                  <div className={`flex-1 bg-indigo-600 rounded-t-lg ${bar.val} opacity-90 hover:opacity-100 transition-opacity`}></div>
                  <div className={`flex-1 bg-indigo-100 rounded-t-lg ${bar.targetVal} hover:bg-indigo-200 transition-colors`}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deals at Risk Table + Rep Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Deals at Risk Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Deals at Risk</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Stagnant opportunities with zero activity (&gt;15 days)</p>
            </div>
            <Button variant="link" className="text-indigo-600 hover:text-indigo-700 text-xs font-bold p-0 h-auto">View All</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3">Opportunity</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Stagnant</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {dealsAtRisk.map(deal => (
                  <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{deal.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{deal.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px] shadow-sm">
                          {deal.ownerInitials}
                        </div>
                        <span className="font-semibold text-slate-700">{deal.owner}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{deal.value}</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-red-50 text-red-700 border border-red-150 text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {deal.stagnant}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleAction(deal.name, deal.action)}
                        className="h-8 w-8 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100"
                      >
                        {deal.action === 'mail' && <Mail className="h-4.5 w-4.5" />}
                        {deal.action === 'alert' && <BellRing className="h-4.5 w-4.5" />}
                        {deal.action === 'phone' && <Phone className="h-4.5 w-4.5" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rep Performance + AI Recommendation */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl flex-1 p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Rep Performance</h3>
            <div className="space-y-4">
              {[
                { name: 'Sarah Chen', value: '$1.2M', progress: 85 },
                { name: 'Anna Lopez', value: '$0.9M', progress: 65 },
                { name: 'Marcus Johnson', value: '$0.4M', progress: 30 }
              ].map((rep, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>{rep.name}</span>
                    <span className="font-bold text-slate-800">{rep.value}</span>
                  </div>
                  <Progress value={rep.progress} className="h-2 bg-slate-100 [&>div]:bg-indigo-600 rounded-full" />
                </div>
              ))}
            </div>
          </Card>

          {/* AI Recommendation Banner */}
          <div className="bg-indigo-600 p-6 rounded-2xl text-white flex flex-col justify-between h-48 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-xs font-bold tracking-wider uppercase">AI Recommendation</h3>
              </div>
              <p className="text-[11px] leading-relaxed opacity-95">
                Shift focus to "Cloud-Native Expansion" deal. Historical win rate for similar contracts in Q4 is 82%.
              </p>
            </div>
            
            <Button 
              onClick={() => {
                toast.success('Opportunity review activated');
                router.push('/dashboard/inbox/deal/skyline-ventures');
              }}
              className="relative z-10 w-fit bg-white hover:bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold shadow transition-all active:scale-[0.98]"
            >
              Review Opportunity
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
