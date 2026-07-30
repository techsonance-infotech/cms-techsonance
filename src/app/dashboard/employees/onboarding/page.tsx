'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users, UserCheck, CheckCircle2, Circle, AlertCircle, Calendar, Plus, Sparkles, Clock, ArrowRight, Kanban, ListTodo,
  FileSignature, Laptop, Mail, Award, BookOpen, Printer, Send, ShieldCheck, FileText, BadgeCheck, Check, Cpu, X, Building,
  TrendingUp, Activity, RotateCw, History, ShieldAlert, CheckSquare, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export default function OnboardingCenterPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [onboardingTasks, setOnboardingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistDesc, setNewChecklistDesc] = useState('');

  // Checklist Task Templates list (fixes "Add steps not visible")
  const [blueprintTasks, setBlueprintTasks] = useState<any[]>([]);

  // Workflow instance states
  const [workflowInstance, setWorkflowInstance] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [eventsQueue, setEventsQueue] = useState<any[]>([]);

  // Dropdown options loaded from APIs
  const [projects, setProjects] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<any[]>([]);

  // Task template creation form
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskRole, setNewTaskRole] = useState('HR');

  // Interactive modal for executing tasks
  const [activeTask, setActiveTask] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  // Dynamic state for task execution modals
  const [offerCTC, setOfferCTC] = useState('');
  const [offerDesignation, setOfferDesignation] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [provisionUsername, setProvisionUsername] = useState('');
  const [provisionLogs, setProvisionLogs] = useState<string[]>([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedBuddy, setSelectedBuddy] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTraining, setSelectedTraining] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [welcomeKitSize, setWelcomeKitSize] = useState('L');
  const [inductionTime, setInductionTime] = useState('');
  const [inductionLocation, setInductionLocation] = useState('');

  // File upload state for KYC documents
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('Passport');

  // Active view tabs for Workflow progression
  const [workflowTab, setWorkflowTab] = useState<'stages' | 'drafts' | 'audits' | 'events'>('stages');

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch blueprint tasks whenever selectedChecklistId changes
  useEffect(() => {
    if (selectedChecklistId) {
      fetchBlueprintTasks(selectedChecklistId);
    } else {
      setBlueprintTasks([]);
    }
  }, [selectedChecklistId]);

  const fetchData = async () => {
    setLoading(true);
    const token = getStoredSessionToken();
    let empList: any[] = [];

    // 1. Fetch checklists
    try {
      const checklistsRes = await fetch('/api/onboarding/checklists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (checklistsRes.ok) {
        const checklistsData = await checklistsRes.json();
        setChecklists(checklistsData);
        if (checklistsData.length > 0) {
          setSelectedChecklistId(checklistsData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load checklists:', err);
    }

    // 2. Fetch employees (crucial for dropdown mapping)
    try {
      const employeesRes = await fetch('/api/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        empList = Array.isArray(employeesData) ? employeesData : (employeesData.data || []);
        setEmployees(empList);
        if (empList.length > 0) {
          handleEmployeeSelect(empList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load employees for onboarding:', err);
    }

    // 3. Fetch projects
    try {
      const projRes = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.data || projData || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }

    // 4. Fetch assets
    try {
      const assetRes = await fetch('/api/assets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (assetRes.ok) {
        const assetData = await assetRes.json();
        setAssets(assetData.data || assetData || []);
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
    }

    // 5. Fetch training programs
    try {
      const trainRes = await fetch('/api/training/programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (trainRes.ok) {
        const trainData = await trainRes.json();
        setTrainingPrograms(trainData.data || trainData || []);
      }
    } catch (err) {
      console.error('Failed to load training programs:', err);
    }

    // 6. Fetch events queue
    try {
      await fetchEventsQueue();
    } catch (err) {
      console.error('Failed to load events queue:', err);
    }

    setLoading(false);
  };

  const fetchBlueprintTasks = async (checklistId: number) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/onboarding/tasks?checklistId=${checklistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBlueprintTasks(data || []);
      }
    } catch (err) {
      console.error('Failed to load blueprint tasks', err);
    }
  };

  const fetchEventsQueue = async () => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/onboarding/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEventsQueue(data || []);
      }
    } catch (err) {
      console.error('Failed to load events queue', err);
    }
  };

  const handleEmployeeSelect = async (emp: any) => {
    setSelectedEmployee(emp);
    try {
      const token = getStoredSessionToken();
      // Fetch checklists tasks
      const res = await fetch(`/api/onboarding/employee?employeeId=${emp.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOnboardingTasks(data);

      // Fetch workflow details & audits
      const workflowRes = await fetch(`/api/onboarding/workflow?employeeId=${emp.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (workflowRes.ok) {
        const wfData = await workflowRes.json();
        setWorkflowInstance(wfData.workflow);
        setAuditLogs(wfData.auditLogs || []);
      }
    } catch {
      toast.error('Failed to fetch tasks for employee');
    }
  };

  const createChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistName) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/onboarding/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newChecklistName, description: newChecklistDesc })
      });
      if (res.ok) {
        toast.success('Onboarding checklist template created');
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
      
      // 1. Create Corporate Checklist template
      const resChk = await fetch('/api/onboarding/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Digital Enterprise Onboarding Workflow',
          description: 'Comprehensive workflow including offer letter, background check, IT provisioning, and team assignments.'
        })
      });
      if (!resChk.ok) throw new Error('Checklist creation failed');
      const createdChk = await resChk.json();
      const checklistId = createdChk.id;

      // 2. Add standard workflow tasks
      const defaultTasks = [
        { title: 'Offer Letter', description: 'Configure details and generate corporate employment offer letter.', roleResponsible: 'HR' },
        { title: 'Accept Offer', description: 'Collect digitally signed offer letter acceptance document.', roleResponsible: 'HR' },
        { title: 'Upload Documents & KYC', description: 'Upload government photo identity proofs and verify credentials.', roleResponsible: 'HR' },
        { title: 'Background Verification', description: 'Initiate employment history and reference database check logs.', roleResponsible: 'HR' },
        { title: 'Asset Request', description: 'Select and allocate active hardware devices (laptops, peripherals) from inventory.', roleResponsible: 'IT' },
        { title: 'Provision G-Suite & Slack', description: 'Generate corporate workspace email account and invite to messaging platforms.', roleResponsible: 'IT' },
        { title: 'Relationship Bindings', description: 'Select reporting manager, team mentor, and buddy assignments.', roleResponsible: 'HR' },
        { title: 'Assign Project', description: 'Link new recruit to active company development projects.', roleResponsible: 'Manager' },
        { title: 'Assign Training & Policies', description: 'Enroll hire into corporate handbook review and online training paths.', roleResponsible: 'HR' },
        { title: 'Generate ID Card', description: 'Render digital photograph employee ID card with printing options.', roleResponsible: 'HR' },
        { title: 'Welcome Kit & Induction', description: 'Configure apparel sizing and schedule orientation timings.', roleResponsible: 'HR' },
        { title: 'Approval Workflow', description: 'Request final VP operations sign-off for onboarding pipeline.', roleResponsible: 'HR' }
      ];

      for (const t of defaultTasks) {
        await fetch('/api/onboarding/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            checklistId,
            title: t.title,
            description: t.description,
            roleResponsible: t.roleResponsible,
            daysToComplete: 7
          })
        });
      }

      toast.success('Successfully seeded Digital Onboarding Workflow!');
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
      const res = await fetch('/api/onboarding/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          checklistId: selectedChecklistId,
          title: newTaskTitle,
          description: newTaskDesc,
          roleResponsible: newTaskRole,
          daysToComplete: 7
        })
      });
      if (res.ok) {
        toast.success('Task template step added successfully!');
        setNewTaskTitle('');
        setNewTaskDesc('');
        // Reload blueprint tasks list immediately
        fetchBlueprintTasks(selectedChecklistId);
      } else {
        toast.error('Failed to add task template');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const assignChecklistToEmployee = async (checklistId: number) => {
    if (!selectedEmployee) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/onboarding/employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ employeeId: selectedEmployee.id, checklistId })
      });
      if (res.ok) {
        toast.success(`Checklist template assigned to ${selectedEmployee.firstName}`);
        handleEmployeeSelect(selectedEmployee);
      } else {
        toast.error('Failed to assign checklist template');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const handleTaskClick = (t: any) => {
    setActiveTask(t);
    // Initialize temporary state values from saved details if present
    const details = t.details || {};
    setOfferDesignation(details.designation || selectedEmployee?.designation || '');
    setOfferCTC(details.ctc || selectedEmployee?.salary || '');
    setOfferDate(details.date || new Date().toISOString().split('T')[0]);
    setSignatureText(details.signature || '');
    setProvisionUsername(details.username || `${selectedEmployee?.firstName?.toLowerCase()}.${selectedEmployee?.lastName?.toLowerCase()}`);
    setSelectedManager(details.managerId || '');
    setSelectedMentor(details.mentorId || '');
    setSelectedBuddy(details.buddyId || '');
    setSelectedProject(details.projectId || '');
    setSelectedTraining(details.trainingId || '');
    setSelectedAssetId(details.assetId || '');
    setWelcomeKitSize(details.kitSize || 'L');
    setInductionTime(details.inductionTime || '10:00');
    setInductionLocation(details.inductionLocation || 'Main Conference Room');
    setProvisionLogs([]);
  };

  const executeTaskAction = async (status: string = 'completed', updatedDetails: any = {}) => {
    if (!activeTask) return;
    try {
      setExecuting(true);
      const token = getStoredSessionToken();
      
      const payloadDetails = {
        ...(activeTask.details || {}),
        ...updatedDetails
      };

      const res = await fetch('/api/onboarding/employee', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: activeTask.id,
          status,
          details: payloadDetails
        })
      });

      if (res.ok) {
        toast.success(`Task "${activeTask.onboarding_tasks?.title}" updated successfully!`);
        setActiveTask(null);
        if (selectedEmployee) handleEmployeeSelect(selectedEmployee);
      } else {
        toast.error('Failed to update task execution');
      }
    } catch {
      toast.error('Network connection error');
    } finally {
      setExecuting(false);
    }
  };

  const handleProgressWorkflow = async (nextStage: string, nextStatus: string = 'active') => {
    if (!workflowInstance) return;
    try {
      setExecuting(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/onboarding/workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: workflowInstance.id,
          status: nextStatus,
          currentStage: nextStage,
          action: 'PROGRESS_STAGE',
          comments: `Workflow stage advanced to ${nextStage}`
        })
      });
      if (res.ok) {
        toast.success(`Workflow advanced to stage: ${nextStage}`);
        if (selectedEmployee) handleEmployeeSelect(selectedEmployee);
      } else {
        toast.error('Failed to advance workflow lifecycle');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setExecuting(false);
    }
  };

  const handleApproveWorkflowStep = async (stepIndex: number) => {
    if (!workflowInstance) return;
    try {
      const nextChain = [...(workflowInstance.approval_chain || [])];
      nextChain[stepIndex].status = 'approved';
      nextChain[stepIndex].approvedAt = new Date().toISOString();

      const nextHistory = [
        ...(workflowInstance.approval_history || []),
        {
          name: nextChain[stepIndex].name,
          role: nextChain[stepIndex].role,
          action: 'APPROVED',
          timestamp: new Date().toISOString()
        }
      ];

      const allApproved = nextChain.every(c => c.status === 'approved');
      const nextStatus = allApproved ? 'approved' : workflowInstance.status;

      const token = getStoredSessionToken();
      const res = await fetch('/api/onboarding/workflow', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: workflowInstance.id,
          status: nextStatus,
          approvalChain: nextChain,
          approvalHistory: nextHistory,
          action: 'APPROVE_STEP',
          comments: `Approved step: ${nextChain[stepIndex].name}`
        })
      });

      if (res.ok) {
        toast.success(`Approval gate cleared for: ${nextChain[stepIndex].name}`);
        if (selectedEmployee) handleEmployeeSelect(selectedEmployee);
      }
    } catch (err) {
      toast.error('Connection failure');
    }
  };

  const handleActivateEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      setExecuting(true);
      const token = getStoredSessionToken();
      
      // Update employee status to active in core database table
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: selectedEmployee.id,
          status: 'active'
        })
      });

      if (res.ok) {
        // Complete the overall workflow
        await fetch('/api/onboarding/workflow', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id: workflowInstance.id,
            status: 'completed',
            currentStage: 'Employee Activation',
            action: 'ACTIVATE_EMPLOYEE',
            comments: 'Recruit status switched from Pre-Onboarding to Active successfully'
          })
        });

        toast.success(`Congratulations! ${selectedEmployee.firstName} is now fully active in directory!`);
        if (selectedEmployee) handleEmployeeSelect(selectedEmployee);
      }
    } catch {
      toast.error('Activation server connection error');
    } finally {
      setExecuting(false);
    }
  };

  const handleRetryEvent = async (eventId: number) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/onboarding/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ eventId, action: 'retry' })
      });
      if (res.ok) {
        toast.success('Domain event queued for immediate replay');
        fetchEventsQueue();
      }
    } catch {
      toast.error('Failed to retry event processing');
    }
  };

  // Simulated IT provisioning log output
  const handleProvisionAccounts = () => {
    setProvisionLogs([
      '[Provision System] Initiating IT account generation sequence...',
    ]);
    setTimeout(() => {
      setProvisionLogs(prev => [...prev, `[G-Suite] Created mailbox: ${provisionUsername}@techsonance.com`]);
    }, 600);
    setTimeout(() => {
      setProvisionLogs(prev => [...prev, `[Slack Workspace] Sending community workspace invitation link to ${selectedEmployee?.email}`]);
    }, 1200);
    setTimeout(() => {
      setProvisionLogs(prev => [...prev, '[Access Manager] Provisioning default RLS read permission scope']);
    }, 1800);
    setTimeout(() => {
      setProvisionLogs(prev => [...prev, '✅ All workspace credential setups verified successfully. System complete!']);
    }, 2400);
  };

  // Upload document simulator
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNameLower = file.name.toLowerCase();
    const mimeType = file.type;
    
    const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/jpg' || 
                    fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png');
                    
    const isPdf = mimeType === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx');
    
    if (!isImage && !isPdf && !isDocx) {
      toast.error('Only PDF, DOCX, and images (JPG, JPEG, PNG) are accepted.');
      return;
    }
    
    const fileLimit = isImage ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > fileLimit) {
      toast.error(`File size exceeds the limit of ${isImage ? '1 MB' : '2 MB'}`);
      return;
    }

    try {
      setUploadingDoc(true);
      const token = getStoredSessionToken();
      const payload = new FormData();
      payload.append('file', file);
      payload.append('kind', 'employee_document');

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      });

      if (!res.ok) throw new Error('File upload failed');
      const data = await res.json();
      const docUrl = data.data?.url || data.url;

      const currentDocs = activeTask.details?.uploadedDocs || [];
      const updatedDocs = [...currentDocs, { name: file.name, type: docType, url: docUrl, date: new Date().toLocaleDateString() }];

      executeTaskAction('completed', { uploadedDocs: updatedDocs });
      toast.success('Document uploaded and verified successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during document uploading');
    } finally {
      setUploadingDoc(false);
    }
  };

  const completedCount = onboardingTasks.filter(t => t.status === 'completed').length;
  const progressPercent = onboardingTasks.length > 0 ? Math.round((completedCount / onboardingTasks.length) * 100) : 0;

  // OCR Verification Checks Simulation
  const draftData = workflowInstance?.draft_data || {};
  const hasDocPhotoId = !!draftData.docPhotoId;
  const ocrInconsistencies = [
    { rule: 'Name Identity Check', status: 'Matched', confidence: '99%' },
    { 
      rule: 'Govt ID Alignment', 
      status: draftData.govtIdNo && selectedEmployee?.personalIdNumber && draftData.govtIdNo !== selectedEmployee?.personalIdNumber ? 'Inconsistent' : 'Matched',
      confidence: '95%' 
    },
    { rule: 'DOB Age Verification', status: 'Matched', confidence: '98%' }
  ];

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
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40 rounded-2xl p-5 space-y-4">
              <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-1/3"></div>
              <div className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
              <div className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
              <div className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
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
              
              {/* Employee horizontal list skeleton */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-48 flex-shrink-0"></div>
                <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-48 flex-shrink-0"></div>
                <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-48 flex-shrink-0"></div>
              </div>

              {/* Tabs Skeleton */}
              <div className="flex gap-2 border-b border-slate-100 dark:border-zinc-800/40 pb-3">
                <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-20"></div>
                <div className="h-8 bg-slate-100 dark:bg-zinc-800/50 rounded w-20"></div>
                <div className="h-8 bg-slate-100 dark:bg-zinc-800/50 rounded w-20"></div>
              </div>

              {/* Active tasks list skeleton */}
              <div className="space-y-3">
                <div className="h-12 bg-slate-100 dark:bg-zinc-800/30 rounded-xl"></div>
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
            <UserCheck className="h-8 w-8 text-[#f87941]" />
            Onboarding Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage paperless joining sequences, checklist templates, and digital workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          {checklists.length === 0 && (
            <Button onClick={seedDefaultChecklist} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold flex items-center gap-2 shadow-lg shadow-[#f87941]/20">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Initialize Enterprise Workflows
            </Button>
          )}
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
            <Cpu className="h-3.5 w-3.5 mr-1" />
            Automatic Provisioning Ready
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: templates configurations */}
        <div className="space-y-6 lg:col-span-1 animate-fadeIn">
          <Card className="border-slate-100 dark:border-zinc-800 shadow-lg dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <ListTodo className="h-4 w-4 text-[#f87941]" />
                Checklist Blueprints Catalog
              </CardTitle>
              <CardDescription>Configure corporate template flows</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <form onSubmit={createChecklist} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="chk-name" className="text-xs">Template Name</Label>
                  <Input
                    id="chk-name"
                    placeholder="e.g. Engineering Onboarding"
                    value={newChecklistName}
                    onChange={e => setNewChecklistName(e.target.value)}
                    className="bg-transparent"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="chk-desc" className="text-xs">Description</Label>
                  <Input
                    id="chk-desc"
                    placeholder="Objective parameters..."
                    value={newChecklistDesc}
                    onChange={e => setNewChecklistDesc(e.target.value)}
                    className="bg-transparent"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#f87941]/90 text-white font-semibold">
                  Create Blueprint
                </Button>
              </form>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-2">
                <Label className="text-xs font-bold text-slate-500 block mb-2">Available Blueprints</Label>
                {checklists.map((chk) => (
                  <div
                    key={chk.id}
                    onClick={() => setSelectedChecklistId(chk.id)}
                    className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                      selectedChecklistId === chk.id
                        ? 'border-[#f87941] bg-[#f87941]/5 shadow-sm'
                        : 'border-slate-100 hover:bg-slate-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/50'
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
            <Card className="border-slate-100 dark:border-zinc-800 shadow-lg dark:bg-slate-950/40">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Add Template Step</span>
                  <Badge variant="outline">{blueprintTasks.length} Steps</Badge>
                </CardTitle>
                <CardDescription>Append checklist items to template blueprint</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Visual list of existing tasks in the selected blueprint (FIXES missing steps display) */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4 border-b pb-4">
                  <Label className="text-[10px] text-slate-400 font-bold block mb-1">Blueprint Tasks List</Label>
                  {blueprintTasks.length === 0 ? (
                    <p className="text-xs italic text-slate-400 py-1 text-center">No tasks added to blueprint yet.</p>
                  ) : (
                    blueprintTasks.map((bt, index) => (
                      <div key={bt.id} className="p-2 border rounded-lg bg-slate-50/60 dark:bg-zinc-900/30 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{index + 1}. {bt.title}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{bt.description}</p>
                        </div>
                        <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[8px]">{bt.role_responsible}</Badge>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={createTask} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="task-title" className="text-xs">Task Name</Label>
                    <Input
                      id="task-title"
                      placeholder="e.g. Schedule meeting"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="task-desc" className="text-xs">Directions</Label>
                    <Input
                      id="task-desc"
                      placeholder="Helpful hints..."
                      value={newTaskDesc}
                      onChange={e => setNewTaskDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="task-role" className="text-xs">Role Assigned</Label>
                    <select
                      id="task-role"
                      className="w-full border rounded-md p-2 bg-transparent text-sm border-input outline-none animate-fadeIn"
                      value={newTaskRole}
                      onChange={e => setNewTaskRole(e.target.value)}
                    >
                      <option value="HR" className="bg-white dark:bg-zinc-950">HR Department</option>
                      <option value="IT" className="bg-white dark:bg-zinc-950">IT Support Team</option>
                      <option value="Manager" className="bg-white dark:bg-zinc-950">Reporting Manager</option>
                      <option value="Buddy" className="bg-white dark:bg-zinc-950">Buddy Mentor</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#f87941]/90 text-white font-semibold">
                    Add Blueprint Step
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: employee progress board */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 dark:border-zinc-800 shadow-xl dark:bg-slate-950/40">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-md flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <Kanban className="h-4 w-4 text-[#f87941]" />
                    Recruit Progression Board
                  </CardTitle>
                  <CardDescription>Manage active checklist steps and execution</CardDescription>
                </div>

                {selectedEmployee && workflowInstance && (
                  <Badge className={`border font-bold uppercase text-[9px] ${
                    workflowInstance.status === 'completed' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-[#f87941]/10 text-[#f87941] border-[#f87941]/20'
                  }`}>
                    Workflow ID: {workflowInstance.id} ({workflowInstance.status})
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Employee list horizontal scroll */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleEmployeeSelect(emp)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer min-w-[200px] max-w-[240px] flex-shrink-0 transition-all ${
                      selectedEmployee?.id === emp.id
                        ? 'border-[#f87941] bg-[#f87941]/5 shadow-sm'
                        : 'border-slate-100 hover:bg-slate-50 dark:border-zinc-800/60 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-[#f87941]/10 border border-[#f87941]/20 flex items-center justify-center font-bold text-[#f87941]">
                      {emp.firstName?.[0]}
                      {emp.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{emp.firstName} {emp.lastName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{emp.designation || 'New Recruit'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedEmployee ? (
                <div className="mt-6 space-y-4">
                  {/* Selected Recruit Status Card */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-zinc-900/20 p-4.5 rounded-2xl border border-slate-100 dark:border-zinc-800/60 gap-4">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Orientation Date: {selectedEmployee.dateOfJoining || 'Not Scheduled'}
                      </p>
                      <div className="flex gap-1.5 mt-2">
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100/80 border-none font-bold text-[9px] cursor-pointer" onClick={() => window.open(`/onboarding/${selectedEmployee.id}`, '_blank')}>
                          Candidate Self-Service Panel
                        </Badge>
                      </div>
                    </div>
                    {onboardingTasks.length > 0 ? (
                      <div className="w-full sm:w-auto text-left sm:text-right space-y-1.5">
                        <div className="flex items-center sm:justify-end gap-2 text-sm font-semibold">
                          <span className="text-[#f87941]">{progressPercent}%</span>
                          <span className="text-slate-400">Completed</span>
                        </div>
                        <div className="w-full sm:w-48 bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#f87941] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{completedCount} of {onboardingTasks.length} steps cleared</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {checklists.length > 0 ? (
                          <div className="flex items-center gap-2 animate-fadeIn">
                            <select
                              className="border rounded-lg p-1.5 text-xs bg-transparent border-input outline-none"
                              value={selectedChecklistId || ''}
                              onChange={e => setSelectedChecklistId(Number(e.target.value))}
                            >
                              {checklists.map(c => (
                                <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-950">{c.name}</option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              className="bg-[#f87941] text-white hover:bg-[#e06634] text-xs font-bold"
                              onClick={() => selectedChecklistId && assignChecklistToEmployee(selectedChecklistId)}
                            >
                              Assign Template
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No checklist templates available. Seed corporate templates to begin.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Workflow Tabs header */}
                  <div className="flex gap-2 border-b pb-2">
                    <Button variant={workflowTab === 'stages' ? 'default' : 'ghost'} size="sm" onClick={() => setWorkflowTab('stages')} className={workflowTab === 'stages' ? 'bg-[#f87941] text-white hover:bg-[#f87941]/90' : 'text-slate-400'}>
                      <TrendingUp className="h-4 w-4 mr-1" /> Progression Stages
                    </Button>
                    <Button variant={workflowTab === 'drafts' ? 'default' : 'ghost'} size="sm" onClick={() => setWorkflowTab('drafts')} className={workflowTab === 'drafts' ? 'bg-[#f87941] text-white hover:bg-[#f87941]/90' : 'text-slate-400'}>
                      <Eye className="h-4 w-4 mr-1" /> Candidate Vault Verification
                    </Button>
                    <Button variant={workflowTab === 'audits' ? 'default' : 'ghost'} size="sm" onClick={() => setWorkflowTab('audits')} className={workflowTab === 'audits' ? 'bg-[#f87941] text-white hover:bg-[#f87941]/90' : 'text-slate-400'}>
                      <History className="h-4 w-4 mr-1" /> Immutables Audit History
                    </Button>
                    <Button variant={workflowTab === 'events' ? 'default' : 'ghost'} size="sm" onClick={() => setWorkflowTab('events')} className={workflowTab === 'events' ? 'bg-[#f87941] text-white hover:bg-[#f87941]/90' : 'text-slate-400'}>
                      <Activity className="h-4 w-4 mr-1" /> Domain Events queue
                    </Button>
                  </div>

                  {/* Tab 1: Workflow Stages progression */}
                  {workflowTab === 'stages' && (
                    <div className="space-y-4 pt-2">
                      {/* Active Stage & Action gates */}
                      {workflowInstance && (
                        <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-zinc-900/10 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Active Stage Gate</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">{workflowInstance.current_stage}</span>
                          </div>
                          <div className="flex gap-2">
                            {workflowInstance.current_stage !== 'Employee Activation' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#f87941]/30 text-[#f87941] hover:bg-[#f87941]/5 flex items-center gap-1 text-[11px]"
                                onClick={() => {
                                  const index = STAGES.indexOf(workflowInstance.current_stage);
                                  if (index >= 0 && index < STAGES.length - 1) {
                                    handleProgressWorkflow(STAGES[index + 1]);
                                  }
                                }}
                              >
                                Advance to Next Stage <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              workflowInstance.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-1 text-[11px]"
                                  onClick={handleActivateEmployee}
                                >
                                  <BadgeCheck className="h-4 w-4" /> Grant final approval & Activate Master profile
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Approval Chain Engine checklist */}
                      {workflowInstance && (
                        <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-zinc-900/10 space-y-3">
                          <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Approval Engine Hierarchy Gates</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(workflowInstance.approval_chain || []).map((gate: any, i: number) => (
                              <div key={i} className="flex justify-between items-center p-2.5 border rounded-lg bg-white dark:bg-slate-950 text-xs">
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{gate.name}</p>
                                  <p className="text-[10px] text-slate-400">Required Role: {gate.role}</p>
                                </div>
                                <div>
                                  {gate.status === 'approved' ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 font-bold border-none text-[10px]">APPROVED</Badge>
                                  ) : (
                                    <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white text-[10px] py-1 px-2.5 h-auto font-bold" onClick={() => handleApproveWorkflowStep(i)}>
                                      Clear Gate
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Task checklist grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {onboardingTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleTaskClick(t)}
                            className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 cursor-pointer transition-all shadow-sm"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">
                                {t.status === 'completed' ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-slate-300 dark:text-zinc-600" />
                                )}
                              </div>
                              <div>
                                <p className={`text-sm font-bold text-slate-800 dark:text-slate-200 ${t.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>
                                  {t.onboarding_tasks?.title || 'System Task'}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{t.onboarding_tasks?.description}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-slate-200 text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5">
                              {t.onboarding_tasks?.role_responsible || 'HR'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Candidate Vault Verification & OCR Inconsistency Check */}
                  {workflowTab === 'drafts' && (
                    <div className="space-y-4 pt-2">
                      {/* OCR validation checks */}
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-3 animate-fadeIn">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-rose-500" />
                          AI-powered OCR validation checks & Inconsistencies Gate
                        </Label>
                        <div className="space-y-2">
                          {ocrInconsistencies.map((rule, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs border-b pb-2 last:border-none last:pb-0">
                              <span className="text-slate-500">{rule.rule}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-medium">Confidence: {rule.confidence}</span>
                                {rule.status === 'Matched' ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[9px]">MATCHED</Badge>
                                ) : (
                                  <Badge className="bg-rose-500/10 text-rose-500 border-none font-bold text-[9px] animate-pulse">FLAGGED INCONSISTENCY</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Candidate Vault Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border shadow-none">
                          <CardHeader className="bg-slate-50/50 pb-2">
                            <CardTitle className="text-xs font-bold">Personal Vault Submissions</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 text-xs space-y-2.5">
                            <div>
                              <span className="text-slate-400 block font-semibold text-[10px]">National ID Type & No:</span>
                              <span className="font-bold">{draftData.govtIdType || 'Pending'} - {draftData.govtIdNo || 'Pending'}</span>
                            </div>
                            <div className="border-t pt-2">
                              <span className="text-slate-400 block font-semibold text-[10px]">Bank Payout Channel:</span>
                              <span className="font-bold">{draftData.bankName || 'Pending'} • Account: {draftData.bankAccount || 'Pending'} • IFSC: {draftData.bankIfsc || 'Pending'}</span>
                            </div>
                            <div className="border-t pt-2">
                              <span className="text-slate-400 block font-semibold text-[10px]">Digital Signature Acceptance:</span>
                              <span className="font-bold italic font-serif text-amber-600">{draftData.signature || 'Pending Signature'}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border shadow-none">
                          <CardHeader className="bg-slate-50/50 pb-2">
                            <CardTitle className="text-xs font-bold">Uploaded Documents Vault</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 text-xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span>Government Photo ID</span>
                              {draftData.docPhotoId ? (
                                <a href={draftData.docPhotoId} target="_blank" rel="noreferrer" className="text-[#f87941] hover:underline font-bold text-[10px]">View Upload</a>
                              ) : (
                                <span className="text-slate-400 italic">Pending</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                              <span>Relieving / Salary slips</span>
                              {draftData.docRelieving ? (
                                <a href={draftData.docRelieving} target="_blank" rel="noreferrer" className="text-[#f87941] hover:underline font-bold text-[10px]">View Upload</a>
                              ) : (
                                <span className="text-slate-400 italic">Pending</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center border-t pt-2">
                              <span>Cancelled Cheque Bank Proof</span>
                              {draftData.docBank ? (
                                <a href={draftData.docBank} target="_blank" rel="noreferrer" className="text-[#f87941] hover:underline font-bold text-[10px]">View Upload</a>
                              ) : (
                                <span className="text-slate-400 italic">Pending</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Immutable audit logs timeline */}
                  {workflowTab === 'audits' && (
                    <div className="pt-2 animate-fadeIn">
                      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-zinc-900/30 text-slate-500 font-bold border-b">
                            <tr>
                              <th className="p-3">Stage</th>
                              <th className="p-3">Action</th>
                              <th className="p-3">Performed By</th>
                              <th className="p-3">Comments/Audit notes</th>
                              <th className="p-3">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-slate-600 dark:text-slate-300">
                            {auditLogs.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center italic text-slate-400">No audit timeline records logged yet.</td>
                              </tr>
                            ) : (
                              auditLogs.map((log) => (
                                <tr key={log.id}>
                                  <td className="p-3 font-bold">{log.stage_name}</td>
                                  <td className="p-3">
                                    <Badge className="bg-slate-100 text-slate-600 font-bold border-none text-[9px]">{log.action}</Badge>
                                  </td>
                                  <td className="p-3">{log.performed_by}</td>
                                  <td className="p-3 max-w-[200px] truncate">{log.device_info}</td>
                                  <td className="p-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Asynchronous events and retries queue */}
                  {workflowTab === 'events' && (
                    <div className="space-y-4 pt-2 animate-fadeIn">
                      <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-zinc-900/10 space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Domain Event Broker Bus</Label>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          This system leverages an event-driven flow. Changes publish domain events. If an event integration fails (like Slack/G-Suite provision timeouts), you can manually queue immediate replay retries here.
                        </p>
                      </div>

                      <div className="overflow-x-auto rounded-xl border">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-zinc-900/30 text-slate-500 font-bold border-b">
                            <tr>
                              <th className="p-3">Event Type</th>
                              <th className="p-3">Queue Status</th>
                              <th className="p-3">Retry count</th>
                              <th className="p-3">Timestamp</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {eventsQueue.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-4 text-center italic text-slate-400">No events generated in the queue yet.</td>
                              </tr>
                            ) : (
                              eventsQueue.slice(0, 8).map((evt) => (
                                <tr key={evt.id}>
                                  <td className="p-3 font-bold">{evt.event_type}</td>
                                  <td className="p-3">
                                    <Badge className={`font-bold text-[9px] uppercase border-none ${
                                      evt.processed_status === 'processed' 
                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                        : 'bg-amber-500/10 text-amber-500'
                                    }`}>
                                      {evt.processed_status}
                                    </Badge>
                                  </td>
                                  <td className="p-3 font-bold">{evt.retry_count} / 3</td>
                                  <td className="p-3 text-slate-400">{new Date(evt.created_at).toLocaleString()}</td>
                                  <td className="p-3 text-right">
                                    {evt.processed_status !== 'processed' && (
                                      <Button size="icon" variant="ghost" onClick={() => handleRetryEvent(evt.id)} className="h-7 w-7 text-[#f87941] hover:bg-[#f87941]/5">
                                        <RotateCw className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground text-sm italic">Select a recruit from the list to track onboarding pipelines.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task execution custom modals dialog */}
      <Dialog open={!!activeTask} onOpenChange={() => setActiveTask(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden max-h-[90vh] flex flex-col p-0 shadow-2xl">
          <DialogHeader className="bg-slate-50/60 dark:bg-zinc-900/30 p-6 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/20 px-2.5 py-0.5 text-[10px] uppercase font-bold">
                    {activeTask?.onboarding_tasks?.role_responsible || 'HR'} Action
                  </Badge>
                  {activeTask?.onboarding_tasks?.title}
                </DialogTitle>
                <DialogDescription className="text-xs mt-1 text-slate-400">{activeTask?.onboarding_tasks?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Interactive view container based on task content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* CASE 1: Offer Letter Generator */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('offer letter') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Designation</Label>
                    <Input value={offerDesignation} onChange={e => setOfferDesignation(e.target.value)} placeholder="e.g. Software Engineer" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Annual CTC (INR)</Label>
                    <Input value={offerCTC} onChange={e => setOfferCTC(e.target.value)} placeholder="e.g. 1200000" className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Date of Joining</Label>
                    <Input type="date" value={offerDate} onChange={e => setOfferDate(e.target.value)} className="mt-1" />
                  </div>
                </div>

                {/* Styled Document Mockup */}
                <div className="p-5 border border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 font-serif text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 shadow-inner">
                  <div className="flex justify-between items-center border-b pb-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-[#f87941]" />
                      <span className="font-bold tracking-wider uppercase text-slate-800 dark:text-slate-100">TechSonance CMS</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Date: {new Date().toLocaleDateString()}</span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Subject: Letter of Employment Offer</p>
                  <p className="mt-3">Dear {selectedEmployee?.firstName} {selectedEmployee?.lastName},</p>
                  <p className="mt-2">We are thrilled to offer you the position of <strong className="text-slate-800 dark:text-slate-200 font-bold">{offerDesignation || '[Designation]'}</strong> at TechSonance CMS. Your annual compensation package package (CTC) is set at <strong className="text-slate-800 dark:text-slate-200 font-bold">INR {offerCTC || '[Salary]'}</strong>.</p>
                  <p className="mt-2">You will report to duty on <strong className="text-slate-800 dark:text-slate-200 font-bold">{offerDate || '[Joining Date]'}</strong>. We look forward to your acceptances.</p>
                  <div className="mt-6 flex justify-between items-center text-[10px] border-t pt-3">
                    <div>
                      <p className="font-bold">Human Resources Dept</p>
                      <p className="text-slate-400">TechSonance CMS</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Discard</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5" onClick={() => executeTaskAction('completed', { designation: offerDesignation, ctc: offerCTC, date: offerDate })}>
                    <Send className="h-3.5 w-3.5" /> Generate & Email Letter
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 2: Accept Offer Signature Panel */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('accept offer') && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">The recruit must review and digitally sign the employment contract below to proceed.</p>
                
                <div className="max-h-48 overflow-y-auto p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/50 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-serif">
                  <p className="font-bold text-slate-800 dark:text-slate-200">EMPLOYMENT AGREEMENT & POLICIES</p>
                  <p className="mt-2">By submitting this signature, I confirm acceptance of terms: 3 months probation, 90 days notice period, intellectual property ownership assignment, and agreement to follow the workspace ethics handbook.</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold block mb-1.5">Digitally Sign (Type your full name)</Label>
                  <Input value={signatureText} onChange={e => setSignatureText(e.target.value)} placeholder="e.g. John Doe" className="font-serif italic text-lg tracking-wider" />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" disabled={!signatureText} className="bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5" onClick={() => executeTaskAction('completed', { signature: signatureText })}>
                    <FileSignature className="h-3.5 w-3.5" /> Accept & Digital Sign
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 3: Upload Documents & KYC */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('document') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Document Type</Label>
                    <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 outline-none border-input">
                      <option value="Passport" className="bg-white dark:bg-zinc-950">International Passport</option>
                      <option value="National ID Card" className="bg-white dark:bg-zinc-950">Aadhaar Card / Govt ID</option>
                      <option value="PAN Card" className="bg-white dark:bg-zinc-950">PAN Card</option>
                      <option value="Education Certificate" className="bg-white dark:bg-zinc-950">Degree Certificate</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <Label className="text-xs mb-1.5">Select File (PNG, JPG, PDF - Max 1MB)</Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleDocumentUpload} disabled={uploadingDoc} className="text-xs cursor-pointer" />
                  </div>
                </div>

                {uploadingDoc && (
                  <div className="flex items-center gap-2 text-xs text-[#f87941]">
                    <span className="h-4 w-4 border-2 border-t-transparent border-[#f87941] rounded-full animate-spin" />
                    Uploading and executing security verification...
                  </div>
                )}

                {/* Uploaded files grid */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold block mb-2">Uploaded Document Vault ({activeTask.details?.uploadedDocs?.length || 0})</Label>
                  {(activeTask.details?.uploadedDocs || []).map((doc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#f87941]" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{doc.type} • Uploaded {doc.date}</p>
                        </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-[#f87941] hover:underline font-bold text-[10px]">Download</a>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white" onClick={() => executeTaskAction('completed')}>
                    Save Verification Details
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 4: Background Verification (BGV) */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('background') && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Initiate digital background verification checkups using API connectors.</p>
                
                <div className="space-y-3 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">National ID Registry Database Check</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">MATCHED</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t pt-2.5">
                    <span className="font-bold">Prior Employer Reference Database Verify</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">APPROVED</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t pt-2.5">
                    <span className="font-bold">Education Records Clearing verification</span>
                    <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold">IN PROGRESS</Badge>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5" onClick={() => executeTaskAction('completed', { bgvStatus: 'CLEARED' })}>
                    <BadgeCheck className="h-4 w-4" /> Approve & Clear BGV
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 5: Asset Request allocation */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('asset') && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Allocate Workspace Laptop / Device</Label>
                  <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1.5 border-input outline-none">
                    <option value="" className="bg-white dark:bg-zinc-950">Select Asset Inventory ID</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id} className="bg-white dark:bg-zinc-950">
                        {asset.name} - S/N: {asset.serialNumber} ({asset.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-dashed text-xs text-slate-500 space-y-1.5">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Device Handover Handshakes</p>
                  <p>Upon assignment, the asset registry status will rotate to "assigned" and bind directly to the employee timeline.</p>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5" onClick={() => executeTaskAction('completed', { assetId: selectedAssetId })}>
                    <Laptop className="h-4 w-4" /> Issue Asset Device
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 6: Provision Email & Slack */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('slack') && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Configure Corporate Account Username</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={provisionUsername} onChange={e => setProvisionUsername(e.target.value)} placeholder="first.last" />
                    <span className="text-sm font-bold text-slate-400">@techsonance.com</span>
                  </div>
                </div>

                <Button size="sm" variant="outline" className="w-full text-[#f87941] border-[#f87941]/30 hover:bg-[#f87941]/5 flex items-center justify-center gap-2" onClick={handleProvisionAccounts}>
                  <Cpu className="h-4 w-4" /> Provision Active Accounts
                </Button>

                {provisionLogs.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[#00ffcc] font-mono text-[10px] space-y-1.5 h-36 overflow-y-auto shadow-inner">
                    {provisionLogs.map((log, index) => (
                      <p key={index}>{log}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" disabled={provisionLogs.length < 4} className="bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5" onClick={() => executeTaskAction('completed', { username: provisionUsername })}>
                    <Check className="h-4 w-4" /> Complete IT Setup
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 7: Relationship Bindings */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('relationship') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Assign Reporting Manager</Label>
                    <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 border-input outline-none animate-fadeIn">
                      <option value="" className="bg-white dark:bg-zinc-950">Select Manager</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id} className="bg-white dark:bg-zinc-950">{e.firstName} {e.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Assign Mentor</Label>
                    <select value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 border-input outline-none animate-fadeIn">
                      <option value="" className="bg-white dark:bg-zinc-950">Select Mentor</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id} className="bg-white dark:bg-zinc-950">{e.firstName} {e.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Assign Onboarding Buddy</Label>
                    <select value={selectedBuddy} onChange={e => setSelectedBuddy(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 border-input outline-none animate-fadeIn">
                      <option value="" className="bg-white dark:bg-zinc-950">Select Buddy</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id} className="bg-white dark:bg-zinc-950">{e.firstName} {e.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white" onClick={() => executeTaskAction('completed', { managerId: selectedManager, mentorId: selectedMentor, buddyId: selectedBuddy })}>
                    Confirm Relationships Bindings
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 8: Assign Project */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('project') && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Select Project Assignment</Label>
                  <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1.5 border-input outline-none">
                    <option value="" className="bg-white dark:bg-zinc-950">Select Corporate Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-950">{p.name} ({p.status})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white" onClick={() => executeTaskAction('completed', { projectId: selectedProject })}>
                    Assign Project Access
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 9: Assign Training & Policies */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('training') && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Select Orientation Program Course</Label>
                    <select value={selectedTraining} onChange={e => setSelectedTraining(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 border-input outline-none">
                      <option value="" className="bg-white dark:bg-zinc-950">Select Corporate Training</option>
                      {trainingPrograms.map(t => (
                        <option key={t.id} value={t.id} className="bg-white dark:bg-zinc-950">{t.title} - {t.durationHours} Hours</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/10">
                    <input type="checkbox" id="polCheck" className="mt-1 h-3.5 w-3.5 accent-[#f87941] cursor-pointer" defaultChecked={activeTask.details?.policiesChecked} />
                    <div>
                      <Label htmlFor="polCheck" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">Enforce Handbook Policies Check</Label>
                      <p className="text-[10px] text-slate-400 mt-0.5">Require candidate to sign employee handbook, NDA agreements, and remote workspace safety checklist.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5" onClick={() => executeTaskAction('completed', { trainingId: selectedTraining, policiesChecked: true })}>
                    <Award className="h-4 w-4" /> Enroll & Assign Policies
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 10: Generate Digital ID Card */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('id card') && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Render and print physical corporate identification card for recruit.</p>
                
                {/* Visual ID Card Mockup Canvas */}
                <div id="print-id-card" className="max-w-[280px] mx-auto p-5 border border-slate-200 dark:border-zinc-800 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-zinc-950 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                  {/* Decorative card background circle */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#f87941]/10 rounded-full blur-xl" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />

                  <div className="flex items-center gap-1 mb-4 text-[#f87941] border-b border-slate-800/80 pb-2 w-full justify-center">
                    <Building className="h-4 w-4" />
                    <span className="font-extrabold tracking-widest text-[9px] uppercase">TechSonance CMS</span>
                  </div>

                  <div className="h-20 w-20 rounded-2xl bg-slate-800 border-2 border-[#f87941] flex items-center justify-center font-bold text-lg text-slate-300 overflow-hidden mb-3">
                    {selectedEmployee?.firstName?.[0]}{selectedEmployee?.lastName?.[0]}
                  </div>

                  <p className="font-bold text-sm tracking-wide">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</p>
                  <p className="text-[10px] text-[#f87941] font-semibold mt-0.5 uppercase tracking-wider">{selectedEmployee?.designation || 'New Hire'}</p>
                  
                  <div className="mt-4 w-full space-y-1.5 text-left text-[9px] border-t border-slate-800/80 pt-3.5 text-slate-400">
                    <p><strong className="text-white">ID:</strong> {selectedEmployee?.employeeId || 'Pending'}</p>
                    <p><strong className="text-white">BLOOD GRP:</strong> {selectedEmployee?.bloodGroup || 'O+'}</p>
                    <p><strong className="text-white">EMAIL:</strong> {selectedEmployee?.officeEmail || selectedEmployee?.email}</p>
                  </div>

                  {/* Simulated barcode */}
                  <div className="mt-4 h-6 w-full bg-white rounded border border-slate-200 flex items-center justify-around px-2 text-slate-900 font-mono text-[8px]">
                    ||| | ||| || ||| | ||| || ||| |
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5" onClick={() => {
                    window.print();
                    executeTaskAction('completed');
                  }}>
                    <Printer className="h-4 w-4" /> Print ID Card
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 11: Welcome Kit & Induction Schedule */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('welcome kit') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Apparel Size (Welcome Hoodie)</Label>
                    <select value={welcomeKitSize} onChange={e => setWelcomeKitSize(e.target.value)} className="w-full border rounded-lg p-2 bg-transparent text-xs mt-1 border-input outline-none">
                      <option value="S" className="bg-white dark:bg-zinc-950">Small (S)</option>
                      <option value="M" className="bg-white dark:bg-zinc-950">Medium (M)</option>
                      <option value="L" className="bg-white dark:bg-zinc-950">Large (L)</option>
                      <option value="XL" className="bg-white dark:bg-zinc-950">Extra Large (XL)</option>
                      <option value="XXL" className="bg-white dark:bg-zinc-950">Double XL (XXL)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Orientation Time</Label>
                    <Input type="time" value={inductionTime} onChange={e => setInductionTime(e.target.value)} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Induction Location Room / Meeting Link</Label>
                    <Input value={inductionLocation} onChange={e => setInductionLocation(e.target.value)} placeholder="e.g. Conference Room A or Zoom link" className="mt-1" />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white" onClick={() => executeTaskAction('completed', { kitSize: welcomeKitSize, inductionTime, inductionLocation })}>
                    Schedule Induction Day
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 12: Final Approval Workflow */}
            {activeTask?.onboarding_tasks?.title?.toLowerCase()?.includes('approval') && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">VP & operations pipeline validations complete:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <li>Offer letter and contract signed by candidate</li>
                    <li>Credentials and KYC documents collected & verified</li>
                    <li>Hardware devices successfully assigned</li>
                    <li>Slack and G-Suite email mailboxes generated</li>
                  </ul>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveTask(null)}>Close</Button>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5" onClick={() => executeTaskAction('completed', { approvedBy: 'VP Operations' })}>
                    <Check className="h-4 w-4" /> Grant Onboarding Approval
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const STAGES = [
  'Offer Acceptance',
  'Pre-Onboarding',
  'Document Collection',
  'Background Verification',
  'IT Provisioning',
  'Employee Activation'
];
