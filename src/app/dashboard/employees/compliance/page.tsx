'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  ShieldCheck, FileText, GraduationCap, Scale, FileCheck, Search,
  Stethoscope, FileSpreadsheet, Globe, Award, Clock, Calendar,
  IndianRupee, ShieldAlert, CheckCircle2, Plus, Filter, Check,
  XCircle, RefreshCw, SendHorizontal, BarChart3, Inbox, AlertCircle,
  Zap, ChevronRight, ChevronLeft, UserCheck, Download, Loader2, Trash2,
  TrendingUp, Activity, HelpCircle, AlertTriangle, Sparkles, MessageSquare, Bot
} from 'lucide-react';
import { toast } from 'sonner';

const getSessionToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('session_token') ?? localStorage.getItem('session_token');
};

export interface DomainItem {
  id: string;
  name: string;
  description: string;
  slaHours: number;
  totalChecks: number;
  compliantCount: number;
  pendingCount: number;
  nonCompliantCount: number;
  compliancePercent: number | null;
  latestDueDate: string | null;
  lastVerifiedAt: string | null;
}

export interface ComplianceRecord {
  id: string;
  userId: string;
  employeeName: string;
  category: string;
  itemName: string;
  complianceStatus: string;
  dueDate: string;
  completedAt: string | null;
  verificationNotes: string;
  createdAt: string;
}

export interface AuditFindingRecord {
  id: string;
  findingCode: string;
  category: string;
  severity: string;
  description: string;
  status: string;
  capaPlan: string;
  dueDate: string;
}

export interface ComplianceViolation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  category: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Escalated';
  detectedAt: string;
  dueDate: string;
  ownerName: string;
  correctiveActions: string;
  rootCause?: string;
}

export interface EmployeeComplianceScore {
  employeeId: string;
  name: string;
  department: string;
  score: number;
  status: 'Healthy' | 'Needs_Review' | 'Critical_Violations';
  openViolationsCount: number;
}

export interface DepartmentComplianceScore {
  department: string;
  score: number;
  totalEmployees: number;
  compliantCount: number;
}

export interface RosterEmp {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

// Status color helpers
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Compliant': case 'Resolved': return 'bg-emerald-500/10 text-emerald-600';
    case 'Non_Compliant': case 'Critical_Violations': return 'bg-red-500/10 text-red-600';
    case 'Pending': case 'Investigating': case 'Needs_Review': return 'bg-amber-500/10 text-amber-600';
    case 'Expiring_Soon': case 'Escalated': return 'bg-orange-500/10 text-orange-600';
    default: return 'bg-slate-500/10 text-slate-600';
  }
}

function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'Critical': return 'bg-red-500/15 text-red-600 border border-red-500/30';
    case 'High': return 'bg-orange-500/10 text-orange-600';
    case 'Medium': return 'bg-amber-500/10 text-amber-600';
    default: return 'bg-slate-500/10 text-slate-600';
  }
}

function getDomainBadgeClass(pct: number | null): string {
  if (pct === null) return 'bg-slate-500/10 text-slate-500';
  if (pct >= 90) return 'bg-emerald-500/10 text-emerald-600';
  if (pct >= 70) return 'bg-amber-500/10 text-amber-600';
  return 'bg-red-500/10 text-red-600';
}

export default function ComplianceOperationsPage() {
  const [activeTab, setActiveTab] = useState('command');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [capaProcessing, setCapaProcessing] = useState(false);

  // RBAC State
  const [canApprove, setCanApprove] = useState(false);
  const [userRole, setUserRole] = useState('developer');

  // Dynamic API State
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [items, setItems] = useState<ComplianceRecord[]>([]);
  const [findings, setFindings] = useState<AuditFindingRecord[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [employeeScores, setEmployeeScores] = useState<EmployeeComplianceScore[]>([]);
  const [departmentScores, setDepartmentScores] = useState<DepartmentComplianceScore[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [globalComplianceScore, setGlobalComplianceScore] = useState<number>(100);
  const [roster, setRoster] = useState<RosterEmp[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalChecks: 0,
    compliantCount: 0,
    pendingCount: 0,
    nonCompliantCount: 0,
    complianceRatePercent: '100%',
    openFindingsCount: 0,
    regulatoryPenaltiesAvoided: '0 Penalties (100% Statutory Compliant)',
    auditReadinessScore: '100%',
    domainsMonitored: 0
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [violationFilter, setViolationFilter] = useState('all');

  // Pagination State
  const [domainPage, setDomainPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [violationPage, setViolationPage] = useState(1);
  const [timelinePage, setTimelinePage] = useState(1);
  const [riskPage, setRiskPage] = useState(1);
  const [auditsPage, setAuditsPage] = useState(1);
  
  const DOMAINS_PER_PAGE = 6;
  const LEDGER_PER_PAGE = 10;
  const VIOLATIONS_PER_PAGE = 10;
  const TIMELINE_PER_PAGE = 5;
  const RISK_PER_PAGE = 5;
  const AUDITS_PER_PAGE = 6;

  // Log Compliance Item Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Policy Acceptance');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [itemName, setItemName] = useState('');
  const [newItemStatus, setNewItemStatus] = useState('Compliant');
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // CAPA Resolution State
  const [selectedFinding, setSelectedFinding] = useState<AuditFindingRecord | null>(null);
  const [capaText, setCapaText] = useState('');

  // AI Advisor Copilot State
  const [aiCopilotQuery, setAiCopilotQuery] = useState('');
  const [aiCopilotAnswer, setAiCopilotAnswer] = useState('');
  const [aiCopilotConfidence, setAiCopilotConfidence] = useState<number | null>(null);
  const [aiCopilotLoading, setAiCopilotLoading] = useState(false);

  // AI Risk Snapshot
  const [aiRiskSnapshot, setAiRiskSnapshot] = useState<{
    overallRiskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
    primaryRiskDrivers: string[];
    recommendations: string[];
    confidenceScore: number;
  } | null>(null);
  const [aiRiskLoading, setAiRiskLoading] = useState(false);

  // Inline action states
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [recommendedActionsId, setRecommendedActionsId] = useState<string | null>(null);
  const [aiRecommendationText, setAiRecommendationText] = useState<string>('');

  // Fetch 100% Dynamic Data from Backend API
  const loadComplianceDataFromApi = async () => {
    setRefreshing(true);
    try {
      const token = getSessionToken();
      const res = await fetch('/api/compliance/operations', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.canApprove !== undefined) setCanApprove(data.canApprove);
        if (data.userRole) setUserRole(data.userRole);
        if (data.domains) setDomains(data.domains);
        if (data.employeeRoster) {
          setRoster(data.employeeRoster);
          if (data.currentUserId) {
            setSelectedUserId(data.currentUserId);
          } else if (data.employeeRoster.length > 0 && !selectedUserId) {
            setSelectedUserId(data.employeeRoster[0].id);
          }
        }
        if (data.summaryStats) setSummaryStats(data.summaryStats);
        if (data.items) setItems(data.items);
        if (data.auditFindings) setFindings(data.auditFindings);
        if (data.violations) setViolations(data.violations);
        if (data.employeeScores) setEmployeeScores(data.employeeScores);
        if (data.departmentScores) setDepartmentScores(data.departmentScores);
        if (data.upcomingDeadlines) setUpcomingDeadlines(data.upcomingDeadlines);
        if (data.globalComplianceScore !== undefined) setGlobalComplianceScore(data.globalComplianceScore);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadComplianceDataFromApi();
  }, []);

  // Run AI Risk Assessment
  const runAiRiskAssessment = async () => {
    setAiRiskLoading(true);
    try {
      const token = getSessionToken();
      const res = await fetch('/api/compliance/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'risk_assessment' })
      });
      const data = await res.json();
      if (res.ok && data.risk) {
        setAiRiskSnapshot(data.risk);
        toast.success('AI Compliance Risk analysis complete!');
      } else {
        throw new Error(data.error || 'Failed to analyze risk');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing AI risk analysis');
    } finally {
      setAiRiskLoading(false);
    }
  };

  // Run Copilot Query
  const runCopilotQuery = async (queryText?: string) => {
    const finalQuery = queryText || aiCopilotQuery;
    if (!finalQuery.trim()) return;

    setAiCopilotLoading(true);
    setAiCopilotAnswer('');
    setAiCopilotConfidence(null);

    try {
      const token = getSessionToken();
      const res = await fetch('/api/compliance/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'nl_query', query: finalQuery })
      });
      const data = await res.json();
      if (res.ok) {
        setAiCopilotAnswer(data.answer);
        setAiCopilotConfidence(data.confidence);
      } else {
        throw new Error(data.error || 'Copilot query failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error asking AI Copilot');
    } finally {
      setAiCopilotLoading(false);
    }
  };

  // Get AI actions recommendations
  const getAiRemediation = async (violationId: string) => {
    setRecommendedActionsId(violationId);
    setAiRecommendationText('');
    try {
      const token = getSessionToken();
      const res = await fetch('/api/compliance/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'recommend_actions', violationId })
      });
      const data = await res.json();
      if (res.ok) {
        setAiRecommendationText(data.recommendation);
      } else {
        throw new Error(data.error || 'Failed to fetch recommendation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not fetch recommendation');
    }
  };

  // Log Compliance Item
  const handleLogCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !itemName.trim()) {
      toast.error('Please specify Employee and Item Name');
      return;
    }

    setSubmitting(true);

    try {
      const token = getSessionToken();
      const payload = {
        userId: selectedUserId,
        category: selectedCategory,
        itemName: itemName.trim(),
        complianceStatus: newItemStatus,
        dueDate,
        verificationNotes: verificationNotes.trim()
      };

      const res = await fetch('/api/compliance/operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Failed to log compliance item');

      toast.success(resData.message || 'Compliance record logged successfully!');
      setShowLogModal(false);
      setItemName('');
      setVerificationNotes('');
      setNewItemStatus('Compliant');
      await loadComplianceDataFromApi();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error logging compliance record');
    } finally {
      setSubmitting(false);
    }
  };

  // Inline Update Status
  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    setUpdatingStatusId(itemId);
    try {
      const token = getSessionToken();
      const res = await fetch('/api/compliance/operations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ itemId, complianceStatus: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      toast.success(data.message || 'Status updated!');
      await loadComplianceDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error updating compliance status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Delete Compliance Item
  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);
    try {
      const token = getSessionToken();
      const res = await fetch(`/api/compliance/operations?itemId=${itemId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');

      toast.success(data.message || 'Item deleted!');
      await loadComplianceDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting compliance item');
    } finally {
      setDeletingItemId(null);
    }
  };

  // Submit CAPA Action Update
  const handleUpdateCapa = async (status: 'Closed' | 'In_Review') => {
    if (!selectedFinding) return;
    setCapaProcessing(true);

    try {
      const token = getSessionToken();
      const payload = {
        findingId: selectedFinding.id,
        status,
        capaPlan: capaText.trim()
      };

      const res = await fetch('/api/compliance/operations/capa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'CAPA update failed');

      toast.success(data.message || 'Corrective Action Plan updated!');
      setSelectedFinding(null);
      setCapaText('');
      await loadComplianceDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error updating CAPA plan');
    } finally {
      setCapaProcessing(false);
    }
  };

  // Export CSV
  const handleExportComplianceCsv = () => {
    if (!items || items.length === 0) {
      toast.error('No compliance records available to export');
      return;
    }
    const headers = ['Employee Name', 'Category', 'Item Name', 'Status', 'Due Date', 'Completed At', 'Verification Notes'];
    const rows = items.map(i => [
      `"${i.employeeName}"`,
      `"${i.category}"`,
      `"${i.itemName}"`,
      `"${i.complianceStatus}"`,
      `"${i.dueDate}"`,
      `"${i.completedAt || 'N/A'}"`,
      `"${i.verificationNotes || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Statutory_Compliance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Statutory Compliance Report exported as CSV!');
  };

  // Filters
  const filteredItems = items.filter(i => {
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    const matchesSearch = i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredViolations = violations.filter(v => {
    const matchesCategory = violationFilter === 'all' || v.category === violationFilter;
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredRoster = roster.filter(e =>
    e.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(employeeSearchQuery.toLowerCase())
  );

  // Pagination totals
  const totalDomainPages = Math.ceil(domains.length / DOMAINS_PER_PAGE);
  const paginatedDomains = domains.slice((domainPage - 1) * DOMAINS_PER_PAGE, domainPage * DOMAINS_PER_PAGE);
  
  const totalLedgerPages = Math.ceil(filteredItems.length / LEDGER_PER_PAGE);
  const paginatedLedgerItems = filteredItems.slice((ledgerPage - 1) * LEDGER_PER_PAGE, ledgerPage * LEDGER_PER_PAGE);
  
  const totalViolationPages = Math.ceil(filteredViolations.length / VIOLATIONS_PER_PAGE);
  const paginatedViolations = filteredViolations.slice((violationPage - 1) * VIOLATIONS_PER_PAGE, violationPage * VIOLATIONS_PER_PAGE);

  const totalTimelinePages = Math.ceil(upcomingDeadlines.length / TIMELINE_PER_PAGE);
  const paginatedTimeline = upcomingDeadlines.slice((timelinePage - 1) * TIMELINE_PER_PAGE, timelinePage * TIMELINE_PER_PAGE);

  const totalRiskPages = Math.ceil(employeeScores.length / RISK_PER_PAGE);
  const paginatedRiskItems = employeeScores.slice((riskPage - 1) * RISK_PER_PAGE, riskPage * RISK_PER_PAGE);

  const totalAuditPages = Math.ceil(findings.length / AUDITS_PER_PAGE);
  const paginatedAudits = findings.slice((auditsPage - 1) * AUDITS_PER_PAGE, auditsPage * AUDITS_PER_PAGE);

  // SKELETON
  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-foreground flex flex-col animate-pulse">
        {/* Header Banner Skeleton */}
        <div className="rounded-3xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-40 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-8 w-80 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
            <div className="h-4 w-96 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-9 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg shrink-0" />
        </div>

        {/* KPI Stats Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
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
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-32 bg-slate-100 dark:bg-zinc-900/80 rounded-xl" />
            ))}
          </div>
          <div className="h-9 w-40 bg-slate-200 dark:bg-zinc-800 rounded-xl shrink-0" />
        </div>

        {/* Dashboard Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Org Health Index Dial Card */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 bg-slate-50 dark:bg-zinc-900/60 h-96 flex flex-col justify-between">
            <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-44 w-44 rounded-full border-8 border-slate-200 dark:border-zinc-800 mx-auto flex items-center justify-center" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-zinc-800 rounded-md mx-auto" />
          </div>

          {/* High Risk Employees List Card */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 bg-slate-50 dark:bg-zinc-900/60 h-96 space-y-4">
            <div className="h-4 w-40 bg-slate-200 dark:bg-zinc-800 rounded-md" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-850">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md" />
                  <div className="h-2.5 w-24 bg-slate-100 dark:bg-zinc-800 rounded-md" />
                </div>
                <div className="h-5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-full" />
              </div>
            ))}
          </div>

          {/* AI Risk Insight Card */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 bg-slate-50 dark:bg-zinc-900/60 h-96 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-slate-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-7 w-14 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
            </div>
            <div className="space-y-4 flex-1 mt-6">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-100 dark:bg-zinc-800 rounded-md" />
                <div className="h-5 w-12 bg-slate-200 dark:bg-zinc-800 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-20 bg-slate-150 dark:bg-zinc-800 rounded-md" />
                <div className="h-3.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-md" />
                <div className="h-3.5 w-5/6 bg-slate-200 dark:bg-zinc-800 rounded-md" />
              </div>
            </div>
            <div className="h-8 w-full bg-slate-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 text-white shadow-xl border border-primary/20">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-soft">Enterprise Statutory Guard</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
              Enterprise Compliance Operations
            </h2>
            <p className="text-sm text-primary-soft mt-1 max-w-xl">
              12 Compliance Domains: Labour Laws, BGV, Visas, Medical, Contracts, Audits & Corrective Action Plans (CAPA)
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              onClick={loadComplianceDataFromApi}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-9 border-white/15 shrink-0"
            >
              {refreshing ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Standalone KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Overall Compliance</div>
              <div className="text-2xl font-black text-emerald-500">{globalComplianceScore}%</div>
              <div className="text-[10px] text-slate-400 font-semibold">Active Org Score</div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Audit Readiness</div>
              <div className="text-2xl font-black text-cyan-500">{summaryStats.auditReadinessScore}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Live Assessment</div>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-2xl">
              <Activity className="h-5 w-5 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Open Violations</div>
              <div className="text-2xl font-black text-amber-500">{violations.filter(v => v.status !== 'Resolved').length}</div>
              <div className="text-[10px] text-slate-400 font-semibold">Requires Attention</div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-2xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Penalties Avoided</div>
              <div className="text-sm font-black text-emerald-500 line-clamp-2 leading-snug">{summaryStats.regulatoryPenaltiesAvoided}</div>
              <div className="text-[9px] text-slate-400 font-semibold">Statutory Standard</div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl shrink-0">
              <Scale className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Verification Ledger</div>
              <div className="text-2xl font-black text-purple-500">{items.length}</div>
              <div className="text-[10px] text-slate-400 font-semibold">{summaryStats.domainsMonitored} Active Checks</div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-2xl">
              <FileCheck className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="command" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <TrendingUp className="h-3.5 w-3.5" /> Compliance Command Centre
            </TabsTrigger>
            <TabsTrigger value="domains" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShieldCheck className="h-3.5 w-3.5" /> 12 Domains ({domains.length})
            </TabsTrigger>
            <TabsTrigger value="records" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileCheck className="h-3.5 w-3.5" /> Verification Ledger ({items.length})
            </TabsTrigger>
            <TabsTrigger value="violations" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <AlertTriangle className="h-3.5 w-3.5" /> Violations & Cases ({violations.filter(v => v.status !== 'Resolved').length})
            </TabsTrigger>
            <TabsTrigger value="audits" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShieldAlert className="h-3.5 w-3.5" /> Audit Findings ({findings.length})
            </TabsTrigger>
            <TabsTrigger value="scorecard" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <BarChart3 className="h-3.5 w-3.5" /> Statutory Scorecard
            </TabsTrigger>
            <TabsTrigger value="copilot" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Bot className="h-3.5 w-3.5" /> AI Copilot
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setShowLogModal(true)}
            className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/20"
          >
            <Plus className="h-3.5 w-3.5" /> {canApprove ? 'Log Compliance Item' : 'Self-Service Sign-off'}
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 0: COMPLIANCE COMMAND CENTRE */}
        {/* ========================================================================= */}
        <TabsContent value="command" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Overall Score Dial */}
            <Card className="lg:col-span-4 rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-primary" /> Org Health Index
                </CardTitle>
              </CardHeader>
              <CardContent className="py-6 flex flex-col items-center justify-center space-y-4">
                <div className="relative flex items-center justify-center">
                  {/* Gauge Arc */}
                  <svg className="w-36 h-36">
                    <circle
                      className="text-slate-100 dark:text-zinc-800"
                      strokeWidth="10"
                      stroke="currentColor"
                      fill="transparent"
                      r="58"
                      cx="72"
                      cy="72"
                    />
                    <circle
                      className="text-emerald-500 transition-all duration-1000"
                      strokeWidth="10"
                      strokeDasharray={364}
                      strokeDashoffset={364 - (364 * globalComplianceScore) / 100}
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
                    <span className="text-4xl font-black">{globalComplianceScore}%</span>
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">Compliant</div>
                  </div>
                </div>
                <div className="text-center text-xs font-semibold text-slate-500 max-w-xs">
                  {globalComplianceScore >= 90
                    ? 'Excellent organization-wide compliance posture. Keep records updated.'
                    : 'Action items pending in visa, shift rules, and document compliance.'
                  }
                </div>
              </CardContent>
            </Card>

            {/* Department Breakdown list */}
            <Card className="lg:col-span-4 rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Globe className="h-4.5 w-4.5 text-cyan-500" /> Department Compliance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 max-h-72">
                {departmentScores.length > 0 ? (
                  departmentScores.map(d => (
                    <div key={d.department} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{d.department}</span>
                        <span className={d.score >= 90 ? 'text-emerald-500 font-bold' : d.score >= 70 ? 'text-amber-500 font-bold' : 'text-red-500 font-bold'}>{d.score}%</span>
                      </div>
                      <Progress value={d.score} className="h-1.5" />
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-slate-400 py-8">No department records scanned</div>
                )}
              </CardContent>
            </Card>

            {/* High Risk Employees */}
            <Card className="lg:col-span-4 rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <UserCheck className="h-4.5 w-4.5 text-red-500" /> Top Action Required Staff
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {paginatedRiskItems.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {paginatedRiskItems.map(es => (
                          <tr key={es.employeeId} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="p-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                              {es.name}
                              <div className="text-[10px] text-slate-400 font-medium">{es.department}</div>
                            </td>
                            <td className="p-3 text-right">
                              <Badge className={`border-none font-bold text-[9px] ${getStatusBadgeClass(es.status)}`}>
                                Score: {es.score}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-8">All staff compliant</div>
                  )}
                </CardContent>
              </div>
              {totalRiskPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t bg-slate-50/50 dark:bg-zinc-900/10 rounded-b-3xl">
                  <span className="text-[10px] text-slate-400 font-semibold">Page {riskPage} of {totalRiskPages}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={riskPage <= 1}
                      onClick={() => setRiskPage(p => Math.max(1, p - 1))}
                      className="h-6 w-6 p-0 rounded-md"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={riskPage >= totalRiskPages}
                      onClick={() => setRiskPage(p => Math.min(totalRiskPages, p + 1))}
                      className="h-6 w-6 p-0 rounded-md"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Upcoming Deadlines Timeline */}
            <Card className="lg:col-span-8 rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-purple-500" /> Upcoming Expiry Timeline (90 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {paginatedTimeline.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-900/40 text-slate-400 font-bold border-b text-[10px] uppercase">
                          <th className="p-3 px-6">Employee</th>
                          <th className="p-3">Domain</th>
                          <th className="p-3">Requirement</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3">Days Left</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedTimeline.map(ud => (
                          <tr key={ud.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/20 transition-colors">
                            <td className="p-3 px-6 font-bold">{ud.employeeName}</td>
                            <td className="p-3">
                              <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px]">
                                {ud.category}
                              </Badge>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{ud.itemName}</td>
                            <td className="p-3 font-mono text-slate-400">{ud.dueDate}</td>
                            <td className="p-3 font-black text-rose-500">{ud.daysRemaining} days</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-xs text-slate-400">No deadlines expiring within 90 days</div>
                  )}
                </CardContent>
              </div>
              {totalTimelinePages > 1 && (
                <div className="flex items-center justify-between p-3 border-t bg-slate-50/50 dark:bg-zinc-900/10 rounded-b-3xl">
                  <span className="text-[10px] text-slate-400 font-semibold">Showing {(timelinePage - 1) * TIMELINE_PER_PAGE + 1}&ndash;{Math.min(timelinePage * TIMELINE_PER_PAGE, upcomingDeadlines.length)} of {upcomingDeadlines.length} timelines</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={timelinePage <= 1}
                      onClick={() => setTimelinePage(p => Math.max(1, p - 1))}
                      className="h-6 w-6 p-0 rounded-md"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={timelinePage >= totalTimelinePages}
                      onClick={() => setTimelinePage(p => Math.min(totalTimelinePages, p + 1))}
                      className="h-6 w-6 p-0 rounded-md"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* AI Risk Assessment panel */}
            <Card className="lg:col-span-4 rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-primary" /> AI Risk Insight
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={aiRiskLoading}
                  onClick={runAiRiskAssessment}
                  className="h-7 rounded-lg text-[10px] font-black border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-1"
                >
                  {aiRiskLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Scan
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                {aiRiskSnapshot ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Overall Risk:</span>
                      <Badge className={`border-none font-black text-[10px] ${
                        aiRiskSnapshot.overallRiskCategory === 'Critical' || aiRiskSnapshot.overallRiskCategory === 'High' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {aiRiskSnapshot.overallRiskCategory}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-slate-400 text-[10px] uppercase">Primary Drivers</div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                        {aiRiskSnapshot.primaryRiskDrivers.map((d, idx) => (
                          <li key={idx} className="font-semibold leading-relaxed">{d}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="font-bold text-primary text-[10px] uppercase">L&D Recommendations</div>
                      <ul className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                        {aiRiskSnapshot.recommendations.map((rec, idx) => (
                          <li key={idx} className="font-semibold leading-relaxed">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400 space-y-2">
                    <Sparkles className="h-8 w-8 mx-auto text-slate-300 animate-pulse" />
                    <p className="font-semibold text-xs">AI Risk Snapshot is ready to scan compliance drivers.</p>
                    <Button
                      size="sm"
                      onClick={runAiRiskAssessment}
                      disabled={aiRiskLoading}
                      className="bg-primary hover:bg-primary/95 text-white text-[10px] font-bold rounded-lg px-3.5 h-8 mt-2"
                    >
                      {aiRiskLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Generating...
                        </>
                      ) : (
                        'Generate AI Risk Report'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 1: 12 DOMAIN COMPLIANCE TRACKER */}
        {/* ========================================================================= */}
        <TabsContent value="domains" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDomains.map(d => {
              const compliancePercent = d.compliancePercent;
              return (
                <Card key={d.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-black">{d.name}</CardTitle>
                      <Badge className={`border-none font-bold text-[9px] ${getDomainBadgeClass(compliancePercent)}`}>
                        {compliancePercent !== null ? `${compliancePercent}% Compliant` : 'No Data'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{d.description}</p>

                    {/* Domain Stats */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-2">
                      {d.totalChecks > 0 ? (
                        <>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-semibold">Total Checked Cases</span>
                            <span className="font-black text-slate-900 dark:text-white">{d.totalChecks}</span>
                          </div>
                          <Progress
                            value={compliancePercent ?? 0}
                            className="h-1.5 rounded-full"
                          />
                          <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                            <div className="text-center">
                              <div className="font-black text-emerald-600">{d.compliantCount}</div>
                              <div className="text-slate-400 font-semibold">Compliant</div>
                            </div>
                            <div className="text-center">
                              <div className="font-black text-amber-600">{d.pendingCount}</div>
                              <div className="text-slate-400 font-semibold">Pending</div>
                            </div>
                            <div className="text-center">
                              <div className="font-black text-red-600">{d.nonCompliantCount}</div>
                              <div className="text-slate-400 font-semibold">Non-Compl.</div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-2">
                          <div className="text-[11px] text-slate-400 font-semibold">No compliance items logged</div>
                        </div>
                      )}
                    </div>

                    {/* Footer: SLA + Last Verified */}
                    <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> SLA: {d.slaHours}h
                      </span>
                      {d.lastVerifiedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Verified: {new Date(d.lastVerifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Domain Pagination */}
          {totalDomainPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Showing {(domainPage - 1) * DOMAINS_PER_PAGE + 1}&ndash;{Math.min(domainPage * DOMAINS_PER_PAGE, domains.length)} of {domains.length} domains
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={domainPage <= 1}
                  onClick={() => setDomainPage(p => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(totalDomainPages)].map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={domainPage === i + 1 ? 'default' : 'outline'}
                    onClick={() => setDomainPage(i + 1)}
                    className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                      domainPage === i + 1
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
                  disabled={domainPage >= totalDomainPages}
                  onClick={() => setDomainPage(p => Math.min(totalDomainPages, p + 1))}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: VERIFICATION LEDGER */}
        {/* ========================================================================= */}
        <TabsContent value="records" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <FileCheck className="h-4.5 w-4.5 text-primary" /> Employee Compliance Verification Ledger
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search item, employee..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setLedgerPage(1); }}
                    className="w-48 h-9 text-xs rounded-xl"
                  />
                  <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setLedgerPage(1); }}>
                    <SelectTrigger className="w-44 h-9 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-800">
                      <SelectValue placeholder="All Domains" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      <SelectItem value="all">All Domains</SelectItem>
                      {domains.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportComplianceCsv}
                    className="rounded-xl text-xs font-bold h-9 px-3 flex items-center gap-1.5 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" /> Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {filteredItems.length > 0 ? (
                <>
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                        <th className="p-4 px-6">Employee</th>
                        <th className="p-4">Compliance Domain</th>
                        <th className="p-4">Requirement Title</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Status</th>
                        {canApprove && <th className="p-4">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {paginatedLedgerItems.map(i => (
                        <tr key={i.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="p-4 px-6 font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                            {i.employeeName}
                          </td>
                          <td className="p-4">
                            <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px]">
                              {i.category}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                            {i.itemName}
                          </td>
                          <td className="p-4 font-mono text-slate-500 text-[11px]">
                            {i.dueDate.slice(0, 10)}
                          </td>
                          <td className="p-4">
                            {canApprove ? (
                              <div className="flex items-center gap-1.5">
                                {updatingStatusId === i.id && (
                                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                )}
                                <Select
                                  value={i.complianceStatus}
                                  onValueChange={v => handleUpdateItemStatus(i.id, v)}
                                  disabled={updatingStatusId === i.id}
                                >
                                  <SelectTrigger className={`h-7 w-32 text-[10px] font-bold rounded-lg border-none ${getStatusBadgeClass(i.complianceStatus)}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    <SelectItem value="Compliant">Compliant</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Non_Compliant">Non-Compliant</SelectItem>
                                    <SelectItem value="Expiring_Soon">Expiring Soon</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <Badge className={`border-none font-bold text-[9px] ${getStatusBadgeClass(i.complianceStatus)}`}>
                                {i.complianceStatus}
                              </Badge>
                            )}
                          </td>
                          {canApprove && (
                            <td className="p-4">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={deletingItemId === i.id}
                                onClick={() => handleDeleteItem(i.id)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                              >
                                {deletingItemId === i.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Trash2 className="h-3.5 w-3.5" />
                                }
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Ledger Pagination */}
                  {totalLedgerPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        Showing {(ledgerPage - 1) * LEDGER_PER_PAGE + 1}&ndash;{Math.min(ledgerPage * LEDGER_PER_PAGE, filteredItems.length)} of {filteredItems.length} records
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={ledgerPage <= 1}
                          onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {[...Array(Math.min(totalLedgerPages, 5))].map((_, i) => {
                          const pageNum = totalLedgerPages <= 5
                            ? i + 1
                            : ledgerPage <= 3
                              ? i + 1
                              : ledgerPage >= totalLedgerPages - 2
                                ? totalLedgerPages - 4 + i
                                : ledgerPage - 2 + i;
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              variant={ledgerPage === pageNum ? 'default' : 'outline'}
                              onClick={() => setLedgerPage(pageNum)}
                              className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                                ledgerPage === pageNum
                                  ? 'bg-primary hover:bg-primary/95 text-white'
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
                          disabled={ledgerPage >= totalLedgerPages}
                          onClick={() => setLedgerPage(p => Math.min(totalLedgerPages, p + 1))}
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
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No compliance records logged yet</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: VIOLATIONS & CASES */}
        {/* ========================================================================= */}
        <TabsContent value="violations" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" /> Active Compliance Violations & Cases
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search violations..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setViolationPage(1); }}
                  className="w-48 h-9 text-xs rounded-xl"
                />
                <Select value={violationFilter} onValueChange={v => { setViolationFilter(v); setViolationPage(1); }}>
                  <SelectTrigger className="w-44 h-9 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-800">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Visa Compliance">Visa Compliance</SelectItem>
                    <SelectItem value="Mandatory Training">Mandatory Training</SelectItem>
                    <SelectItem value="Shift Compliance">Shift Compliance</SelectItem>
                    <SelectItem value="Document Compliance">Document Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {filteredViolations.length > 0 ? (
                <>
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                        <th className="p-4 px-6">Employee</th>
                        <th className="p-4">Violation Details</th>
                        <th className="p-4">Severity</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {paginatedViolations.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="p-4 px-6 font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                            {v.employeeName}
                            <div className="text-[10px] text-slate-400 font-medium">{v.department}</div>
                          </td>
                          <td className="p-4 max-w-sm space-y-1">
                            <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] mb-1">
                              {v.category}
                            </Badge>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{v.title}</div>
                            <div className="text-[11px] text-slate-500 font-medium leading-relaxed">{v.description}</div>
                          </td>
                          <td className="p-4">
                            <Badge className={`border-none font-black text-[9px] ${getSeverityBadgeClass(v.severity)}`}>
                              {v.severity} ({v.riskScore})
                            </Badge>
                          </td>
                          <td className="p-4 font-mono text-slate-500 text-[11px]">
                            {v.dueDate.slice(0, 10)}
                          </td>
                          <td className="p-4">
                            <Badge className={`border-none font-bold text-[9px] ${getStatusBadgeClass(v.status)}`}>
                              {v.status}
                            </Badge>
                          </td>
                          <td className="p-4 space-y-2">
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 italic">Owner: {v.ownerName}</div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => getAiRemediation(v.id)}
                                disabled={recommendedActionsId === v.id}
                                className="h-7 text-[10px] font-black border-primary/30 hover:bg-primary/5 text-primary rounded-lg"
                              >
                                {recommendedActionsId === v.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                AI Action Guide
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Violation Pagination */}
                  {totalViolationPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        Showing {(violationPage - 1) * VIOLATIONS_PER_PAGE + 1}&ndash;{Math.min(violationPage * VIOLATIONS_PER_PAGE, filteredViolations.length)} of {filteredViolations.length} violations
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          disabled={violationPage <= 1}
                          onClick={() => setViolationPage(p => Math.max(1, p - 1))}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {[...Array(totalViolationPages)].map((_, i) => (
                          <Button
                            key={i}
                            size="sm"
                            variant={violationPage === i + 1 ? 'default' : 'outline'}
                            onClick={() => setViolationPage(i + 1)}
                            className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                              violationPage === i + 1
                                ? 'bg-primary hover:bg-primary/95 text-white'
                                : 'border-slate-200 dark:border-zinc-800'
                            }`}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          disabled={violationPage >= totalViolationPages}
                          onClick={() => setViolationPage(p => Math.min(totalViolationPages, p + 1))}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400">No active violations detected</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: AUDIT FINDINGS & CORRECTIVE ACTIONS (CAPA) */}
        {/* ========================================================================= */}
        <TabsContent value="audits" className="space-y-6 m-0">
          {findings.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedAudits.map(f => (
                  <Card key={f.id} className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                    <CardHeader className="pb-2 border-b">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-500/10 text-purple-600 font-mono text-[10px]">
                          {f.findingCode} -- {f.category}
                        </Badge>
                        <Badge className={`border-none font-bold text-[9px] ${
                          f.severity === 'High' || f.severity === 'Critical' ? 'bg-rose-500/10 text-rose-600' : f.severity === 'Low' ? 'bg-slate-500/10 text-slate-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {f.severity} Severity
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-black mt-2">{f.description}</CardTitle>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">CAPA Corrective Action Plan</div>
                        <div className="text-slate-700 dark:text-slate-300 font-medium">{f.capaPlan || 'Pending CAPA assignment.'}</div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <Badge className={`border-none font-bold text-[9px] ${f.status === 'Closed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          Status: {f.status}
                        </Badge>

                        {canApprove && f.status !== 'Closed' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedFinding(f);
                              setCapaText(f.capaPlan);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] h-7 px-3 rounded-lg"
                          >
                            Update CAPA Plan
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Audit Pagination */}
              {totalAuditPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    Showing {(auditsPage - 1) * AUDITS_PER_PAGE + 1}&ndash;{Math.min(auditsPage * AUDITS_PER_PAGE, findings.length)} of {findings.length} findings
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={auditsPage <= 1}
                      onClick={() => setAuditsPage(p => Math.max(1, p - 1))}
                      className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-zinc-800"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {[...Array(totalAuditPages)].map((_, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant={auditsPage === i + 1 ? 'default' : 'outline'}
                        onClick={() => setAuditsPage(i + 1)}
                        className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                          auditsPage === i + 1
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
                      disabled={auditsPage >= totalAuditPages}
                      onClick={() => setAuditsPage(p => Math.min(totalAuditPages, p + 1))}
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
              <CardContent className="p-12 text-center space-y-3">
                <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto" />
                <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No audit findings recorded</div>
                <p className="text-slate-400 text-xs">Your organization has no open audit findings. All compliance domains are healthy.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: STATUTORY SCORECARD & FINES AVOIDED */}
        {/* ========================================================================= */}
        <TabsContent value="scorecard" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Scale className="h-4.5 w-4.5 text-emerald-500" /> Labour Law Compliance Index
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">
                  {summaryStats.totalChecks > 0
                    ? `${summaryStats.compliantCount} of ${summaryStats.totalChecks} compliance checks passed across ${summaryStats.domainsMonitored} active domains.`
                    : 'No compliance checks logged yet. Log items to track statutory compliance.'
                  }
                </div>
                <div className="text-xl font-mono font-black text-emerald-500">{summaryStats.complianceRatePercent} Statutory Met</div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <IndianRupee className="h-4.5 w-4.5 text-cyan-500" /> Regulatory Penalties Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">
                  {summaryStats.nonCompliantCount === 0
                    ? 'Zero legal fines or regulatory non-compliance penalties incurred.'
                    : `${summaryStats.nonCompliantCount} non-compliant items flagged for immediate remediation.`
                  }
                </div>
                <div className={`text-xl font-mono font-black ${summaryStats.nonCompliantCount === 0 ? 'text-cyan-500' : 'text-red-500'}`}>
                  {summaryStats.nonCompliantCount === 0 ? '0 Fines Incurred' : `${summaryStats.nonCompliantCount} Items at Risk`}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Annual Audit Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500">
                  Preparedness score for external ISO & Labour Inspector audits.
                  {summaryStats.openFindingsCount > 0 && ` ${summaryStats.openFindingsCount} open finding(s) reduce readiness.`}
                </div>
                {summaryStats.totalChecks > 0 ? (
                  <>
                    <Progress value={parseInt(summaryStats.auditReadinessScore) || 0} className="h-2" />
                    <div className={`text-[10px] ${parseInt(summaryStats.auditReadinessScore) >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {summaryStats.auditReadinessScore}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-[10px]">Log compliance items to compute readiness score</div>
                )}
              </CardContent>
            </Card>

            {/* Domain Coverage Card */}
            <Card className="md:col-span-3 rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <BarChart3 className="h-4.5 w-4.5 text-primary" /> Domain Coverage Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {domains.map(d => (
                    <div key={d.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{d.name}</div>
                      <div className={`text-lg font-black ${d.totalChecks === 0 ? 'text-slate-300 dark:text-zinc-600' : (d.compliancePercent ?? 0) >= 80 ? 'text-emerald-500' : (d.compliancePercent ?? 0) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {d.totalChecks > 0 ? `${d.compliancePercent}%` : '--'}
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold">{d.totalChecks} checks</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 6: AI COMPLIANCE COPILOT */}
        {/* ========================================================================= */}
        <TabsContent value="copilot" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Ask AI Compliance Copilot
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* Presets */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Suggested Prompts</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAiCopilotQuery('Which employees have critical or high compliance violations?');
                      runCopilotQuery('Which employees have critical or high compliance violations?');
                    }}
                    className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-zinc-800 hover:bg-slate-50"
                  >
                    Show high risk employees
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAiCopilotQuery('What are the upcoming deadlines in the next 90 days?');
                      runCopilotQuery('What are the upcoming deadlines in the next 90 days?');
                    }}
                    className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-zinc-800 hover:bg-slate-50"
                  >
                    View upcoming deadlines
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAiCopilotQuery('What corrective action recommendations do you suggest for shift rest gap violations?');
                      runCopilotQuery('What corrective action recommendations do you suggest for shift rest gap violations?');
                    }}
                    className="h-8 rounded-xl text-xs font-semibold border-slate-200 dark:border-zinc-800 hover:bg-slate-50"
                  >
                    Rest gap corrective actions
                  </Button>
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-3 pt-2">
                <Input
                  placeholder="Ask a question about employee compliance status..."
                  value={aiCopilotQuery}
                  onChange={e => setAiCopilotQuery(e.target.value)}
                  className="rounded-xl text-xs font-semibold h-11 border-slate-200 dark:border-zinc-800"
                  onKeyDown={e => { if (e.key === 'Enter') runCopilotQuery(); }}
                />
                <Button
                  onClick={() => runCopilotQuery()}
                  disabled={aiCopilotLoading || !aiCopilotQuery.trim()}
                  className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs h-11 px-5 rounded-xl flex items-center gap-1.5"
                >
                  {aiCopilotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                  Ask AI
                </Button>
              </div>

              {/* Response Panel */}
              {(aiCopilotAnswer || aiCopilotLoading) && (
                <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                    <span className="flex items-center gap-1.5 font-bold text-primary"><Bot className="h-4 w-4" /> AI Copilot Response</span>
                    {aiCopilotConfidence !== null && (
                      <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono">
                        Confidence: {Math.round(aiCopilotConfidence * 100)}%
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
                    <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line">{aiCopilotAnswer}</p>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Log Compliance Modal Dialog */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="rounded-[36px] max-w-2xl border-none bg-white dark:bg-zinc-950 p-8 md:p-10 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl md:text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Log Compliance Check Item
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold">
              Record verified document, visa, BGV, or statutory training compliance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogCompliance} className="space-y-6 pt-4">
            {/* Employee Applicant Searchable Combobox */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Employee Applicant
              </label>
              <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={isDropdownOpen}
                    disabled={!canApprove}
                    className="w-full justify-between rounded-2xl text-xs font-semibold h-11 border-slate-200 dark:border-zinc-800 text-left bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  >
                    {(() => {
                      const selectedEmp = roster.find(e => e.id === selectedUserId);
                      return selectedEmp ? (
                        <span className="font-bold text-slate-900 dark:text-white">{selectedEmp.name} ({selectedEmp.department})</span>
                      ) : (
                        <span className="text-slate-400 font-semibold">Select Employee Applicant...</span>
                      );
                    })()}
                    <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50 rotate-90" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl z-50">
                  <div className="flex items-center border border-slate-200 dark:border-zinc-850 rounded-xl px-3 mb-2 bg-slate-50/50 dark:bg-zinc-900">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-primary" />
                    <Input
                      placeholder="Search employee name or department..."
                      value={employeeSearchQuery}
                      onChange={e => setEmployeeSearchQuery(e.target.value)}
                      className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 p-0 text-xs font-semibold"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {filteredRoster.length > 0 ? (
                      filteredRoster.map(e => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(e.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                            selectedUserId === e.id
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{e.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{e.department} • {e.designation}</div>
                          </div>
                          {selectedUserId === e.id && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400">No employees found</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Row 2: Category and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Compliance Domain
                </label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="rounded-2xl text-xs font-semibold h-11 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {domains.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Compliance Status
                </label>
                <Select value={newItemStatus} onValueChange={setNewItemStatus}>
                  <SelectTrigger className="rounded-2xl text-xs font-semibold h-11 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Compliant">Compliant</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Non_Compliant">Non-Compliant</SelectItem>
                    <SelectItem value="Expiring_Soon">Expiring Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Requirement Title and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Requirement Title / Check Item
                </label>
                <Input
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="e.g. Annual POSH Training..."
                  className="rounded-2xl text-xs font-semibold h-11 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Compliance Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="rounded-2xl text-xs font-semibold h-11 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            {/* Row 4: Notes */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Verification Notes
              </label>
              <Textarea
                rows={3}
                value={verificationNotes}
                onChange={e => setVerificationNotes(e.target.value)}
                placeholder="Notes on certificate hash, BGV vendor reference, or visa approval..."
                className="rounded-2xl text-xs p-3 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>

            {/* Row 5: Footer Actions */}
            <DialogFooter className="pt-2 gap-3 flex items-center justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowLogModal(false)}
                className="rounded-full px-6 font-bold h-10 border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-xs text-slate-700 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-full px-6 h-10 flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                Log Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CAPA Resolution Modal Dialog */}
      <Dialog open={!!selectedFinding} onOpenChange={() => setSelectedFinding(null)}>
        {selectedFinding && (
          <DialogContent className="rounded-3xl max-w-lg border-slate-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-amber-500" /> Corrective Action Plan (CAPA)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Finding Code: {selectedFinding.findingCode} -- {selectedFinding.category}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs font-semibold">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Finding Description</div>
                <div className="text-slate-700 dark:text-slate-300">{selectedFinding.description}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Corrective Action Plan (CAPA)</label>
                <Textarea
                  rows={3}
                  value={capaText}
                  onChange={e => setCapaText(e.target.value)}
                  placeholder="Detail remediation steps taken..."
                  className="rounded-2xl text-xs p-3"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setSelectedFinding(null)} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button
                disabled={capaProcessing}
                onClick={() => handleUpdateCapa('Closed')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5"
              >
                {capaProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Close Audit Finding (CAPA Resolved)
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* AI Action Guide Modal Dialog */}
      <Dialog open={!!recommendedActionsId} onOpenChange={() => setRecommendedActionsId(null)}>
        <DialogContent className="rounded-3xl max-w-lg border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-primary" /> AI Recommended Corrective Actions
            </DialogTitle>
            <DialogDescription className="text-xs">
              Remediation guide for violation ID: {recommendedActionsId}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 border border-zinc-800 space-y-3">
            {!aiRecommendationText ? (
              <div className="space-y-2.5 animate-pulse py-2">
                <div className="h-3 w-full bg-zinc-800 rounded" />
                <div className="h-3 w-5/6 bg-zinc-800 rounded" />
                <div className="h-3 w-2/3 bg-zinc-800 rounded" />
              </div>
            ) : (
              <p className="text-xs leading-relaxed whitespace-pre-line text-slate-300 font-sans">{aiRecommendationText}</p>
            )
            }
          </div>

          <DialogFooter>
            <Button onClick={() => setRecommendedActionsId(null)} className="bg-primary hover:bg-primary/95 text-white text-xs font-black rounded-xl px-5 h-10">
              Close Guide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
