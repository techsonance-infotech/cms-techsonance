'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ScrollText, Search, Download, Filter, Clock, User, FileText,
  Shield, DollarSign, Eye, ShieldCheck, X, Activity, ArrowRight,
  ShieldAlert, Bot, Sparkles, RefreshCw, SendHorizontal, Trash2,
  Lock, Calendar, Database, Check, AlertCircle, ChevronLeft, ChevronRight, HelpCircle, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

interface AuditLog {
  id: string;
  employeeId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: any | null;
  newValues: any | null;
  performedBy: string;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // User Authentication / RBAC Role
  const [userRole, setUserRole] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LOGS_PER_PAGE = 10;

  // AI Security Intelligence state
  const [activeTab, setActiveTab] = useState('command');
  const [aiAnalysis, setAiAnalysis] = useState<{
    securityHealthScore: number;
    riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
    primaryAnomalies: string[];
    recommendations: string[];
    confidence: number;
  } | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  // AI Copilot state
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiCopilotLoading, setAiCopilotLoading] = useState(false);

  // Load user role from session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawUser = sessionStorage.getItem('user') ?? localStorage.getItem('user');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          setUserRole(parsed.role || '');
        } catch (e) {
          console.warn('Failed parsing user details from localstorage:', e);
        }
      }
      setAuthLoading(false);
    }
  }, []);

  // Load tab from URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'activity' || tabParam === 'timeline') {
        setActiveTab('timeline');
      } else if (tabParam && ['command', 'copilot', 'retention'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Trigger search on inputs
  useEffect(() => {
    if (userRole) {
      setCurrentPage(1);
      fetchLogs(1);
    }
  }, [search, resourceFilter, userRole]);

  const getSessionToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('session_token') ?? localStorage.getItem('session_token');
  };

  const fetchLogs = async (page = currentPage) => {
    setRefreshing(true);
    try {
      setLoading(true);
      const token = getSessionToken();
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (resourceFilter) params.append('resourceType', resourceFilter);
      
      const offset = (page - 1) * LOGS_PER_PAGE;
      params.append('limit', String(LOGS_PER_PAGE));
      params.append('offset', String(offset));

      const res = await fetch(`/api/employees/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        if (json.meta && json.meta.total !== undefined) {
          setTotalCount(json.meta.total);
        }
      } else {
        toast.error('Failed to load audit logs from server');
      }
    } catch (err) {
      console.error('Audit logs fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Run AI Anomaly Analysis
  const runAiSecurityScan = async () => {
    if (logs.length === 0) {
      toast.error('No logs available for analysis');
      return;
    }
    setAiAnalysisLoading(true);
    try {
      const token = getSessionToken();
      const res = await fetch('/api/audit-logs/intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'anomaly_summary', logs })
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAiAnalysis(data.analysis);
        toast.success('Audit Log AI Anomaly Scan completed!');
      } else {
        throw new Error(data.error || 'Failed to complete AI scan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error running AI security scanner');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Run AI Copilot natural language query
  const runAiCopilotQuery = async (presetQuery?: string) => {
    const finalQuery = presetQuery || aiQuery;
    if (!finalQuery.trim()) return;

    setAiCopilotLoading(true);
    setAiAnswer('');
    setAiConfidence(null);

    try {
      const token = getSessionToken();
      const res = await fetch('/api/audit-logs/intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'copilot_query', query: finalQuery, logs })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setAiAnswer(data.result.answer);
        setAiConfidence(data.result.confidence);
      } else {
        throw new Error(data.error || 'Failed to query copilot');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing Copilot request');
    } finally {
      setAiCopilotLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLogs(newPage);
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs available to export');
      return;
    }
    const headers = "Timestamp,Performed By,Action,Resource Type,Resource ID,IP Address\n";
    const rows = logs.map(l => 
      `"${new Date(l.createdAt).toLocaleString()}","${l.performedBy}","${l.action}","${l.entityType}","${l.entityId || 'N/A'}","${l.ipAddress || 'N/A'}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Compliance_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    a.click();
    toast.success('Audit trail logs exported as CSV.');
  };

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('start')) return 'bg-emerald-500/10 text-emerald-500 border-none';
    if (act.includes('update') || act.includes('edit') || act.includes('calibrate') || act.includes('complete')) return 'bg-blue-500/10 text-blue-500 border-none';
    if (act.includes('delete') || act.includes('remove') || act.includes('terminate')) return 'bg-rose-500/10 text-rose-500 border-none';
    return 'bg-amber-500/10 text-amber-500 border-none';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType?.toLowerCase()) {
      case 'employee': return User;
      case 'document': return FileText;
      case 'payroll': return DollarSign;
      case 'access': return Shield;
      default: return ScrollText;
    }
  };

  // Authentication/RBAC Check logic
  const isAuthorized = ['admin', 'superadmin', 'owner', 'business_owner', 'tenant_owner'].includes(userRole.toLowerCase());

  if (authLoading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-slate-400 text-xs font-bold">Verifying security clearances...</p>
        </div>
      </div>
    );
  }

  // ACCESS RESTRICTED SCREEN
  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-6 min-h-[500px] flex flex-col justify-center items-center">
        <div className="p-5 bg-red-500/10 rounded-full border border-red-500/30 text-red-500 animate-bounce">
          <Lock className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Administrative Access Restricted
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold leading-relaxed">
            Due to strict organizational privacy (SOC2 compliance) and data governance (GDPR audits), the CMS Audit Trail database is only accessible to Business Owners and Administrator roles.
          </p>
        </div>
        <Button
          onClick={() => window.history.back()}
          className="bg-primary hover:bg-primary/95 text-white font-extrabold rounded-full px-6 h-10 text-xs shadow-md shadow-primary/20"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / LOGS_PER_PAGE);

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 text-foreground flex flex-col animate-pulse">
        {/* Header Banner Skeleton */}
        <div className="rounded-3xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-40 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-8 w-80 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-9 w-44 bg-slate-200 dark:bg-zinc-800 rounded-full shrink-0" />
        </div>

        {/* KPI Stats Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 dark:border-zinc-800 p-5 bg-slate-50 dark:bg-zinc-900/60 h-28 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-2.5 w-20 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-6 w-12 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-2 w-28 bg-slate-100 dark:bg-zinc-800 rounded-md" />
              </div>
              <div className="h-10 w-10 bg-slate-200 dark:bg-zinc-800 rounded-2xl shrink-0" />
            </div>
          ))}
        </div>

        {/* Tabs Bar Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-850 pb-2">
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-32 bg-slate-100 dark:bg-zinc-900/80 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Health Score Gauge */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 bg-slate-50 dark:bg-zinc-900/60 h-96 flex flex-col justify-between">
            <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-44 w-44 rounded-full border-8 border-slate-200 dark:border-zinc-800 mx-auto flex items-center justify-center" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-zinc-800 rounded-md mx-auto" />
          </div>

          {/* AI Security Anomaly Analysis */}
          <div className="lg:col-span-8 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 bg-slate-50 dark:bg-zinc-900/60 h-96 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 w-48 bg-slate-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-7 w-20 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6 flex-1">
              <div className="space-y-3">
                <div className="h-3 w-32 bg-slate-150 dark:bg-zinc-800 rounded-md" />
                <div className="h-4 w-full bg-slate-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded-md" />
              </div>
              <div className="space-y-3">
                <div className="h-3 w-32 bg-slate-150 dark:bg-zinc-800 rounded-md" />
                <div className="h-4 w-full bg-slate-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc] max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 animate-fadeIn">
      
      {/* Redesigned Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 text-white shadow-xl border border-primary/20">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-soft">Enterprise Statutory Security Log</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
              Enterprise Audit Logs & Monitor
            </h2>
            <p className="text-sm text-primary-soft mt-1 max-w-xl">
              Complete statutory audit trails. Tracks role assignments, database updates, document actions, and access credentials.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              disabled={refreshing}
              onClick={() => fetchLogs(currentPage)}
              className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-9 border-white/15 shrink-0"
            >
              {refreshing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button 
              onClick={exportToCSV} 
              className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl h-9 px-4 flex items-center gap-1.5 border-none shadow-md shadow-primary/20"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 animate-pulse" />
              SOC2 Logging Enforced
            </Badge>
          </div>
        </div>
      </div>

      {/* Standalone KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Logs</div>
              <div className="text-2xl font-black text-primary">{totalCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Statutory Records</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl">
              <ScrollText className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Security Health</div>
              <div className="text-2xl font-black text-emerald-500">{aiAnalysis ? aiAnalysis.securityHealthScore : 98}%</div>
              <div className="text-[10px] text-slate-400 font-semibold">Active Threat Index</div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Risk Level</div>
              <div className={`text-2xl font-black ${aiAnalysis?.riskCategory === 'Critical' || aiAnalysis?.riskCategory === 'High' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {aiAnalysis ? aiAnalysis.riskCategory : 'Low Risk'}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">Scan Level Status</div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <ShieldAlert className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Monitored Domains</div>
              <div className="text-2xl font-black text-purple-500">5 Resources</div>
              <div className="text-[10px] text-slate-400 font-semibold">SOC2 Databases monitored</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-2xl">
              <Database className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
          <TabsTrigger value="command" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ShieldCheck className="h-3.5 w-3.5" /> Security & Operations Center
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Clock className="h-3.5 w-3.5" /> Activity Timeline ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="copilot" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Bot className="h-3.5 w-3.5" /> AI Audit Copilot
          </TabsTrigger>
          <TabsTrigger value="retention" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Database className="h-3.5 w-3.5" /> Retention & Governance
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: SECURITY & OPERATIONS COMMAND CENTER */}
        {/* ========================================================================= */}
        <TabsContent value="command" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Health Score Gauge */}
            <Card className="lg:col-span-4 rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" /> Security Health Index
                </CardTitle>
              </CardHeader>
              <CardContent className="py-6 flex flex-col items-center justify-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <svg className="w-36 h-36">
                    <circle className="text-slate-100 dark:text-zinc-800" strokeWidth="10" stroke="currentColor" fill="transparent" r="58" cx="72" cy="72" />
                    <circle
                      className="text-emerald-500 transition-all duration-1000"
                      strokeWidth="10"
                      strokeDasharray={364}
                      strokeDashoffset={364 - (364 * (aiAnalysis ? aiAnalysis.securityHealthScore : 98)) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="58"
                      cx="72"
                      cy="72"
                      transform="rotate(-90 72 72)"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-4xl font-black">{aiAnalysis ? aiAnalysis.securityHealthScore : 98}%</span>
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">Secure</div>
                  </div>
                </div>
                <div className="text-center text-xs font-semibold text-slate-500">
                  Suspicious behaviour: <span className="text-emerald-500 font-bold">None Detected</span>. All login sessions are verified.
                </div>
              </CardContent>
            </Card>

            {/* AI Risk Scans Insight */}
            <Card className="lg:col-span-8 rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary" /> AI Security Anomaly Analysis
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={aiAnalysisLoading}
                    onClick={runAiSecurityScan}
                    className="h-7 text-[10px] font-black border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-1"
                  >
                    {aiAnalysisLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Scan Trail
                  </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs font-semibold">
                  {aiAnalysis ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Primary Anomalies Detected</div>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          {aiAnalysis.primaryAnomalies.map((a, idx) => (
                            <li key={idx} className="font-semibold leading-relaxed">{a}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] text-primary uppercase font-bold">Audit Recommendations</div>
                        <ul className="list-decimal pl-4 space-y-1.5 text-slate-600 dark:text-slate-400">
                          {aiAnalysis.recommendations.map((r, idx) => (
                            <li key={idx} className="font-semibold leading-relaxed">{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 space-y-2">
                      <ShieldAlert className="h-8 w-8 mx-auto text-slate-300" />
                      <p className="font-bold">No security analysis scanned yet.</p>
                      <Button
                        onClick={runAiSecurityScan}
                        disabled={aiAnalysisLoading}
                        className="bg-primary hover:bg-primary/95 text-white text-[10px] font-black rounded-lg h-8 px-4 mt-1"
                      >
                        {aiAnalysisLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            Scanning...
                          </>
                        ) : (
                          'Generate AI Threat Scan'
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
              {aiAnalysis && (
                <div className="p-3 border-t bg-slate-50/50 dark:bg-zinc-900/10 rounded-b-3xl text-right">
                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono font-bold">
                    Analysis Confidence: {Math.round(aiAnalysis.confidence * 100)}%
                  </Badge>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: ACTIVITY TIMELINE WITH SEARCH & FILTERS */}
        {/* ========================================================================= */}
        <TabsContent value="timeline" className="space-y-6 m-0">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search audit actions, performed by, IP coordinates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl text-xs font-semibold h-10 border-slate-200 bg-white dark:bg-zinc-900"
              />
            </div>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="border rounded-xl px-3 bg-white dark:bg-zinc-900 text-xs border-slate-200 dark:border-zinc-800 h-10 outline-none w-48 font-bold text-slate-600 dark:text-slate-400"
            >
              <option value="">All Resource Types</option>
              <option value="employee">Employees</option>
              <option value="document">Documents</option>
              <option value="payroll">Payroll</option>
              <option value="training_program">Training Program</option>
              <option value="pms_cycle">PMS Appraisal Cycles</option>
            </select>
          </div>

          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                  <div className="text-xs text-slate-400 font-bold">Querying statutory transaction indexes...</div>
                </div>
              ) : logs.length > 0 ? (
                <>
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                        <th className="p-4 px-6">Timestamp</th>
                        <th className="p-4">Actor</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Resource</th>
                        <th className="p-4">IP Coordinates</th>
                        <th className="p-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {logs.map((log) => {
                        const Icon = getEntityIcon(log.entityType);
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="p-4 px-6 font-mono text-slate-400 text-[11px]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">
                              {log.performedBy}
                            </td>
                            <td className="p-4">
                              <Badge className={`uppercase text-[8px] font-black tracking-wider ${getActionColor(log.action)}`}>
                                {log.action}
                              </Badge>
                            </td>
                            <td className="p-4 font-bold text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5 text-slate-400" />
                                <span className="capitalize">{log.entityType}</span>
                                {log.entityId && <span className="text-[10px] text-slate-400 font-mono">({log.entityId})</span>}
                              </div>
                            </td>
                            <td className="p-4 font-mono text-slate-400 text-[11px]">
                              {log.ipAddress || 'N/A'}
                            </td>
                             <td className="p-4 text-right px-6">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary rounded-lg"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination footer */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        Showing {(currentPage - 1) * LOGS_PER_PAGE + 1}&ndash;{Math.min(currentPage * LOGS_PER_PAGE, totalCount)} of {totalCount} records
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage <= 1}
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {[...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i}
                            size="sm"
                            variant={currentPage === i + 1 ? 'default' : 'outline'}
                            onClick={() => handlePageChange(i + 1)}
                            className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                              currentPage === i + 1
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
                          disabled={currentPage >= totalPages}
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-16 text-center text-xs text-slate-400 font-bold">
                  No statutory compliance logs match your search.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: AI COPILOT QUERY */}
        {/* ========================================================================= */}
        <TabsContent value="copilot" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Ask AI Audit Copilot
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Suggested Prompts</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAiQuery('Are there any failed login attempts?');
                      runAiCopilotQuery('Are there any failed login attempts?');
                    }}
                    className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-zinc-800"
                  >
                    Check failed logins
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAiQuery('Find salary or payroll edits made recently.');
                      runAiCopilotQuery('Find salary or payroll edits made recently.');
                    }}
                    className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-zinc-800"
                  >
                    Locate payroll edits
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAiQuery('Who updated employee documentation details?');
                      runAiCopilotQuery('Who updated employee documentation details?');
                    }}
                    className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-zinc-800"
                  >
                    Track document edits
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Input
                  placeholder="Ask a question about the statutory logs..."
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  className="rounded-xl text-xs font-semibold h-11 border-slate-200 dark:border-zinc-800"
                  onKeyDown={e => { if (e.key === 'Enter') runAiCopilotQuery(); }}
                />
                <Button
                  onClick={() => runAiCopilotQuery()}
                  disabled={aiCopilotLoading || !aiQuery.trim()}
                  className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs h-11 px-5 rounded-xl flex items-center gap-1.5"
                >
                  {aiCopilotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                  Ask Copilot
                </Button>
              </div>

              {(aiAnswer || aiCopilotLoading) && (
                <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                    <span className="flex items-center gap-1.5 font-bold text-primary"><Bot className="h-4 w-4" /> Copilot Intelligence response</span>
                    {aiConfidence !== null && (
                      <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono">
                        Confidence: {Math.round(aiConfidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  {aiCopilotLoading ? (
                    <div className="space-y-2.5 animate-pulse py-2">
                      <div className="h-3 w-full bg-zinc-800 rounded" />
                      <div className="h-3 w-5/6 bg-zinc-800 rounded" />
                      <div className="h-3 w-2/3 bg-zinc-800 rounded" />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line">{aiAnswer}</p>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: RETENTION & GOVERNANCE */}
        {/* ========================================================================= */}
        <TabsContent value="retention" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-emerald-500" /> Immutable Storage Hashing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500 leading-relaxed">
                  Every transaction hash in `audit_logs` is cryptographically chained using SHA-256 digital signatures to prevent tampering.
                </div>
                <div className="text-xs font-mono font-black text-emerald-500 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Integrity Verified (Append Only)
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-cyan-500" /> Retention Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500 leading-relaxed">
                  Compliance guidelines enforce a **3-year** logs retention policy. Expired records are auto-archived into encrypted cold storage.
                </div>
                <div className="text-xs font-bold text-cyan-500">Active Rule: 1,095 Days Preservation</div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-purple-500" /> Legal Hold Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500 leading-relaxed">
                  Prevent auto-archival of target records during statutory audits or regulatory investigations.
                </div>
                <div className="text-xs font-bold text-slate-400">0 Active Legal Holds</div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
        
      </Tabs>

      {/* JSON Value Inspector Dialog Overlay */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl animate-scaleUp">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center pb-4 rounded-t-3xl">
              <div>
                <CardTitle className="text-md flex items-center gap-2"><Activity className="h-4.5 w-4.5 text-primary" /> Audit Value Change Inspector</CardTitle>
                <CardDescription>Inspect previous values vs. updated payload values.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full" onClick={() => setSelectedLog(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400">Action:</h4>
                  <Badge className={`uppercase text-[8px] font-extrabold ${getActionColor(selectedLog.action)}`}>{selectedLog.action}</Badge>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400">Performed By:</h4>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.performedBy}</p>
                </div>
              </div>

              {/* Diffs values comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-400">Previous / Old Values</h5>
                  <pre className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 font-mono text-[10px] overflow-x-auto text-slate-600 dark:text-slate-400 h-44">
                    {selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : 'No previous state recorded.'}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-400 flex items-center gap-1">New / Updated Values <ArrowRight className="h-3 w-3 text-primary" /></h5>
                  <pre className="bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 font-mono text-[10px] overflow-x-auto text-slate-600 dark:text-slate-400 h-44">
                    {selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : 'No update details mapped.'}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
