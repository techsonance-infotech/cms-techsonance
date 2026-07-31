'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot, Brain, Sparkles, ShieldAlert, CheckCircle2,
  RefreshCw, SendHorizontal, Clock, User, FileText, DollarSign, Shield,
  Zap, ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkle, BookOpen, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export interface CapabilityItem {
  category: string;
  name: string;
  description: string;
  confidenceScore: number;
}

export interface InsightRecord {
  id: string;
  category: string;
  title: string;
  description: string;
  riskLevel: string;
  confidenceScore: number;
  recommendedAction: string;
  status: string;
  createdAt: string;
}

export default function AiCopilotOperationsPage() {
  const [activeTab, setActiveTab] = useState('insights');
  const [loading, setLoading] = useState(true);
  const [actionProcessing, setActionProcessing] = useState(false);

  // RBAC State
  const [canApprove, setCanApprove] = useState(false);
  const [userRole, setUserRole] = useState('');

  // Dynamic API State
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([]);
  const [insights, setInsights] = useState<InsightRecord[]>([]);
  const [dailyExecutiveSummary, setDailyExecutiveSummary] = useState<string>('');
  const [summaryStats, setSummaryStats] = useState({
    totalCapabilities: 0,
    modelConfidencePercent: '0%',
    activeAnomaliesCount: 0,
    fraudSavingsTotal: '₹0 Saved',
    moraleIndexScore: '0% Sentiment'
  });

  // Pagination State
  const [insightsPage, setInsightsPage] = useState(1);
  const [capabilitiesPage, setCapabilitiesPage] = useState(1);
  const INSIGHTS_PER_PAGE = 3;
  const CAPABILITIES_PER_PAGE = 6;

  // Natural Language Chat State
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ prompt: string; response: string }>>([]);
  const [chatThinking, setChatThinking] = useState(false);

  const getSessionToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('session_token') ?? localStorage.getItem('session_token');
  };

  // Fetch 100% Dynamic Data from Backend API
  const loadAiOperationsDataFromApi = async () => {
    try {
      setLoading(true);
      const token = getSessionToken();
      const res = await fetch('/api/ai/operations-intelligence', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.canApprove !== undefined) setCanApprove(data.canApprove);
        if (data.userRole) setUserRole(data.userRole);
        if (data.capabilities) setCapabilities(data.capabilities);
        if (data.summaryStats) setSummaryStats(data.summaryStats);
        if (data.insights) setInsights(data.insights);
        if (data.dailyExecutiveSummary) setDailyExecutiveSummary(data.dailyExecutiveSummary);
      } else {
        toast.error('Failed to load operations intelligence data');
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAiOperationsDataFromApi();
  }, []);

  // Send Natural Language HR Assistant Prompt
  const handleSendChatPrompt = async () => {
    if (!chatPrompt.trim()) return;
    const userMsg = chatPrompt.trim();
    setChatPrompt('');
    setChatThinking(true);

    // Optimistically insert user request
    setChatHistory(prev => [...prev, { prompt: userMsg, response: '' }]);

    try {
      const token = getSessionToken();
      const res = await fetch('/api/ai/operations-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt: userMsg })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Chat failed');

      // Update history response index
      setChatHistory(prev => prev.map(item => item.prompt === userMsg ? { ...item, response: data.response } : item));
    } catch (err: any) {
      toast.error(err.message || 'Error communicating with AI Assistant');
      setChatHistory(prev => prev.filter(item => item.prompt !== userMsg));
    } finally {
      setChatThinking(false);
    }
  };

  // Execute 1-Click AI Action
  const handleExecuteAiAction = async (insightId: string, action: string) => {
    setActionProcessing(true);

    try {
      const token = getSessionToken();
      const res = await fetch('/api/ai/operations-intelligence/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ insightId, action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      toast.success(data.message || '1-Click AI Recommendation executed!');
      await loadAiOperationsDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error executing AI action');
    } finally {
      setActionProcessing(false);
    }
  };

  // Pagination Computations
  const totalInsightsPages = Math.ceil(insights.length / INSIGHTS_PER_PAGE);
  const paginatedInsights = insights.slice((insightsPage - 1) * INSIGHTS_PER_PAGE, insightsPage * INSIGHTS_PER_PAGE);

  const totalCapabilitiesPages = Math.ceil(capabilities.length / CAPABILITIES_PER_PAGE);
  const paginatedCapabilities = capabilities.slice((capabilitiesPage - 1) * CAPABILITIES_PER_PAGE, capabilitiesPage * CAPABILITIES_PER_PAGE);

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-44 w-full bg-slate-100 dark:bg-zinc-800 rounded-3xl" />
        {/* Tabs selector Skeleton */}
        <div className="h-12 w-full max-w-lg bg-slate-100 dark:bg-zinc-850 rounded-2xl" />
        {/* Grid content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-zinc-800 rounded-3xl" />
          <div className="h-64 bg-slate-100 dark:bg-zinc-800 rounded-3xl" />
          <div className="h-64 bg-slate-100 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

      {/* Hero Header Section (Gradient & Style Aligned to CRM & Analytics) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/15 rounded-2xl border border-primary/30">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
                AI Operations Intelligence Engine
              </h1>
              <p className="text-slate-350 text-xs font-semibold mt-0.5">
                19 Active capabilities: Attendance & Expense Fraud Shields, Attrition Radar, Shift Optimizer & NL Copilot
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Operations AI KPI Card Row (Aligned to Analytics & CRM) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Model Accuracy</div>
            <div className="text-xl md:text-2xl font-black text-emerald-500">{summaryStats.modelConfidencePercent}</div>
            <div className="text-[10px] text-slate-400 font-medium">Avg precision rating</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Active Anomalies</div>
            <div className="text-xl md:text-2xl font-black text-amber-500">{summaryStats.activeAnomaliesCount} Flags</div>
            <div className="text-[10px] text-slate-400 font-medium">In review queue</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Fraud Shield Savings</div>
            <div className="text-xl md:text-2xl font-black text-emerald-500">{summaryStats.fraudSavingsTotal}</div>
            <div className="text-[10px] text-slate-400 font-medium">Loss leakage avoided</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Team Sentiment</div>
            <div className="text-xl md:text-2xl font-black text-indigo-500">{summaryStats.moraleIndexScore}</div>
            <div className="text-[10px] text-slate-400 font-medium">Positive pulse rating</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">AI Engines Active</div>
            <div className="text-xl md:text-2xl font-black text-purple-500">{summaryStats.totalCapabilities} / 19 Live</div>
            <div className="text-[10px] text-slate-400 font-medium">Capabilities online</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="insights" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShieldAlert className="h-3.5 w-3.5" /> AI Anomaly Risk Radar ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="capabilities" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Brain className="h-3.5 w-3.5" /> 19 AI Operations Engines ({capabilities.length})
            </TabsTrigger>
            <TabsTrigger value="assistant" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Bot className="h-3.5 w-3.5" /> Natural Language AI Assistant
            </TabsTrigger>
            <TabsTrigger value="digest" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Sparkles className="h-3.5 w-3.5" /> Daily Executive Summary
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AI ANOMALY & FRAUD RISK RADAR */}
        {/* ========================================================================= */}
        <TabsContent value="insights" className="space-y-6 m-0">
          {paginatedInsights.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedInsights.map(i => (
                  <Card key={i.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-2 border-b">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary/10 text-primary font-mono text-[10px]">
                            {i.category}
                          </Badge>
                          <Badge className={`border-none font-bold text-[9px] ${
                            i.riskLevel === 'High' || i.riskLevel === 'Critical' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {i.riskLevel} Risk ({i.confidenceScore}%)
                          </Badge>
                        </div>
                        <CardTitle className="text-sm font-black mt-2">{i.title}</CardTitle>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-1">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">AI Diagnostic Finding</div>
                          <div className="text-slate-700 dark:text-slate-300 font-medium">{i.description}</div>
                        </div>

                        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 space-y-1">
                          <div className="text-[10px] uppercase font-bold flex items-center gap-1"><Sparkles className="h-3 w-3" /> Recommended Corrective Action</div>
                          <div className="font-medium">{i.recommendedAction}</div>
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-4 pt-0">
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <Badge className={`border-none font-bold text-[9px] ${i.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          Status: {i.status}
                        </Badge>

                        {canApprove && i.status !== 'Resolved' && (
                          <Button
                            size="sm"
                            disabled={actionProcessing}
                            onClick={() => handleExecuteAiAction(i.id, 'resolve')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] h-7 px-3 rounded-lg flex items-center gap-1"
                          >
                            {actionProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                            1-Click AI Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Insights Pagination */}
              {totalInsightsPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Showing {(insightsPage - 1) * INSIGHTS_PER_PAGE + 1}&ndash;{Math.min(insightsPage * INSIGHTS_PER_PAGE, insights.length)} of {insights.length} anomalies
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={insightsPage <= 1}
                      onClick={() => setInsightsPage(p => Math.max(1, p - 1))}
                      className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {[...Array(totalInsightsPages)].map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={insightsPage === i + 1 ? 'default' : 'outline'}
                        onClick={() => setInsightsPage(i + 1)}
                        className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                          insightsPage === i + 1
                            ? 'bg-primary hover:bg-primary/95 text-white'
                            : 'border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={insightsPage >= totalInsightsPages}
                      onClick={() => setInsightsPage(p => Math.min(totalInsightsPages, p + 1))}
                      className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardContent className="p-12 text-center text-xs text-slate-400 font-bold">
                No active operational anomalies or risk flags reported.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: 19 AI OPERATIONS ENGINES */}
        {/* ========================================================================= */}
        <TabsContent value="capabilities" className="space-y-6 m-0">
          {paginatedCapabilities.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCapabilities.map(c => (
                  <Card key={c.name} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-500 font-mono text-[9px]">
                          {c.category}
                        </Badge>
                        <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px]">
                          {c.confidenceScore}% Precision
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-black mt-2">{c.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                      {c.description}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Capabilities Pagination */}
              {totalCapabilitiesPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Showing {(capabilitiesPage - 1) * CAPABILITIES_PER_PAGE + 1}&ndash;{Math.min(capabilitiesPage * CAPABILITIES_PER_PAGE, capabilities.length)} of {capabilities.length} capabilities
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={capabilitiesPage <= 1}
                      onClick={() => setCapabilitiesPage(p => Math.max(1, p - 1))}
                      className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {[...Array(totalCapabilitiesPages)].map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={capabilitiesPage === i + 1 ? 'default' : 'outline'}
                        onClick={() => setCapabilitiesPage(i + 1)}
                        className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                          capabilitiesPage === i + 1
                            ? 'bg-primary hover:bg-primary/95 text-white'
                            : 'border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={capabilitiesPage >= totalCapabilitiesPages}
                      onClick={() => setCapabilitiesPage(p => Math.min(totalCapabilitiesPages, p + 1))}
                      className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 font-bold">
              No active capabilities initialized.
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: NATURAL LANGUAGE AI ASSISTANT */}
        {/* ========================================================================= */}
        <TabsContent value="assistant" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> Natural Language HR Operations Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex gap-2">
                <Input
                  value={chatPrompt}
                  onChange={e => setChatPrompt(e.target.value)}
                  placeholder="Ask AI anything, e.g., 'Are there any expense fraud risks or burnout alerts today?'"
                  className="rounded-2xl text-xs h-11 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  onKeyDown={e => e.key === 'Enter' && handleSendChatPrompt()}
                />
                <Button
                  onClick={handleSendChatPrompt}
                  disabled={chatThinking || !chatPrompt.trim()}
                  className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs h-11 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  {chatThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                  Ask AI Copilot
                </Button>
              </div>

              {chatHistory.length > 0 && (
                <div className="space-y-4 pt-2">
                  {chatHistory.map((item, idx) => (
                    <div key={idx} className="space-y-3 p-5 rounded-3xl bg-slate-950 text-white border border-zinc-800 animate-fadeIn">
                      <div className="text-xs font-bold text-primary flex items-center gap-2">
                        <Sparkle className="h-4 w-4 text-primary" /> Prompt: "{item.prompt}"
                      </div>
                      <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans pt-1">
                        {item.response ? item.response : (
                          <div className="space-y-2.5 animate-pulse py-1">
                            <div className="h-3 w-5/6 bg-zinc-800 rounded" />
                            <div className="h-3 w-4/6 bg-zinc-800 rounded" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: DAILY EXECUTIVE SUMMARY */}
        {/* ========================================================================= */}
        <TabsContent value="digest" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Morning Executive Summary & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-6 rounded-3xl bg-slate-950 text-white border border-zinc-800 space-y-3">
                <div className="text-xs font-mono text-primary font-bold">
                  Daily Workforce Intelligence Briefing
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans pt-2">
                  {dailyExecutiveSummary || 'Generating operational summary...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

    </div>
  );
}
