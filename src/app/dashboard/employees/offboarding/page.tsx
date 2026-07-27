'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Users, UserX, CheckCircle2, Circle, AlertCircle, Calendar, Plus, Sparkles, Clock, ArrowRight, Kanban, ListTodo,
  FileText, Award, Printer, ShieldCheck, Check, Trash2, ShieldAlert, Cpu, HeartHandshake, Laptop, Receipt, DollarSign,
  RefreshCw, Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

const OFFBOARDING_STAGES = [
  'Separation Request',
  'Manager Review',
  'HR Review',
  'Knowledge Transfer',
  'Project Handover',
  'Asset Recovery',
  'IT Deprovisioning',
  'Finance Clearance',
  'Exit Interview',
  'Document Handover',
  'Alumni Conversion'
];

export default function OffboardingCenterPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  // Workflow States
  const [workflowInstance, setWorkflowInstance] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [eventsQueue, setEventsQueue] = useState<any[]>([]);
  const [activeStage, setActiveStage] = useState<string>('Separation Request');
  const [workflowTab, setWorkflowTab] = useState<'stages' | 'drafts' | 'audits' | 'events'>('stages');

  const [loading, setLoading] = useState(true);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistDesc, setNewChecklistDesc] = useState('');

  // Dropdown options loaded from APIs
  const [assets, setAssets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Task template creation form
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskRole, setNewTaskRole] = useState('HR');

  // Dynamic state for workflow form submission
  const [separationType, setSeparationType] = useState('Voluntary Resignation');
  const [resignationDate, setResignationDate] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [eligibleForRehire, setEligibleForRehire] = useState('Yes');
  const [docPhotoId, setDocPhotoId] = useState('');

  // KT Details
  const [ktRecipient, setKtRecipient] = useState('');
  const [ktDocUrl, setKtDocUrl] = useState('');
  const [ktCompletePercent, setKtCompletePercent] = useState('0');

  // Handover Details
  const [handoverProjId, setHandoverProjId] = useState('');
  const [handoverSuccessor, setHandoverSuccessor] = useState('');
  const [handoverStatus, setHandoverStatus] = useState('Pending');

  // Asset Recovery Checklist
  const [recoveredAssets, setRecoveredAssets] = useState<Record<number, boolean>>({});
  const [assetConditions, setAssetConditions] = useState<Record<number, string>>({});

  // IT lock logs
  const [deactivateLogs, setDeactivateLogs] = useState<string[]>([]);
  const [lockoutActive, setLockoutActive] = useState(false);

  // Full & Final calculations
  const [ffBasicSalary, setFfBasicSalary] = useState('0');
  const [ffNoticePay, setFfNoticePay] = useState('0');
  const [ffLeaveEncash, setFfLeaveEncash] = useState('0');
  const [ffGratuity, setFfGratuity] = useState('0');
  const [ffDeductions, setFfDeductions] = useState('0');

  // Exit Feedbacks
  const [cultureRating, setCultureRating] = useState('5');
  const [exitFeedback, setExitFeedback] = useState('');

  // Document Signatures
  const [hrSignatory, setHrSignatory] = useState('HR Director Office');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      
      // Get checklists
      const checklistsRes = await fetch('/api/offboarding/checklists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const checklistsData = await checklistsRes.json();
      setChecklists(checklistsData);

      if (checklistsData.length > 0) {
        setSelectedChecklistId(checklistsData[0].id);
      }

      // Get all employees
      const employeesRes = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const employeesData = await employeesRes.json();
      const empList = Array.isArray(employeesData) ? employeesData : (employeesData.data || []);
      setEmployees(empList);
      
      if (empList.length > 0) {
        handleEmployeeSelect(empList[0]);
      }

      // Fetch assets
      const assetRes = await fetch('/api/assets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (assetRes.ok) {
        const assetData = await assetRes.json();
        setAssets(assetData.data || assetData || []);
      }

      // Fetch projects
      const projRes = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.data || projData || []);
      }

      // Fetch Events
      fetchEventsQueue();
    } catch (e) {
      toast.error('Failed to load offboarding configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsQueue = async () => {
    try {
      const token = getStoredSessionToken();
      const eventsRes = await fetch('/api/offboarding/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEventsQueue(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmployeeSelect = async (emp: any) => {
    setSelectedEmployee(emp);
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/offboarding/workflow?employeeId=${emp.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflowInstance(data.workflow);
        setAuditLogs(data.auditLogs || []);
        setActiveStage(data.workflow?.current_stage || 'Separation Request');
        
        // Populate form draft data
        const draft = data.workflow?.draft_data || {};
        setSeparationType(draft.separationType || 'Voluntary Resignation');
        setResignationDate(draft.resignationDate || new Date().toISOString().split('T')[0]);
        setLastWorkingDay(draft.lastWorkingDay || '');
        setReasonText(draft.reasonText || '');
        setEligibleForRehire(draft.eligibleForRehire || 'Yes');
        setDocPhotoId(draft.docPhotoId || '');
        setKtRecipient(draft.ktRecipient || '');
        setKtDocUrl(draft.ktDocUrl || '');
        setKtCompletePercent(draft.ktCompletePercent || '0');
        setFfBasicSalary(draft.ffBasicSalary || '0');
        setFfNoticePay(draft.ffNoticePay || '0');
        setFfLeaveEncash(draft.ffLeaveEncash || '0');
        setFfGratuity(draft.ffGratuity || '0');
        setFfDeductions(draft.ffDeductions || '0');
        setCultureRating(draft.cultureRating || '5');
        setExitFeedback(draft.exitFeedback || '');
      }
    } catch {
      toast.error('Failed to fetch offboarding workflow details');
    }
  };

  const createChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistName) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/offboarding/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newChecklistName, description: newChecklistDesc })
      });
      if (res.ok) {
        toast.success('Offboarding exit checklist template created');
        setNewChecklistName('');
        setNewChecklistDesc('');
        fetchData();
      } else {
        toast.error('Failed to create checklist template');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const seedDefaultChecklist = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      
      const resChk = await fetch('/api/offboarding/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Standard Corporate Offboarding Exit Workflow',
          description: 'Enterprise workflow for exiting recruits including resignation logging, exit interview feedback, asset returns, and payroll clearances.'
        })
      });
      if (!resChk.ok) throw new Error('Exit Checklist creation failed');
      const createdChk = await resChk.json();
      const checklistId = createdChk.id;

      const defaultTasks = [
        { title: 'Resignation Logging', description: 'Log notice period parameters and LWD last working dates.' },
        { title: 'Exit Interview', description: 'Conduct exit questionnaire feedback rating review.' },
        { title: 'Knowledge Transfer & Handover', description: 'Link KT documentation transition registers.' },
        { title: 'Asset Recovery', description: 'Verify asset devices return clearance.' },
        { title: 'Payroll Clearance & F&F', description: 'Calculate Full and Final settlement sheets.' },
        { title: 'Relieving & Experience Letters', description: 'Generate exit certificate documents.' },
        { title: 'Account Deactivations', description: 'Deactivate email, Slack, and cloud platform logins.' },
        { title: 'Archive Profile Records', description: 'Archive record files from active workspaces.' }
      ];

      for (const t of defaultTasks) {
        await fetch('/api/offboarding/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            checklistId,
            title: t.title,
            description: t.description,
            roleResponsible: 'HR'
          })
        });
      }

      toast.success('Successfully seeded Offboarding Exit Checklist!');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Seeding failed');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !selectedChecklistId) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/offboarding/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          checklistId: selectedChecklistId,
          title: newTaskTitle,
          description: newTaskDesc,
          roleResponsible: newTaskRole
        })
      });
      if (res.ok) {
        toast.success('Task template added successfully');
        setNewTaskTitle('');
        setNewTaskDesc('');
        fetchData();
      } else {
        toast.error('Failed to add task template');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const saveWorkflowDraft = async (updates: any = {}, showToast = true) => {
    if (!workflowInstance) return;
    try {
      const token = getStoredSessionToken();
      const draft = {
        ...workflowInstance.draft_data,
        ...updates
      };

      const res = await fetch('/api/offboarding/workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: workflowInstance.id,
          draftData: draft
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkflowInstance(updated);
        if (showToast) toast.success('Offboarding draft parameters saved');
      }
    } catch {
      toast.error('Failed to save offboarding parameters');
    }
  };

  const advanceStage = async (nextStage: string, status: string = 'active', actionMsg = 'Stage Transitioned') => {
    if (!workflowInstance) return;
    try {
      const token = getStoredSessionToken();
      const draft = {
        ...workflowInstance.draft_data,
        separationType, resignationDate, lastWorkingDay, reasonText, eligibleForRehire, docPhotoId,
        ktRecipient, ktDocUrl, ktCompletePercent,
        ffBasicSalary, ffNoticePay, ffLeaveEncash, ffGratuity, ffDeductions,
        cultureRating, exitFeedback
      };

      const res = await fetch('/api/offboarding/workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: workflowInstance.id,
          currentStage: nextStage,
          status,
          action: 'STAGE_ADVANCE',
          comments: actionMsg,
          draftData: draft
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkflowInstance(updated);
        setActiveStage(nextStage);
        toast.success(`Workflow advanced to stage: ${nextStage}`);
        if (selectedEmployee) handleEmployeeSelect(selectedEmployee);
        fetchEventsQueue();
      } else {
        toast.error('Failed to advance stage');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const triggerAuditRollback = async () => {
    if (!workflowInstance) return;
    const prevIndex = OFFBOARDING_STAGES.indexOf(activeStage) - 1;
    if (prevIndex < 0) return;
    const rollbackStage = OFFBOARDING_STAGES[prevIndex];
    await advanceStage(rollbackStage, 'under_review', `Rollback transition triggered from ${activeStage} to ${rollbackStage}`);
  };

  // Mock accounts lockout procedure
  const handleLockoutSystems = () => {
    setLockoutActive(true);
    setDeactivateLogs(['[SSO Lockout] Starting IT account deactivation procedures...']);
    setTimeout(() => {
      setDeactivateLogs(prev => [...prev, `[G-Suite] Locked mailbox ${selectedEmployee?.officeEmail || selectedEmployee?.email}`]);
    }, 500);
    setTimeout(() => {
      setDeactivateLogs(prev => [...prev, '[Slack] Suspended active sessions and deactivated workspace access']);
    }, 1000);
    setTimeout(() => {
      setDeactivateLogs(prev => [...prev, '[AWS / GitHub] Blocked developer IAM policy credentials']);
    }, 1500);
    setTimeout(() => {
      setDeactivateLogs(prev => [...prev, '[Access Badge] Deauthorized active biometric access cards']);
    }, 2000);
    setTimeout(() => {
      setDeactivateLogs(prev => [...prev, '✅ Deprovisioning complete! All accounts safely disabled.']);
      setLockoutActive(false);
    }, 2500);
  };

  // Clear Event Logs queue
  const retryEvent = async (id: number) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/offboarding/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: id, action: 'retry' })
      });
      if (res.ok) {
        toast.success('Offboarding domain event queued for immediate replay');
        fetchEventsQueue();
      }
    } catch {
      toast.error('Failed to queue event retry');
    }
  };

  // Calculated Full & Final values
  const basic = Number(ffBasicSalary) || 0;
  const notice = Number(ffNoticePay) || 0;
  const leave = Number(ffLeaveEncash) || 0;
  const gratuity = Number(ffGratuity) || 0;
  const deductions = Number(ffDeductions) || 0;
  const netSettlement = basic + notice + leave + gratuity - deductions;

  // Filter assets currently assigned to selected employee
  const employeeAssets = assets.filter(a => a.status === 'assigned' || a.notes?.toLowerCase()?.includes(selectedEmployee?.firstName?.toLowerCase()));

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="h-28 bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 flex items-center justify-between px-6">
          <div className="space-y-3 w-1/3">
            <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-lg w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded-lg w-1/2"></div>
          </div>
          <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-lg w-40"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column Skeleton */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40 rounded-2xl p-5 space-y-4">
              <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-1/2"></div>
              <div className="space-y-3">
                <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
                <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40 rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-2 w-1/4">
                  <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-4 bg-slate-100 dark:bg-zinc-800/50 rounded w-2/3"></div>
                </div>
                <div className="h-8 bg-slate-100 dark:bg-zinc-800/50 rounded w-28"></div>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2">
                <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-48 flex-shrink-0"></div>
                <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-48 flex-shrink-0"></div>
              </div>

              <div className="flex gap-2 border-b border-slate-100 dark:border-zinc-800/40 pb-3">
                <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-20"></div>
                <div className="h-8 bg-slate-100 dark:bg-zinc-800/50 rounded w-20"></div>
              </div>

              <div className="space-y-3">
                <div className="h-12 bg-slate-100 dark:bg-zinc-800/30 rounded-xl"></div>
                <div className="h-12 bg-slate-100 dark:bg-zinc-800/30 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <UserX className="h-8 w-8 text-[#f87941]" />
            Offboarding Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage notice periods, clearances, assets recovery, and Relieving letter printings.</p>
        </div>
        <div className="flex items-center gap-2">
          {checklists.length === 0 && (
            <Button onClick={seedDefaultChecklist} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold flex items-center gap-2 shadow-lg shadow-[#f87941]/20">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Initialize Exit Blueprints
            </Button>
          )}
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
            <Cpu className="h-3.5 w-3.5 mr-1" />
            Access Lockout System Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: blueprints catalog */}
        <div className="space-y-6 lg:col-span-1 animate-fadeIn">
          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <ListTodo className="h-4 w-4 text-[#f87941]" />
                Exit Blueprints Catalog
              </CardTitle>
              <CardDescription>Setup corporate exit templates and mandatory items.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <form onSubmit={createChecklist} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="chk-name" className="text-xs">Exit Blueprint Name</Label>
                  <Input
                    id="chk-name"
                    placeholder="e.g. Standard Corporate Clearance"
                    value={newChecklistName}
                    onChange={e => setNewChecklistName(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="chk-desc" className="text-xs">Description</Label>
                  <Input
                    id="chk-desc"
                    placeholder="Describe checklist parameters..."
                    value={newChecklistDesc}
                    onChange={e => setNewChecklistDesc(e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-semibold h-9">
                  Create Blueprint Template
                </Button>
              </form>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-2">
                <Label className="text-xs font-bold text-slate-500 block mb-2">Available Blueprints</Label>
                {checklists.map((chk) => (
                  <div
                    key={chk.id}
                    onClick={() => setSelectedChecklistId(chk.id)}
                    className={`p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                      selectedChecklistId === chk.id
                        ? 'border-[#f87941] bg-[#f87941]/5 shadow-sm'
                        : 'border-slate-100 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-200">{chk.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{chk.description || 'No description provided.'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedChecklistId && (
            <Card className="border-slate-100 dark:border-zinc-800/80 shadow-lg dark:bg-slate-950/40 animate-fadeIn">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
                <CardTitle className="text-sm font-bold">Add Exit Task Item</CardTitle>
                <CardDescription>Append task to standard workflow blueprints.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={createTask} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="task-title" className="text-xs">Task Name</Label>
                    <Input
                      id="task-title"
                      placeholder="e.g. Relieving Document Generation"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="task-desc" className="text-xs">Description</Label>
                    <Input
                      id="task-desc"
                      placeholder="Exit step details..."
                      value={newTaskDesc}
                      onChange={e => setNewTaskDesc(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-semibold">
                    Add Blueprint Exit Step
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Progression board */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 dark:border-zinc-800/80 shadow-xl dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Kanban className="h-4 w-4 text-[#f87941]" />
                Separation Progression Board
              </CardTitle>
              <CardDescription>Initiate exits and clear corporate departments checklist workflows.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Employee horizontal list */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleEmployeeSelect(emp)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer min-w-[200px] max-w-[240px] flex-shrink-0 transition-all ${
                      selectedEmployee?.id === emp.id
                        ? 'border-[#f87941] bg-[#f87941]/5 shadow-sm'
                        : 'border-slate-100 hover:bg-slate-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-[#f87941]/10 border border-[#f87941]/20 flex items-center justify-center font-bold text-[#f87941]">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{emp.firstName} {emp.lastName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{emp.designation || 'Exiting Employee'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedEmployee ? (
                <div className="mt-6 space-y-6">
                  {/* Selected Recruit overview */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-zinc-900/20 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/60 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                        <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/20 text-[10px] font-bold px-2 py-0.5 uppercase">
                          {workflowInstance?.status || 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#f87941]" />
                        Notice Completion Target: {lastWorkingDay || 'Not logged yet'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={triggerAuditRollback} disabled={activeStage === 'Separation Request'} className="text-slate-500 hover:text-[#f87941] text-xs flex items-center gap-1">
                        <Undo2 className="h-3.5 w-3.5" />
                        Rollback Stage
                      </Button>
                    </div>
                  </div>

                  {/* Multi-Stage Progression Timeline Nodes */}
                  <div className="bg-slate-50/30 dark:bg-zinc-900/10 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/60">
                    <Label className="text-xs font-bold text-slate-400 block mb-4 uppercase tracking-wider">Offboarding Lifecycle Stage Nodes</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {OFFBOARDING_STAGES.map((stage, idx) => {
                        const isCurrent = activeStage === stage;
                        const isPast = OFFBOARDING_STAGES.indexOf(activeStage) > idx;
                        return (
                          <div
                            key={stage}
                            onClick={() => {
                              if (workflowInstance) setActiveStage(stage);
                            }}
                            className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                              isCurrent
                                ? 'bg-[#f87941] text-white border-[#f87941] shadow-md font-bold'
                                : isPast
                                  ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20'
                                  : 'bg-white dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            <p className="text-[10px] truncate leading-tight font-medium">{stage}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="flex border-b border-slate-100 dark:border-zinc-800 gap-1.5 pb-2">
                    <Button variant={workflowTab === 'stages' ? 'default' : 'ghost'} size="sm" onClick={() => setWorkflowTab('stages')} className={workflowTab === 'stages' ? 'bg-[#f87941] text-white hover:bg-[#f87941]/90' : 'text-slate-400'}>
                      Progression Stages
                    </Button>
                    <Button variant={workflowTab === 'drafts' ? 'default' : 'ghost'} size="sm" onClick={() => setWorkflowTab('drafts')} className={workflowTab === 'drafts' ? 'bg-[#f87941] text-white hover:bg-[#f87941]/90' : 'text-slate-400'}>
                      Candidate Details Draft
                    </Button>
                    <Button variant={workflowTab === 'audits' ? 'default' : 'ghost'} size="sm" onClick={() => setWorkflowTab('audits')} className={workflowTab === 'audits' ? 'bg-[#f87941] text-white hover:bg-[#f87941]/90' : 'text-slate-400'}>
                      Clearance Audit Trails
                    </Button>
                    <Button variant={workflowTab === 'events' ? 'default' : 'ghost'} size="sm" onClick={() => setWorkflowTab('events')} className={workflowTab === 'events' ? 'bg-[#f87941] text-white hover:bg-[#f87941]/90' : 'text-slate-400'}>
                      Events Broker Queue
                    </Button>
                  </div>

                  {/* TAB 1: PROGRESSION STAGES */}
                  {workflowTab === 'stages' && (
                    <div className="space-y-6">
                      {/* STAGE 1: Separation Request Form */}
                      {activeStage === 'Separation Request' && (
                        <Card className="border-slate-100 dark:border-zinc-800/85 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-[#f87941]" />
                              Log Separation Request Form
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <Label className="text-xs">Separation Type</Label>
                                <select value={separationType} onChange={e => setSeparationType(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1.5 border-input outline-none">
                                  <option value="Voluntary Resignation">Voluntary Resignation</option>
                                  <option value="Retirement">Retirement</option>
                                  <option value="Contract Completion">Contract Completion</option>
                                  <option value="End of Internship">End of Internship</option>
                                  <option value="Termination">Involuntary Termination</option>
                                  <option value="Layoff">Layoff</option>
                                  <option value="Absconding">Absconding</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">Eligible for Rehire</Label>
                                <select value={eligibleForRehire} onChange={e => setEligibleForRehire(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1.5 border-input outline-none">
                                  <option value="Yes">Eligible / Rehire Yes</option>
                                  <option value="No">No / Blacklisted</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">Resignation Date</Label>
                                <Input type="date" value={resignationDate} onChange={e => setResignationDate(e.target.value)} className="mt-1" />
                              </div>
                              <div>
                                <Label className="text-xs">Preferred Last Working Day</Label>
                                <Input type="date" value={lastWorkingDay} onChange={e => setLastWorkingDay(e.target.value)} className="mt-1" />
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">Detailed Reason / Comments</Label>
                                <textarea value={reasonText} onChange={e => setReasonText(e.target.value)} placeholder="Provide separation details..." className="w-full border rounded-lg p-3 bg-transparent text-xs mt-1.5 outline-none border-input h-20" />
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">Resignation Letter URL / Document ID</Label>
                                <Input value={docPhotoId} onChange={e => setDocPhotoId(e.target.value)} placeholder="e.g. /uploads/resignation_attachment_doc.pdf" className="mt-1" />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" variant="outline" onClick={() => saveWorkflowDraft({ separationType, resignationDate, lastWorkingDay, reasonText, eligibleForRehire, docPhotoId })}>Save Draft</Button>
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('Manager Review', 'under_review', 'Separation request logged successfully. Submitting to reporting manager.')}>Submit Separation Request</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 2: Manager Review Approval */}
                      {activeStage === 'Manager Review' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-[#f87941]" />
                              Line Manager & Operations Review
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="border rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/10 space-y-3">
                              <div className="flex items-center justify-between text-xs font-bold border-b pb-2">
                                <span>Approval Node Role</span>
                                <span>Verification Status</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span>Immediate Manager Clearance</span>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">APPROVED</Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span>Department Head Sign-off</span>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">APPROVED</Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span>Operations VP Gatekeeper</span>
                                <Badge className="bg-yellow-500/10 text-yellow-600 border-none font-bold">PENDING GATEWAY</Badge>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" variant="outline" className="text-[#f87941] border-[#f87941]/20 hover:bg-[#f87941]/5">Rework Required</Button>
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('HR Review', 'under_review', 'Manager clearance approved. Progressing to HR Review.')}>Approve & Clear Gate</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 3: HR Review */}
                      {activeStage === 'HR Review' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <Award className="h-4 w-4 text-[#f87941]" />
                              HR Leave & Notice Period Reconciliation
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <Label className="text-xs">Annual Leaves Accrued (Days)</Label>
                                <Input type="number" defaultValue="24" className="mt-1" />
                              </div>
                              <div>
                                <Label className="text-xs">Leaves Taken / Availed (Days)</Label>
                                <Input type="number" defaultValue="6" className="mt-1" />
                              </div>
                              <div className="col-span-2">
                                <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-xs">
                                  <p className="font-bold">Calculated Leave Balance to Encash:</p>
                                  <p className="text-emerald-500 mt-1 font-bold">18 Leaves eligible for final encashment payouts.</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('Knowledge Transfer', 'active', 'Reconciled leave and notice period parameters successfully.')}>Confirm Reconciliation & Proceed</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 4: Knowledge Transfer */}
                      {activeStage === 'Knowledge Transfer' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <HeartHandshake className="h-4 w-4 text-[#f87941]" />
                              Knowledge Transfer Registry
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <Label className="text-xs">KT Recipient successor</Label>
                                <select value={ktRecipient} onChange={e => setKtRecipient(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1.5 border-input outline-none">
                                  <option value="">Select Successor</option>
                                  {employees.filter(e => e.id !== selectedEmployee?.id).map(e => (
                                    <option key={e.id} value={e.firstName + ' ' + e.lastName}>{e.firstName} {e.lastName}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">Handover Progress percentage</Label>
                                <select value={ktCompletePercent} onChange={e => setKtCompletePercent(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1.5 border-input outline-none">
                                  <option value="25">25% (Drafting Docs)</option>
                                  <option value="50">50% (Code Walkthrough)</option>
                                  <option value="75">75% (Credentials Transferred)</option>
                                  <option value="100">100% (KT fully completed)</option>
                                </select>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs">KT Documentation Shareable URL (Confluence / Google Doc)</Label>
                                <Input value={ktDocUrl} onChange={e => setKtDocUrl(e.target.value)} placeholder="e.g. https://confluence.corporate.com/pages/kt-handover-document" className="mt-1" />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" variant="outline" onClick={() => saveWorkflowDraft({ ktRecipient, ktDocUrl, ktCompletePercent })}>Save Draft</Button>
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('Project Handover', 'active', 'KT documents verified and handovers completed.')}>Complete KT Handover</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 5: Project Handover */}
                      {activeStage === 'Project Handover' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-[#f87941]" />
                              Project Handover & Successor Assignment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Label className="text-xs font-semibold block">Active Projects assigned to Exiting Employee ({projects.length})</Label>
                            
                            {projects.length > 0 ? (
                              <div className="space-y-2">
                                {projects.map((proj) => (
                                  <div key={proj.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-xs gap-3">
                                    <div>
                                      <p className="font-bold text-slate-800 dark:text-slate-200">{proj.name}</p>
                                      <p className="text-[10px] text-slate-400">{proj.description || 'No project description'}</p>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                      <select className="border rounded-lg p-1 text-[11px] bg-transparent border-input outline-none w-full sm:w-40">
                                        <option value="">Reassign team member</option>
                                        {employees.filter(e => e.id !== selectedEmployee?.id).map(e => (
                                          <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                        ))}
                                      </select>
                                      <Badge className="bg-yellow-500/10 text-yellow-600 border-none text-[10px]">PENDING REASSIGNMENT</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl border border-dashed text-xs text-slate-400 italic text-center">
                                No active projects found for this employee profile.
                              </div>
                            )}

                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('Asset Recovery', 'active', 'Project handovers and reassignments logged successfully.')}>Reassign & Continue</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 6: Asset Recovery */}
                      {activeStage === 'Asset Recovery' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <Laptop className="h-4 w-4 text-[#f87941]" />
                              Allocated Assets Recovery Audit
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Label className="text-xs font-semibold block">Assets Issued to Employee ({employeeAssets.length})</Label>
                            
                            {employeeAssets.length > 0 ? (
                              <div className="space-y-3">
                                {employeeAssets.map((asset) => (
                                  <div key={asset.id} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-xs">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={recoveredAssets[asset.id] || false}
                                        onChange={e => setRecoveredAssets(prev => ({ ...prev, [asset.id]: e.target.checked }))}
                                        className="rounded text-[#f87941] focus:ring-[#f87941] h-4 w-4 border-slate-300 cursor-pointer"
                                      />
                                      <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{asset.name}</p>
                                        <p className="text-[10px] text-slate-400">S/N: {asset.serialNumber || 'N/A'} • Status: {asset.status}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        placeholder="Condition (e.g. Scratches, Working)"
                                        value={assetConditions[asset.id] || ''}
                                        onChange={e => setAssetConditions(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                        className="h-8 text-xs w-48 bg-transparent"
                                      />
                                      <Badge className={recoveredAssets[asset.id] ? "bg-emerald-500/10 text-emerald-500" : "bg-[#f87941]/10 text-[#f87941]"}>
                                        {recoveredAssets[asset.id] ? "COLLECTED" : "PENDING RETURN"}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl border border-dashed text-xs text-slate-400 italic text-center">
                                No issued assets registered for this profile.
                              </div>
                            )}

                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('IT Deprovisioning', 'active', 'Assets collected and physical audits complete.')}>Verify & Approve Recovery</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 7: IT Deprovisioning */}
                      {activeStage === 'IT Deprovisioning' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <Cpu className="h-4 w-4 text-[#f87941]" />
                              IT Deprovisioning & Identity Revocations
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Button size="sm" variant="outline" className="w-full text-[#f87941] border-[#f87941]/30 hover:bg-[#f87941]/5 flex items-center justify-center gap-2 h-10" onClick={handleLockoutSystems} disabled={lockoutActive}>
                              <Cpu className="h-4 w-4" /> Trigger Automated Revocations Suite
                            </Button>

                            {deactivateLogs.length > 0 && (
                              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-orange-400 font-mono text-[10px] space-y-1.5 h-36 overflow-y-auto shadow-inner">
                                {deactivateLogs.map((log, index) => (
                                  <p key={index}>{log}</p>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" disabled={deactivateLogs.length < 5} onClick={() => advanceStage('Finance Clearance', 'active', 'All active IT permissions and workspace mailboxes revoked.')}>Save Deprovisioning clearance</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 8: Finance Clearance F&F */}
                      {activeStage === 'Finance Clearance' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <Receipt className="h-4 w-4 text-[#f87941]" />
                              Full & Final Settlement Ledger
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-[11px]">Unpaid Basic Salary (INR)</Label>
                                <Input value={ffBasicSalary} onChange={e => setFfBasicSalary(e.target.value)} type="number" className="mt-1" />
                              </div>
                              <div>
                                <Label className="text-[11px]">Notice Period Payout</Label>
                                <Input value={ffNoticePay} onChange={e => setFfNoticePay(e.target.value)} type="number" className="mt-1" />
                              </div>
                              <div>
                                <Label className="text-[11px]">Leave Encashment (18 Days)</Label>
                                <Input value={ffLeaveEncash} onChange={e => setFfLeaveEncash(e.target.value)} type="number" className="mt-1" />
                              </div>
                              <div>
                                <Label className="text-[11px]">Gratuity Settlement</Label>
                                <Input value={ffGratuity} onChange={e => setFfGratuity(e.target.value)} type="number" className="mt-1" />
                              </div>
                              <div>
                                <Label className="text-[11px]">Deductions (INR)</Label>
                                <Input value={ffDeductions} onChange={e => setFfDeductions(e.target.value)} type="number" className="mt-1 text-[#f87941]" />
                              </div>
                            </div>

                            <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-slate-900/10 text-xs space-y-2">
                              <p className="font-bold text-slate-800 dark:text-slate-200 border-b pb-1.5 mb-2">F&F Settlement Ledger Worksheet</p>
                              <div className="flex justify-between font-semibold">
                                <span className="text-slate-500">Gross Settlement Payout:</span>
                                <span className="text-emerald-500">+ INR {basic + notice + leave + gratuity}</span>
                              </div>
                              <div className="flex justify-between font-semibold border-b pb-2">
                                <span className="text-slate-500">Total Deductions:</span>
                                <span className="text-rose-500">- INR {deductions}</span>
                              </div>
                              <div className="flex justify-between font-extrabold text-sm pt-1 text-slate-800 dark:text-slate-100">
                                <span>Net F&F Settlement Payout:</span>
                                <span>INR {netSettlement}</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" variant="outline" onClick={() => saveWorkflowDraft({ ffBasicSalary, ffNoticePay, ffLeaveEncash, ffGratuity, ffDeductions })}>Save Draft</Button>
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('Exit Interview', 'active', `F&F settlement ledger finalized. Net settlement: INR ${netSettlement}`)}>Finalize & Approve Finance Clearance</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 9: Exit Interview */}
                      {activeStage === 'Exit Interview' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <HeartHandshake className="h-4 w-4 text-[#f87941]" />
                              Exit Interview Questionnaire
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-4 text-xs">
                              <div>
                                <Label className="text-xs">Workspace Culture Rating (1-5)</Label>
                                <select value={cultureRating} onChange={e => setCultureRating(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 border-input outline-none">
                                  <option value="5">⭐⭐⭐⭐⭐ Outstanding workplace experience</option>
                                  <option value="4">⭐⭐⭐⭐ Good corporate culture</option>
                                  <option value="3">⭐⭐⭐ Fair/Neutral experience</option>
                                  <option value="2">⭐⭐ Needs structural culture modifications</option>
                                  <option value="1">⭐ Poor management/unsatisfactory experience</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">Detailed Exit Comments & Feedback</Label>
                                <textarea value={exitFeedback} onChange={e => setExitFeedback(e.target.value)} placeholder="Provide exit notes feedback..." className="w-full border rounded-lg p-3 bg-transparent text-xs mt-1.5 outline-none border-input h-24" />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" variant="outline" onClick={() => saveWorkflowDraft({ cultureRating, exitFeedback })}>Save Draft</Button>
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('Document Handover', 'active', 'Exit interview completed. Ratings and comments registered.')}>Submit Exit Interview</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 10: Document Handover */}
                      {activeStage === 'Document Handover' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <Printer className="h-4 w-4 text-[#f87941]" />
                              Generate & Sign Relieving Certificates
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <Label className="text-xs">Authorized HR Signatory Name</Label>
                              <Input value={hrSignatory} onChange={e => setHrSignatory(e.target.value)} placeholder="e.g. HR Operations Director" />
                            </div>

                            {/* Letter preview */}
                            <div className="p-6 border rounded-2xl bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 font-serif text-[11px] leading-relaxed relative shadow-md">
                              <div className="text-center border-b pb-3 mb-4">
                                <h2 className="font-extrabold text-base tracking-widest uppercase">TECHSONANCE CMS</h2>
                                <p className="text-[8px] text-slate-400 font-sans mt-0.5">Corporate Headquarters • Technology Operations Division</p>
                              </div>
                              <h3 className="text-center font-bold text-sm tracking-wider uppercase underline">TO WHOMSOEVER IT MAY CONCERN</h3>
                              <p className="mt-4">This is to certify that <strong className="font-bold">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> was employed with TechSonance CMS as a <strong className="font-bold">{selectedEmployee?.designation || 'Software Engineer'}</strong> from <strong className="font-bold">{selectedEmployee?.dateOfJoining || '[Joining Date]'}</strong> to <strong className="font-bold">{lastWorkingDay || '[Exit LWD]'}</strong>.</p>
                              <p className="mt-2">During their tenure with us, we found them to be diligent, hard-working, and sincere in their duties. We wish them success in their future endeavors.</p>
                              
                              <div className="mt-12 flex justify-between text-[9px] font-sans">
                                <div>
                                  <p className="font-bold border-t pt-2 w-32 border-slate-300">Authorized Signatory</p>
                                  <p className="text-slate-400">{hrSignatory}</p>
                                </div>
                                <span className="text-slate-400">Date: {new Date().toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button variant="outline" size="sm" onClick={() => window.print()} className="flex items-center gap-1"><Printer className="h-3.5 w-3.5" /> Print Relieving Certificate</Button>
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold" onClick={() => advanceStage('Alumni Conversion', 'active', 'Letters generated and shared with employee.')}>Confirm & Issue Letters</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* STAGE 11: Alumni Conversion */}
                      {activeStage === 'Alumni Conversion' && (
                        <Card className="border-slate-100 dark:border-zinc-800/80 shadow-md">
                          <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                              <ShieldAlert className="h-4 w-4 text-[#f87941]" />
                              Alumni Conversion & Workflow Closure
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 border border-[#f87941]/30 bg-[#f87941]/5 rounded-2xl flex gap-3 items-start">
                              <ShieldAlert className="h-6 w-6 text-[#f87941] flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-100">Permanent Employee Profile Archiving Check:</span>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">This operation will lock the user logins, switch status to "Alumni", and mark the workflow instance as closed. Archived data records will remain encrypted for regulatory audits.</p>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t pt-4">
                              <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold flex items-center gap-1.5" onClick={() => advanceStage('Alumni Conversion', 'completed', 'Workflow closed. Exiting candidate converts to Alumni status.')}>
                                <Trash2 className="h-4 w-4" /> Grant Final Exit Sign-off & Close Workflow
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* TAB 2: DRAFTS DATA */}
                  {workflowTab === 'drafts' && (
                    <Card className="border-slate-100 dark:border-zinc-800 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold">Portal Draft Details</CardTitle>
                        <CardDescription>View raw separation form fields and values saved by candidate self-service draft log.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[10px] overflow-x-auto shadow-inner leading-relaxed">
                          {JSON.stringify(workflowInstance?.draft_data || {}, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  {/* TAB 3: AUDITS HISTORY */}
                  {workflowTab === 'audits' && (
                    <Card className="border-slate-100 dark:border-zinc-800 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="h-4.5 w-4.5 text-[#f87941]" />
                          Clearance Audit History Logs
                        </CardTitle>
                        <CardDescription>Immutable tracking logs of stage transitions, approvals, and system triggers.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {auditLogs.length > 0 ? (
                          <div className="space-y-4">
                            {auditLogs.map((log) => (
                              <div key={log.id} className="flex gap-3 text-xs border-l-2 border-[#f87941] pl-4 py-1 relative">
                                <div className="absolute -left-1.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#f87941]" />
                                <div className="flex-1 space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.action} • Stage: {log.stage_name}</span>
                                    <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-slate-500 font-medium">Performed By: {log.performed_by} ({log.device_info})</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic text-center py-6">No audit log records registered yet.</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* TAB 4: EVENTS QUEUE */}
                  {workflowTab === 'events' && (
                    <Card className="border-slate-100 dark:border-zinc-800 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                          <Cpu className="h-4.5 w-4.5 text-[#f87941]" />
                          Events Broker queue (Asynchronous processing)
                        </CardTitle>
                        <CardDescription>Verify integration triggers, webhooks, and retry failed operations.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {eventsQueue.length > 0 ? (
                          <div className="space-y-3">
                            {eventsQueue.map((ev) => (
                              <div key={ev.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 text-xs">
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{ev.event_type}</p>
                                  <p className="text-[10px] text-slate-400">Triggered: {new Date(ev.created_at).toLocaleString()} • Retries: {ev.retry_count}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={ev.processed_status === 'processed' ? 'bg-emerald-500/10 text-emerald-500 border-none' : 'bg-[#f87941]/10 text-[#f87941] border-none'}>
                                    {ev.processed_status.toUpperCase()}
                                  </Badge>
                                  {ev.processed_status === 'failed' && (
                                    <Button size="xs" variant="outline" onClick={() => retryEvent(ev.id)} className="text-[#f87941] border-[#f87941]/20 hover:bg-[#f87941]/5 h-7">
                                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic text-center py-6">No event broker logs recorded.</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground text-sm italic">Select an exiting recruit from the board.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
