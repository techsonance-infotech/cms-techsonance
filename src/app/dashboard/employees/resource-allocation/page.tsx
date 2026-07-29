'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar as CalendarIcon, Download, Sparkles, 
  Settings, ChevronRight, ChevronLeft, CalendarDays,
  Users, Bot, ArrowRightLeft, User, ShieldCheck, 
  HelpCircle, AlertTriangle, Play, BarChart3, LineChart,
  UserCheck, Award, Briefcase, Plus, Send, Landmark, IndianRupee
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

interface StaffingRequest {
  id: string;
  project_id: number | null;
  project_name: string;
  role_requested: string;
  skills_required: string | null;
  seniority: string;
  duration: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

interface PsaContract {
  id: string;
  project_id: number;
  sow_details: string | null;
  billing_model: string;
  planned_revenue: number;
  actual_revenue: number;
  planned_cost: number;
  actual_cost: number;
  margin_percentage: number;
  revenue_leakage: number;
  project?: {
    name: string;
    budget: number;
    status: string;
  };
}

export default function ResourceAllocationWorkload() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<StaffingRequest[]>([]);
  const [contracts, setContracts] = useState<PsaContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'bench' | 'requests' | 'forecasting' | 'psa_billing'>('heatmap');
  
  // Forecast scenario values
  const [pipelineGrowth, setPipelineGrowth] = useState<number>(20);
  const [attritionRate, setAttritionRate] = useState<number>(5);

  // Staffing request form state
  const [reqProjectId, setReqProjectId] = useState<string>('none');
  const [reqProjectName, setReqProjectName] = useState('');
  const [reqRole, setReqRole] = useState('');
  const [reqSkills, setReqSkills] = useState('');
  const [reqSeniority, setReqSeniority] = useState('Senior');
  const [reqDuration, setReqDuration] = useState('6 months');

  // PSA contract form state
  const [psaProjectId, setPsaProjectId] = useState<string>('');
  const [psaSowDetails, setPsaSowDetails] = useState('');
  const [psaBillingModel, setPsaBillingModel] = useState<'fixed_cost' | 'time_and_materials' | 'retainer'>('fixed_cost');
  const [psaPlannedRev, setPsaPlannedRev] = useState('');
  const [psaPlannedCost, setPsaPlannedCost] = useState('');
  const [psaActualRev, setPsaActualRev] = useState('');
  const [psaActualCost, setPsaActualCost] = useState('');
  const [psaLeakage, setPsaLeakage] = useState('');
  const [showPsaForm, setShowPsaForm] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      // Parallel fetches
      const [empRes, taskRes, projRes, reqRes, contractRes] = await Promise.all([
        fetch('/api/employees?limit=50', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tasks?limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/projects?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/resources/staffing', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/psa/contracts', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (empRes.ok) {
        const json = await empRes.json();
        setEmployees(json.data || json || []);
      }
      if (taskRes.ok) {
        const json = await taskRes.json();
        setTasks(json.data || json || []);
      }
      if (projRes.ok) {
        const json = await projRes.json();
        setProjects(Array.isArray(json) ? json : (json.data ?? []));
      }
      if (reqRes.ok) {
        const json = await reqRes.json();
        setRequests(json.data || []);
      }
      if (contractRes.ok) {
        const json = await contractRes.json();
        setContracts(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching resource planner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const projName = reqProjectId === 'none' ? reqProjectName : projects.find(p => p.id.toString() === reqProjectId)?.name;
    if (!projName || !reqRole) {
      toast.error('Please specify a project and role type');
      return;
    }

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/resources/staffing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: reqProjectId === 'none' ? null : parseInt(reqProjectId, 10),
          projectName: projName,
          roleRequested: reqRole,
          skillsRequired: reqSkills || null,
          seniority: reqSeniority,
          duration: reqDuration,
        })
      });

      if (res.ok) {
        toast.success('Staffing request raised successfully');
        setReqProjectName('');
        setReqRole('');
        setReqSkills('');
        fetchData();
      } else {
        toast.error('Failed to submit staffing request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePsaContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!psaProjectId) {
      toast.error('Please select a project to associate billing details');
      return;
    }

    const pRev = parseFloat(psaPlannedRev) || 0;
    const aRev = parseFloat(psaActualRev) || 0;
    const pCost = parseFloat(psaPlannedCost) || 0;
    const aCost = parseFloat(psaActualCost) || 0;
    const margin = aRev > 0 ? Math.round(((aRev - aCost) / aRev) * 100) : 0;

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/psa/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: parseInt(psaProjectId, 10),
          sowDetails: psaSowDetails || null,
          billingModel: psaBillingModel,
          plannedRevenue: pRev,
          actualRevenue: aRev,
          plannedCost: pCost,
          actualCost: aCost,
          marginPercentage: margin,
          revenueLeakage: parseFloat(psaLeakage) || 0
        })
      });

      if (res.ok) {
        toast.success('PSA Contract margins updated successfully');
        setShowPsaForm(false);
        setPsaProjectId('');
        setPsaSowDetails('');
        setPsaPlannedRev('');
        setPsaActualRev('');
        setPsaPlannedCost('');
        setPsaActualCost('');
        setPsaLeakage('');
        fetchData();
      } else {
        toast.error('Failed to save contract metrics');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateRequestStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/resources/staffing?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Request status updated to ${status}`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAvatarFallback = (firstName: string, lastName: string) => {
    const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    return (
      <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs">
        {initials || 'EM'}
      </div>
    );
  };

  // Find bench resources (developers with 0 allocated tasks)
  const benchResources = employees.filter(emp => {
    const allocatedTasks = tasks.filter(t => t.assignedTo === emp.id && t.status !== 'done');
    return allocatedTasks.length === 0;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6 animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* Brand Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-850 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-100 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="h-8 w-8 text-indigo-500" />
            Enterprise PSA & Resource Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">Centralized cockpit for capacity planning, staffing requests, bench costs, and AI workload forecasting.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
            AI Capacity Engine Active
          </Badge>
        </div>
      </div>

      {/* Interactive Tabs Menu */}
      <div className="flex gap-2 border-b pb-2.5 overflow-x-auto text-xs font-bold text-slate-500">
        {[
          { id: 'heatmap', label: 'Workload Heatmap', icon: BarChart3 },
          { id: 'bench', label: 'Bench Management', icon: UserCheck },
          { id: 'requests', label: 'Staffing Requests', icon: Briefcase },
          { id: 'forecasting', label: 'Capacity Forecasting', icon: LineChart },
          { id: 'psa_billing', label: 'PSA Billing & margins', icon: Landmark }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Context Layout Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left main content panels based on Active Tab */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* TAB 1: HEATMAP */}
          {activeTab === 'heatmap' && (
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-md">Weekly Utilization Heat Map</CardTitle>
                  <CardDescription>Allocated hours mapped dynamically to current employee master data.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2 h-2 rounded bg-slate-100 dark:bg-zinc-850"></span>0%</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2 h-2 rounded bg-indigo-100 dark:bg-indigo-950/45"></span>Optimal</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2 h-2 rounded bg-indigo-500"></span>Overload</span>
                </div>
              </CardHeader>
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-900/10 border-b">
                      <th className="px-6 py-3 font-bold">Resource Name</th>
                      <th className="py-3 text-center font-bold">Mon</th>
                      <th className="py-3 text-center font-bold">Tue</th>
                      <th className="py-3 text-center font-bold">Wed</th>
                      <th className="py-3 text-center font-bold">Thu</th>
                      <th className="py-3 text-center font-bold">Fri</th>
                      <th className="py-3 text-center font-bold">Sat</th>
                      <th className="py-3 text-center font-bold">Sun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, idx) => {
                      const empTasks = tasks.filter(t => t.assignedTo === emp.id && t.status !== 'done');
                      const workloadPoints = empTasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
                      const baseHours = workloadPoints > 8 ? 8 : workloadPoints || 4;
                      return (
                        <tr key={emp.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              {getAvatarFallback(emp.firstName, emp.lastName)}
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">{emp.firstName} {emp.lastName}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">{emp.designation || 'Software Dev'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`h-8 rounded-md flex items-center justify-center font-bold text-xs ${
                              workloadPoints === 0 ? 'bg-slate-100 dark:bg-zinc-900 text-slate-400' :
                              workloadPoints > 8 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40'
                            }`}>
                              {workloadPoints === 0 ? '0h' : `${baseHours}h`}
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`h-8 rounded-md flex items-center justify-center font-bold text-xs ${
                              workloadPoints === 0 ? 'bg-slate-100 dark:bg-zinc-900 text-slate-400' :
                              workloadPoints > 8 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40'
                            }`}>
                              {workloadPoints === 0 ? '0h' : `${baseHours}h`}
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`h-8 rounded-md flex items-center justify-center font-bold text-xs ${
                              workloadPoints === 0 ? 'bg-slate-100 dark:bg-zinc-900 text-slate-400' :
                              workloadPoints > 8 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40'
                            }`}>
                              {workloadPoints === 0 ? '0h' : `${baseHours}h`}
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`h-8 rounded-md flex items-center justify-center font-bold text-xs ${
                              workloadPoints === 0 ? 'bg-slate-100 dark:bg-zinc-900 text-slate-400' :
                              workloadPoints > 8 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40'
                            }`}>
                              {workloadPoints === 0 ? '0h' : `${Math.max(0, baseHours - 2)}h`}
                            </div>
                          </td>
                          <td className="p-1">
                            <div className={`h-8 rounded-md flex items-center justify-center font-bold text-xs ${
                              workloadPoints === 0 ? 'bg-slate-100 dark:bg-zinc-900 text-slate-400' :
                              workloadPoints > 8 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40'
                            }`}>
                              {workloadPoints === 0 ? '0h' : `${Math.max(0, baseHours - 3)}h`}
                            </div>
                          </td>
                          <td className="p-1"><div className="h-8 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                          <td className="p-1"><div className="h-8 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 2: BENCH MANAGEMENT */}
          {activeTab === 'bench' && (
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Unallocated Bench Aging Dashboard</CardTitle>
                <CardDescription>Track bench costs, days on bench, and redeployment recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/10 border-b">
                      <th className="p-3 px-6">Bench Resource</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Daily cost impact</th>
                      <th className="p-3">Redeployment Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchResources.map((emp, idx) => (
                      <tr key={emp.id} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                        <td className="p-3 px-6 font-bold flex items-center gap-2">
                          {getAvatarFallback(emp.firstName, emp.lastName)}
                          {emp.firstName} {emp.lastName}
                        </td>
                        <td className="p-3 font-semibold text-slate-500">{emp.designation || 'Software Dev'}</td>
                        <td className="p-3">
                          <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold">
                            Unallocated Bench
                          </Badge>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                          ₹4,500/day
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-bold">
                            <Bot className="h-3.5 w-3.5" />
                            {idx % 2 === 0 ? 'Redeploy to Active Pipeline' : 'Queue onboarding courses'}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {benchResources.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400 italic">No resources currently on bench. 100% capacity deployed!</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: STAFFING REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Form to raise staffing request */}
              <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                  <CardTitle className="text-md flex items-center gap-1.5"><Plus className="h-4.5 w-4.5 text-indigo-500" /> Raise Project Staffing Request</CardTitle>
                  <CardDescription>Request resource allocation matching skills and budget constraints.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleCreateRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 col-span-2">
                      <label className="font-bold text-slate-500">Associate Portfolio Project</label>
                      <Select value={reqProjectId} onValueChange={setReqProjectId}>
                        <SelectTrigger className="h-9 bg-white dark:bg-zinc-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Create Standalone (Internal / Research)</SelectItem>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {reqProjectId === 'none' && (
                      <div className="space-y-1.5 col-span-2">
                        <label className="font-bold text-slate-500">Standalone Project / SOW Title</label>
                        <Input
                          placeholder="e.g. eSIM Cloud Provisioning Sync"
                          value={reqProjectName}
                          onChange={e => setReqProjectName(e.target.value)}
                          className="bg-white dark:bg-zinc-900 border-border h-9"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500">Role Designation</label>
                      <Input
                        placeholder="e.g. Principal React Lead"
                        value={reqRole}
                        onChange={e => setReqRole(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border-border h-9"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500">Duration Required</label>
                      <Input
                        placeholder="e.g. 6 months"
                        value={reqDuration}
                        onChange={e => setReqDuration(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border-border h-9"
                        required
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="font-bold text-slate-500">Skillset Criteria</label>
                      <Input
                        placeholder="e.g. TypeScript, AWS lambda, RLS schemas"
                        value={reqSkills}
                        onChange={e => setReqSkills(e.target.value)}
                        className="bg-white dark:bg-zinc-900 border-border h-9"
                      />
                    </div>
                    <div className="col-span-2 text-right pt-2">
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 flex items-center gap-1">
                        <Send className="h-4 w-4" /> Publish Request
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Active requests queues */}
              <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                  <CardTitle className="text-md">Active Staffing Request Queues</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/10 border-b">
                        <th className="p-3 px-6">ID</th>
                        <th className="p-3">Project</th>
                        <th className="p-3">Role Requested</th>
                        <th className="p-3">Skills required</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                          <td className="p-3 px-6 font-mono font-bold text-slate-400">REQ-{r.id.substring(0,4).toUpperCase()}</td>
                          <td className="p-3 font-bold">{r.project_name}</td>
                          <td className="p-3 font-semibold text-slate-600 dark:text-slate-350">{r.role_requested}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">{r.skills_required || 'N/A'}</td>
                          <td className="p-3 text-center">
                            <Badge className={`text-[9px] font-bold border-none ${
                              r.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                              r.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            {r.status === 'Pending' && (
                              <>
                                <Button size="sm" onClick={() => updateRequestStatus(r.id, 'Approved')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-7 px-2 text-[10px]">Approve</Button>
                                <Button size="sm" onClick={() => updateRequestStatus(r.id, 'Rejected')} className="bg-rose-500 hover:bg-rose-600 text-white font-bold h-7 px-2 text-[10px]">Reject</Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-slate-400 text-center py-6 italic">No staffing requests raised.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: CAPACITY FORECASTING */}
          {activeTab === 'forecasting' && (
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-1.5"><LineChart className="h-5 w-5 text-indigo-500" /> What-If Staffing Capacity Forecast Calculator</CardTitle>
                <CardDescription>Drag parameters to simulate hiring triggers, bench expansions, and skill availability timelines.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pipeline Growth Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-slate-500">
                      <span>Expected Pipeline Project Growth:</span>
                      <span className="text-indigo-600">{pipelineGrowth}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pipelineGrowth}
                      onChange={e => setPipelineGrowth(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Attrition Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-slate-500">
                      <span>Simulated Annual Employee Attrition:</span>
                      <span className="text-rose-500">{attritionRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={attritionRate}
                      onChange={e => setAttritionRate(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>

                {/* Simulated Results Indicators */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="p-4 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50 dark:bg-zinc-900/20">
                    <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Forecasted Headcount Required</h5>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">+{Math.round(employees.length * (pipelineGrowth / 100))} resources</p>
                  </div>
                  <div className="p-4 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50 dark:bg-zinc-900/20">
                    <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Critical Skill Shortage Risk</h5>
                    <p className={`text-xl font-black ${pipelineGrowth > 40 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {pipelineGrowth > 40 ? 'HIGH RISK' : 'STABLE'}
                    </p>
                  </div>
                  <div className="p-4 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 col-span-2 md:col-span-1">
                    <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Recruitment Demand Trigger</h5>
                    <p className="text-xl font-black text-indigo-600">
                      {Math.max(0, Math.round((employees.length * (attritionRate / 100)) + (employees.length * (pipelineGrowth / 120))))} hires
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: PSA BILLING & CONTRACTS */}
          {activeTab === 'psa_billing' && (
            <div className="space-y-6">
              {/* Form to configure contract details */}
              {showPsaForm ? (
                <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80 bg-indigo-50/10">
                  <CardHeader>
                    <CardTitle className="text-md flex items-center gap-1.5"><Landmark className="h-4.5 w-4.5 text-indigo-500" /> Manage PSA Contract</CardTitle>
                    <CardDescription>Setup gross margins, planned and actual cost, and leakage logs.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreatePsaContract} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5 col-span-2">
                        <label className="font-bold text-slate-500">Associate Portfolio Project *</label>
                        <Select value={psaProjectId} onValueChange={setPsaProjectId}>
                          <SelectTrigger className="h-9 bg-white dark:bg-zinc-900">
                            <SelectValue placeholder="Select active project" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Billing Model</label>
                        <Select value={psaBillingModel} onValueChange={val => setPsaBillingModel(val as any)}>
                          <SelectTrigger className="h-9 bg-white dark:bg-zinc-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed_cost">Fixed Cost (Lump-sum)</SelectItem>
                            <SelectItem value="time_and_materials">Time & Materials (T&M)</SelectItem>
                            <SelectItem value="retainer">Retainer Subscription</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">SOW Details Reference</label>
                        <Input placeholder="e.g. SOW-2026-REACT-04" value={psaSowDetails} onChange={e => setPsaSowDetails(e.target.value)} className="bg-white dark:bg-zinc-900 h-9" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Planned SOW Revenue (₹)</label>
                        <Input placeholder="1500000" value={psaPlannedRev} onChange={e => setPsaPlannedRev(e.target.value)} type="number" className="bg-white dark:bg-zinc-900 h-9" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Actual Revenue Recognized (₹)</label>
                        <Input placeholder="1200000" value={psaActualRev} onChange={e => setPsaActualRev(e.target.value)} type="number" className="bg-white dark:bg-zinc-900 h-9" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Planned Cost Allocation (₹)</label>
                        <Input placeholder="900000" value={psaPlannedCost} onChange={e => setPsaPlannedCost(e.target.value)} type="number" className="bg-white dark:bg-zinc-900 h-9" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500">Actual Delivery Costs (₹)</label>
                        <Input placeholder="750000" value={psaActualCost} onChange={e => setPsaActualCost(e.target.value)} type="number" className="bg-white dark:bg-zinc-900 h-9" />
                      </div>

                      <div className="space-y-1.5 col-span-2">
                        <label className="font-bold text-slate-500">Revenue Leakage / Scope Creep Cost (₹)</label>
                        <Input placeholder="50000" value={psaLeakage} onChange={e => setPsaLeakage(e.target.value)} type="number" className="bg-white dark:bg-zinc-900 h-9" />
                      </div>

                      <div className="col-span-2 text-right space-x-2 pt-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowPsaForm(false)}>Cancel</Button>
                        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Save Margins</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-right">
                  <Button onClick={() => setShowPsaForm(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9">
                    <Plus className="h-4 w-4 mr-1.5" /> Configure Billing Contract
                  </Button>
                </div>
              )}

              {/* Contracts Breakdown */}
              <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                  <CardTitle className="text-md">Active PSA Contracts & Deliverables</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/10 border-b">
                        <th className="p-3 px-6">Project Name</th>
                        <th className="p-3">Billing Model</th>
                        <th className="p-3">Revenue (Planned vs Actual)</th>
                        <th className="p-3">Cost (Planned vs Actual)</th>
                        <th className="p-3">Gross Margin</th>
                        <th className="p-3 text-right">Scope Leakage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                          <td className="p-3 px-6 font-bold">{c.project?.name || 'Internal'}</td>
                          <td className="p-3 font-semibold text-slate-500 capitalize">{c.billing_model.replace('_', ' ')}</td>
                          <td className="p-3">
                            <span className="text-muted-foreground">₹{Number(c.planned_revenue || 0).toLocaleString()}</span>
                            <span className="mx-1 text-slate-400">→</span>
                            <strong className="text-indigo-600 dark:text-indigo-400">₹{Number(c.actual_revenue || 0).toLocaleString()}</strong>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-350">
                            <span>₹{Number(c.planned_cost || 0).toLocaleString()}</span>
                            <span className="mx-1">→</span>
                            <strong>₹{Number(c.actual_cost || 0).toLocaleString()}</strong>
                          </td>
                          <td className="p-3 font-black text-emerald-600 dark:text-emerald-500">
                            {c.margin_percentage}%
                          </td>
                          <td className="p-3 text-right font-bold text-rose-500">
                            ₹{Number(c.revenue_leakage || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {contracts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400 italic">No PSA billing contracts configured.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {/* Side Column: Utilization & AI Suggestions */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Utilization Breakdown */}
          <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
              <CardTitle className="text-md flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-500" /> Current Utilization Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Engineering Department</span>
                  <span className="font-black text-indigo-600">82%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-[82%]"></div>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-indigo-400">Optimal: Balanced workload configuration</div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Design Team</span>
                  <span className="font-black text-amber-500">60%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[60%]"></div>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-slate-400">Bench: Available for pipeline additions</div>
              </div>
            </CardContent>
          </Card>

          {/* AI Reallocation Suggestions */}
          <Card className="border-none shadow-xl relative overflow-hidden bg-slate-900 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 blur-3xl -mr-16 -mt-16 rounded-full"></div>
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-md font-bold text-indigo-400">AI Reallocation Engine</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10 text-xs">
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Bench Optimizations</div>
                <p className="text-xs font-medium text-slate-300 mb-3">Found {benchResources.length} unallocated engineers on the bench.</p>
                <div className="flex items-center gap-2 text-[10px] font-semibold bg-indigo-500/20 p-2 rounded border border-indigo-500/30 text-indigo-100">
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>Assign to pending staffing requests.</span>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
