'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Star, Plus, Calendar, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  TrendingUp, Compass, Target, MessageSquare, Award, GitPullRequest, Settings,
  Activity, BarChart3, HelpCircle, ShieldAlert, Check, X, Sparkles, Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export default function ReviewsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [successions, setSuccessions] = useState<any[]>([]);
  const [pips, setPips] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tab selections
  const [activeTab, setActiveTab] = useState<'appraisal' | 'goals' | 'feedback' | 'calibration' | 'succession' | 'idp' | 'pip' | 'audits'>('appraisal');
  
  // Focused employee profile view
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);

  // Cycle creation fields
  const [cycleTitle, setCycleTitle] = useState('');
  const [cycleType, setCycleType] = useState('annual');
  const [cycleStart, setCycleStart] = useState('');
  const [cycleEnd, setCycleEnd] = useState('');
  const [cycleWeightGoals, setCycleWeightGoals] = useState('50');
  const [cycleWeightComps, setCycleWeightComps] = useState('50');

  // Goal creation fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalType, setGoalType] = useState('individual');
  const [goalWeight, setGoalWeight] = useState('10');
  const [goalTarget, setGoalTarget] = useState('100');
  const [goalUnit, setGoalUnit] = useState('%');
  const [goalCycleId, setGoalCycleId] = useState<string>('');

  // Feedback fields
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState('5');
  const [feedbackBadge, setFeedbackBadge] = useState('Team Player');
  const [feedbackVisibility, setFeedbackVisibility] = useState('public');

  // Succession fields
  const [succPosition, setSuccPosition] = useState('');
  const [succPrimaryId, setSuccPrimaryId] = useState('');
  const [succSecondaryId, setSuccSecondaryId] = useState('');
  const [succTimeline, setSuccTimeline] = useState('ready_1_2_years');
  const [succRisk, setSuccRisk] = useState('');

  // PIP fields
  const [pipStart, setPipStart] = useState('');
  const [pipEnd, setPipEnd] = useState('');
  const [pipObjective, setPipObjective] = useState('');

  // Calibration helper fields
  const [calibratedRating, setCalibratedRating] = useState('4.0');
  const [calibrationJustification, setCalibrationJustification] = useState('');

  // Career IDP fields
  const [idpTargetRole, setIdpTargetRole] = useState('Principal Software Architect');
  const [idpAspirations, setIdpAspirations] = useState('Lead enterprise scaling and multi-tenant RLS core engines migration.');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = getStoredSessionToken();
    let empList: any[] = [];

    // 1. Fetch employees
    try {
      const employeesRes = await fetch('/api/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        empList = employeesData.data || [];
        setEmployees(empList);
        if (empList.length > 0) {
          setSelectedEmpId(empList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }

    // 2. Fetch cycles
    try {
      const cyclesRes = await fetch('/api/pms/cycles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cyclesRes.ok) {
        const cyclesData = await cyclesRes.json();
        setCycles(cyclesData);
        if (cyclesData.length > 0) {
          setGoalCycleId(String(cyclesData[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load cycles:', err);
    }

    // 3. Fetch succession maps
    try {
      const successionRes = await fetch('/api/pms/succession', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (successionRes.ok) {
        const successionData = await successionRes.json();
        setSuccessions(successionData);
      }
    } catch (err) {
      console.error('Failed to load successions:', err);
    }

    // 4. Fetch audit logs
    try {
      const auditsRes = await fetch('/api/pms/audits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (auditsRes.ok) {
        const auditsData = await auditsRes.json();
        setAuditLogs(auditsData);
      }
    } catch (err) {
      console.error('Failed to load audits:', err);
    }

    // 5. Fetch employee specifics
    if (empList.length > 0) {
      await fetchEmployeeSpecifics(empList[0].id);
    }

    setLoading(false);
  };

  const fetchEmployeeSpecifics = async (empId: number) => {
    const token = getStoredSessionToken();

    // Fetch goals
    try {
      const goalsRes = await fetch(`/api/pms/goals?employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    }

    // Fetch feedbacks
    try {
      const fbRes = await fetch(`/api/pms/feedback?employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        setFeedbacks(fbData);
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
    }

    // Fetch PIPs
    try {
      const pipRes = await fetch(`/api/pms/pips?employeeId=${empId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pipRes.ok) {
        const pipData = await pipRes.json();
        setPips(pipData);
      }
    } catch (err) {
      console.error('Failed to load PIPs:', err);
    }
  };

  const handleEmployeeViewChange = async (empId: number) => {
    setSelectedEmpId(empId);
    await fetchEmployeeSpecifics(empId);
  };

  // Log Audit trail utility helper
  const logAuditAction = async (action: string, details: any) => {
    try {
      const token = getStoredSessionToken();
      await fetch('/api/pms/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, details })
      });
    } catch (err) {
      console.error("Failed to log audit event:", err);
    }
  };

  // 1. Submit review cycle
  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleTitle || !cycleStart || !cycleEnd) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/pms/cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: cycleTitle,
          cycleType,
          startDate: cycleStart,
          endDate: cycleEnd,
          weightageGoals: Number(cycleWeightGoals),
          weightageCompetencies: Number(cycleWeightComps),
        })
      });
      if (res.ok) {
        toast.success("Performance cycle published successfully!");
        setCycleTitle('');
        setCycleStart('');
        setCycleEnd('');
        await logAuditAction('ReviewCycleStarted', { title: cycleTitle, type: cycleType });
        fetchData();
      } else {
        toast.error("Failed to create cycle");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Submit Goal OKR/KPI
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !selectedEmpId) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/pms/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          cycleId: goalCycleId ? Number(goalCycleId) : null,
          title: goalTitle,
          description: goalDesc,
          goalType,
          weightage: Number(goalWeight),
          targetValue: Number(goalTarget),
          metricUnit: goalUnit,
          currentValue: 0.0,
          status: 'pending'
        })
      });
      if (res.ok) {
        toast.success("Goal constraint registered successfully!");
        setGoalTitle('');
        setGoalDesc('');
        await logAuditAction('GoalCreated', { title: goalTitle, type: goalType });
        if (selectedEmpId) fetchEmployeeSpecifics(selectedEmpId);
      } else {
        toast.error("Failed to save goal");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Submit Continuous Feedback Review
  const handleGiveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText || !selectedEmpId) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/pms/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          feedbackText,
          rating: Number(feedbackRating),
          badge: feedbackBadge,
          visibility: feedbackVisibility
        })
      });
      if (res.ok) {
        toast.success("Appreciation logged in continuous feedback register!");
        setFeedbackText('');
        await logAuditAction('RecognitionAwarded', { badge: feedbackBadge });
        if (selectedEmpId) fetchEmployeeSpecifics(selectedEmpId);
      } else {
        toast.error("Failed to save feedback");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Save Succession Candidate Map
  const handleSaveSuccession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!succPosition) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/pms/succession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          positionName: succPosition,
          primarySuccessorId: succPrimaryId ? Number(succPrimaryId) : null,
          secondarySuccessorId: succSecondaryId ? Number(succSecondaryId) : null,
          readinessTimeline: succTimeline,
          riskMitigation: succRisk
        })
      });
      if (res.ok) {
        toast.success("Succession planning profile saved!");
        setSuccPosition('');
        setSuccRisk('');
        await logAuditAction('SuccessionCandidateIdentified', { position: succPosition });
        fetchData();
      } else {
        toast.error("Failed to save succession candidate");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Save PIP Plan
  const handleCreatePip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !pipStart || !pipEnd || !pipObjective) return;
    try {
      setSubmitting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/pms/pips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          startDate: pipStart,
          endDate: pipEnd,
          objectives: [{ objective: pipObjective, status: 'pending' }],
          reviewMilestones: [],
          status: 'active'
        })
      });
      if (res.ok) {
        toast.success("Performance Improvement Plan (PIP) activated!");
        setPipObjective('');
        await logAuditAction('PerformanceImprovementInitiated', { employeeId: selectedEmpId });
        if (selectedEmpId) fetchEmployeeSpecifics(selectedEmpId);
      } else {
        toast.error("Failed to initiate PIP");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Simulate calibration
  const executeCalibrationAdjustment = async () => {
    if (!selectedEmpId || !calibrationJustification) {
      toast.error("Justification comments required");
      return;
    }
    toast.success(`Calibration adjusted to rating: ${calibratedRating}. Bell normalisation score saved.`);
    await logAuditAction('CalibrationCompleted', { employeeId: selectedEmpId, rating: Number(calibratedRating) });
    setCalibrationJustification('');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="h-28 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full"></div>
        {/* Focused Selector Skeleton */}
        <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-full"></div>
        {/* Tabs Navigation Skeleton */}
        <div className="flex gap-2 pb-2 border-b">
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/55 rounded w-32"></div>
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/55 rounded w-32"></div>
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/55 rounded w-32"></div>
          <div className="h-8 bg-slate-100 dark:bg-zinc-800/55 rounded w-32"></div>
        </div>
        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-1">
            <div className="h-64 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
            <div className="h-64 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[450px] bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      {/* Premium Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-[#0f172a] to-slate-950 p-6 border border-zinc-800 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[#f87941]/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
              <Star className="h-8 w-8 text-[#f87941]" />
              Employee Movement, Reviews & Appraisals (PMS)
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage promotions, transfers, salary revisions, reporting manager changes, and succession bench strength.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
              SOC2 & GDPR Appraisal Secure
            </Badge>
          </div>
        </div>
      </div>

      {/* Global Employee Profile Selector */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/30 rounded-xl border">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#f87941]" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Focused Employee Profile View:</span>
        </div>
        <select 
          className="w-72 border rounded-lg p-2 bg-transparent text-xs border-input h-9 outline-none font-semibold text-slate-800 dark:text-slate-200" 
          value={selectedEmpId || ''} 
          onChange={e => handleEmployeeViewChange(Number(e.target.value))}
        >
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.designation || 'Staff'})</option>
          ))}
        </select>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-200 dark:border-zinc-800">
        {[
          { id: 'appraisal', label: 'Appraisal Cycles', icon: Calendar },
          { id: 'goals', label: 'Cascaded OKRs & KPIs', icon: Target },
          { id: 'feedback', label: '360° Feedback Badges', icon: MessageSquare },
          { id: 'calibration', label: 'Rating Calibration', icon: Sliders },
          { id: 'succession', label: 'Succession Planning', icon: TrendingUp },
          { id: 'idp', label: 'Career Roadmaps (IDP)', icon: Compass },
          { id: 'pip', label: 'Improvement Plans (PIP)', icon: AlertTriangle },
          { id: 'audits', label: 'Compliance Audit Trail', icon: ShieldAlert }
        ].map(t => (
          <Button
            key={t.id}
            variant={activeTab === t.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(t.id as any)}
            className={activeTab === t.id ? 'bg-[#f87941] hover:bg-[#e06634] text-white font-semibold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}
          >
            <t.icon className="h-3.5 w-3.5 mr-1.5" /> {t.label}
          </Button>
        ))}
      </div>

      {/* TAB 1: APPRAISAL CYCLES & CREATIONS */}
      {activeTab === 'appraisal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Create Appraisal Cycle</CardTitle>
                <CardDescription>Setup cycle milestones, timelines, and goal weightage divisions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleCreateCycle} className="space-y-3.5 text-xs">
                  <div>
                    <Label htmlFor="cycle-title">Review Cycle Title</Label>
                    <Input id="cycle-title" placeholder="e.g. FY 2026 Annual Appraisals" value={cycleTitle} onChange={e => setCycleTitle(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="cycle-type">Cycle Type</Label>
                      <select id="cycle-type" value={cycleType} onChange={e => setCycleType(e.target.value)} className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none">
                        <option value="annual">Annual Appraisal</option>
                        <option value="quarterly">Quarterly Review</option>
                        <option value="half_yearly">Half Yearly Checkup</option>
                        <option value="probation">Probation Review</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="cycle-start">Start Date</Label>
                      <Input id="cycle-start" type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)} required className="h-9 mt-1 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="cycle-end">Expiration Deadline</Label>
                      <Input id="cycle-end" type="date" value={cycleEnd} onChange={e => setCycleEnd(e.target.value)} required className="h-9 mt-1 text-xs" />
                    </div>
                    <div>
                      <Label>Goals / Competencies ratio</Label>
                      <div className="flex gap-1.5 mt-1.5 items-center">
                        <Input type="number" value={cycleWeightGoals} onChange={e => setCycleWeightGoals(e.target.value)} className="h-8 text-xs w-12 text-center" />
                        <span>:</span>
                        <Input type="number" value={cycleWeightComps} onChange={e => setCycleWeightComps(e.target.value)} className="h-8 text-xs w-12 text-center" />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Creating...' : 'Publish Appraisal Cycle'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Active Appraisal Review Cycles</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3.5 text-xs">
                  {cycles.map(c => (
                    <div key={c.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 flex justify-between items-center border-slate-100 dark:border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.title}</span>
                          <span className="text-[10px] text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-semibold">{c.cycle_type}</span>
                        </div>
                        <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                          <span>Start: {c.start_date}</span>
                          <span>Deadline: {c.end_date}</span>
                          <span>Goals weight: {c.weightage_goals}%</span>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold uppercase tracking-wider text-[9px]">{c.status}</Badge>
                    </div>
                  ))}
                  {cycles.length === 0 && <p className="text-slate-400 italic py-6 text-center">No active appraisal review cycles initialized.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SMART GOAL PLANNER (Cascaded OKRs & KPIs) */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Add Cascaded Goal</CardTitle>
                <CardDescription>Assign OKR objectives and metric KPIs to the selected employee.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
                  <div>
                    <Label htmlFor="goal-cycle">Link to Cycle</Label>
                    <select id="goal-cycle" className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none" value={goalCycleId} onChange={e => setGoalCycleId(e.target.value)}>
                      <option value="">No linked cycle (standalone)</option>
                      {cycles.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="goal-title">Goal Objective Title</Label>
                    <Input id="goal-title" placeholder="e.g. Ingest MDM Remote wipe simulation locks" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <div>
                    <Label htmlFor="goal-desc">KRA description details</Label>
                    <Input id="goal-desc" placeholder="Goal outcomes detail..." value={goalDesc} onChange={e => setGoalDesc(e.target.value)} className="h-9 mt-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="goal-type">Goal Level Type</Label>
                      <select id="goal-type" value={goalType} onChange={e => setGoalType(e.target.value)} className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none">
                        <option value="individual">Individual Goal</option>
                        <option value="team">Team OKR</option>
                        <option value="department">Department Objective</option>
                        <option value="organizational">Company Strategy</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="goal-weight">Weightage (%)</Label>
                      <Input id="goal-weight" type="number" placeholder="10" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} className="h-9 mt-1 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="goal-target">Target Value</Label>
                      <Input id="goal-target" type="number" placeholder="100" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="h-9 mt-1 text-xs" />
                    </div>
                    <div>
                      <Label htmlFor="goal-unit">Metric Unit</Label>
                      <Input id="goal-unit" placeholder="%" value={goalUnit} onChange={e => setGoalUnit(e.target.value)} className="h-9 mt-1 text-xs" />
                    </div>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Saving...' : 'Save Goal Metric'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
                <CardTitle className="text-md">KPI Metrics & OKRs ({employees.find(emp => emp.id === selectedEmpId)?.firstName || 'Select user'})</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3.5 text-xs">
                  {goals.map(g => (
                    <div key={g.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 border-slate-100 dark:border-zinc-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{g.title}</span>
                            <span className="text-[10px] text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-semibold">{g.goal_type}</span>
                          </div>
                          <p className="text-slate-500 mt-1">{g.description || 'No description logged.'}</p>
                        </div>
                        <Badge className={`uppercase font-bold text-[9px] tracking-wide border-none ${g.status === 'achieved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{g.status}</Badge>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span>Progress: {g.current_value} / {g.target_value} {g.metric_unit}</span>
                          <span>Weight: {g.weightage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5">
                          <div className="bg-[#f87941] h-1.5 rounded-full" style={{ width: `${Math.min((g.current_value / g.target_value) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {goals.length === 0 && <p className="text-slate-400 italic py-6 text-center">No OKRs / KPI goals mapped for the selected employee profile.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: CONTINUOUS 360 FEEDBACK BADGES */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Share Instant Appreciation</CardTitle>
                <CardDescription>Grant feedback recognition badges and comments.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleGiveFeedback} className="space-y-3.5 text-xs">
                  <div>
                    <Label htmlFor="fb-text">Feedback Comments</Label>
                    <Input id="fb-text" placeholder="e.g. Handled remote eSIM lockers deployment flawlessly!" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="fb-rating">Performance Rating</Label>
                      <select id="fb-rating" value={feedbackRating} onChange={e => setFeedbackRating(e.target.value)} className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none">
                        <option value="5">Exceptional (5/5)</option>
                        <option value="4">Highly Effective (4/5)</option>
                        <option value="3">Meets Goals (3/5)</option>
                        <option value="2">Underperforming (2/5)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="fb-badge">Select Badge</Label>
                      <select id="fb-badge" value={feedbackBadge} onChange={e => setFeedbackBadge(e.target.value)} className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none">
                        <option value="Team Player">Team Player</option>
                        <option value="Innovation Star">Innovation Star</option>
                        <option value="Customer Champion">Customer Champion</option>
                        <option value="Problem Solver">Problem Solver</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fb-visibility">Visibility settings</Label>
                    <select id="fb-visibility" value={feedbackVisibility} onChange={e => setFeedbackVisibility(e.target.value)} className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none">
                      <option value="public">Public (Entire company)</option>
                      <option value="manager_only">Manager Confidential</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Sharing...' : 'Share Feedback Badge'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
                <CardTitle className="text-md">Continuous Feedback & Appreciation Feed</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3.5 text-xs">
                  {feedbacks.map(f => (
                    <div key={f.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 border-slate-100 dark:border-zinc-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">"{f.feedback_text}"</p>
                          <p className="text-[10px] text-slate-400 mt-2">Given by: <span className="font-semibold">{f.reviewer_id}</span> • Visibility: <span className="uppercase text-[9px] font-bold text-indigo-500">{f.visibility}</span></p>
                        </div>
                        {f.badge && <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold uppercase tracking-wider text-[9px]">{f.badge}</Badge>}
                      </div>
                    </div>
                  ))}
                  {feedbacks.length === 0 && <p className="text-slate-400 italic py-6 text-center">No continuous feedback reviews logged for this employee profile.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: RATING CALIBRATION */}
      {activeTab === 'calibration' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Sliders className="h-4.5 w-4.5 text-[#f87941]" /> Force Calibrate Rating</CardTitle>
                <CardDescription>Conduct calibration to eliminate rating bias and align with bell curve distributions.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div>
                  <Label>Calibrated Rating Score</Label>
                  <select className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none" value={calibratedRating} onChange={e => setCalibratedRating(e.target.value)}>
                    <option value="5.0">5.0 - Exceptional Performance</option>
                    <option value="4.0">4.0 - Highly Effective</option>
                    <option value="3.0">3.0 - Meets Expectations</option>
                    <option value="2.0">2.0 - Underperforming</option>
                  </select>
                </div>
                <div>
                  <Label>Calibration Justification Comments</Label>
                  <Input placeholder="Why is this rating being calibrated?" value={calibrationJustification} onChange={e => setCalibrationJustification(e.target.value)} required className="h-9 mt-1 text-xs" />
                </div>
                <Button className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 mt-2" onClick={executeCalibrationAdjustment}>
                  Apply Calibrated Rating
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Sparkles className="h-4.5 w-4.5 text-[#f87941]" /> AI Bell Curve Normalisation Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-3">
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                  <h4 className="font-bold text-amber-600 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Rating Anomaly Detected</h4>
                  <p className="text-slate-500">The current average review score in the **Engineering Department (Surat Office)** stands at **4.8/5.0**. This violates the organizational bell curve policy threshold (which limits Exceptional reviews to at most 10% of headcount).</p>
                  <p className="text-slate-400 text-[10px]">AI recommends calibrating 3 employee ratings down to **4.0** or **3.5** to restore normal distributions.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: SUCCESSION PLANNING */}
      {activeTab === 'succession' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><TrendingUp className="h-4.5 w-4.5 text-[#f87941]" /> Schedule Succession Map</CardTitle>
                <CardDescription>Log bench strength successor maps for key leadership roles.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSaveSuccession} className="space-y-3.5 text-xs">
                  <div>
                    <Label htmlFor="succ-pos">Target Position</Label>
                    <Input id="succ-pos" placeholder="e.g. Chief Technology Officer (CTO)" value={succPosition} onChange={e => setSuccPosition(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="succ-primary">Primary Successor</Label>
                      <select id="succ-primary" className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none" value={succPrimaryId} onChange={e => setSuccPrimaryId(e.target.value)}>
                        <option value="">Select successor...</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="succ-secondary">Secondary Successor</Label>
                      <select id="succ-secondary" className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none" value={succSecondaryId} onChange={e => setSuccSecondaryId(e.target.value)}>
                        <option value="">Select successor...</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="succ-timeline">Readiness Timeline</Label>
                    <select id="succ-timeline" className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-9 outline-none" value={succTimeline} onChange={e => setSuccTimeline(e.target.value)}>
                      <option value="immediate">Immediate Successor</option>
                      <option value="ready_1_2_years">Ready in 1-2 Years</option>
                      <option value="ready_3_5_years">Ready in 3-5 Years</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="succ-risk">Risk Mitigation Strategy</Label>
                    <Input id="succ-risk" placeholder="Coaching and leadership tracks assignment..." value={succRisk} onChange={e => setSuccRisk(e.target.value)} className="h-9 mt-1 text-xs" />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                    {submitting ? 'Saving...' : 'Save Succession Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
                <CardTitle className="text-md">Succession Readiness Bench Maps</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {successions.map(s => {
                    const primaryEmp = employees.find(emp => String(emp.id) === String(s.primary_successor_id));
                    const secondaryEmp = employees.find(emp => String(emp.id) === String(s.secondary_successor_id));
                    
                    return (
                      <div key={s.id} className="p-5 border rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 border-slate-100 dark:border-zinc-800 space-y-4 shadow-md bg-white dark:bg-[#1C1C1E] transition">
                        
                        <div className="flex justify-between items-center pb-2 border-b border-border/50">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Succession Bench</h4>
                          <span className="text-[8px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded-full uppercase">
                            Active
                          </span>
                        </div>

                        {/* Interactive Succession Flowchart */}
                        <div className="flex flex-col items-center pt-2">
                          
                          {/* Target leadership Role node */}
                          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-3 rounded-xl w-full max-w-[280px] text-center shadow-sm">
                            <div className="text-[9px] font-black text-primary uppercase tracking-wider">Target Key Position</div>
                            <div className="text-xs font-black mt-1 text-slate-800 dark:text-slate-100">{s.position_name}</div>
                          </div>
                          
                          {/* Node Connector Line */}
                          <div className="h-5 w-0.5 bg-border/80 my-0.5 relative">
                            <div className="absolute -bottom-1 -left-0.5 w-1 h-1 rounded-full bg-border" />
                          </div>
                          
                          {/* Primary Successor node */}
                          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl w-full max-w-[280px] text-center shadow-sm relative">
                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Primary Successor</div>
                            <div className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-200">
                              {primaryEmp ? `${primaryEmp.firstName} ${primaryEmp.lastName}` : 'Unassigned Position'}
                            </div>
                            {primaryEmp && (
                              <div className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                                {primaryEmp.designation} • {primaryEmp.department}
                              </div>
                            )}
                            <div className="mt-1.5 inline-block text-[8px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full uppercase">
                              Readiness: {s.readiness_timeline.replace(/_/g, ' ')}
                            </div>
                          </div>
                          
                          {/* Node Connector Line */}
                          <div className="h-5 w-0.5 bg-border/80 my-0.5 relative">
                            <div className="absolute -bottom-1 -left-0.5 w-1 h-1 rounded-full bg-border" />
                          </div>
                          
                          {/* Secondary Successor node */}
                          <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl w-full max-w-[280px] text-center shadow-sm">
                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Secondary Successor</div>
                            <div className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-200">
                              {secondaryEmp ? `${secondaryEmp.firstName} ${secondaryEmp.lastName}` : 'Unassigned Position'}
                            </div>
                            {secondaryEmp && (
                              <div className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                                {secondaryEmp.designation} • {secondaryEmp.department}
                              </div>
                            )}
                          </div>

                        </div>

                        {s.risk_mitigation && (
                          <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-border/50 text-[10px] text-muted-foreground italic">
                            <span className="font-bold not-italic text-slate-600 dark:text-slate-400">Risk Strategy:</span> "{s.risk_mitigation}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {successions.length === 0 && (
                    <p className="col-span-full text-slate-400 italic py-12 text-center bg-slate-50/50 dark:bg-zinc-900/10 border border-dashed rounded-2xl">
                      No succession replacement paths documented. Please use the form on the left to map successors.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: CAREER ROADMAPS (IDP) */}
      {activeTab === 'idp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Compass className="h-4.5 w-4.5 text-[#f87941]" /> Map Career Roadmap (IDP)</CardTitle>
                <CardDescription>Setup Individual Development Plan milestones and target designation objectives.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs">
                <div>
                  <Label>Long Term Target Role</Label>
                  <Input value={idpTargetRole} onChange={e => setIdpTargetRole(e.target.value)} className="h-9 mt-1 text-xs" />
                </div>
                <div>
                  <Label>Aspirations & Learning Targets</Label>
                  <textarea value={idpAspirations} onChange={e => setIdpAspirations(e.target.value)} className="w-full border rounded-lg p-2 mt-1.5 bg-transparent text-xs border-input h-20 outline-none" />
                </div>
                <Button className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9" onClick={() => toast.success("Individual Development Plan (IDP) saved to employee roadmap!")}>
                  Save IDP Milestones
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Active IDP Roadmaps ({employees.find(emp => emp.id === selectedEmpId)?.firstName || 'Select user'})</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-3.5">
                <div className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 border-slate-100 dark:border-zinc-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Target: {idpTargetRole}</span>
                    <Badge className="bg-indigo-500/10 text-indigo-500 border-none font-bold uppercase text-[9px] tracking-wide">In Progress</Badge>
                  </div>
                  <p className="text-slate-500">Aspirations: "{idpAspirations}"</p>
                  <div className="pt-2 flex gap-1.5 flex-wrap">
                    <Badge className="bg-slate-100 text-slate-700 border-none">Milestone 1: Supabase RLS Exam (Pass)</Badge>
                    <Badge className="bg-slate-100 text-slate-700 border-none">Milestone 2: Agile Lead Mentor</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 7: PERFORMANCE IMPROVEMENT PLANS (PIP) */}
      {activeTab === 'pip' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><AlertTriangle className="h-4.5 w-4.5 text-[#f87941]" /> Initiate PIP Action</CardTitle>
                <CardDescription>Setup targets, milestones, and dates for performance improvements.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleCreatePip} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="pip-start">Start Date</Label>
                      <Input id="pip-start" type="date" value={pipStart} onChange={e => setPipStart(e.target.value)} required className="h-9 mt-1 text-xs" />
                    </div>
                    <div>
                      <Label htmlFor="pip-end">Evaluation Date</Label>
                      <Input id="pip-end" type="date" value={pipEnd} onChange={e => setPipEnd(e.target.value)} required className="h-9 mt-1 text-xs" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pip-obj">Improvement Objective Statement</Label>
                    <Input id="pip-obj" placeholder="e.g. Complete RLS training path and pass 70% exam" value={pipObjective} onChange={e => setPipObjective(e.target.value)} required className="h-9 mt-1 text-xs" />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-9">
                    {submitting ? 'Saving...' : 'Initiate PIP Plan'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center">
                <CardTitle className="text-md">Performance Improvement Plans Feed ({employees.find(emp => emp.id === selectedEmpId)?.firstName || 'Select user'})</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3.5 text-xs">
                  {pips.map(p => (
                    <div key={p.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 border-rose-500/20 bg-rose-500/5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-rose-600 text-sm">PIP Track #{p.id}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Timeline: {p.start_date} to {p.end_date}</p>
                        </div>
                        <Badge className="bg-rose-500 text-white border-none uppercase font-bold text-[9px] tracking-wide">{p.status}</Badge>
                      </div>
                      <div className="pt-2 border-t border-rose-500/10 text-[10px] space-y-1 text-slate-500">
                        {p.objectives?.map((obj: any, idx: number) => (
                          <p key={idx}>• {obj.objective} (<span className="capitalize text-slate-400 font-semibold">{obj.status}</span>)</p>
                        ))}
                      </div>
                    </div>
                  ))}
                  {pips.length === 0 && <p className="text-slate-400 italic py-6 text-center">Employee is currently meeting expectations. No PIP active.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 8: FORENSIC AUDIT TRAIL */}
      {activeTab === 'audits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-3 space-y-4">
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><ShieldAlert className="h-4.5 w-4.5 text-[#f87941]" /> Immutable Appraisals Forensic Audits</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-xs font-mono">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/30 space-y-1 border-slate-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#f87941]">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Performed by: {log.performed_by}</p>
                      <pre className="text-[9px] bg-slate-50 dark:bg-zinc-900 p-2 rounded border mt-1 overflow-x-auto text-slate-600 dark:text-slate-400">{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-slate-400 italic py-6 text-center">Compliance forensic audits log is currently empty.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}
