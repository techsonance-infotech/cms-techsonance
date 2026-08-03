'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, DollarSign, Users, Target, RefreshCw, Download, Search,
  ArrowRight, AlertTriangle, CheckCircle2, XCircle, Pause, Loader2,
  BarChart3, Brain, Sparkles, ChevronRight, Building2, Calendar, Phone,
  Mail, GripVertical, ArrowUpRight, ArrowDownRight, Minus, Shield
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Skeleton ─── */
function PipelineSkeleton() {
  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-pulse">
      <div className="rounded-2xl bg-slate-100 dark:bg-[#37383E] h-36 p-6 md:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-3">
          <div className="h-6 w-60 bg-slate-200 dark:bg-zinc-800/80 rounded-lg"></div>
          <div className="h-3.5 w-96 bg-slate-200 dark:bg-zinc-800/80 rounded-lg"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#37383E] h-28 p-5">
            <div className="flex justify-between">
              <div className="h-3.5 w-20 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
            </div>
            <div className="mt-4 h-6 w-12 bg-slate-200 dark:bg-zinc-800 rounded"></div>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] h-96"></Card>
    </div>
  );
}

/* ─── Stage color/icon map ─── */
const STAGE_CONFIG: Record<string, { color: string; bg: string; borderColor: string; icon: React.ReactNode }> = {
  'New Lead':        { color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', borderColor: 'border-sky-200 dark:border-sky-900/40', icon: <Users className="h-4 w-4" /> },
  'Qualified':       { color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', borderColor: 'border-indigo-200 dark:border-indigo-900/40', icon: <Target className="h-4 w-4" /> },
  'Discovery':       { color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', borderColor: 'border-violet-200 dark:border-violet-900/40', icon: <Search className="h-4 w-4" /> },
  'Proposal Sent':   { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-200 dark:border-amber-900/40', icon: <ArrowRight className="h-4 w-4" /> },
  'Negotiation':     { color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', borderColor: 'border-orange-200 dark:border-orange-900/40', icon: <BarChart3 className="h-4 w-4" /> },
  'Contract Review': { color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', borderColor: 'border-teal-200 dark:border-teal-900/40', icon: <Shield className="h-4 w-4" /> },
  'Won':             { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-900/40', icon: <CheckCircle2 className="h-4 w-4" /> },
  'Lost':            { color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', borderColor: 'border-rose-200 dark:border-rose-900/40', icon: <XCircle className="h-4 w-4" /> },
  'On Hold':         { color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/30', borderColor: 'border-slate-200 dark:border-slate-700/40', icon: <Pause className="h-4 w-4" /> },
};

const getStageConfig = (stage: string) => STAGE_CONFIG[stage] || STAGE_CONFIG['New Lead'];

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function SalesPipelinePage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deals, setDeals] = useState<any[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [stageStats, setStageStats] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({});
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('kanban');
  const [updatingDealId, setUpdatingDealId] = useState<number | null>(null);

  const fetchPipeline = useCallback(async (isInitial = false) => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/sales-pipeline', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setDeals(json.deals || []);
        setStages(json.stages || []);
        setStageStats(json.stageStats || []);
        setKpis(json.kpis || {});
        setAiInsights(json.aiInsights || null);
        if (!isInitial) toast.success('Pipeline synced successfully!');
      } else {
        toast.error('Failed to load pipeline data.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while fetching pipeline.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => { fetchPipeline(true); }, [fetchPipeline]);

  /* ─── Update deal stage ─── */
  const updateDealStage = async (dealId: number, newStage: string) => {
    setUpdatingDealId(dealId);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/sales-pipeline', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: dealId, pipeline_stage: newStage })
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        toast.success(`Deal moved to "${newStage}"`);
        fetchPipeline(true);
      } else {
        toast.error(json?.error || 'Failed to update deal stage.');
      }
    } catch {
      toast.error('Network error updating deal.');
    } finally {
      setUpdatingDealId(null);
    }
  };

  /* ─── CSV Export ─── */
  const handleExportCSV = () => {
    if (!deals.length) { toast.error('No deals to export.'); return; }
    const headers = ['Deal', 'Company', 'Stage', 'Value', 'Probability', 'Priority', 'Owner', 'Status'].join(',');
    const rows = deals.map(d =>
      [d.name, d.companyName, d.stage, d.value, `${d.probability}%`, d.priorityLevel, d.accountOwner, d.opportunityStatus]
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'sales_pipeline.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Pipeline exported!');
  };

  if (loading) return <PipelineSkeleton />;

  /* ─── Filtered deals ─── */
  const filtered = deals.filter(d => {
    const q = searchQuery.toLowerCase();
    return !q || d.name?.toLowerCase().includes(q) || d.companyName?.toLowerCase().includes(q) || d.contactPerson?.toLowerCase().includes(q) || d.stage?.toLowerCase().includes(q) || d.accountOwner?.toLowerCase().includes(q);
  });

  const activeStages = stages.filter(s => !['Won', 'Lost'].includes(s));

  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-fadeIn">
      {/* ─── Premium Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-white" />
              Sales Pipeline
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">
              Visual pipeline management with AI-powered deal intelligence, stage tracking, and revenue forecasting.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchPipeline()} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Pipeline'}
            </Button>
            <Button size="sm" onClick={handleExportCSV} disabled={!deals.length} className="bg-white hover:bg-white/95 text-primary font-bold shadow-lg disabled:opacity-50">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Deals</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{kpis.totalDeals || 0}</div>
            <span className="text-[10px] text-muted-foreground">{kpis.activeCount || 0} active</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Value</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{formatCurrency(kpis.activePipelineValue || 0)}</div>
            <span className="text-[10px] text-muted-foreground">Weighted: {formatCurrency(kpis.weightedPipelineValue || 0)}</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Won Deals</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-emerald-600">{kpis.wonCount || 0}</div>
            <span className="text-[10px] text-emerald-500 font-bold">{formatCurrency(kpis.wonValue || 0)} revenue</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lost Deals</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-rose-600">{kpis.lostCount || 0}</div>
            <span className="text-[10px] text-rose-500 font-bold">{formatCurrency(kpis.lostValue || 0)} lost</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conversion</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{kpis.conversionRate || 0}%</div>
            <span className="text-[10px] text-muted-foreground">Avg deal: {formatCurrency(kpis.avgDealValue || 0)}</span>
          </CardContent>
        </Card>
      </div>

      {/* ─── AI Sales Intelligence ─── */}
      {aiInsights && (
        <Card className="rounded-2xl border-primary/20 shadow-sm bg-gradient-to-r from-primary/5 via-white to-primary/5 dark:from-primary/10 dark:via-[#37383E] dark:to-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> AI Sales Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Health Score */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm ${
                  (aiInsights.pipelineHealthScore || 0) >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                  (aiInsights.pipelineHealthScore || 0) >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                  'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                }`}>
                  {aiInsights.pipelineHealthScore || 0}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Health Score</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    {(aiInsights.pipelineHealthScore || 0) >= 70 ? 'Healthy' : (aiInsights.pipelineHealthScore || 0) >= 40 ? 'Needs Attention' : 'At Risk'}
                  </p>
                </div>
              </div>

              {/* Win Prediction */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Win Prediction</p>
                <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 line-clamp-2">{aiInsights.winPrediction || '—'}</p>
              </div>

              {/* Revenue Projection */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Revenue Projection</p>
                <p className="text-sm font-black text-primary">{aiInsights.revenueProjection || '—'}</p>
              </div>

              {/* Risk Alerts */}
              <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Risk Alerts</p>
                {(aiInsights.riskAlerts?.length > 0) ? (
                  <ul className="space-y-0.5">
                    {aiInsights.riskAlerts.slice(0, 3).map((alert: string, i: number) => (
                      <li key={i} className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> <span className="line-clamp-1">{alert}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-emerald-600 font-semibold">No risk alerts</p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {aiInsights.recommendations?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {aiInsights.recommendations.slice(0, 3).map((rec: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary bg-primary/5">
                    <Brain className="h-3 w-3 mr-1" /> {rec}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Search + View Toggle ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search deals by name, company, stage, owner..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-white dark:bg-[#37383E] border-slate-200 dark:border-zinc-800 text-xs font-semibold"
          />
        </div>
        <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
          <TabsList className="rounded-xl">
            <TabsTrigger value="kanban" className="text-xs font-bold rounded-lg">Kanban Board</TabsTrigger>
            <TabsTrigger value="table" className="text-xs font-bold rounded-lg">Table View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ─── Kanban View ─── */}
      {activeView === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {stages.map(stage => {
            const cfg = getStageConfig(stage);
            const stageDeals = filtered.filter(d => d.stage === stage);
            const stat = stageStats.find(s => s.stage === stage);
            return (
              <div key={stage} className={`min-w-[280px] max-w-[300px] flex-shrink-0 rounded-2xl border ${cfg.borderColor} ${cfg.bg} flex flex-col`}>
                {/* Stage Header */}
                <div className="p-3 border-b border-inherit">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cfg.color}>{cfg.icon}</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white">{stage}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold rounded-lg">{stageDeals.length}</Badge>
                  </div>
                  {stat && (
                    <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                      {formatCurrency(stat.totalValue)} • {stat.averageProbability}% avg prob
                    </p>
                  )}
                </div>

                {/* Stage Cards */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[520px]">
                  {stageDeals.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-[10px] text-muted-foreground">No deals in this stage</p>
                    </div>
                  ) : (
                    stageDeals.map(deal => (
                      <div key={deal.id} className="p-3 rounded-xl bg-white dark:bg-[#2A2B30] border border-slate-100 dark:border-zinc-800 hover:shadow-md transition-all cursor-default group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{deal.name}</p>
                            {deal.companyName && <p className="text-[10px] text-muted-foreground truncate">{deal.companyName}</p>}
                          </div>
                          <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-black text-primary">{deal.value > 0 ? formatCurrency(deal.value) : '—'}</span>
                          {deal.probability > 0 && (
                            <span className={`text-[10px] font-bold ${deal.probability >= 70 ? 'text-emerald-600' : deal.probability >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {deal.probability}%
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="outline" className={`text-[9px] font-bold ${
                            deal.priorityLevel === 'High' ? 'border-rose-300 text-rose-600 bg-rose-50 dark:bg-rose-950/20' :
                            deal.priorityLevel === 'Medium' ? 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/20' :
                            'border-slate-300 text-slate-500 bg-slate-50 dark:bg-slate-800/20'
                          }`}>
                            {deal.priorityLevel}
                          </Badge>
                          {deal.accountOwner && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{deal.accountOwner}</span>
                          )}
                        </div>

                        {/* Stage move buttons */}
                        {!['Won', 'Lost'].includes(stage) && (
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              className="flex-1 text-[10px] font-bold bg-transparent border border-slate-200 dark:border-zinc-700 rounded-lg p-1 text-foreground cursor-pointer"
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) updateDealStage(deal.id, e.target.value);
                                e.target.value = '';
                              }}
                              disabled={updatingDealId === deal.id}
                            >
                              <option value="" disabled>Move to...</option>
                              {stages.filter(s => s !== stage).map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            {updatingDealId === deal.id && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Table View ─── */}
      {activeView === 'table' && (
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
          <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Pipeline Deals</CardTitle>
            <CardDescription className="text-[10px]">
              {searchQuery
                ? `${filtered.length} deal${filtered.length !== 1 ? 's' : ''} matching "${searchQuery}"`
                : `${deals.length} deal${deals.length !== 1 ? 's' : ''} in pipeline`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                  <TableRow className="border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider font-bold">
                    <TableHead className="p-3 px-6 text-slate-650 dark:text-zinc-400">Deal</TableHead>
                    <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Stage</TableHead>
                    <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Value</TableHead>
                    <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Probability</TableHead>
                    <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Priority</TableHead>
                    <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Owner</TableHead>
                    <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Source</TableHead>
                    <TableHead className="p-3 text-right text-slate-650 dark:text-zinc-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                            <TrendingUp className="h-7 w-7 text-slate-400 dark:text-zinc-500" />
                          </div>
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                            {searchQuery ? 'No deals match your search' : 'No deals in pipeline'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {searchQuery ? 'Try a different search term.' : 'Create inquiries to populate your sales pipeline.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((deal, idx) => {
                      const cfg = getStageConfig(deal.stage);
                      return (
                        <TableRow key={deal.id || idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850 transition-colors">
                          <TableCell className="p-3 px-6">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{deal.name}</p>
                              {deal.companyName && <p className="text-[10px] text-muted-foreground">{deal.companyName}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="outline" className={`text-[10px] font-bold ${cfg.color} ${cfg.bg} ${cfg.borderColor}`}>
                              {deal.stage}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3 text-xs font-black text-slate-800 dark:text-white">
                            {deal.value > 0 ? formatCurrency(deal.value) : '—'}
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${deal.probability >= 70 ? 'bg-emerald-500' : deal.probability >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  style={{ width: `${Math.min(100, deal.probability)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300">{deal.probability}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="outline" className={`text-[9px] font-bold ${
                              deal.priorityLevel === 'High' ? 'border-rose-300 text-rose-600' :
                              deal.priorityLevel === 'Medium' ? 'border-amber-300 text-amber-600' :
                              'border-slate-300 text-slate-500'
                            }`}>
                              {deal.priorityLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">{deal.accountOwner || '—'}</TableCell>
                          <TableCell className="p-3 text-xs font-semibold text-slate-500">{deal.source || '—'}</TableCell>
                          <TableCell className="p-3 text-right">
                            <select
                              className="text-[10px] font-bold bg-transparent border border-slate-200 dark:border-zinc-700 rounded-lg p-1.5 text-foreground cursor-pointer"
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) updateDealStage(deal.id, e.target.value);
                                e.target.value = '';
                              }}
                              disabled={updatingDealId === deal.id}
                            >
                              <option value="" disabled>Move to...</option>
                              {stages.filter(s => s !== deal.stage).map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
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
      )}

      {/* ─── Stage-Wise Performance Bar ─── */}
      {stageStats.length > 0 && (
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
          <CardHeader>
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Stage-Wise Performance</CardTitle>
            <CardDescription className="text-[10px]">Deal distribution and value across pipeline stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageStats.filter(s => s.count > 0).map(stat => {
                const cfg = getStageConfig(stat.stage);
                const maxCount = Math.max(...stageStats.map(s => s.count), 1);
                const widthPct = Math.max(8, (stat.count / maxCount) * 100);
                return (
                  <div key={stat.stage} className="flex items-center gap-3">
                    <div className="w-28 flex items-center gap-1.5 shrink-0">
                      <span className={cfg.color}>{cfg.icon}</span>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-200 truncate">{stat.stage}</span>
                    </div>
                    <div className="flex-1 h-7 bg-slate-100 dark:bg-zinc-800 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg ${cfg.bg} flex items-center px-2 transition-all`}
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="text-[10px] font-black text-slate-700 dark:text-white whitespace-nowrap">{stat.count} deal{stat.count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="w-24 text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300">{formatCurrency(stat.totalValue)}</span>
                    </div>
                  </div>
                );
              })}
              {stageStats.every(s => s.count === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">No deals to display performance metrics.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
