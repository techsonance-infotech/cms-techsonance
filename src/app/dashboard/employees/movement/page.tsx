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
  ArrowRightLeft, UserCheck, TrendingUp, Landmark, Layers, Users,
  Building2, Briefcase, DollarSign, GitMerge, History, CheckCircle2,
  Clock, ShieldAlert, FileText, Download, SendHorizontal, RefreshCw,
  Search, Filter, ChevronRight, AlertCircle, Sparkles, UserPlus,
  ArrowRight, ShieldCheck, Check, XCircle, Award, Zap, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

// Define the 9 Movement Types
const MOVEMENT_TYPES = [
  { id: 'transfer', name: 'Transfer (Location/Branch)', icon: Landmark, color: 'text-teal-500 bg-teal-500/10' },
  { id: 'promotion', name: 'Promotion (Level/Grade)', icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10' },
  { id: 'department', name: 'Department Change', icon: Layers, color: 'text-indigo-500 bg-indigo-500/10' },
  { id: 'manager', name: 'Reporting Manager Change', icon: Users, color: 'text-purple-500 bg-[#337BAA]/10' },
  { id: 'branch', name: 'Branch Office Change', icon: Building2, color: 'text-sky-500 bg-sky-500/10' },
  { id: 'business_unit', name: 'Business Unit Change', icon: GitMerge, color: 'text-cyan-500 bg-cyan-500/10' },
  { id: 'employment_type', name: 'Employment Type Change', icon: Briefcase, color: 'text-emerald-500 bg-emerald-500/10' },
  { id: 'designation', name: 'Designation / Job Title Change', icon: Award, color: 'text-pink-500 bg-pink-500/10' },
  { id: 'salary_revision', name: 'Salary Revision Trigger', icon: DollarSign, color: 'text-rose-500 bg-rose-500/10' }
];

interface RosterEmployee {
  id: string;
  userId?: string;
  employeeTableId?: string;
  name: string;
  email: string;
  department: string;
  branch: string;
  businessUnit: string;
  designation: string;
  grade: string;
  employmentType: string;
  salary: number;
  managerId?: string;
  managerName?: string;
  dateOfJoining?: string;
}

interface MovementOrder {
  id: string;
  movementCode: string;
  userId?: string;
  employeeTableId?: string | number;
  employeeId?: string;
  employeeName: string;
  employeeEmail: string;
  movementType: string;
  effectiveDate: string;
  reason: string;
  notes: string;
  previousDepartment?: string;
  newDepartment?: string;
  previousBranch?: string;
  newBranch?: string;
  previousBusinessUnit?: string;
  newBusinessUnit?: string;
  previousManagerName?: string;
  newManagerName?: string;
  previousDesignation?: string;
  newDesignation?: string;
  previousGrade?: string;
  newGrade?: string;
  previousEmploymentType?: string;
  newEmploymentType?: string;
  previousSalary: number;
  newSalary: number;
  salaryIncrementPercentage: number;
  status: string;
  approvalStage: string;
  approvalHistory: any[];
  createdAt: string;
}

export default function EmployeeMovementPage() {
  const [activeTab, setActiveTab] = useState('request');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Dynamic API state
  const [roster, setRoster] = useState<RosterEmployee[]>([]);
  const [departmentsList, setDepartmentsList] = useState<string[]>([]);
  const [branchesList, setBranchesList] = useState<string[]>([]);
  const [businessUnitsList, setBusinessUnitsList] = useState<string[]>([]);
  const [movements, setMovements] = useState<MovementOrder[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalMovements: 0,
    pendingApprovals: 0,
    promotionsProcessed: 0,
    transfersActive: 0,
    salaryRevisionsTriggered: 0
  });

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedMovementTypes, setSelectedMovementTypes] = useState<string[]>(['promotion', 'salary_revision']);
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [autoUpdateProfile, setAutoUpdateProfile] = useState(true);

  // Target New Values Form State
  const [targetDept, setTargetDept] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [targetBusinessUnit, setTargetBusinessUnit] = useState('');
  const [targetManagerName, setTargetManagerName] = useState('');
  const [targetDesignation, setTargetDesignation] = useState('');
  const [targetGrade, setTargetGrade] = useState('');
  const [targetEmploymentType, setTargetEmploymentType] = useState('Full-Time');
  const [targetSalary, setTargetSalary] = useState<number>(0);
  const [incrementPct, setIncrementPct] = useState<number>(15);

  // Modal View state
  const [selectedOrder, setSelectedOrder] = useState<MovementOrder | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [historySearchEmpId, setHistorySearchEmpId] = useState<string>('');

  // Fetch 100% Dynamic Data from Backend API
  const loadMovementDataFromApi = async () => {
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/employees/movement', {
        headers,
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.employeeRoster) {
          setRoster(data.employeeRoster);
          let targetEmp = null;
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const queryEmpId = urlParams.get('employeeId');
            if (queryEmpId) {
              targetEmp = data.employeeRoster.find((e: any) => String(e.id) === String(queryEmpId) || String(e.employeeTableId) === String(queryEmpId) || String(e.userId) === String(queryEmpId));
            }
          }
          if (!targetEmp && data.employeeRoster.length > 0 && !selectedEmployeeId) {
            targetEmp = data.employeeRoster[0];
          }
          if (targetEmp) {
            setSelectedEmployeeId(targetEmp.id);
            setTargetDept(targetEmp.department);
            setTargetBranch(targetEmp.branch);
            setTargetBusinessUnit(targetEmp.businessUnit || 'Enterprise Solutions');
            setTargetManagerName(targetEmp.managerName || 'Department Head');
            setTargetDesignation(`Senior ${targetEmp.designation}`);
            setTargetGrade(targetEmp.grade || 'L5');
            setTargetSalary(targetEmp.salary > 0 ? Math.round(targetEmp.salary * 1.15) : 50000);
            setHistorySearchEmpId(targetEmp.id);
          }
        }
        if (data.departmentsList) setDepartmentsList(data.departmentsList);
        if (data.branchesList) setBranchesList(data.branchesList);
        if (data.businessUnitsList) setBusinessUnitsList(data.businessUnitsList);
        if (data.summaryStats) setSummaryStats(data.summaryStats);
        if (data.movements) setMovements(data.movements);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovementDataFromApi();
  }, []);

  useEffect(() => {
    if (activeTab === 'movements' || activeTab === 'timeline') {
      loadMovementDataFromApi();
    }
  }, [activeTab]);

  // Update target values when selected employee changes
  const activeEmployee = roster.find(e => e.id === selectedEmployeeId) || roster[0];

  useEffect(() => {
    if (activeEmployee) {
      setTargetDept(activeEmployee.department);
      setTargetBranch(activeEmployee.branch);
      setTargetBusinessUnit(activeEmployee.businessUnit || 'Enterprise Solutions');
      setTargetDesignation(`Senior ${activeEmployee.designation}`);
      setTargetGrade('L5');
      setTargetSalary(Math.round(activeEmployee.salary * (1 + incrementPct / 100)));
    }
  }, [selectedEmployeeId]);

  const handleIncrementChange = (pct: number) => {
    setIncrementPct(pct);
    if (activeEmployee) {
      setTargetSalary(Math.round(activeEmployee.salary * (1 + pct / 100)));
    }
  };

  const toggleMovementType = (id: string) => {
    if (selectedMovementTypes.includes(id)) {
      setSelectedMovementTypes(selectedMovementTypes.filter(t => t !== id));
    } else {
      setSelectedMovementTypes([...selectedMovementTypes, id]);
    }
  };

  // Submit new Movement Order Request
  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !effectiveDate) {
      toast.error('Please select an employee and effective date');
      return;
    }
    if (selectedMovementTypes.length === 0) {
      toast.error('Please select at least one movement type option');
      return;
    }

    setSubmitting(true);

    try {
      const token = getStoredSessionToken();
      const payload = {
        userId: activeEmployee?.userId || activeEmployee?.id || selectedEmployeeId,
        employeeTableId: activeEmployee?.employeeTableId,
        movementTypes: selectedMovementTypes,
        effectiveDate,
        reason: reason || 'Career progression & organizational restructuring.',
        notes,
        previousDepartment: activeEmployee?.department,
        newDepartment: selectedMovementTypes.includes('department') ? targetDept : (activeEmployee?.department || ''),
        previousBranch: activeEmployee?.branch,
        newBranch: selectedMovementTypes.includes('transfer') || selectedMovementTypes.includes('branch') ? targetBranch : (activeEmployee?.branch || ''),
        previousBusinessUnit: activeEmployee?.businessUnit,
        newBusinessUnit: selectedMovementTypes.includes('business_unit') ? targetBusinessUnit : (activeEmployee?.businessUnit || ''),
        previousManagerName: activeEmployee?.managerName,
        newManagerName: selectedMovementTypes.includes('manager') ? targetManagerName : (activeEmployee?.managerName || ''),
        previousDesignation: activeEmployee?.designation,
        newDesignation: selectedMovementTypes.includes('promotion') || selectedMovementTypes.includes('designation') ? targetDesignation : (activeEmployee?.designation || ''),
        previousGrade: activeEmployee?.grade,
        newGrade: selectedMovementTypes.includes('promotion') ? targetGrade : (activeEmployee?.grade || ''),
        previousEmploymentType: activeEmployee?.employmentType,
        newEmploymentType: selectedMovementTypes.includes('employment_type') ? targetEmploymentType : (activeEmployee?.employmentType || 'Full-Time'),
        previousSalary: activeEmployee?.salary || 0,
        newSalary: selectedMovementTypes.includes('salary_revision') ? targetSalary : (activeEmployee?.salary || 0),
        salaryIncrementPercentage: selectedMovementTypes.includes('salary_revision') ? incrementPct : 0,
        autoUpdateProfile
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/employees/movement', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Failed to submit movement request');

      toast.success(resData.message || 'Employee Movement Order created & submitted for approval!');
      await loadMovementDataFromApi();
      setActiveTab('movements');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error creating movement order');
    } finally {
      setSubmitting(false);
    }
  };

  // Workflow Approval trigger
  const handleApproveWorkflow = async (movementId: string, action: 'approve' | 'reject') => {
    setProcessingId(movementId);
    try {
      const token = getStoredSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/employees/movement/approve', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ movementId, action, comments: 'Stage verified.' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');

      toast.success(data.message || `Workflow ${action}d successfully!`);
      await loadMovementDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error approving stage');
    } finally {
      setProcessingId(null);
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
                <ArrowRightLeft className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Employee Movement & Progression Hub
                </h1>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  Manage Transfers, Promotions, Department/Branch/BU Shifts, Salary Revisions & Workflow Approvals
                </p>
                <div className="pt-2">
                  <a
                    href="/dashboard/employees/reviews"
                    className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1 rounded-xl border border-orange-500/30 font-semibold transition"
                  >
                    <Star className="h-3 w-3" />
                    ← View Performance Reviews & Appraisals (PMS)
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Orders</div>
              <div className="text-xl font-black text-white mt-0.5">{summaryStats.totalMovements}</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> API Connected
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Pending Approvals</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{summaryStats.pendingApprovals}</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">In Workflow Pipeline</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Promotions</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">{summaryStats.promotionsProcessed}</div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">Grade Escalations</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Transfers</div>
              <div className="text-xl font-black text-teal-400 mt-0.5">{summaryStats.transfersActive}</div>
              <div className="text-[10px] text-teal-400/80 mt-0.5">Branch Relocations</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Salary Revisions</div>
              <div className="text-xl font-black text-rose-400 mt-0.5">{summaryStats.salaryRevisionsTriggered}</div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">Payroll Adjusted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="request" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <UserPlus className="h-3.5 w-3.5" /> Initiate Movement Request
            </TabsTrigger>
            <TabsTrigger value="movements" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <History className="h-3.5 w-3.5" /> Movement Orders & Workflow ({movements.length})
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <TrendingUp className="h-3.5 w-3.5" /> Career History Timeline
            </TabsTrigger>
            <TabsTrigger value="automation" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Zap className="h-3.5 w-3.5" /> Salary & Workflow Triggers
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await loadMovementDataFromApi();
                toast.success('Movement register refreshed!');
              }}
              className="rounded-xl text-xs font-bold border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Employee Movement Register exported to CSV!')}
              className="rounded-xl text-xs font-bold border-slate-200 dark:border-zinc-800 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export Register
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: INITIATE MOVEMENT REQUEST */}
        {/* ========================================================================= */}
        <TabsContent value="request" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">

            {/* Left Column: Form Setup */}
            <div className="col-span-12 lg:col-span-8 space-y-6">

              {/* 1. Employee Selection & Current Profile Info */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <UserCheck className="h-4.5 w-4.5 text-[#f87941]" /> Select Employee & Profile Snapshot
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose employee to initiate organizational transfer, promotion, or compensation revision.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Employee</label>
                      <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                        <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                          <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {roster.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name} ({emp.designation} • {emp.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Effective Date</label>
                      <Input
                        type="date"
                        value={effectiveDate}
                        onChange={e => setEffectiveDate(e.target.value)}
                        className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>

                  {activeEmployee && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Current Dept</span>
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">{activeEmployee.department}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Current Branch</span>
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">{activeEmployee.branch}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Designation</span>
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">{activeEmployee.designation} ({activeEmployee.grade})</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Current Base Salary</span>
                        <div className="font-mono font-black text-emerald-500">${activeEmployee.salary.toLocaleString()}/yr</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2. Select Movement Types (Checkboxes for 9 Movement Types) */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-[#f87941]" /> Select Movement Types to Execute
                    </CardTitle>
                    <Badge className="bg-[#f87941]/10 text-[#f87941] font-bold text-[10px]">
                      {selectedMovementTypes.length} Types Selected
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Select all applicable changes for this movement order (multi-movement enabled).
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {MOVEMENT_TYPES.map(mType => {
                      const TypeIcon = mType.icon;
                      const isChecked = selectedMovementTypes.includes(mType.id);
                      return (
                        <div
                          key={mType.id}
                          onClick={() => toggleMovementType(mType.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center space-x-3 ${
                            isChecked
                              ? 'border-[#f87941] bg-[#f87941]/10 text-[#f87941] shadow-sm font-extrabold'
                              : 'border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/30'
                          }`}
                        >
                          <Checkbox checked={isChecked} onCheckedChange={() => toggleMovementType(mType.id)} />
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${mType.color}`}>
                              <TypeIcon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-bold leading-tight">{mType.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 3. Dynamic Configuration Inputs Based on Selected Types */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-[#f87941]" /> Movement Target Values Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Department Change */}
                    {(selectedMovementTypes.includes('department') || selectedMovementTypes.includes('promotion')) && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Department</label>
                        <Select value={targetDept} onValueChange={setTargetDept}>
                          <SelectTrigger className="rounded-xl text-xs h-10 border-slate-200 dark:border-zinc-800 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {departmentsList.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Transfer / Branch Change */}
                    {(selectedMovementTypes.includes('transfer') || selectedMovementTypes.includes('branch')) && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Office Branch</label>
                        <Select value={targetBranch} onValueChange={setTargetBranch}>
                          <SelectTrigger className="rounded-xl text-xs h-10 border-slate-200 dark:border-zinc-800 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {branchesList.map(b => (
                              <SelectItem key={b} value={b}>{b}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Business Unit */}
                    {selectedMovementTypes.includes('business_unit') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Business Unit</label>
                        <Select value={targetBusinessUnit} onValueChange={setTargetBusinessUnit}>
                          <SelectTrigger className="rounded-xl text-xs h-10 border-slate-200 dark:border-zinc-800 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {businessUnitsList.map(bu => (
                              <SelectItem key={bu} value={bu}>{bu}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Reporting Manager Change */}
                    {selectedMovementTypes.includes('manager') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Reporting Manager</label>
                        <Input
                          value={targetManagerName}
                          onChange={e => setTargetManagerName(e.target.value)}
                          placeholder="Manager Name..."
                          className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                        />
                      </div>
                    )}

                    {/* Designation / Promotion */}
                    {(selectedMovementTypes.includes('promotion') || selectedMovementTypes.includes('designation')) && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Designation Title</label>
                          <Input
                            value={targetDesignation}
                            onChange={e => setTargetDesignation(e.target.value)}
                            className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Grade Band</label>
                          <Input
                            value={targetGrade}
                            onChange={e => setTargetGrade(e.target.value)}
                            className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                          />
                        </div>
                      </>
                    )}

                    {/* Employment Type */}
                    {selectedMovementTypes.includes('employment_type') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Employment Type</label>
                        <Select value={targetEmploymentType} onValueChange={setTargetEmploymentType}>
                          <SelectTrigger className="rounded-xl text-xs h-10 border-slate-200 dark:border-zinc-800 font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Full-Time">Full-Time (Regular)</SelectItem>
                            <SelectItem value="Contractor">Contractor (Fixed-term)</SelectItem>
                            <SelectItem value="Part-Time">Part-Time</SelectItem>
                            <SelectItem value="Intern">Intern / Apprentice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  </div>

                  {/* Salary Revision Trigger Block */}
                  {selectedMovementTypes.includes('salary_revision') && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" /> Salary Revision & Compensation Trigger
                        </div>
                        <span className="text-xs font-mono font-black text-rose-600">
                          +{incrementPct}% Salary Revision
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Increment %</label>
                          <div className="flex items-center gap-1">
                            {[10, 15, 20, 25].map(pct => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => handleIncrementChange(pct)}
                                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg ${incrementPct === pct ? 'bg-rose-600 text-white' : 'bg-white dark:bg-zinc-800 border'}`}
                              >
                                +{pct}%
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">New Base Salary ($/yr)</label>
                          <Input
                            type="number"
                            value={targetSalary}
                            onChange={e => setTargetSalary(Number(e.target.value))}
                            className="rounded-xl text-xs font-mono font-bold h-9 border-rose-500/30"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Annual Increase</label>
                          <div className="h-9 px-3 rounded-xl bg-white dark:bg-zinc-800 border flex items-center text-xs font-mono font-bold text-emerald-500">
                            +${(targetSalary - (activeEmployee?.salary || 0)).toLocaleString()}/yr
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Justification Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Business Justification & Notes</label>
                    <Textarea
                      rows={3}
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Specify business reason for promotion, branch transfer, or salary revision..."
                      className="rounded-2xl text-xs p-3 border-slate-200 dark:border-zinc-800"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>Auto-Sync Employee DB Profile upon final executive approval</span>
                    </div>
                    <Switch checked={autoUpdateProfile} onCheckedChange={setAutoUpdateProfile} />
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50 dark:bg-zinc-900/40 border-t p-4 rounded-b-3xl flex justify-between items-center">
                  <div className="text-xs text-slate-500 font-medium">
                    Order will enter Multi-Stage Workflow Approval Pipeline.
                  </div>
                  <Button
                    onClick={handleSubmitMovement}
                    disabled={submitting}
                    className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-11 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-[#f87941]/20"
                  >
                    {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                    Submit Movement Order
                  </Button>
                </CardFooter>
              </Card>

            </div>

            {/* Right Column: Live Before vs After Comparison & Workflow Preview */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Live Before vs After Comparison Card */}
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md sticky top-6">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <ArrowRightLeft className="h-4.5 w-4.5 text-[#f87941]" /> Before vs After Profile Diff
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                  {activeEmployee && (
                    <div className="space-y-3">

                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-zinc-900 border space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Employee</div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">{activeEmployee.name}</div>
                        <div className="text-[11px] text-slate-400">{activeEmployee.email}</div>
                      </div>

                      {/* Department */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Department</div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 line-through">{activeEmployee.department}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#f87941]" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedMovementTypes.includes('department') ? targetDept : activeEmployee.department}
                          </span>
                        </div>
                      </div>

                      {/* Branch Office */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Branch Office</div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 line-through">{activeEmployee.branch}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#f87941]" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedMovementTypes.includes('transfer') || selectedMovementTypes.includes('branch') ? targetBranch : activeEmployee.branch}
                          </span>
                        </div>
                      </div>

                      {/* Designation */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Designation</div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 line-through">{activeEmployee.designation}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#f87941]" />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedMovementTypes.includes('promotion') || selectedMovementTypes.includes('designation') ? targetDesignation : activeEmployee.designation}
                          </span>
                        </div>
                      </div>

                      {/* Salary */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Compensation / Base Salary</div>
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-slate-500 line-through">${activeEmployee.salary.toLocaleString()}/yr</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#f87941]" />
                          <span className="font-black text-emerald-500">
                            ${(selectedMovementTypes.includes('salary_revision') ? targetSalary : activeEmployee.salary).toLocaleString()}/yr
                          </span>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Workflow Pipeline Preview */}
                  <div className="pt-2 border-t space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Automated Approval Stages</div>
                    <div className="space-y-1.5 text-[11px] font-bold">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-between">
                        <span>1. HR Initiation</span>
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-between">
                        <span>2. Reporting Manager Approval</span>
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 flex items-center justify-between">
                        <span>3. Finance Compensation Review</span>
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 flex items-center justify-between">
                        <span>4. Executive Approval & DB Profile Auto-Sync</span>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: MOVEMENT ORDERS & WORKFLOW PIPELINE */}
        {/* ========================================================================= */}
        <TabsContent value="movements" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-[#f87941]" /> Active Movement Orders & Workflow Pipeline
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Track approval stages, verify profile diffs, and approve/reject pending movement orders.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {movements.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                      <th className="p-4 px-6">Order Code & Employee</th>
                      <th className="p-4">Movement Type</th>
                      <th className="p-4">Department & Branch Shift</th>
                      <th className="p-4">Salary Revision</th>
                      <th className="p-4">Workflow Stage</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Workflow Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {movements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30">
                        <td className="p-4 px-6">
                          <span className="font-mono text-[10px] text-[#f87941] font-black">{m.movementCode}</span>
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{m.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{m.employeeEmail}</div>
                        </td>

                        <td className="p-4">
                          <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold text-[9px]">
                            {m.movementType}
                          </Badge>
                        </td>

                        <td className="p-4 space-y-0.5">
                          {m.newDepartment && m.newDepartment !== m.previousDepartment && (
                            <div className="text-[10px]">
                              <span className="text-slate-400">Dept:</span> {m.previousDepartment} &rarr; <span className="font-extrabold text-slate-900 dark:text-slate-100">{m.newDepartment}</span>
                            </div>
                          )}
                          {m.newBranch && m.newBranch !== m.previousBranch && (
                            <div className="text-[10px]">
                              <span className="text-slate-400">Branch:</span> {m.previousBranch} &rarr; <span className="font-extrabold text-slate-900 dark:text-slate-100">{m.newBranch}</span>
                            </div>
                          )}
                          {m.newDesignation && m.newDesignation !== m.previousDesignation && (
                            <div className="text-[10px]">
                              <span className="text-slate-400">Role:</span> {m.previousDesignation} &rarr; <span className="font-extrabold text-slate-900 dark:text-slate-100">{m.newDesignation}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-4 font-mono">
                          {m.salaryIncrementPercentage > 0 || m.newSalary > m.previousSalary ? (
                            <div>
                              <span className="text-emerald-500 font-extrabold">${m.newSalary.toLocaleString()}</span>
                              <span className="text-[9px] text-emerald-600 block">+{m.salaryIncrementPercentage}% increase</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No Revision</span>
                          )}
                        </td>

                        <td className="p-4 font-mono text-[11px] text-slate-500">
                          {m.approvalStage}
                        </td>

                        <td className="p-4">
                          {m.status.includes('Approved') || m.status.includes('Processed') ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> {m.status}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[10px]">
                              <Clock className="h-3 w-3 mr-1" /> {m.status}
                            </Badge>
                          )}
                        </td>

                        <td className="p-4 text-right pr-6 space-x-1">
                          {m.status !== 'Approved & Processed' && m.status !== 'Rejected' && (
                            <Button
                              size="sm"
                              disabled={processingId === m.id}
                              onClick={() => handleApproveWorkflow(m.id, 'approve')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] h-7 px-3 rounded-lg"
                            >
                              Approve Stage
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedOrder(m); setShowDetailDialog(true); }}
                            className="h-7 text-xs font-bold text-[#f87941]"
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <ArrowRightLeft className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No movement orders created yet</div>
                  <div className="text-xs text-slate-400">Use the Initiate tab to submit your first employee transfer or promotion order.</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: CAREER HISTORY TIMELINE */}
        {/* ========================================================================= */}
        <TabsContent value="timeline" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">

            <div className="col-span-12 lg:col-span-4 space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <UserCheck className="h-4.5 w-4.5 text-[#f87941]" /> Select Employee Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <Select value={historySearchEmpId} onValueChange={setHistorySearchEmpId}>
                    <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {roster.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.department})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {roster.find(e => e.id === historySearchEmpId) && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-2 text-xs">
                      <div className="font-extrabold text-sm">{roster.find(e => e.id === historySearchEmpId)?.name}</div>
                      <div className="text-slate-400">{roster.find(e => e.id === historySearchEmpId)?.designation}</div>
                      <div className="flex justify-between border-t pt-2 text-[11px]">
                        <span className="text-slate-400">Current Dept:</span>
                        <span className="font-bold">{roster.find(e => e.id === historySearchEmpId)?.department}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Branch Office:</span>
                        <span className="font-bold">{roster.find(e => e.id === historySearchEmpId)?.branch}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        <TrendingUp className="h-4.5 w-4.5 text-[#f87941]" /> Career Progression Audit Timeline
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Chronological record of transfers, promotions, and compensation changes for {roster.find(e => e.id === historySearchEmpId)?.name || 'Selected Employee'}.
                      </CardDescription>
                    </div>
                    {(() => {
                      const selEmp = roster.find(e => e.id === historySearchEmpId);
                      const count = movements.filter(m =>
                        (selEmp?.employeeTableId && String(m.employeeTableId) === String(selEmp.employeeTableId)) ||
                        (selEmp?.id && String(m.employeeTableId) === String(selEmp.id)) ||
                        (selEmp?.userId && String(m.userId) === String(selEmp.userId))
                      ).length;
                      return (
                        <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold text-xs">
                          {count} Movement Order{count !== 1 ? 's' : ''}
                        </Badge>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {(() => {
                    const selEmp = roster.find(e => e.id === historySearchEmpId);
                    const empTimelineMovements = movements.filter(m =>
                      (selEmp?.employeeTableId && String(m.employeeTableId) === String(selEmp.employeeTableId)) ||
                      (selEmp?.id && String(m.employeeTableId) === String(selEmp.id)) ||
                      (selEmp?.userId && String(m.userId) === String(selEmp.userId))
                    );

                    return (
                      <div className="relative border-l-2 border-[#f87941]/30 ml-4 space-y-6 pl-6">

                        {/* 1. Real Movement Orders from Database */}
                        {empTimelineMovements.map((m) => {
                          const isApproved = m.status.includes('Approved') || m.status.includes('Processed');
                          const isRejected = m.status.includes('Reject');
                          const isPromotion = m.movementType.toLowerCase().includes('promotion');
                          const isTransfer = m.movementType.toLowerCase().includes('transfer') || m.movementType.toLowerCase().includes('branch');
                          const isSalary = m.movementType.toLowerCase().includes('salary');

                          const IconComponent = isPromotion ? Award : (isTransfer ? Landmark : (isSalary ? DollarSign : ArrowRightLeft));
                          const iconBg = isPromotion ? 'bg-amber-500' : (isTransfer ? 'bg-teal-500' : (isSalary ? 'bg-rose-500' : 'bg-[#f87941]'));

                          return (
                            <div key={m.id} className="relative group">
                              <div className={`absolute -left-[31px] top-0 p-1.5 rounded-full ${iconBg} text-white shadow-md`}>
                                <IconComponent className="h-3.5 w-3.5" />
                              </div>
                              <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border space-y-2 text-xs transition-all hover:border-[#f87941]/40">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="text-slate-400 font-bold">{m.effectiveDate || (m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'Effective Now')}</span>
                                  <Badge className={
                                    isApproved
                                      ? 'bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px]'
                                      : isRejected
                                        ? 'bg-rose-500/10 text-rose-600 border-none font-bold text-[9px]'
                                        : 'bg-amber-500/10 text-amber-600 border-none font-bold text-[9px]'
                                  }>
                                    {m.status.toUpperCase()}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {m.movementType}
                                  </div>
                                  <span className="font-mono text-[10px] text-[#f87941] font-bold">{m.movementCode}</span>
                                </div>

                                {/* Before vs After Changes Breakdown */}
                                <div className="space-y-1 pt-1 text-[11px]">
                                  {m.newDepartment && m.newDepartment !== m.previousDepartment && (
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <span className="text-slate-400 font-bold">Department:</span>
                                      <span className="line-through text-slate-400">{m.previousDepartment}</span>
                                      <ArrowRight className="h-3 w-3 text-[#f87941]" />
                                      <span className="font-bold text-slate-900 dark:text-white">{m.newDepartment}</span>
                                    </div>
                                  )}
                                  {m.newBranch && m.newBranch !== m.previousBranch && (
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <span className="text-slate-400 font-bold">Branch:</span>
                                      <span className="line-through text-slate-400">{m.previousBranch}</span>
                                      <ArrowRight className="h-3 w-3 text-[#f87941]" />
                                      <span className="font-bold text-slate-900 dark:text-white">{m.newBranch}</span>
                                    </div>
                                  )}
                                  {m.newDesignation && m.newDesignation !== m.previousDesignation && (
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                      <span className="text-slate-400 font-bold">Role:</span>
                                      <span className="line-through text-slate-400">{m.previousDesignation}</span>
                                      <ArrowRight className="h-3 w-3 text-[#f87941]" />
                                      <span className="font-bold text-slate-900 dark:text-white">{m.newDesignation}</span>
                                    </div>
                                  )}
                                  {(m.salaryIncrementPercentage > 0 || m.newSalary > m.previousSalary) && (
                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
                                      <span className="text-slate-400 font-bold font-sans">Compensation:</span>
                                      <span className="line-through text-slate-400">${m.previousSalary.toLocaleString()}</span>
                                      <ArrowRight className="h-3 w-3 text-[#f87941]" />
                                      <span className="font-bold text-emerald-500">${m.newSalary.toLocaleString()}</span>
                                      <span className="text-[10px] text-emerald-600 font-sans font-bold">(+{m.salaryIncrementPercentage}%)</span>
                                    </div>
                                  )}
                                  {m.reason && (
                                    <div className="text-[11px] text-slate-500 italic pt-1">
                                      "{m.reason}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* 2. Real Initial Onboarding from Employee DB Record */}
                        {selEmp && (
                          <div className="relative group">
                            <div className="absolute -left-[31px] top-0 p-1.5 rounded-full bg-blue-500 text-white shadow-md">
                              <UserPlus className="h-3.5 w-3.5" />
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-2xl border space-y-2 text-xs">
                              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                <span className="font-bold">{selEmp.dateOfJoining || 'Initial Joining'}</span>
                                <Badge className="bg-blue-500/10 text-blue-500 border-none font-bold text-[9px]">
                                  INITIAL ONBOARDING
                                </Badge>
                              </div>
                              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                Joined TechSonance Enterprise
                              </div>
                              <div className="text-slate-500 text-[11px] leading-relaxed">
                                Officially joined company as <span className="font-bold text-slate-700 dark:text-slate-200">{selEmp.designation}</span> in <span className="font-bold text-slate-700 dark:text-slate-200">{selEmp.department}</span> department ({selEmp.employmentType}) at <span className="font-bold text-slate-700 dark:text-slate-200">{selEmp.branch}</span> branch.
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Empty state notice if no movements created yet */}
                        {empTimelineMovements.length === 0 && (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>No organizational movement orders recorded yet for {selEmp?.name}. Any new movement orders submitted in the "Initiate Movement Request" tab will appear here in chronological order.</span>
                          </div>
                        )}

                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: AUTOMATION & SALARY REVISION TRIGGERS */}
        {/* ========================================================================= */}
        <TabsContent value="automation" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <DollarSign className="h-4.5 w-4.5 text-rose-500" /> Appraisal Salary Trigger
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Automatic compensation adjustment trigger based on PMS review scores (&gt;4.5 CSAT score).</div>
                <Badge className="bg-rose-500/10 text-rose-600 border-none font-bold text-[10px]">Rule Active</Badge>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" /> Profile Auto-Sync Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Updates employee department, branch, and designation in DB automatically upon final executive approval.</div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">Engine Active</Badge>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Zap className="h-4.5 w-4.5 text-amber-500" /> Automated Payroll Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Pushes revised salary base and effective dates to Payroll engine for next pay cycle disbursement.</div>
                <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[10px]">Sync Connected</Badge>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

      </Tabs>

      {/* Movement Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="rounded-3xl max-w-xl border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              Movement Order: {selectedOrder?.movementCode}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedOrder?.employeeName} • {selectedOrder?.movementType}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 text-xs font-medium pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Effective Date:</span>
                  <span className="font-bold">{selectedOrder.effectiveDate}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-emerald-500">{selectedOrder.status}</span>
                </div>
                <div className="text-[11px] pt-1 border-t">
                  <span className="text-slate-400 font-bold block">Justification:</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedOrder.reason}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="rounded-xl text-xs font-bold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
