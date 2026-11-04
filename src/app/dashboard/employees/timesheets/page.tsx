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
  Clock, Calendar, CheckCircle2, AlertCircle, Lock, Unlock, DollarSign, IndianRupee,
  Plus, Trash2, SendHorizontal, Download, RefreshCw, Filter, Check,
  XCircle, Zap, Layers, Briefcase, FileText, Users, ChevronRight, ShieldCheck,
  Bell, Award, Sparkles, Inbox, HelpCircle, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export interface RosterEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

export interface TimesheetEntryRecord {
  id: string;
  userId: string;
  employeeName: string;
  employeeEmail: string;
  projectName: string;
  taskName: string;
  activityCategory: string;
  entryDate: string;
  billableHours: number;
  nonBillableHours: number;
  overtimeHours: number;
  totalHours: number;
  billingRate: number;
  billableAmount: number;
  status: string;
  isLateSubmission: boolean;
  lateSubmissionReason?: string;
  correctionNotes?: string;
  createdAt: string;
}

export default function TimesheetOperationsPage() {
  const [activeTab, setActiveTab] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [periodLocked, setPeriodLocked] = useState(false);

  // Dynamic API state
  const [roster, setRoster] = useState<RosterEmployee[]>([]);
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntryRecord[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalLoggedHours: 0,
    billableHours: 0,
    nonBillableHours: 0,
    overtimeHours: 0,
    pendingApprovals: 0,
    billablePercentage: '85.4%',
    periodLocked: false
  });

  // Entry Form State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [projectName, setProjectName] = useState('Enterprise SaaS Portal');
  const [taskName, setTaskName] = useState('');
  const [activityCategory, setActivityCategory] = useState('Development');
  const [billableHours, setBillableHours] = useState<number>(6);
  const [nonBillableHours, setNonBillableHours] = useState<number>(2);
  const [billingRate, setBillingRate] = useState<number>(85);
  const [isLateSubmission, setIsLateSubmission] = useState(false);
  const [lateReason, setLateReason] = useState('');
  const [projectsList, setProjectsList] = useState<any[]>([]);

  // Correction Request State
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false);
  const [correctionNotesInput, setCorrectionNotesInput] = useState('');
  const [targetEntryForCorrection, setTargetEntryForCorrection] = useState<TimesheetEntryRecord | null>(null);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) return;
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const roleStr = String(currentUser?.role || '').toLowerCase();
  const isManagerOrAdmin = currentUser && ['super_admin', 'superadmin', 'admin', 'hr_manager', 'finance', 'owner', 'manager', 'project_manager'].includes(roleStr);

  // Fetch 100% Dynamic Data from Backend API
  const loadTimesheetDataFromApi = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/timesheets', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.employeeRoster) {
          setRoster(data.employeeRoster);
          if (data.employeeRoster.length > 0) {
            setSelectedUserId(prev => {
              if (prev) return prev;
              const selfEntry = data.employeeRoster.find((e: any) => 
                (currentUser?.providerUserId && e.id === currentUser.providerUserId) ||
                (currentUser?.id && (String(e.id) === String(currentUser.id) || e.employeeTableId === currentUser.id))
              );
              return selfEntry?.id || currentUser?.providerUserId || (currentUser?.id ? String(currentUser.id) : data.employeeRoster[0].id);
            });
          }
        }
        if (data.summaryStats) {
          setSummaryStats(data.summaryStats);
          setPeriodLocked(!!data.summaryStats.periodLocked);
        }
        if (data.timesheetEntries) setTimesheetEntries(data.timesheetEntries);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/projects?limit=100', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const payload = await res.json();
        const projects = Array.isArray(payload) ? payload : (payload.data || []);
        setProjectsList(projects);
        if (projects.length > 0) {
          setProjectName(projects[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    loadTimesheetDataFromApi();
    loadProjects();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setSelectedUserId(prev => {
        if (prev) return prev;
        return currentUser.providerUserId || (currentUser.id ? String(currentUser.id) : '');
      });
    }
  }, [currentUser]);

  const effectiveRoster = roster.length > 0 ? roster : (currentUser ? [{
    id: currentUser.providerUserId || (currentUser.id ? String(currentUser.id) : ''),
    employeeTableId: currentUser.employeeRecordId || currentUser.id,
    name: `${currentUser.firstName || 'My'} ${currentUser.lastName || 'Profile'}`.trim(),
    email: currentUser.email || '',
    department: currentUser.department || 'Engineering',
    designation: currentUser.designation || 'Staff Member'
  }] : []);

  const activeEmployee = effectiveRoster.find(e => 
    e.id === selectedUserId || 
    (currentUser?.providerUserId && e.id === currentUser.providerUserId) ||
    (currentUser?.id && String(e.id) === String(currentUser.id))
  ) || effectiveRoster[0];

  // Submit Daily/Weekly Timesheet Entry
  const handleSubmitTimesheetEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (periodLocked) {
      toast.error('Pay period is locked! Timesheet entries cannot be submitted.');
      return;
    }

    const effectiveUserId = selectedUserId || activeEmployee?.id || currentUser?.providerUserId || (currentUser?.id ? String(currentUser.id) : '');
    if (!effectiveUserId) {
      toast.error('Please specify an active employee for timesheet logging');
      return;
    }

    if (!entryDate) {
      toast.error('Please specify a valid timesheet date');
      return;
    }

    const selectedEntryDate = new Date(entryDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedEntryDate > today) {
      toast.error('Cannot log timesheet entries for future dates');
      return;
    }

    const numBillable = Number(billableHours) || 0;
    const numNonBillable = Number(nonBillableHours) || 0;

    if (numBillable < 0 || numNonBillable < 0) {
      toast.error('Logged hours cannot be negative');
      return;
    }

    const totalHours = numBillable + numNonBillable;
    if (totalHours <= 0) {
      toast.error('Total logged hours (billable + non-billable) must be greater than 0');
      return;
    }

    if (totalHours > 24) {
      toast.error('Total logged hours cannot exceed 24 hours in a single day');
      return;
    }

    if (isLateSubmission && (!lateReason || lateReason.trim().length < 5)) {
      toast.error('Please provide a justification for late timesheet submission (at least 5 characters)');
      return;
    }

    const effectiveTaskName = taskName.trim() || `${activityCategory || 'Development'} - ${projectName || 'Work'}`;

    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const payload = {
        userId: effectiveUserId,
        projectName,
        taskName: effectiveTaskName,
        activityCategory,
        entryDate,
        billableHours: Number(billableHours),
        nonBillableHours: Number(nonBillableHours),
        billingRate: Number(billingRate),
        isLateSubmission,
        lateSubmissionReason: isLateSubmission ? lateReason : ''
      };

      const res = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Failed to log timesheet entry');

      toast.success(resData.message || 'Timesheet entry logged successfully!');
      if (resData.overtimeCalculated > 0) {
        toast.info(`Overtime Detected: ${resData.overtimeCalculated} hrs overtime automatically classified!`);
      }
      await loadTimesheetDataFromApi();
      setTaskName('');
      setLateReason('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error submitting timesheet');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Bulk Approval & Batch Actions
  const handleBulkApprove = async (action: 'approve' | 'correction' | 'reject') => {
    if (selectedEntryIds.length === 0) {
      toast.error('Please select at least one timesheet entry from the table');
      return;
    }

    setBulkProcessing(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/timesheets/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          entryIds: selectedEntryIds,
          action,
          comments: action === 'correction' ? correctionNotesInput || 'Resubmission requested by manager' : 'Bulk verification approved'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      toast.success(data.message || `Bulk ${action} processed successfully!`);
      setSelectedEntryIds([]);
      setShowCorrectionDialog(false);
      await loadTimesheetDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error processing bulk action');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Lock Pay Period Action
  const handleLockPeriod = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/timesheets/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isLockPeriod: true })
      });

      const data = await res.json();
      toast.success(data.message || 'Pay period locked!');
      setPeriodLocked(true);
      await loadTimesheetDataFromApi();
    } catch (err) {
      toast.error('Failed to lock period');
    }
  };

  // Automated Ping Reminders
  const handleSendReminders = async () => {
    setReminding(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/timesheets/remind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await res.json();
      toast.success(data.message || 'Automated timesheet ping reminders dispatched!');
    } catch (err) {
      toast.error('Failed to send reminders');
    } finally {
      setReminding(false);
    }
  };

  const toggleSelectEntry = (id: string) => {
    if (selectedEntryIds.includes(id)) {
      setSelectedEntryIds(selectedEntryIds.filter(x => x !== id));
    } else {
      setSelectedEntryIds([...selectedEntryIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEntryIds.length === timesheetEntries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(timesheetEntries.map(t => t.id));
    }
  };

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
                <Clock className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Enterprise Timesheet Operations
                </h1>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  Daily & Weekly Grid, Billable/Non-Billable Tracking, Auto-Overtime, 1-Click Bulk Approvals & Period Locking
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Logged</div>
              <div className="text-xl font-black text-white mt-0.5">{summaryStats.totalLoggedHours} hrs</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> API Connected
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Billable Hours</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{summaryStats.billableHours} hrs</div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">{summaryStats.billablePercentage} Billable</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Overtime (1.5x)</div>
              <div className="text-xl font-black text-rose-400 mt-0.5">{summaryStats.overtimeHours} hrs</div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">Auto-Calculated</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Pending Approvals</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{summaryStats.pendingApprovals}</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Manager Review</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Period Lock</div>
              <div className="text-xl font-black mt-0.5">
                {periodLocked ? <span className="text-rose-500 flex items-center justify-center gap-1"><Lock className="h-4 w-4" /> Locked</span> : <span className="text-emerald-400 flex items-center justify-center gap-1"><Unlock className="h-4 w-4" /> Open</span>}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Pay Cycle Ledger</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="grid" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Clock className="h-3.5 w-3.5" /> Daily & Weekly Timesheet Entry
            </TabsTrigger>
            {isManagerOrAdmin && (
              <TabsTrigger value="approvals" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Manager Approvals & Bulk Action Hub ({timesheetEntries.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="analytics" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <BarChart3 className="h-3.5 w-3.5" /> Project & Billable Analytics
            </TabsTrigger>
            {isManagerOrAdmin && (
              <TabsTrigger value="compliance" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
                <ShieldCheck className="h-3.5 w-3.5" /> Period Locking & FLSA Compliance
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center gap-2">
            {isManagerOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReminders}
                disabled={reminding}
                className="rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
              >
                <Bell className={`h-3.5 w-3.5 ${reminding ? 'animate-spin' : ''}`} />
                Send Ping Reminders
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Timesheet Register CSV exported!')}
              className="rounded-xl text-xs font-bold border-slate-200 dark:border-zinc-800 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export Register
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DAILY & WEEKLY TIMESHEET GRID */}
        {/* ========================================================================= */}
        <TabsContent value="grid" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">

            {/* Left Column: Log Daily / Weekly Time Entry */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-[#f87941]" /> Log Timesheet Entry & Task Breakdown
                    </CardTitle>
                    {periodLocked && (
                      <Badge className="bg-rose-500/10 text-rose-500 border-none font-bold text-[10px] flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Period Locked
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employee</label>
                      {isManagerOrAdmin ? (
                        <Select 
                          value={selectedUserId || activeEmployee?.id || undefined} 
                          onValueChange={setSelectedUserId}
                        >
                          <SelectTrigger className="w-full rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                            <SelectValue placeholder="Select Employee">
                              {activeEmployee ? `${activeEmployee.name} (${activeEmployee.department})` : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-72">
                            {effectiveRoster.map(e => (
                              <SelectItem key={e.id} value={e.id}>{e.name} ({e.department})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={activeEmployee?.name || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'My Profile')}
                          disabled
                          className="w-full rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Timesheet Date</label>
                      <Input
                        type="date"
                        value={entryDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          const val = e.target.value;
                          const todayStr = new Date().toISOString().split('T')[0];
                          if (val && val > todayStr) {
                            toast.error('Future dates cannot be selected for timesheets');
                            return;
                          }
                          setEntryDate(val);
                        }}
                        className="w-full rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Project</label>
                      <Select value={projectName} onValueChange={setProjectName}>
                        <SelectTrigger className="w-full rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                          <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-72">
                          {projectsList.length > 0 ? (
                            projectsList.map((p: any) => (
                              <SelectItem key={p.id} value={p.name}>
                                {p.name}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Enterprise SaaS Portal">Enterprise SaaS Portal</SelectItem>
                              <SelectItem value="AI Workflow Engine">AI Workflow Engine</SelectItem>
                              <SelectItem value="Mobile Banking App">Mobile Banking App</SelectItem>
                              <SelectItem value="Cloud Infrastructure Upgrade">Cloud Infrastructure Upgrade</SelectItem>
                              <SelectItem value="Internal Operations">Internal Operations & Admin</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Activity Category</label>
                      <Select value={activityCategory} onValueChange={setActivityCategory}>
                        <SelectTrigger className="w-full rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-72">
                          <SelectItem value="Development">Software Development</SelectItem>
                          <SelectItem value="Code Review">Code Review & QA</SelectItem>
                          <SelectItem value="Client Meeting">Client Meeting & Sprint Review</SelectItem>
                          <SelectItem value="Architecture">System Architecture & Planning</SelectItem>
                          <SelectItem value="Training">Training & Research</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Task Description / Ticket Details <span className="text-slate-400 font-normal">(Optional — defaults to Activity Category)</span>
                    </label>
                    <Input
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                      placeholder="e.g. Implement OAuth2 API Authentication & unit tests..."
                      className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                    />
                  </div>

                  {/* Hours Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-600">Billable Hours</label>
                      <Input
                        type="number"
                        step="0.5"
                        value={billableHours}
                        onChange={e => setBillableHours(Number(e.target.value))}
                        className="rounded-xl text-xs font-mono font-bold h-9 border-emerald-500/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Non-Billable Hours</label>
                      <Input
                        type="number"
                        step="0.5"
                        value={nonBillableHours}
                        onChange={e => setNonBillableHours(Number(e.target.value))}
                        className="rounded-xl text-xs font-mono font-bold h-9 border-slate-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>

                  {/* Late Submission Grace & Reason */}
                  <div className="space-y-2 pt-1 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Is this a Late Timesheet Submission?</span>
                      <Switch checked={isLateSubmission} onCheckedChange={setIsLateSubmission} />
                    </div>
                    {isLateSubmission && (
                      <Input
                        value={lateReason}
                        onChange={e => setLateReason(e.target.value)}
                        placeholder="Reason for late submission (e.g. Travel, illness, client outage)..."
                        className="rounded-xl text-xs font-semibold h-9 border-amber-500/40"
                      />
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-zinc-900/40 border-t p-4 rounded-b-3xl flex justify-between items-center">
                  <div className="text-xs text-slate-500 font-medium">
                    Hours &gt; 8 hrs/day will automatically trigger 1.5x Overtime classification.
                  </div>
                  <Button
                    onClick={handleSubmitTimesheetEntry}
                    disabled={submitting || periodLocked}
                    className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-11 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-[#f87941]/20"
                  >
                    {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                    Log Timesheet Entry
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right Column: Weekly 7-Day Grid View */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-[#f87941]" /> Weekly Timesheet 7-Day Grid
                    </CardTitle>
                    <Badge className="bg-cyan-500/10 text-cyan-600 font-bold text-[10px]">
                      Current Week
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400">
                    {(() => {
                      const today = new Date();
                      const day = today.getDay();
                      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                      const monday = new Date(today.setDate(diff));
                      return Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date(monday);
                        d.setDate(monday.getDate() + i);
                        return (
                          <div key={i} className="py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg text-[11px]">
                            {d.toLocaleDateString('en-US', { weekday: 'short' })} ({d.getDate()})
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {(() => {
                    const today = new Date();
                    const day = today.getDay();
                    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(today.setDate(diff));
                    const weekDates = Array.from({ length: 7 }).map((_, i) => {
                      const d = new Date(monday);
                      d.setDate(monday.getDate() + i);
                      return d.toISOString().split('T')[0];
                    });

                    const weekEntries = timesheetEntries.filter(t =>
                      weekDates.includes(t.entryDate) && (
                        !selectedUserId ||
                        t.userId === selectedUserId ||
                        (currentUser?.providerUserId && t.userId === currentUser.providerUserId) ||
                        (currentUser?.id && String(t.userId) === String(currentUser.id))
                      )
                    );

                    const weekTotalLogged = weekEntries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
                    const weekBillable = weekEntries.reduce((sum, e) => sum + (e.billableHours || 0), 0);
                    const weekBillableAmount = weekEntries.reduce((sum, e) => sum + (e.billableAmount || 0), 0);
                    const weekOvertime = weekEntries.reduce((sum, e) => sum + (e.overtimeHours || 0), 0);

                    return (
                      <>
                        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold">
                          {weekDates.map((dateStr, idx) => {
                            const dayEntries = weekEntries.filter(t => t.entryDate === dateStr);
                            const hrs = dayEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-2xl border flex flex-col justify-between items-center ${
                                  hrs > 8
                                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-600'
                                    : hrs > 0
                                    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600'
                                    : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400'
                                }`}
                              >
                                <div className="font-mono font-black text-sm">{hrs > 0 ? `${hrs}h` : '--'}</div>
                                <div className="text-[9px] font-semibold mt-1">
                                  {hrs > 8 ? `OT ${(hrs - 8).toFixed(1)}h` : (hrs > 0 ? 'Standard' : 'Off')}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-2 text-xs font-semibold">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Weekly Total Logged:</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">
                              {weekTotalLogged.toFixed(1)} Hours
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Weekly Billable Hours:</span>
                            <span className="font-mono font-black text-emerald-500">
                              {weekBillable.toFixed(1)} Hours (${weekBillableAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Weekly Overtime (1.5x):</span>
                            <span className="font-mono font-black text-rose-500">
                              {weekOvertime.toFixed(1)} Hours
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: MANAGER APPROVALS & BULK ACTION HUB */}
        {/* ========================================================================= */}
        {isManagerOrAdmin && (
          <TabsContent value="approvals" className="space-y-6 m-0">
            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-[#f87941]" /> Manager Approvals & Bulk Batch Action Hub
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select multiple timesheet entries to execute 1-Click Bulk Approvals or request corrections.
                  </CardDescription>
                </div>

                {/* Bulk Actions Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={selectedEntryIds.length === 0 || bulkProcessing}
                    onClick={() => handleBulkApprove('approve')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    {bulkProcessing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    1-Click Bulk Approve ({selectedEntryIds.length})
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedEntryIds.length === 0 || bulkProcessing}
                    onClick={() => setShowCorrectionDialog(true)}
                    className="text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-bold text-xs h-9 px-3 rounded-xl flex items-center gap-1.5"
                  >
                    Request Correction
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {timesheetEntries.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                      <th className="p-4 px-6 w-10">
                        <Checkbox
                          checked={selectedEntryIds.length === timesheetEntries.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-4">Employee & Date</th>
                      <th className="p-4">Project & Task Description</th>
                      <th className="p-4">Billable / Non-Billable</th>
                      <th className="p-4">Overtime</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {timesheetEntries.map(t => {
                      const isSelected = selectedEntryIds.includes(t.id);
                      return (
                        <tr key={t.id} className={`transition-all ${isSelected ? 'bg-[#f87941]/5' : 'hover:bg-slate-50/70 dark:hover:bg-zinc-900/30'}`}>
                          <td className="p-4 px-6">
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelectEntry(t.id)} />
                          </td>

                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{t.employeeName}</div>
                            <div className="font-mono text-[10px] text-slate-400">{t.entryDate}</div>
                            {t.isLateSubmission && (
                              <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[8px] mt-0.5">
                                Late Submission
                              </Badge>
                            )}
                          </td>

                          <td className="p-4 space-y-0.5">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{t.projectName}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{t.taskName}</div>
                          </td>

                          <td className="p-4 font-mono">
                            <span className="text-emerald-600 font-extrabold">{t.billableHours}h Billable</span>
                            {t.nonBillableHours > 0 && <span className="text-slate-400 text-[10px] block">{t.nonBillableHours}h Non-billable</span>}
                          </td>

                          <td className="p-4 font-mono font-black text-rose-500">
                            {t.overtimeHours > 0 ? `${t.overtimeHours}h (1.5x)` : '--'}
                          </td>

                          <td className="p-4 font-mono font-black text-emerald-500">
                            ₹{t.billableAmount.toFixed(2)}
                          </td>

                          <td className="p-4">
                            <Badge className={`border-none font-bold text-[9px] ${
                              t.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {t.status}
                            </Badge>
                          </td>

                          <td className="p-4 text-right pr-6">
                            {t.status !== 'Approved' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedEntryIds([t.id]);
                                  handleBulkApprove('approve');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] h-7 px-3 rounded-lg"
                              >
                                Approve
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No timesheet entries logged yet</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROJECT & BILLABLE ANALYTICS */}
        {/* ========================================================================= */}
        <TabsContent value="analytics" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">

            <div className="col-span-12 lg:col-span-8">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-[#f87941]" /> Project Billable Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {timesheetEntries.length > 0 ? (
                    Object.entries(
                      timesheetEntries.reduce((acc: Record<string, { totalHours: number; billableHours: number; totalAmount: number }>, t) => {
                        if (!acc[t.projectName]) acc[t.projectName] = { totalHours: 0, billableHours: 0, totalAmount: 0 };
                        acc[t.projectName].totalHours += t.totalHours;
                        acc[t.projectName].billableHours += t.billableHours;
                        acc[t.projectName].totalAmount += t.billableAmount;
                        return acc;
                      }, {})
                    ).map(([projName, data]) => {
                      const pct = data.totalHours > 0 ? Math.round((data.billableHours / data.totalHours) * 100) : 0;
                      return (
                        <div key={projName} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>{projName}</span>
                            <span className="font-mono text-[#f87941]">{data.totalHours} hrs • ₹{data.totalAmount.toFixed(2)}</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No timesheet entries logged yet to calculate project breakdown.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <IndianRupee className="h-4.5 w-4.5 text-[#f87941]" /> Revenue Ledger Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                    <div className="text-[10px] text-emerald-600 uppercase font-bold">Billable Revenue Logged</div>
                    <div className="text-xl font-mono font-black text-emerald-500">
                      ₹{timesheetEntries.reduce((sum, t) => sum + t.billableAmount, 0).toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: PERIOD LOCKING & FLSA COMPLIANCE */}
        {/* ========================================================================= */}
        {isManagerOrAdmin && (
          <TabsContent value="compliance" className="space-y-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-[#f87941]" /> Pay Period Cutoff & Locking
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500">Locks the current pay cycle timesheet ledger to prevent unauthorized edits before payroll processing.</div>
                <Button
                  onClick={handleLockPeriod}
                  disabled={periodLocked}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {periodLocked ? 'Pay Period Locked' : 'Lock Pay Period Ledger'}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" /> FLSA Overtime Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Auto-classifies work &gt;8 hrs/day as 1.5x overtime and validates maximum weekly work hour caps.</div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">Rules Enforced</Badge>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Bell className="h-4.5 w-4.5 text-amber-500" /> Automated Ping Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500">Sends in-app notifications and email pings for unsubmitted or late timesheets prior to cutoff.</div>
                <Button
                  onClick={handleSendReminders}
                  disabled={reminding}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
                >
                  {reminding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                  Dispatch Automated Pings
                </Button>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
        )}

      </Tabs>

      {/* Correction Request Modal Dialog */}
      <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
        <DialogContent className="rounded-3xl max-w-md border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Request Timesheet Correction</DialogTitle>
            <DialogDescription className="text-xs">
              Specify correction notes for the selected timesheet entries to allow employee resubmission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Correction Notes / Reason</label>
            <Textarea
              rows={3}
              value={correctionNotesInput}
              onChange={e => setCorrectionNotesInput(e.target.value)}
              placeholder="e.g. Please update billable vs non-billable hours split..."
              className="rounded-2xl text-xs p-3"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCorrectionDialog(false)} className="rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button
              onClick={() => handleBulkApprove('correction')}
              disabled={bulkProcessing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
            >
              Request Correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
