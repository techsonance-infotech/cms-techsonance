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
  HelpCircle, MessageSquare, Sparkles, Clock, ShieldAlert, CheckCircle2,
  Plus, Search, Filter, Check, XCircle, RefreshCw, SendHorizontal, Star,
  FileText, BookOpen, Award, ShieldCheck, Layers, Users, PhoneCall,
  FileCheck, AlertCircle, Inbox, ChevronRight, BarChart3, IndianRupee,
  Bot, CornerDownRight, ThumbsUp, Eye, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken, getStoredUser } from '@/lib/client-session';

const HR_CASE_CATEGORIES = [
  'Payroll & Benefits',
  'Policy Inquiry',
  'Grievance & Legal',
  'IT & Workplace',
  'Performance Review',
  'Leave & Attendance'
];

interface KbItem {
  articleNumber: string;
  category: string;
  title: string;
  content: string;
  isFaq: boolean;
  viewCount: number;
  helpfulCount: number;
}

interface EscalationTier {
  level: number;
  tier: string;
  slaHours: number;
  targetRole: string;
  autoEscalateAfter: string;
}

interface RosterEmp {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

interface HrTicketRecord {
  id: string;
  userId: string;
  employeeName: string;
  employeeEmail: string;
  ticketNumber: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedToName: string;
  slaHours: number;
  escalationLevel: number;
  resolutionNotes: string;
  internalNotes: string;
  csatRating: number | null;
  csatFeedback: string;
  aiSuggestedAnswer: string;
  dueDate: string;
  resolvedAt: string | null;
  createdAt: string;
}

export default function HrServiceDeskPage() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);

  // RBAC State
  const [canApprove, setCanApprove] = useState(false);
  const [isSuperAdminOrAdmin, setIsSuperAdminOrAdmin] = useState(false);
  const [userRole, setUserRole] = useState('employee');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentEmployee, setCurrentEmployee] = useState<RosterEmp | null>(null);

  // Dynamic API State
  const [roster, setRoster] = useState<RosterEmp[]>([]);
  const [kbArticles, setKbArticles] = useState<KbItem[]>([]);
  const [escalationMatrix, setEscalationMatrix] = useState<EscalationTier[]>([]);
  const [tickets, setTickets] = useState<HrTicketRecord[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalTickets: 0,
    openCount: 0,
    resolvedCount: 0,
    escalatedCount: 0,
    avgCsatRating: '4.8 / 5.0 Rating',
    slaCompliancePercent: '98.5%',
    avgFirstResponseTime: '14 mins'
  });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  // New Case Modal State
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Payroll & Benefits');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [formTouched, setFormTouched] = useState({ subject: false, description: false });

  // Ticket Detail & Interactive Chat/Notes Modal
  const [selectedTicket, setSelectedTicket] = useState<HrTicketRecord | null>(null);
  const [newInternalNote, setNewInternalNote] = useState('');
  const [newResolutionNotes, setNewResolutionNotes] = useState('');
  const [userCsatRating, setUserCsatRating] = useState<number>(5);
  const [userCsatFeedback, setUserCsatFeedback] = useState('');

  // AI Assistant Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  // Fetch 100% Dynamic Data from Backend API
  const loadServiceDeskDataFromApi = async () => {
    try {
      const token = getStoredSessionToken() || localStorage.getItem('session_token');
      const res = await fetch('/api/hr/service-desk', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.canApprove !== undefined) setCanApprove(data.canApprove);
        if (data.isSuperAdminOrAdmin !== undefined) setIsSuperAdminOrAdmin(data.isSuperAdminOrAdmin);
        if (data.userRole) setUserRole(data.userRole);
        if (data.currentEmployee) setCurrentEmployee(data.currentEmployee);
        if (data.kbArticles) setKbArticles(data.kbArticles);
        if (data.escalationMatrix) setEscalationMatrix(data.escalationMatrix);
        if (data.employeeRoster) {
          setRoster(data.employeeRoster);
          const defaultEmpId = data.currentUserId || (data.currentEmployee?.id) || (data.employeeRoster.length > 0 ? data.employeeRoster[0].id : '');
          if (defaultEmpId) {
            setSelectedUserId(String(defaultEmpId));
          }
        }
        if (data.summaryStats) setSummaryStats(data.summaryStats);
        if (data.tickets) setTickets(data.tickets);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
      const roleStr = (stored.role || '').toLowerCase();
      const isAdminOrSuper = ['superadmin', 'super_admin', 'admin', 'hr_manager', 'owner', 'tenant_owner'].includes(roleStr);
      setIsSuperAdminOrAdmin(isAdminOrSuper);
    }
    loadServiceDeskDataFromApi();
  }, []);

  // Submit New HR Case with Field-Level Validation
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched({ subject: true, description: true });

    const effectiveUserId = isSuperAdminOrAdmin ? selectedUserId : (currentEmployee?.id || selectedUserId);
    if (!effectiveUserId) {
      toast.error('Employee applicant is required');
      return;
    }

    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (trimmedSubject.length < 5) {
      toast.error('Subject must be at least 5 characters');
      return;
    }

    if (trimmedDescription.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    setSubmitting(true);

    try {
      const token = getStoredSessionToken() || localStorage.getItem('session_token');
      const payload = {
        userId: effectiveUserId,
        category: selectedCategory,
        subject: trimmedSubject,
        description: trimmedDescription,
        priority
      };

      const res = await fetch('/api/hr/service-desk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Failed to submit HR case');

      toast.success(resData.message || 'HR Case logged successfully!');
      setShowNewCaseModal(false);
      setSubject('');
      setDescription('');
      setFormTouched({ subject: false, description: false });
      await loadServiceDeskDataFromApi();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error submitting HR case');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Ticket Action (Resolve, Escalate, Internal Note, CSAT)
  const handleTicketAction = async (action: 'resolve' | 'escalate' | 'internal_note' | 'csat_feedback') => {
    if (!selectedTicket && selectedTicketIds.length === 0) {
      toast.error('No ticket selected');
      return;
    }

    const targetIds = selectedTicket ? [selectedTicket.id] : selectedTicketIds;
    setActionProcessing(true);

    try {
      const token = getStoredSessionToken() || localStorage.getItem('session_token');
      const payload = {
        ticketIds: targetIds,
        action,
        resolutionNotes: newResolutionNotes.trim(),
        internalNotes: newInternalNote.trim(),
        csatRating: userCsatRating,
        csatFeedback: userCsatFeedback.trim()
      };

      const res = await fetch('/api/hr/service-desk/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      toast.success(data.message || `Action ${action} completed!`);
      setSelectedTicket(null);
      setSelectedTicketIds([]);
      setNewInternalNote('');
      setNewResolutionNotes('');
      await loadServiceDeskDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error executing action');
    } finally {
      setActionProcessing(false);
    }
  };

  // AI Copilot Query Simulation
  const handleAskAiCopilot = () => {
    if (!aiPrompt.trim()) return;
    setAiThinking(true);

    setTimeout(() => {
      const matched = kbArticles.find(kb =>
        aiPrompt.toLowerCase().includes(kb.category.toLowerCase()) ||
        kb.title.toLowerCase().includes(aiPrompt.toLowerCase())
      );

      if (matched) {
        setAiResponse(`AI HR Copilot Recommendation (${matched.articleNumber}):\n\n${matched.content}\n\n*Reference Policy: ${matched.title}*`);
      } else {
        setAiResponse(`AI HR Copilot Recommendation:\n\nFor queries regarding "${aiPrompt}", our standard HR SLA is 24 hours. A ticket has been automatically categorized for your HR Business Partner.`);
      }
      setAiThinking(false);
    }, 800);
  };

  const toggleSelectTicket = (id: string) => {
    if (selectedTicketIds.includes(id)) {
      setSelectedTicketIds(selectedTicketIds.filter(x => x !== id));
    } else {
      setSelectedTicketIds([...selectedTicketIds, id]);
    }
  };

  const toggleSelectAllTickets = () => {
    if (selectedTicketIds.length === tickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(tickets.map(t => t.id));
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesEmployee = employeeFilter === 'all' || String(t.userId) === String(employeeFilter);
    const matchesSearch = t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesEmployee && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto p-6 animate-pulse">
        <div className="h-32 w-full bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        <div className="h-14 w-full bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="col-span-4 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0f172a] to-zinc-950 p-6 md:p-8 border border-zinc-800 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#f87941]/10 blur-3xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#f87941]/15 rounded-2xl border border-[#f87941]/30">
                <HelpCircle className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                    Enterprise HR Service Desk
                  </h1>
                  <Badge className="bg-[#f87941]/20 text-[#f87941] border border-[#f87941]/40 font-bold text-[10px]">
                    {isSuperAdminOrAdmin ? 'Super Admin / HR Desk' : (canApprove ? 'HR Manager Desk' : 'Employee Service Desk')}
                  </Badge>
                </div>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  Ticket Case Management, 3-Tier Escalation Matrix, AI HR Copilot, Knowledge Base & CSAT Ratings
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar - Only visible to Admins & HR Managers; hidden for employees */}
          {(isSuperAdminOrAdmin || canApprove) && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total HR Cases</div>
                <div className="text-xl font-black text-white mt-0.5">{summaryStats.totalTickets}</div>
                <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" /> API Connected
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Open Tickets</div>
                <div className="text-xl font-black text-amber-400 mt-0.5">{summaryStats.openCount}</div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">In Queue</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">CSAT Score</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{summaryStats.avgCsatRating}</div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">Satisfaction Index</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">SLA Compliance</div>
                <div className="text-xl font-black text-cyan-400 mt-0.5">{summaryStats.slaCompliancePercent}</div>
                <div className="text-[10px] text-cyan-400/80 mt-0.5">Target Met</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">First Response</div>
                <div className="text-xl font-black text-purple-400 mt-0.5">{summaryStats.avgFirstResponseTime}</div>
                <div className="text-[10px] text-purple-400/80 mt-0.5">Turnaround</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="tickets" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <HelpCircle className="h-3.5 w-3.5" /> HR Cases Queue ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="copilot" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Bot className="h-3.5 w-3.5" /> AI HR Copilot & Assistant
            </TabsTrigger>
            <TabsTrigger value="kb" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <BookOpen className="h-3.5 w-3.5" /> Knowledge Base & FAQs ({kbArticles.length})
            </TabsTrigger>
            <TabsTrigger value="escalation" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <ShieldAlert className="h-3.5 w-3.5" /> Escalation Matrix & SLA Rules
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => {
              if (!isSuperAdminOrAdmin && currentEmployee?.id) {
                setSelectedUserId(currentEmployee.id);
              } else if (isSuperAdminOrAdmin && !selectedUserId && roster.length > 0) {
                setSelectedUserId(currentEmployee?.id || roster[0]?.id);
              }
              setFormTouched({ subject: false, description: false });
              setShowNewCaseModal(true);
            }}
            className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#f87941]/20"
          >
            <Plus className="h-3.5 w-3.5" /> Raise New HR Case
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: HR CASES QUEUE & TICKET MANAGEMENT */}
        {/* ========================================================================= */}
        <TabsContent value="tickets" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-[#f87941]" /> HR Service Tickets & Resolution Queue
                </CardTitle>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40 h-9 text-xs rounded-xl border-slate-200 dark:border-zinc-800">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Categories</SelectItem>
                      {HR_CASE_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {isSuperAdminOrAdmin && (
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                      <SelectTrigger className="w-44 h-9 text-xs rounded-xl border-slate-200 dark:border-zinc-800">
                        <SelectValue placeholder="All Employees" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60">
                        <SelectItem value="all">All Employees ({roster.length})</SelectItem>
                        {roster.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Input
                    placeholder="Search case #, subject..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-44 h-9 text-xs rounded-xl"
                  />

                  {canApprove && (
                    <Button
                      size="sm"
                      disabled={selectedTicketIds.length === 0 || actionProcessing}
                      onClick={() => handleTicketAction('resolve')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-9 px-3 rounded-xl flex items-center gap-1"
                    >
                      Bulk Resolve ({selectedTicketIds.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {filteredTickets.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                      {canApprove && (
                        <th className="p-4 px-6 w-10">
                          <Checkbox checked={selectedTicketIds.length === tickets.length && tickets.length > 0} onCheckedChange={toggleSelectAllTickets} />
                        </th>
                      )}
                      <th className="p-4">Case # & {isSuperAdminOrAdmin ? 'Employee' : 'Submitted Date'}</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Escalation Tier</th>
                      <th className="p-4">CSAT Rating</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {filteredTickets.map(t => {
                      const isSelected = selectedTicketIds.includes(t.id);
                      return (
                        <tr key={t.id} className={`transition-all ${isSelected ? 'bg-[#f87941]/5' : 'hover:bg-slate-50/70 dark:hover:bg-zinc-900/30'}`}>
                          {canApprove && (
                            <td className="p-4 px-6">
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectTicket(t.id)} />
                            </td>
                          )}

                          <td className="p-4">
                            <div className="font-extrabold text-[#f87941] font-mono text-xs">{t.ticketNumber}</div>
                            <div className="text-[11px] text-slate-900 dark:text-slate-100 font-bold">
                              {isSuperAdminOrAdmin ? t.employeeName : (t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent')}
                            </div>
                          </td>

                          <td className="p-4">
                            <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold text-[9px]">
                              {t.category}
                            </Badge>
                          </td>

                          <td className="p-4">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{t.subject}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">{t.description}</div>
                          </td>

                          <td className="p-4">
                            <Badge className={`border-none font-bold text-[9px] ${
                              t.priority === 'Critical' || t.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-600' : (t.priority === 'High' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-600')
                            }`}>
                              {t.priority}
                            </Badge>
                          </td>

                          <td className="p-4">
                            <Badge className="bg-purple-500/10 text-purple-600 border-none font-bold text-[9px]">
                              Level {t.escalationLevel} Tier
                            </Badge>
                          </td>

                          <td className="p-4 font-mono font-bold text-amber-500 flex items-center gap-1">
                            {t.csatRating ? (
                              <>
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                <span>{t.csatRating} / 5</span>
                              </>
                            ) : '--'}
                          </td>

                          <td className="p-4">
                            <Badge className={`border-none font-bold text-[10px] px-2.5 py-1 flex items-center w-fit gap-1.5 ${
                              t.status === 'Resolved' || t.status === 'Closed'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : (t.status === 'Escalated' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400')
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                t.status === 'Resolved' || t.status === 'Closed' ? 'bg-emerald-500' : (t.status === 'Escalated' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse')
                              }`} />
                              {t.status === 'Open' ? 'Open (Pending Review)' : t.status}
                            </Badge>
                          </td>

                          <td className="p-4 text-right pr-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTicket(t)}
                              className="rounded-xl text-[10px] font-bold h-7 px-3 border-slate-200 dark:border-zinc-800 hover:border-[#f87941] hover:text-[#f87941] transition-all"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No HR cases logged yet</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: AI HR ASSISTANT & COPILOT */}
        {/* ========================================================================= */}
        <TabsContent value="copilot" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#f87941]" /> AI HR Assistant & Policy Instant Resolver
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#f87941]/10 via-orange-500/5 to-transparent border border-[#f87941]/30 flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-[#f87941] shrink-0 mt-1" />
                <div className="space-y-1 text-xs">
                  <div className="font-black text-slate-900 dark:text-slate-100">Ask HR Copilot Anything</div>
                  <div className="text-slate-500 font-medium">
                    Type your query about leaves, tax deductions, remote allowance, or health benefits to receive instant policy resolution.
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. How many days of earned leave can I carry forward to next year?"
                  className="rounded-2xl text-xs h-11 border-slate-200 dark:border-zinc-800"
                  onKeyDown={e => e.key === 'Enter' && handleAskAiCopilot()}
                />
                <Button
                  onClick={handleAskAiCopilot}
                  disabled={aiThinking}
                  className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-11 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-[#f87941]/20"
                >
                  {aiThinking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                  Ask AI HR
                </Button>
              </div>

              {aiResponse && (
                <div className="p-5 rounded-3xl bg-slate-950 text-white border border-zinc-800 space-y-3 animate-fadeIn">
                  <div className="text-xs font-mono text-[#f87941] font-bold flex items-center gap-2">
                    <Bot className="h-4 w-4" /> Copilot Response
                  </div>
                  <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    {aiResponse}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: KNOWLEDGE BASE & FAQS */}
        {/* ========================================================================= */}
        <TabsContent value="kb" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kbArticles.map(kb => (
              <Card key={kb.articleNumber} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-[#f87941]/10 text-[#f87941] font-mono text-[10px]">
                      {kb.articleNumber} • {kb.category}
                    </Badge>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {kb.viewCount}</span>
                      <span className="flex items-center gap-1 text-emerald-500"><ThumbsUp className="h-3 w-3" /> {kb.helpfulCount}</span>
                    </div>
                  </div>
                  <CardTitle className="text-sm font-black mt-2">{kb.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-xs text-slate-500 font-medium leading-relaxed">
                  {kb.content}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: ESCALATION MATRIX & SLA */}
        {/* ========================================================================= */}
        <TabsContent value="escalation" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {escalationMatrix.map(tier => (
              <Card key={tier.level} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-500/10 text-purple-600 font-bold text-xs">
                      Level {tier.level} Escalation Tier
                    </Badge>
                    <span className="font-mono text-xs font-bold text-slate-400">SLA: {tier.slaHours}h</span>
                  </div>
                  <CardTitle className="text-sm font-black mt-2">{tier.tier}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>Target Role:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">{tier.targetRole}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Auto Escalate Rule:</span>
                    <span className="text-rose-500 font-bold">{tier.autoEscalateAfter}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>

      {/* Raise New HR Case Modal Dialog with Strict Width Constraints & Field Validation */}
      <Dialog open={showNewCaseModal} onOpenChange={(open) => {
        setShowNewCaseModal(open);
        if (!open) {
          setFormTouched({ subject: false, description: false });
        }
      }}>
        <DialogContent className="rounded-3xl max-w-lg w-full overflow-hidden border-slate-200 dark:border-zinc-800 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Raise New HR Case / Service Ticket</DialogTitle>
            <DialogDescription className="text-xs">
              Fill in case details to route directly to HR support.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCase} className="space-y-4 pt-2 w-full max-w-full min-w-0 overflow-hidden">
            <div className="space-y-1.5 w-full max-w-full min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Employee Target / Applicant <span className="text-rose-500">*</span>
                </label>
                {isSuperAdminOrAdmin ? (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">
                    Admin Access (All Employees)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold flex items-center gap-1">
                    <UserCheck className="h-2.5 w-2.5" /> Auto-Filled
                  </Badge>
                )}
              </div>

              {isSuperAdminOrAdmin ? (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="rounded-xl text-xs font-semibold h-10 w-full max-w-full border-slate-200 dark:border-zinc-800">
                    <SelectValue placeholder="Select Employee from Roster" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {roster.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.department}) {e.designation ? `- ${e.designation}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative flex items-center w-full max-w-full">
                  <Input
                    value={
                      currentEmployee
                        ? `${currentEmployee.name} (${currentEmployee.department || 'Operations'}${currentEmployee.designation ? ` - ${currentEmployee.designation}` : ''})`
                        : (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''} (Operations)` : (roster[0]?.name ? `${roster[0].name} (${roster[0].department})` : 'Current Employee'))
                    }
                    disabled
                    readOnly
                    className="rounded-xl text-xs font-bold h-10 w-full max-w-full border-slate-200 bg-slate-100 text-slate-800 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-200 cursor-not-allowed pl-9 truncate"
                  />
                  <UserCheck className="absolute left-3 h-4 w-4 text-emerald-500 pointer-events-none" />
                </div>
              )}
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isSuperAdminOrAdmin
                  ? 'As Super Admin / Admin, select any employee from the list to file a ticket on their behalf.'
                  : 'Auto-filled with your employee profile. Tickets will be tracked under your account.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full min-w-0">
              <div className="space-y-1.5 w-full max-w-full min-w-0">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Case Category <span className="text-rose-500">*</span>
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="rounded-xl text-xs font-semibold h-10 w-full max-w-full border-slate-200 dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {HR_CASE_CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 w-full max-w-full min-w-0">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Priority Level <span className="text-rose-500">*</span>
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="rounded-xl text-xs font-semibold h-10 w-full max-w-full border-slate-200 dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="Critical">Critical (SLA 12h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject / Inquiry Title with Character Counter & Validation */}
            <div className="space-y-1.5 w-full max-w-full min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subject / Inquiry Title <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] font-semibold transition-colors ${
                  subject.length > 0 && subject.trim().length < 5 ? 'text-rose-500' : 'text-slate-400'
                }`}>
                  {subject.length} / 100 characters
                </span>
              </div>
              <Input
                value={subject}
                maxLength={100}
                onChange={e => {
                  setSubject(e.target.value);
                  if (!formTouched.subject) setFormTouched(prev => ({ ...prev, subject: true }));
                }}
                onBlur={() => setFormTouched(prev => ({ ...prev, subject: true }))}
                placeholder="e.g. Query regarding tax deduction on bonus payment (min 5 chars)..."
                className={`rounded-xl text-xs font-semibold h-10 w-full max-w-full min-w-0 border transition-all ${
                  formTouched.subject && (subject.trim().length === 0 || subject.trim().length < 5)
                    ? 'border-rose-500 focus-visible:ring-rose-500/20'
                    : 'border-slate-200 dark:border-zinc-800'
                }`}
              />
              {formTouched.subject && subject.trim().length === 0 && (
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">Subject is required (minimum 5 characters)</p>
              )}
              {formTouched.subject && subject.trim().length > 0 && subject.trim().length < 5 && (
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">
                  Subject must be at least 5 characters (currently {subject.trim().length}/100)
                </p>
              )}
            </div>

            {/* Detailed Description with Overflow Wrap, Character Counter & Validation */}
            <div className="space-y-1.5 w-full max-w-full min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Detailed Description <span className="text-rose-500">*</span>
                </label>
                <span className={`text-[10px] font-semibold transition-colors ${
                  description.length > 0 && description.trim().length < 10 ? 'text-rose-500' : 'text-slate-400'
                }`}>
                  {description.length} / 500 characters
                </span>
              </div>
              <Textarea
                rows={4}
                maxLength={500}
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (!formTouched.description) setFormTouched(prev => ({ ...prev, description: true }));
                }}
                onBlur={() => setFormTouched(prev => ({ ...prev, description: true }))}
                placeholder="Provide full description of your HR case or issue (10 to 500 characters)..."
                style={{ fieldSizing: 'normal' } as any}
                className={`rounded-2xl text-xs p-3 w-full max-w-full min-w-0 resize-y break-words [overflow-wrap:anywhere] border transition-all ${
                  formTouched.description && (description.trim().length === 0 || description.trim().length < 10)
                    ? 'border-rose-500 focus-visible:ring-rose-500/20'
                    : 'border-slate-200 dark:border-zinc-800'
                }`}
              />
              {formTouched.description && description.trim().length === 0 && (
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">Description is required (minimum 10 characters)</p>
              )}
              {formTouched.description && description.trim().length > 0 && description.trim().length < 10 && (
                <p className="text-[11px] text-rose-500 font-medium mt-0.5">
                  Description must be at least 10 characters (currently {description.trim().length}/500)
                </p>
              )}
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setShowNewCaseModal(false);
                  setFormTouched({ subject: false, description: false });
                }}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || subject.trim().length < 5 || description.trim().length < 10}
                className={`text-white font-extrabold text-xs rounded-xl h-9 px-4 transition-all flex items-center gap-1.5 ${
                  subject.trim().length < 5 || description.trim().length < 10
                    ? 'bg-slate-300 dark:bg-zinc-700 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-[#f87941] hover:bg-[#e06634] shadow-md shadow-[#f87941]/20'
                }`}
              >
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                Submit HR Case
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Details & Chat / Resolution / CSAT Modal Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        {selectedTicket && (
          <DialogContent className="rounded-3xl max-w-2xl border-slate-200 dark:border-zinc-800">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-black flex items-center gap-2">
                  <HelpCircle className="h-4.5 w-4.5 text-[#f87941]" /> HR Case Thread #{selectedTicket.ticketNumber}
                </DialogTitle>
                <Badge className="bg-[#f87941]/10 text-[#f87941] font-mono text-[10px]">
                  {selectedTicket.category}
                </Badge>
              </div>
              <DialogDescription className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {selectedTicket.subject} — Submitted by {selectedTicket.employeeName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              {/* Status & Key Metrics Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Status</div>
                  <Badge className={`mt-1 border-none font-bold text-[10px] px-2 py-0.5 flex items-center w-fit gap-1 ${
                    selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : (selectedTicket.status === 'Escalated' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400')
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? 'bg-emerald-500' : (selectedTicket.status === 'Escalated' ? 'bg-rose-500' : 'bg-amber-500')
                    }`} />
                    {selectedTicket.status === 'Open' ? 'Open (Pending Review)' : selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Priority</div>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-1">{selectedTicket.priority}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Agent</div>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-1">{selectedTicket.assignedToName || 'L1 Helpdesk'}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Submitted On</div>
                  <div className="font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-2">
                <div className="font-bold text-slate-400 uppercase text-[10px]">Case Description</div>
                <div className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{selectedTicket.description}</div>
              </div>

              {selectedTicket.resolutionNotes && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-extrabold text-[10px] uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> HR Resolution Summary
                  </div>
                  <div className="font-medium text-xs leading-relaxed">{selectedTicket.resolutionNotes}</div>
                </div>
              )}

              {selectedTicket.aiSuggestedAnswer && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 space-y-1">
                  <div className="font-bold text-[10px] uppercase flex items-center gap-1"><Bot className="h-3.5 w-3.5" /> AI Instant Suggestion</div>
                  <div className="font-medium">{selectedTicket.aiSuggestedAnswer}</div>
                </div>
              )}

              {/* CSAT Rating Widget */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="font-extrabold text-amber-600 flex items-center justify-between">
                  <span>CSAT Employee Satisfaction Rating</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span>{selectedTicket.csatRating ? `${selectedTicket.csatRating} / 5` : 'Unrated'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setUserCsatRating(star);
                        handleTicketAction('csat_feedback');
                      }}
                      className={`p-1 rounded-lg hover:scale-110 transition-all ${star <= (selectedTicket.csatRating || userCsatRating) ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Notes (Managers / HR Only) */}
              {canApprove && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Internal HR Notes (Private)</label>
                  <Textarea
                    rows={2}
                    value={newInternalNote}
                    onChange={e => setNewInternalNote(e.target.value)}
                    placeholder="Add internal escalation notes viewable only by HR agents..."
                    className="rounded-2xl text-xs p-3"
                  />
                  <Button size="sm" onClick={() => handleTicketAction('internal_note')} className="rounded-xl text-xs font-bold">
                    Save Internal Note
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between items-center pt-2">
              <Button variant="outline" onClick={() => setSelectedTicket(null)} className="rounded-xl text-xs font-bold">
                Close
              </Button>
              {canApprove && selectedTicket.status !== 'Resolved' && (
                <div className="flex items-center gap-2">
                  <Button onClick={() => handleTicketAction('escalate')} variant="outline" className="rounded-xl text-xs font-bold border-rose-500/30 text-rose-600">
                    Escalate L2
                  </Button>
                  <Button onClick={() => handleTicketAction('resolve')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold">
                    Resolve Case
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

    </div>
  );
}
