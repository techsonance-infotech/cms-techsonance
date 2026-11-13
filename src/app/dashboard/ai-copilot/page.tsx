'use client';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Bot, Brain, Sparkles, ShieldAlert, CheckCircle2,
  RefreshCw, SendHorizontal, Clock, User, FileText, DollarSign, Shield,
  Zap, ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkle, BookOpen, TrendingUp,
  Copy, Check, Plus, Sliders, Lock, Compass, FileSpreadsheet, Terminal, Play, History
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

  // Synchronize activeTab with URL query parameters reactively using searchParams hook
  const searchParams = useSearchParams();
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['insights', 'capabilities', 'assistant', 'digest', 'prompts', 'usage'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // AI Prompt Library templates interface
  interface PromptTemplate {
    id: string;
    name: string;
    category: string;
    templateText: string;
    version: string;
    placeholders: string[];
    tags: string[];
    approvalStatus: 'Approved' | 'In Review' | 'Draft';
    roleRequired: string;
    language: string;
  }

  const DEFAULT_PROMPTS: PromptTemplate[] = [
    {
      id: 'pr-1',
      name: 'Workforce Performance Review Reviewer',
      category: 'HR',
      templateText: 'Draft a comprehensive and professional employee evaluation report for {employeeName} in the {departmentName} department based on the achievements list: {achievementsText}. Focus on constructive growth recommendations.',
      version: 'v2.1',
      placeholders: ['employeeName', 'departmentName', 'achievementsText'],
      tags: ['Reviews', 'Performance', 'Evaluation'],
      approvalStatus: 'Approved',
      roleRequired: 'Manager',
      language: 'English'
    },
    {
      id: 'pr-2',
      name: 'Candidate Interview Assessor',
      category: 'Recruitment',
      templateText: 'Write a set of 5 target technical interview questions evaluating candidate {candidateName} for the {jobTitle} role. Core requirements: {requiredSkills}. Focus on situational and behavioral scoring criteria.',
      version: 'v1.4',
      placeholders: ['candidateName', 'jobTitle', 'requiredSkills'],
      tags: ['Hiring', 'Interviews', 'Assessments'],
      approvalStatus: 'Approved',
      roleRequired: 'Employee',
      language: 'English'
    },
    {
      id: 'pr-3',
      name: 'CRM Inquiries Converter & Responder',
      category: 'CRM',
      templateText: 'Write a warm, highly-professional business proposal response email to contact {contactName} at company {companyName} regarding inquiry details: {inquiryDetails}. Include a clear invitation to book a roadmap alignment call.',
      version: 'v2.0',
      placeholders: ['contactName', 'companyName', 'inquiryDetails'],
      tags: ['Sales', 'Convert', 'Inquiries'],
      approvalStatus: 'Approved',
      roleRequired: 'Employee',
      language: 'English'
    },
    {
      id: 'pr-4',
      name: 'Financial Ledger Anomaly Inspector',
      category: 'Finance',
      templateText: 'Scan the ledger list for transaction patterns highlighting possible anomalies: {ledgerTransactions}. Group suspicious entries by department and recommend corrective audit procedures.',
      version: 'v1.0',
      placeholders: ['ledgerTransactions'],
      tags: ['Audit', 'Anomalies', 'Finance'],
      approvalStatus: 'Approved',
      roleRequired: 'Admin',
      language: 'English'
    },
    {
      id: 'pr-5',
      name: 'Project Timeline Milestones Planner',
      category: 'Projects',
      templateText: 'Generate a project timeline sprint schedule breakdown for project {projectName} spanning {durationWeeks} weeks. Key deliverables to incorporate: {deliverablesList}. Conform to Agile methodology.',
      version: 'v1.2',
      placeholders: ['projectName', 'durationWeeks', 'deliverablesList'],
      tags: ['Planning', 'Sprints', 'Milestones'],
      approvalStatus: 'Approved',
      roleRequired: 'Manager',
      language: 'English'
    },
    {
      id: 'pr-6',
      name: 'Multi-lingual Onboarding Checklist Creator',
      category: 'HR',
      templateText: 'Generate a personalized new-hire onboarding checklists summary in language {languageName} for {employeeName} joining as {jobRole}. Outline direct links to policies and first-week setup instructions.',
      version: 'v1.1',
      placeholders: ['employeeName', 'jobRole', 'languageName'],
      tags: ['Onboarding', 'Checklists', 'Multilingual'],
      approvalStatus: 'Approved',
      roleRequired: 'Employee',
      language: 'Spanish'
    },
    {
      id: 'pr-7',
      name: 'Client Billing Dispute Response Drafter',
      category: 'Finance',
      templateText: 'Draft a polite and legally compliant dispute resolution response to client {clientName} regarding invoice number {invoiceNumber} and disputed value {disputedAmount}. Explain our escalation paths.',
      version: 'v1.5',
      placeholders: ['clientName', 'invoiceNumber', 'disputedAmount'],
      tags: ['Billing', 'Invoicing', 'Dispute'],
      approvalStatus: 'Approved',
      roleRequired: 'Admin',
      language: 'English'
    },
    {
      id: 'pr-8',
      name: 'HR Anniversaries Campaign Composer',
      category: 'Marketing',
      templateText: 'Draft an engaging email campaign script celebrating {employeeName}\'s {yearsCount}-year career anniversary at our firm. Use warm branding tone: {brandTone}.',
      version: 'v1.0',
      placeholders: ['employeeName', 'yearsCount', 'brandTone'],
      tags: ['Internal', 'Anniversaries', 'Engagement'],
      approvalStatus: 'Approved',
      roleRequired: 'Employee',
      language: 'English'
    },
    {
      id: 'pr-9',
      name: 'Customer Support Escalations Helper',
      category: 'Customer Support',
      templateText: 'Compose a recovery template response for client {clientName} regarding product complaint: {complaintMessage}. Assure 2h SLA and suggest compensatory token value {compensationValue}.',
      version: 'v2.3',
      placeholders: ['clientName', 'complaintMessage', 'compensationValue'],
      tags: ['Support', 'Resolutions', 'ClientCare'],
      approvalStatus: 'Approved',
      roleRequired: 'Employee',
      language: 'English'
    }
  ];

  // AI Prompt Library State
  const [promptsList, setPromptsList] = useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [promptSearch, setPromptSearch] = useState('');
  const [promptCategoryFilter, setPromptCategoryFilter] = useState('all');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [favoritePrompts, setFavoritePrompts] = useState<string[]>([]);

  const toggleFavoritePrompt = (id: string) => {
    setFavoritePrompts(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    toast.success('Prompt favorite status updated');
  };

  // Export Prompts as JSON File
  const handleExportPrompts = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(promptsList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "techsonance_prompt_templates.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Prompt templates exported successfully');
  };

  // Import Prompts from JSON File
  const handleImportPrompts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            setPromptsList(prev => [...parsed, ...prev]);
            toast.success(`${parsed.length} Prompt templates imported successfully!`);
          } else {
            toast.error('Invalid file format. Must be a JSON array of prompt templates.');
          }
        } catch (err) {
          toast.error('Failed to parse prompt templates file.');
        }
      };
    }
  };

  // Testing prompt state
  const [testingPrompt, setTestingPrompt] = useState<PromptTemplate | null>(null);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState('');
  const [testingInProcess, setTestingInProcess] = useState(false);

  // Creation of prompt state
  const [showCreatePromptModal, setShowCreatePromptModal] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('HR');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptRole, setNewPromptRole] = useState('Employee');
  const [newPromptLanguage, setNewPromptLanguage] = useState('English');

  // AI Usage Analytics Telemetry State
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [logsCurrentPage, setLogsCurrentPage] = useState(1);
  const logsItemsPerPage = 5;

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

  const fetchUsageAnalyticsData = async () => {
    try {
      setMonitoringLoading(true);
      const token = getSessionToken();
      const res = await fetch('/api/ai/monitoring?window=1440', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.monitoring) {
          setMonitoringData(data.monitoring);
        }
      }
    } catch (err) {
      console.error('Failed to load AI monitoring data:', err);
    } finally {
      setMonitoringLoading(false);
    }
  };

  useEffect(() => {
    loadAiOperationsDataFromApi();
  }, []);

  useEffect(() => {
    if (activeTab === 'usage') {
      fetchUsageAnalyticsData();
    }
  }, [activeTab]);

  // Copy Prompt to Clipboard
  const handleCopyPromptText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    toast.success('Prompt template copied to clipboard');
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  // Run Prompt in AI Assistant Tab
  const handleRunInAssistant = (text: string) => {
    setChatPrompt(text);
    setActiveTab('assistant');
    toast.success('Prompt pre-populated inside Assistant chat. Customize values and execute!');
  };

  // Setup prompt variables testing
  const handleOpenTestingModal = (prompt: PromptTemplate) => {
    setTestingPrompt(prompt);
    const initialVars: Record<string, string> = {};
    prompt.placeholders.forEach(p => {
      initialVars[p] = '';
    });
    setTestVariables(initialVars);
    setTestResult('');
    setTestingInProcess(false);
  };

  // Run Test Query
  const handleExecutePromptTest = async () => {
    if (!testingPrompt) return;
    setTestingInProcess(true);
    setTestResult('');

    // Pre-populate placeholders in the string template
    let interpolatedPrompt = testingPrompt.templateText;
    testingPrompt.placeholders.forEach(p => {
      const val = testVariables[p] || `{${p}}`;
      interpolatedPrompt = interpolatedPrompt.replace(new RegExp(`\\{${p}\\}`, 'g'), val);
    });

    try {
      const token = getSessionToken();
      // Send directly to operations-intelligence or copilot prompt runner
      const res = await fetch('/api/ai/operations-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt: interpolatedPrompt })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate test execution');
      setTestResult(data.response || 'Execution completed with empty output.');
    } catch (err: any) {
      toast.error(err.message || 'Error executing prompt test');
    } finally {
      setTestingInProcess(false);
    }
  };

  // Create Prompt
  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptName.trim() || !newPromptText.trim()) {
      toast.error('Prompt Name and Template Text are required.');
      return;
    }

    // Extract placeholders matching {variable} pattern
    const regex = /\{([^}]+)\}/g;
    const placeholders: string[] = [];
    let match;
    while ((match = regex.exec(newPromptText)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }

    const created: PromptTemplate = {
      id: `pr-custom-${Date.now()}`,
      name: newPromptName.trim(),
      category: newPromptCategory,
      templateText: newPromptText.trim(),
      version: 'v1.0',
      placeholders,
      tags: ['Custom', newPromptCategory],
      approvalStatus: 'Approved',
      roleRequired: newPromptRole,
      language: newPromptLanguage
    };

    setPromptsList(prev => [created, ...prev]);
    toast.success('Prompt Template registered successfully inside active library!');
    setShowCreatePromptModal(false);

    // Reset fields
    setNewPromptName('');
    setNewPromptCategory('HR');
    setNewPromptText('');
    setNewPromptRole('Employee');
    setNewPromptLanguage('English');
  };

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
    // Action confirmation for critical operation
    const proceed = window.confirm(`Are you sure you want to execute this AI recommended action (${action})? This will modify live enterprise records.`);
    if (!proceed) return;

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
            <TabsTrigger value="prompts" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <BookOpen className="h-3.5 w-3.5" /> AI Prompt Library
            </TabsTrigger>
            <TabsTrigger value="usage" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="h-3.5 w-3.5" /> AI Usage Analytics
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
        <TabsContent value="assistant" className="space-y-6 m-0 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-black flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" /> Active Copilot Session Chat
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-500 font-semibold gap-1">
                    <Sliders className="h-3 w-3" /> Model: Llama 3.3 (Complex Context)
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Chat Suggestions Grid */}
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Suggested Prompts & Actions</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() => handleRunInAssistant('Check for overtime timesheet leakages in the last billing cycle')}
                        className="text-left p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-primary transition-all flex items-center justify-between"
                      >
                        <span>Scan Overtime Leakage Anomalies</span>
                        <ChevronRight className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => handleRunInAssistant('Predict resignation attrition probability for employees with zero promotions')}
                        className="text-left p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-primary transition-all flex items-center justify-between"
                      >
                        <span>Run Attrition Risk Forecast</span>
                        <ChevronRight className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => handleRunInAssistant('Verify if statutory rest gap between consecutive shifts is respected in active schedule')}
                        className="text-left p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-primary transition-all flex items-center justify-between"
                      >
                        <span>Audit Schedule Rest Gaps Compliance</span>
                        <ChevronRight className="h-3.5 w-3.5 text-primary" />
                      </button>
                      <button
                        onClick={() => handleRunInAssistant('Extract duplicate expense claims and biometric fraud signatures')}
                        className="text-left p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:border-primary transition-all flex items-center justify-between"
                      >
                        <span>Audit Expense Fraud Signature Logs</span>
                        <ChevronRight className="h-3.5 w-3.5 text-primary" />
                      </button>
                    </div>
                  </div>

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

                  {chatHistory.length > 0 ? (
                    <div className="space-y-4 pt-2">
                      {chatHistory.map((item, idx) => (
                        <div key={idx} className="space-y-3 p-5 rounded-3xl bg-slate-950 text-white border border-zinc-800 animate-fadeIn">
                          <div className="text-xs font-bold text-primary flex items-center gap-2">
                            <Sparkle className="h-4 w-4 text-primary" /> Prompt: "{item.prompt}"
                          </div>
                          <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans pt-1">
                            {item.response ? item.response : (
                              <div className="space-y-2.5 animate-pulse py-1">
                                <div className="h-3 w-5/6 bg-zinc-850 rounded" />
                                <div className="h-3 w-4/6 bg-zinc-850 rounded" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed rounded-3xl text-slate-400 font-bold text-xs">
                      No active messages in session. Type a custom request or click a prompt recommendation suggestion above to start.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Context panel */}
            <div className="space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-xs font-extrabold uppercase text-slate-400">Contextual Telemetry</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">Tenant Scope ID</span>
                    <span className="font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] text-slate-700 dark:text-slate-300">
                      cms-tenant-isolated-production
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">Authorized Role</span>
                    <span className="font-mono bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded text-[10px]">
                      {userRole || 'Corporate Operator'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">Safety Policies</span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Active RLS Filters Enforced
                    </span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-400 block font-bold">Quick Diagnostics</span>
                    <span className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed block font-medium">
                      Operational Assistant handles queries using fine-tuned HR models and pre-computed database RAG contexts for secure, policy-compliant response layouts.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: DAILY EXECUTIVE SUMMARY */}
        {/* ========================================================================= */}
        <TabsContent value="digest" className="space-y-6 m-0 animate-fadeIn">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-black flex items-center gap-2">
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

        {/* ========================================================================= */}
        {/* TAB 5: AI PROMPT LIBRARY */}
        {/* ========================================================================= */}
        <TabsContent value="prompts" className="space-y-6 m-0 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2.5">
              <Input
                placeholder="Search prompt templates..."
                value={promptSearch}
                onChange={e => setPromptSearch(e.target.value)}
                className="w-56 h-9 text-xs rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
              <select
                value={promptCategoryFilter}
                onChange={e => setPromptCategoryFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="HR">HR & Personnel</option>
                <option value="Recruitment">Recruitment</option>
                <option value="CRM">CRM & Inquiries</option>
                <option value="Finance">Finance & Audit</option>
                <option value="Projects">Projects Management</option>
                <option value="Marketing">Marketing</option>
                <option value="Customer Support">Customer Support</option>
                <option value="favorites">★ Favorites Only</option>
              </select>

              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-zinc-800 pl-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportPrompts}
                  className="h-9 text-xs font-bold rounded-xl border-slate-200 dark:border-zinc-800 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-zinc-850"
                >
                  Export Templates
                </Button>
                <label className="h-9 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-zinc-850 px-3 cursor-pointer bg-card border-dashed">
                  <span>Import Templates</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportPrompts}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <Button
              onClick={() => setShowCreatePromptModal(true)}
              className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 border-none"
            >
              <Plus className="h-4 w-4" /> Create Prompt Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promptsList
              .filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(promptSearch.toLowerCase()) || p.templateText.toLowerCase().includes(promptSearch.toLowerCase());
                
                if (promptCategoryFilter === 'favorites') {
                  return matchesSearch && favoritePrompts.includes(p.id);
                }
                const matchesCat = promptCategoryFilter === 'all' || p.category === promptCategoryFilter;
                return matchesSearch && matchesCat;
              })
              .map(p => {
                const isFav = favoritePrompts.includes(p.id);
                return (
                  <Card key={p.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                    <CardHeader className="pb-2 border-b">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-primary/10 text-primary font-mono text-[9px] border-none">
                          {p.category}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleFavoritePrompt(p.id)}
                            className="text-slate-400 hover:text-amber-500 transition-colors p-0.5"
                          >
                            <span className="text-sm font-bold">{isFav ? '★' : '☆'}</span>
                          </button>
                          <Badge variant="outline" className="text-[9px] font-mono text-slate-400 font-medium">
                            {p.version} • {p.language}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-sm font-black mt-2 leading-snug">{p.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-4 text-xs font-semibold flex-1">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 font-medium text-slate-600 dark:text-slate-300 leading-relaxed min-h-[90px]">
                        {p.templateText}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Dynamic Placeholders</span>
                        <div className="flex flex-wrap gap-1">
                          {p.placeholders.length > 0 ? p.placeholders.map(ph => (
                            <span key={ph} className="font-mono bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded text-[9px]">
                              {ph}
                            </span>
                          )) : (
                            <span className="text-[10px] text-slate-400 font-medium">No variables required</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.tags.map(t => (
                          <span key={t} className="text-[9px] text-slate-400 bg-slate-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </CardContent>

                  <CardFooter className="pt-3 pb-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] text-slate-400 font-bold border-slate-200">
                      Role: {p.roleRequired}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyPromptText(p.id, p.templateText)}
                        className="h-7 px-2 text-[10px] font-extrabold rounded-lg border-slate-200 dark:border-zinc-800 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      >
                        {copiedPromptId === p.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-slate-400" />}
                        {copiedPromptId === p.id ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenTestingModal(p)}
                        className="h-7 px-2.5 text-[10px] font-extrabold rounded-lg border-slate-200 dark:border-zinc-800 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      >
                        <Sliders className="h-3 w-3 text-primary" /> Test
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRunInAssistant(p.templateText)}
                        className="bg-primary hover:bg-primary/95 text-white font-extrabold text-[10px] h-7 px-2.5 rounded-lg flex items-center gap-1 border-none shadow-sm shadow-primary/10"
                      >
                        <Bot className="h-3.5 w-3.5" /> Run
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 6: AI USAGE ANALYTICS */}
        {/* ========================================================================= */}
        <TabsContent value="usage" className="space-y-6 m-0 animate-fadeIn">
          {monitoringLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 rounded-3xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
                <div className="h-96 rounded-3xl bg-slate-100 dark:bg-zinc-800 animate-pulse" />
              </div>
            </div>
          ) : monitoringData ? (
            <div className="space-y-6">
              {/* Telemetry Stats Rows */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  <CardContent className="p-4 space-y-1 text-xs font-semibold">
                    <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Total AI Queries</div>
                    <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                      {monitoringData.performance?.totalRequests || 0} Calls
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">In the past 24h</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  <CardContent className="p-4 space-y-1 text-xs font-semibold">
                    <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Success Rate</div>
                    <div className="text-xl md:text-2xl font-black text-emerald-500">
                      {monitoringData.performance?.successRate || '100%'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Zero dispatch drops</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  <CardContent className="p-4 space-y-1 text-xs font-semibold">
                    <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Average Latency</div>
                    <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                      {monitoringData.performance?.avgLatencyMs || 0} ms
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Groq API response delay</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  <CardContent className="p-4 space-y-1 text-xs font-semibold">
                    <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Total Tokens</div>
                    <div className="text-xl md:text-2xl font-black text-indigo-500">
                      {(monitoringData.tokens?.totalConsumed || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">In/Out Tokens Used</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                  <CardContent className="p-4 space-y-1 text-xs font-semibold">
                    <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Cache Savings</div>
                    <div className="text-xl md:text-2xl font-black text-emerald-500">
                      {monitoringData.cache?.hitRate || '0%'} Hit
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">{monitoringData.tokens?.estimatedCostSaved} saved</div>
                  </CardContent>
                </Card>
              </div>

              {/* Grid Logs & Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Live Inference Event Logs Feed */}
                <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md lg:col-span-3">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                      <Terminal className="h-4.5 w-4.5 text-primary" /> Live AI Inference Event Logs
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px] font-mono border-slate-200 text-slate-400 font-bold gap-1">
                      <History className="h-3 w-3" /> Live Feed
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-4 p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-semibold">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-900/30">
                            <th className="py-2.5 px-4 font-extrabold">Time</th>
                            <th className="py-2.5 px-4 font-extrabold">Prompt Template</th>
                            <th className="py-2.5 px-4 font-extrabold">Inference Model</th>
                            <th className="py-2.5 px-4 font-extrabold">Latency</th>
                            <th className="py-2.5 px-4 font-extrabold">Tokens</th>
                            <th className="py-2.5 px-4 font-extrabold">Cache</th>
                            <th className="py-2.5 px-4 font-extrabold">Quality</th>
                            <th className="py-2.5 px-4 font-extrabold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const totalEvents = monitoringData.recentEvents || [];
                            const paginatedEvents = totalEvents.slice(
                              (logsCurrentPage - 1) * logsItemsPerPage,
                              logsCurrentPage * logsItemsPerPage
                            );
                            if (paginatedEvents.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                                    No live log history found.
                                  </td>
                                </tr>
                              );
                            }
                            return paginatedEvents.map((e: any, idx: number) => (
                              <tr key={e.requestId || idx} className="border-b border-slate-100 dark:border-zinc-800/80 last:border-none hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                                <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                                  {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </td>
                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-bold text-[11px]">{e.template || 'Custom Prompt'}</td>
                                <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{e.model}</td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">{e.latencyMs}ms</td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">{e.tokens}</td>
                                <td className="py-3 px-4">
                                  <Badge className={`border-none font-bold text-[9px] px-1.5 py-0.5 ${e.cached ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>
                                    {e.cached ? 'HIT' : 'MISS'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`font-black ${e.dataQuality >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{e.dataQuality}%</span>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge className={`border-none font-bold text-[9px] px-1.5 py-0.5 ${e.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                    {e.success ? 'OK' : 'FAIL'}
                                  </Badge>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>

                  {/* Pagination Controls Footer */}
                  {(() => {
                    const totalEvents = monitoringData.recentEvents || [];
                    const totalLogsPages = Math.ceil(totalEvents.length / logsItemsPerPage) || 1;
                    if (totalEvents.length <= logsItemsPerPage) return null;
                    return (
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 px-4 py-3 bg-slate-50/50 dark:bg-zinc-900/10 rounded-b-3xl">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Showing {Math.min(totalEvents.length, (logsCurrentPage - 1) * logsItemsPerPage + 1)} - {Math.min(totalEvents.length, logsCurrentPage * logsItemsPerPage)} of {totalEvents.length} Logs
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogsCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={logsCurrentPage === 1}
                            className="h-7 px-2 text-[10px] font-extrabold rounded-lg border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" /> Prev
                          </Button>
                          <span className="text-[10px] font-black px-2 text-slate-500 dark:text-slate-400">
                            Page {logsCurrentPage} of {totalLogsPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogsCurrentPage(prev => Math.min(totalLogsPages, prev + 1))}
                            disabled={logsCurrentPage === totalLogsPages}
                            className="h-7 px-2 text-[10px] font-extrabold rounded-lg border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                          >
                            Next <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </Card>

                {/* Model & Registry stats */}
                <div className="space-y-6">
                  {/* Model Distribution card */}
                  <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                    <CardHeader className="pb-2 border-b">
                      <CardTitle className="text-xs font-extrabold uppercase text-slate-400">Model Routing</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4 text-xs font-semibold">
                      {Object.entries(monitoringData.modelRouting || {}).map(([model, count]: [string, any]) => (
                        <div key={model} className="space-y-1.5">
                          <div className="flex justify-between font-mono text-[10px]">
                            <span className="text-slate-500">{model}</span>
                            <span className="text-slate-700 dark:text-slate-300 font-black">{count} requests</span>
                          </div>
                          <Progress value={Math.min(100, Math.max(5, (count / (monitoringData.performance?.totalRequests || 1)) * 100))} className="h-1.5 bg-slate-100 dark:bg-zinc-800" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Data Quality card */}
                  <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                    <CardContent className="p-5 space-y-3 text-xs font-semibold">
                      <div className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold">Data Stream Quality</div>
                      <div className="text-2xl font-black text-emerald-500">
                        {monitoringData.dataQuality?.avgScore || 0}% Score
                      </div>
                      <div className="text-[10px] text-emerald-500/80 bg-emerald-500/5 px-2.5 py-1 rounded-xl border border-emerald-500/10 inline-block">
                        Status: {monitoringData.dataQuality?.status}
                      </div>
                      <div className="text-[10px] text-slate-400 pt-1 leading-relaxed font-medium">
                        Tracks compliance to strict context schemas and verifies zero corrupted or missing database tokens.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardContent className="p-12 text-center text-xs text-slate-400 font-bold">
                No active performance telemetry log data available.
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>

      {/* ========================================================================= */}
      {/* MODAL 1: TEST PROMPT TEMPLATE */}
      {/* ========================================================================= */}
      {testingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button
              onClick={() => setTestingPrompt(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                <Sliders className="h-4.5 w-4.5 text-primary" /> Test Prompt Template
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Supply placeholder values below to execute a live test run against Groq AI.</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-2xl border text-xs font-medium text-slate-500 max-h-[100px] overflow-y-auto leading-relaxed">
              {testingPrompt.templateText}
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {testingPrompt.placeholders.map(v => (
                <div key={v} className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{v}</label>
                  <Input
                    value={testVariables[v] || ''}
                    onChange={e => setTestVariables(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={`Enter value for {${v}}`}
                    className="bg-accent border-border text-xs rounded-xl h-9"
                  />
                </div>
              ))}
            </div>

            {testResult && (
              <div className="space-y-1.5 animate-in slideInFromTop duration-200">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block">AI Test Output</span>
                <div className="p-3.5 bg-slate-950 text-slate-350 border border-zinc-800 rounded-2xl text-[11px] leading-relaxed font-sans max-h-[140px] overflow-y-auto">
                  {testResult}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="ghost" onClick={() => setTestingPrompt(null)} className="text-xs font-bold hover:bg-accent rounded-xl px-4 h-9">
                Close
              </Button>
              <Button
                onClick={handleExecutePromptTest}
                disabled={testingInProcess || testingPrompt.placeholders.some(p => !testVariables[p])}
                className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl px-4 border-none h-9 flex items-center gap-1.5 shadow-md shadow-primary/10"
              >
                {testingInProcess ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {testingInProcess ? 'Executing...' : 'Run Test'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE PROMPT TEMPLATE */}
      {/* ========================================================================= */}
      {showCreatePromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-lg bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowCreatePromptModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5 text-primary" /> Create Reusable Prompt Template
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Define structured prompt instructions using placeholder variables matching standard format &apos;&#123;variable&#125;&apos;.</p>
            </div>

            <form onSubmit={handleCreatePrompt} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Template Title</label>
                  <Input
                    required
                    value={newPromptName}
                    onChange={e => setNewPromptName(e.target.value)}
                    placeholder="Candidate Evaluator"
                    className="bg-accent border-border text-xs rounded-xl h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Category Scope</label>
                  <select
                    value={newPromptCategory}
                    onChange={e => setNewPromptCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-accent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="HR">HR & Personnel</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="CRM">CRM & Inquiries</option>
                    <option value="Finance">Finance & Audit</option>
                    <option value="Projects">Projects Management</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Customer Support">Customer Support</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Template Text (with `{`variable`}` placeholders)</label>
                <textarea
                  required
                  rows={4}
                  value={newPromptText}
                  onChange={e => setNewPromptText(e.target.value)}
                  placeholder="Draft employee evaluation details for {employeeName} matching achievement specs: {achievements}."
                  className="w-full p-3 rounded-xl border border-border bg-accent text-xs font-semibold focus:outline-none leading-relaxed text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">RBAC Access Limit</label>
                  <select
                    value={newPromptRole}
                    onChange={e => setNewPromptRole(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-accent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="Employee">Employee (All Staff)</option>
                    <option value="Manager">Manager & Lead</option>
                    <option value="Admin">Admin Only</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Language Scope</label>
                  <select
                    value={newPromptLanguage}
                    onChange={e => setNewPromptLanguage(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-accent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Hindi">Hindi</option>
                    <option value="German">German</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowCreatePromptModal(false)} className="text-xs font-bold hover:bg-accent rounded-xl px-4 h-9">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-xl px-4 border-none h-9 shadow-md shadow-primary/10"
                >
                  Register Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
