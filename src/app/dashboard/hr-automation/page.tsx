'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Cpu, Clock, AlertCircle, Flame, CalendarDays, Gift, Award,
  FileText, Globe, ShieldCheck, GraduationCap, Hourglass, UserCheck,
  IndianRupee, ClipboardList, RefreshCw, Smile, Sparkles, LogOut,
  Users, ShieldAlert, Bot, Play, SendHorizontal, CheckCircle2,
  BarChart3, Inbox, Zap, ChevronRight, ChevronLeft, Settings, Download, Edit, Save, Filter, Check, Trash2, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const ICON_MAP: Record<string, any> = {
  Clock, AlertCircle, Flame, CalendarDays, Gift, Award, FileText, Globe,
  ShieldCheck, GraduationCap, Hourglass, UserCheck, IndianRupee,
  ClipboardList, RefreshCw, Smile, Sparkles, LogOut, Users, ShieldAlert, Bot
};

export interface AutomationRuleRecord {
  id: string;
  name: string;
  category: string;
  triggerSchedule: string;
  channel: string;
  isEnabled: boolean;
  executionCount: number;
  lastRunAt: string;
  templateBody: string;
}

export interface AutomationLogRecord {
  id: string;
  ruleCategory: string;
  recipientName: string;
  messageSent: string;
  status: string;
  createdAt: string;
}

export default function HrAutomationPage() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  // RBAC State
  const [canApprove, setCanApprove] = useState(false);
  const [userRole, setUserRole] = useState('developer');

  // Dynamic API State
  const [rules, setRules] = useState<AutomationRuleRecord[]>([]);
  const [logs, setLogs] = useState<AutomationLogRecord[]>([]);
  const [aiDailyDigest, setAiDailyDigest] = useState<string>('');
  const [summaryStats, setSummaryStats] = useState({
    totalWorkflows: 21,
    activeTriggersCount: 21,
    totalDispatchesThisMonth: 0,
    deliverySuccessRate: '100% Success',
    aiDailyDigestStatus: 'Initializing...'
  });
  const [aiMonitoring, setAiMonitoring] = useState<{
    totalAiRequests: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    cacheHitRate: string;
    totalTokensConsumed: number;
    tokensSavedByCache: number;
    avgDataQuality: number;
    errorRate: string;
    modelRouting: Record<string, number>;
  } | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Pagination State
  const [workflowPage, setWorkflowPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const WORKFLOWS_PER_PAGE = 9;
  const LOGS_PER_PAGE = 10;

  // Button Loading States
  const [clearingLogs, setClearingLogs] = useState(false);
  const [togglingRule, setTogglingRule] = useState<string | null>(null);
  const [regeneratingDigest, setRegeneratingDigest] = useState(false);

  // Configure Rule Modal State
  const [selectedRuleForEdit, setSelectedRuleForEdit] = useState<AutomationRuleRecord | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editChannel, setEditChannel] = useState('Email & Push');
  const [editSchedule, setEditSchedule] = useState('Daily at 08:00 AM');
  const [editTemplate, setEditTemplate] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // AI Copilot State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [askingCopilot, setAskingCopilot] = useState(false);

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;

    setAskingCopilot(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'chat', query: copilotQuery })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query AI copilot');
      setCopilotResponse(data.answer || data.message || 'AI response received.');
    } catch (err: any) {
      toast.error(err.message || 'Error querying AI copilot');
    } finally {
      setAskingCopilot(false);
    }
  };

  const handleOpenConfigModal = (rule: AutomationRuleRecord) => {
    setSelectedRuleForEdit(rule);
    setEditChannel(rule.channel || 'Email & Push');
    setEditSchedule(rule.triggerSchedule || 'Daily at 08:00 AM');
    setEditTemplate(rule.templateBody || '');
    setShowConfigModal(true);
  };

  const handleSaveRuleConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuleForEdit) return;

    setSavingConfig(true);
    try {
      const token = localStorage.getItem('session_token');
      const payload = {
        category: selectedRuleForEdit.category,
        isEnabled: selectedRuleForEdit.isEnabled,
        channel: editChannel,
        triggerSchedule: editSchedule.trim(),
        templateBody: editTemplate.trim()
      };

      const res = await fetch('/api/hr/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save configuration');

      toast.success(data.message || `Rule ${selectedRuleForEdit.category} updated!`);
      setShowConfigModal(false);
      setSelectedRuleForEdit(null);
      await loadAutomationDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error updating rule configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleExportLogsCsv = () => {
    if (!logs || logs.length === 0) {
      toast.error('No execution logs available to export');
      return;
    }
    const headers = ['Timestamp', 'Trigger Category', 'Recipient Target', 'Message Payload Sent', 'Status'];
    const rows = logs.map(l => [
      `"${l.createdAt}"`,
      `"${l.ruleCategory}"`,
      `"${l.recipientName}"`,
      `"${l.messageSent.replace(/"/g, '""')}"`,
      `"${l.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HR_Automation_Execution_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('HR Automation Execution Log exported as CSV!');
  };

  const handleClearLogsHistory = async () => {
    setClearingLogs(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/hr/automation', {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear execution logs');

      toast.success(data.message || 'Execution history cleared!');
      setLogsPage(1);
      await loadAutomationDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error clearing execution logs');
    } finally {
      setClearingLogs(false);
    }
  };

  // Fetch 100% Dynamic Data from Backend API
  const loadAutomationDataFromApi = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/hr/automation', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.canApprove !== undefined) setCanApprove(data.canApprove);
        if (data.userRole) setUserRole(data.userRole);
        if (data.summaryStats) setSummaryStats(data.summaryStats);
        if (data.rules) setRules(data.rules);
        if (data.logs) setLogs(data.logs);
        if (data.aiDailyDigest) setAiDailyDigest(data.aiDailyDigest);
        if (data.aiMonitoring) setAiMonitoring(data.aiMonitoring);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomationDataFromApi();
  }, []);

  // Toggle Automation Rule Enabled State
  const handleToggleRule = async (category: string, isEnabled: boolean) => {
    setTogglingRule(category);
    try {
      const token = localStorage.getItem('session_token');
      const payload = { category, isEnabled };

      const res = await fetch('/api/hr/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle trigger');

      toast.success(data.message || `Trigger ${category} updated!`);
      await loadAutomationDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error updating trigger');
    } finally {
      setTogglingRule(null);
    }
  };

  // 1-Click Test Execute Trigger
  const handleExecuteTrigger = async (category: string) => {
    setExecuting(category);

    try {
      const token = localStorage.getItem('session_token');
      const payload = { category };

      const res = await fetch('/api/hr/automation/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');

      toast.success(data.message || `Trigger ${category} executed!`);
      await loadAutomationDataFromApi();
      setActiveTab('logs');
    } catch (err: any) {
      toast.error(err.message || 'Error executing trigger');
    } finally {
      setExecuting(null);
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination Computed Values
  const totalWorkflowPages = Math.ceil(filteredRules.length / WORKFLOWS_PER_PAGE);
  const paginatedRules = filteredRules.slice((workflowPage - 1) * WORKFLOWS_PER_PAGE, workflowPage * WORKFLOWS_PER_PAGE);
  const totalLogPages = Math.ceil(logs.length / LOGS_PER_PAGE);
  const paginatedLogs = logs.slice((logsPage - 1) * LOGS_PER_PAGE, logsPage * LOGS_PER_PAGE);

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-36 w-full bg-slate-100 dark:bg-zinc-800 rounded-3xl" />
        
        {/* KPI Stats Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="h-20 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-20 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-20 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-20 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
          <div className="h-20 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex items-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-48 rounded-xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 animate-pulse space-y-4">
              <div className="flex justify-between">
                <div className="h-5 w-28 rounded-full bg-slate-200 dark:bg-zinc-800" />
                <div className="h-5 w-10 rounded-full bg-slate-200 dark:bg-zinc-800" />
              </div>
              <div className="h-5 w-48 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              <div className="h-20 rounded-2xl bg-slate-100 dark:bg-zinc-800/50" />
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
                <div className="h-7 w-24 rounded-lg bg-slate-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

      {/* Hero Header Section (Gradient & Style Aligned to AI Copilot) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/15 rounded-2xl border border-primary/30">
              <Cpu className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
                Enterprise HR Automation Engine
              </h1>
              <p className="text-slate-355 text-xs font-semibold mt-0.5">
                21 Automated Triggers: Attendance, Missing Punch, Expiries, Birthdays, Anniversaries, Escalations & AI Daily Digest
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Operations AI KPI Card Row (Moved Below Hero and Aligned to AI Copilot) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Active Workflows</div>
            <div className="text-xl md:text-2xl font-black text-indigo-500">{summaryStats.activeTriggersCount} / {summaryStats.totalWorkflows}</div>
            <div className="text-[10px] text-slate-400 font-medium">All Triggers Running</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Dispatches / Mo</div>
            <div className="text-xl md:text-2xl font-black text-emerald-500">{summaryStats.totalDispatchesThisMonth}</div>
            <div className="text-[10px] text-slate-400 font-medium">Automated Sent</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Delivery Rate</div>
            <div className="text-xl md:text-2xl font-black text-cyan-500">{summaryStats.deliverySuccessRate}</div>
            <div className="text-[10px] text-slate-400 font-medium">Zero Drops</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">AI Daily Digest</div>
            <div className="text-xl md:text-2xl font-black text-amber-500">Live Active</div>
            <div className="text-[10px] text-slate-400 font-medium">Executive sync active</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <CardContent className="p-4 space-y-1 text-xs font-semibold">
            <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Auto Escalations</div>
            <div className="text-xl md:text-2xl font-black text-purple-500">24h SLA Rule</div>
            <div className="text-[10px] text-slate-400 font-medium">L1 to L2 escalations</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="workflows" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Cpu className="h-3.5 w-3.5" /> 21 Automated Workflows ({rules.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <ClipboardList className="h-3.5 w-3.5" /> Execution Logs & History ({logs.length})
            </TabsTrigger>
            <TabsTrigger value="digest" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Bot className="h-3.5 w-3.5" /> AI Daily Digest Copilot
            </TabsTrigger>
          </TabsList>

          <Input
            placeholder="Search automation category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-56 h-9 text-xs rounded-xl"
          />
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: 21 AUTOMATED WORKFLOWS */}
        {/* ========================================================================= */}
        <TabsContent value="workflows" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedRules.map(r => (
              <Card key={r.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/10 text-primary font-mono text-[10px] border-none">
                      {r.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {togglingRule === r.category && (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                      )}
                      <Switch
                        checked={r.isEnabled}
                        disabled={!canApprove || togglingRule === r.category}
                        onCheckedChange={v => handleToggleRule(r.category, v)}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-sm font-black mt-2">{r.name}</CardTitle>
                </CardHeader>

                <CardContent className="pb-4 space-y-3 text-xs font-semibold">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Template & Channels</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{r.templateBody}</div>
                    <div className="text-[10px] text-primary font-mono font-bold pt-1 flex items-center gap-1">
                      <SendHorizontal className="h-3 w-3 text-primary" /> {r.channel} • {r.triggerSchedule}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">Dispatches: {r.executionCount}</span>
                    <div className="flex items-center gap-1.5">
                      {canApprove && (
                        <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handleOpenConfigModal(r)}
                           className="font-extrabold text-[10px] h-7 px-2.5 rounded-lg flex items-center gap-1 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        >
                           <Settings className="h-3 w-3 text-primary" /> Configure
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={executing === r.category}
                        onClick={() => handleExecuteTrigger(r.category)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] h-7 px-3 rounded-lg flex items-center gap-1"
                      >
                        {executing === r.category ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        {executing === r.category ? 'Running...' : 'Run Now'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Workflow Pagination */}
          {totalWorkflowPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Showing {(workflowPage - 1) * WORKFLOWS_PER_PAGE + 1}–{Math.min(workflowPage * WORKFLOWS_PER_PAGE, filteredRules.length)} of {filteredRules.length} workflows
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={workflowPage <= 1}
                  onClick={() => setWorkflowPage(p => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(totalWorkflowPages)].map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={workflowPage === i + 1 ? 'default' : 'outline'}
                    onClick={() => setWorkflowPage(i + 1)}
                    className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                      workflowPage === i + 1
                        ? 'bg-primary hover:bg-primary/95 text-white border-none'
                        : 'border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={workflowPage >= totalWorkflowPages}
                  onClick={() => setWorkflowPage(p => Math.min(totalWorkflowPages, p + 1))}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
      </TabsContent>

      {/* ========================================================================= */}
      {/* TAB 2: EXECUTION LOGS & HISTORY */}
      {/* ========================================================================= */}
      <TabsContent value="logs" className="space-y-6 m-0">
        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-primary" /> Real-time Automation Execution History
            </CardTitle>
            <div className="flex items-center gap-2">
              {canApprove && logs.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={clearingLogs}
                  onClick={handleClearLogsHistory}
                  className="rounded-xl text-xs font-bold h-8 px-3 flex items-center gap-1.5 border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  {clearingLogs ? <Loader2 className="h-3.5 w-3.5 text-rose-500 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                  {clearingLogs ? 'Clearing...' : 'Clear History'}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportLogsCsv}
                className="rounded-xl text-xs font-bold h-8 px-3 flex items-center gap-1.5 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                  <Download className="h-3.5 w-3.5 text-primary" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {logs.length > 0 ? (
                <>
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                        <th className="p-4 px-6">Timestamp</th>
                        <th className="p-4">Trigger Category</th>
                        <th className="p-4">Recipient Target</th>
                        <th className="p-4">Message Payload Sent</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {paginatedLogs.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="p-4 px-6 font-mono text-slate-400 text-[11px]">
                            {l.createdAt.slice(0, 19).replace('T', ' ')}
                          </td>
                          <td className="p-4">
                            <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px]">
                              {l.ruleCategory}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-900 dark:text-slate-100 font-bold">
                            {l.recipientName}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 font-medium max-w-xs truncate">
                            {l.messageSent}
                          </td>
                          <td className="p-4">
                            <Badge className={`border-none font-bold text-[9px] ${l.status === 'Failed' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                              {l.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Logs Pagination */}
                  {totalLogPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        Showing {(logsPage - 1) * LOGS_PER_PAGE + 1}–{Math.min(logsPage * LOGS_PER_PAGE, logs.length)} of {logs.length} records
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={logsPage <= 1}
                          onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {[...Array(Math.min(totalLogPages, 5))].map((_, i) => {
                          const pageNum = totalLogPages <= 5
                            ? i + 1
                            : logsPage <= 3
                              ? i + 1
                              : logsPage >= totalLogPages - 2
                                ? totalLogPages - 4 + i
                                : logsPage - 2 + i;
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={logsPage === pageNum ? 'default' : 'outline'}
                              onClick={() => setLogsPage(pageNum)}
                              className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                                logsPage === pageNum
                                  ? 'bg-primary hover:bg-primary/95 text-white border-none'
                                  : 'border-slate-200 dark:border-zinc-800'
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={logsPage >= totalLogPages}
                          onClick={() => setLogsPage(p => Math.min(totalLogPages, p + 1))}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No automation log records yet</div>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    Click <strong>"Run Now"</strong> on any workflow trigger card to execute real-time database evaluation and generate live dispatch records.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('workflows')}
                    className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs h-8 px-4 rounded-xl mt-2 border-none"
                  >
                    View Automated Workflows
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: AI DAILY DIGEST COPILOT */}
        {/* ========================================================================= */}
        <TabsContent value="digest" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" /> AI Executive Morning Workforce Digest
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-6 rounded-3xl bg-slate-950 text-white border border-zinc-800 space-y-3">
                <div className="text-xs font-mono text-primary font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Live AI Morning Briefing</span>
                  <Button
                    size="sm"
                    disabled={regeneratingDigest || executing === 'AI-generated Daily Digest'}
                    onClick={async () => {
                      setRegeneratingDigest(true);
                      await handleExecuteTrigger('AI-generated Daily Digest');
                      setRegeneratingDigest(false);
                    }}
                    className="bg-primary hover:bg-primary/95 text-white font-extrabold text-[10px] h-7 px-3 rounded-lg flex items-center gap-1 border-none"
                  >
                    {regeneratingDigest ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    {regeneratingDigest ? 'Regenerating...' : 'Regenerate Digest'}
                  </Button>
                </div>

                <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans pt-2">
                  {aiDailyDigest ? (
                    aiDailyDigest
                  ) : (
                    <div className="space-y-2.5 animate-pulse">
                      <div className="h-3 w-full bg-zinc-800 rounded" />
                      <div className="h-3 w-5/6 bg-zinc-800 rounded" />
                      <div className="h-3 w-4/5 bg-zinc-800 rounded" />
                      <div className="h-3 w-3/4 bg-zinc-800 rounded" />
                      <div className="h-3 w-2/3 bg-zinc-800 rounded" />
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive AI Workforce Copilot Prompt Box */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <Sparkles className="h-4 w-4 text-primary" /> Ask AI Workforce Copilot
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono border-slate-300 dark:border-zinc-700">
                    LLM Engine Active
                  </Badge>
                </div>

                <form onSubmit={handleAskCopilot} className="flex gap-2">
                  <Input
                    value={copilotQuery}
                    onChange={e => setCopilotQuery(e.target.value)}
                    placeholder="e.g. Summarize today's check-in metrics or check skill gaps..."
                    className="rounded-xl text-xs h-10 font-medium"
                  />
                  <Button
                    type="submit"
                    disabled={askingCopilot || !copilotQuery.trim()}
                    className="bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold h-10 px-4 flex items-center gap-1.5 shrink-0 border-none"
                  >
                    {askingCopilot ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <SendHorizontal className="h-3.5 w-3.5" />}
                    Ask AI
                  </Button>
                </form>

                {copilotResponse && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs font-medium space-y-2 animate-fadeIn">
                    <div className="text-[10px] text-primary uppercase font-bold tracking-wider">AI Copilot Response</div>
                    <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {copilotResponse}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* AI REAL-TIME PERFORMANCE MONITORING DASHBOARD */}
          {/* ========================================================================= */}
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> AI Engine Performance Monitoring
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time inference latency, token economy, cache efficiency, and data quality metrics (24-hour window)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {aiMonitoring ? (
                <>
                  {/* Performance Metrics Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total AI Requests</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{aiMonitoring.totalAiRequests}</div>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">24h Window</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Latency</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{aiMonitoring.avgLatencyMs}<span className="text-xs font-bold text-slate-400 ml-0.5">ms</span></div>
                      <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">p95: {aiMonitoring.p95LatencyMs}ms</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cache Hit Rate</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{aiMonitoring.cacheHitRate}</div>
                      <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{aiMonitoring.tokensSavedByCache.toLocaleString()} tokens saved</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Error Rate</div>
                      <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{aiMonitoring.errorRate}</div>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Target: &lt;1%</div>
                    </div>
                  </div>

                  {/* Token Economy & Data Quality Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Token Economy */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                      <div className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-primary" /> Token Economy
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Total Consumed</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">{aiMonitoring.totalTokensConsumed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Saved by Cache</span>
                        <span className="text-xs font-black text-emerald-600">{aiMonitoring.tokensSavedByCache.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Est. Cost Saved</span>
                        <span className="text-xs font-black text-emerald-600">${(aiMonitoring.tokensSavedByCache * 0.00000005).toFixed(4)}</span>
                      </div>
                    </div>

                    {/* Data Quality */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                      <div className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Data Quality Score
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{aiMonitoring.avgDataQuality}<span className="text-sm font-bold text-slate-400">/100</span></div>
                        <Badge className={`text-[9px] font-bold ${aiMonitoring.avgDataQuality >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : aiMonitoring.avgDataQuality >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                          {aiMonitoring.avgDataQuality >= 80 ? 'Healthy' : aiMonitoring.avgDataQuality >= 60 ? 'Fair' : 'Needs Improvement'}
                        </Badge>
                      </div>
                      <Progress
                        value={aiMonitoring.avgDataQuality}
                        className="h-2 rounded-full"
                      />
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Measures completeness of telemetry fields sent to AI model
                      </div>
                    </div>
                  </div>

                  {/* Model Routing Distribution */}
                  {aiMonitoring.modelRouting && Object.keys(aiMonitoring.modelRouting).length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
                      <div className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-primary" /> Model Routing Distribution
                      </div>
                      <div className="space-y-2">
                        {Object.entries(aiMonitoring.modelRouting).map(([model, count]) => (
                          <div key={model} className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">{model}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${Math.min(100, (count / Math.max(1, aiMonitoring.totalAiRequests)) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-black text-slate-900 dark:text-white w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 mx-auto text-slate-300 dark:text-zinc-600 animate-spin" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Loading AI performance telemetry...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Configure Rule Dialog Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-primary" /> Configure Rule: {selectedRuleForEdit?.category}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Customize notification channels, trigger execution schedule, and template message payload.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRuleConfig} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notification Channels</label>
              <Select value={editChannel} onValueChange={setEditChannel}>
                <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="In-App & Email">In-App & Email Notification</SelectItem>
                  <SelectItem value="WhatsApp & In-App">WhatsApp & In-App Alert</SelectItem>
                  <SelectItem value="Email Only">Email Only</SelectItem>
                  <SelectItem value="In-App Only">In-App Only</SelectItem>
                  <SelectItem value="SMS Urgent & Email">SMS Urgent & Email</SelectItem>
                  <SelectItem value="WhatsApp (Production Ready)">WhatsApp (Production Ready)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Trigger Schedule (Cron / Event)</label>
              <Input
                value={editSchedule}
                onChange={e => setEditSchedule(e.target.value)}
                placeholder="e.g. Daily at 08:00 AM, Mon-Fri at 09:00 AM"
                className="rounded-xl text-xs font-semibold h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Template Message Payload</label>
              <Textarea
                rows={3}
                value={editTemplate}
                onChange={e => setEditTemplate(e.target.value)}
                placeholder="Message template text sent to recipients..."
                className="rounded-2xl text-xs font-medium resize-none"
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfigModal(false)}
                className="rounded-xl text-xs font-bold h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingConfig}
                className="bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold h-9 px-4 flex items-center gap-1.5 border-none"
              >
                {savingConfig ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
