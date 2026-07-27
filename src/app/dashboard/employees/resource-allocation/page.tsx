'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar as CalendarIcon, Download, Sparkles, 
  Settings, ChevronRight, ChevronLeft, CalendarDays,
  Users, Bot, ArrowRightLeft, User, ShieldCheck, 
  HelpCircle, AlertTriangle, Play, BarChart3, LineChart,
  UserCheck, Award, Briefcase, Plus, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

interface StaffingRequest {
  id: string;
  project: string;
  role: string;
  skills: string;
  seniority: string;
  duration: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function ResourceAllocationWorkload() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'heatmap' | 'bench' | 'requests' | 'forecasting' | 'sprint'>('heatmap');
  
  // Forecast scenario values
  const [pipelineGrowth, setPipelineGrowth] = useState<number>(20);
  const [attritionRate, setAttritionRate] = useState<number>(5);

  // Staffing request state
  const [requests, setRequests] = useState<StaffingRequest[]>([
    { id: 'REQ-01', project: 'Core API Redesign', role: 'Backend Lead', skills: 'Node.js, PostgreSQL, Redis', seniority: 'Senior', duration: '6 months', status: 'Pending' },
    { id: 'REQ-02', project: 'Helios UX', role: 'UI/UX Designer', skills: 'Figma, Tailwind CSS', seniority: 'Mid-Level', duration: '3 months', status: 'Approved' },
    { id: 'REQ-03', project: 'Titan Pay Gateway', role: 'Security Auditor', skills: 'OAuth 2.0, PCI-DSS', seniority: 'Principal', duration: '2 months', status: 'Pending' }
  ]);
  const [reqProject, setReqProject] = useState('');
  const [reqRole, setReqRole] = useState('');
  const [reqSkills, setReqSkills] = useState('');
  const [reqSeniority, setReqSeniority] = useState('Senior');
  const [reqDuration, setReqDuration] = useState('6 months');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/employees?limit=12', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.data || json || []);
      } else {
        toast.error('Failed to load employees for resource matrix');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarFallback = (firstName: string, lastName: string) => {
    const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    return (
      <div className="w-9 h-9 rounded-full bg-[#f87941]/10 text-[#f87941] flex items-center justify-center font-extrabold text-xs">
        {initials || 'EM'}
      </div>
    );
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProject || !reqRole) {
      toast.error('Please enter project name and role type');
      return;
    }
    const newReq: StaffingRequest = {
      id: `REQ-0${requests.length + 1}`,
      project: reqProject,
      role: reqRole,
      skills: reqSkills || 'N/A',
      seniority: reqSeniority,
      duration: reqDuration,
      status: 'Pending'
    };
    setRequests(prev => [newReq, ...prev]);
    toast.success('Staffing request raised successfully');
    setReqProject('');
    setReqRole('');
    setReqSkills('');
  };

  const updateRequestStatus = (id: string, status: 'Approved' | 'Rejected') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast.success(`Request ${id} status updated to ${status}`);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse">
        <div className="h-28 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full animate-pulse"></div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 h-96 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl animate-pulse"></div>
          <div className="col-span-4 h-96 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Bench Ageing & classification calculations
  const benchResources = employees.slice(0, 4);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6 animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="h-8 w-8 text-[#f87941]" />
            Enterprise PSA & Resource Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">Centralized cockpit for capacity planning, staffing requests, bench costs, and AI workload forecasting.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-slate-800 text-slate-300 bg-transparent text-xs h-9 flex items-center gap-2">
            <Download className="h-4 w-4" /> Export capacity matrices
          </Button>
          <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
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
          { id: 'sprint', label: 'Agile Sprint Tracker', icon: Award }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[#f87941]/15 text-[#f87941] shadow-xs' 
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
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2 h-2 rounded bg-slate-100 dark:bg-zinc-850"></span>Low</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2 h-2 rounded bg-orange-100 dark:bg-orange-950/40"></span>Med</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2 h-2 rounded bg-[#f87941]"></span>High</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2 h-2 rounded bg-rose-600"></span>Overload</span>
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
                    {employees.map((emp, idx) => (
                      <tr key={emp.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {getAvatarFallback(emp.firstName, emp.lastName)}
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{emp.firstName} {emp.lastName}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{emp.designation || 'Specialist'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-1"><div className={`h-8 rounded-md flex items-center justify-center font-bold text-xs ${idx % 3 === 0 ? 'bg-orange-100 text-[#f87941] dark:bg-orange-950/40' : 'bg-rose-500 text-white'}`}>{idx % 3 === 0 ? '6h' : '10h'}</div></td>
                        <td className="p-1"><div className="h-8 rounded-md bg-[#f87941] flex items-center justify-center text-white font-bold text-xs shadow-sm">8h</div></td>
                        <td className="p-1"><div className="h-8 rounded-md bg-[#f87941] flex items-center justify-center text-white font-bold text-xs shadow-sm">8h</div></td>
                        <td className="p-1"><div className="h-8 rounded-md bg-orange-100 text-[#f87941] dark:bg-orange-950/40 flex items-center justify-center font-bold text-xs">6h</div></td>
                        <td className="p-1"><div className="h-8 rounded-md bg-orange-100 text-[#f87941] dark:bg-orange-950/40 flex items-center justify-center font-bold text-xs">4h</div></td>
                        <td className="p-1"><div className="h-8 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                        <td className="p-1"><div className="h-8 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-slate-400 italic py-8 text-center">No active employees found to generate heatmap.</td>
                      </tr>
                    )}
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
                      <th className="p-3">Bench Ageing</th>
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
                            {idx * 15 + 10} Days on Bench
                          </Badge>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                          ₹{idx * 1000 + 4500}/day
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-bold">
                            <Bot className="h-3 w-3" />
                            {idx % 2 === 0 ? 'Assign to Pre-sales' : 'Queue training program'}
                          </div>
                        </td>
                      </tr>
                    ))}
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
                  <CardTitle className="text-md flex items-center gap-1.5"><Plus className="h-4.5 w-4.5 text-[#f87941]" /> Raise Project Staffing Request</CardTitle>
                  <CardDescription>Request resource allocation matching skills and budget constraints.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleCreateRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 col-span-2">
                      <label className="font-bold text-slate-500">Project Title / Client Name</label>
                      <Input
                        placeholder="e.g. eSIM Cloud Provisioning Sync"
                        value={reqProject}
                        onChange={e => setReqProject(e.target.value)}
                        className="bg-white dark:bg-[#1E1F22] border-border h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500">Role Designation</label>
                      <Input
                        placeholder="e.g. Principal React Lead"
                        value={reqRole}
                        onChange={e => setReqRole(e.target.value)}
                        className="bg-white dark:bg-[#1E1F22] border-border h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-500">Duration Required</label>
                      <Input
                        placeholder="e.g. 6 months"
                        value={reqDuration}
                        onChange={e => setReqDuration(e.target.value)}
                        className="bg-white dark:bg-[#1E1F22] border-border h-9"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="font-bold text-slate-500">Skillset Criteria</label>
                      <Input
                        placeholder="e.g. TypeScript, AWS lambda, RLS schemas"
                        value={reqSkills}
                        onChange={e => setReqSkills(e.target.value)}
                        className="bg-white dark:bg-[#1E1F22] border-border h-9"
                      />
                    </div>
                    <div className="col-span-2 text-right pt-2">
                      <Button type="submit" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 flex items-center gap-1">
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
                          <td className="p-3 px-6 font-mono font-bold text-slate-400">{r.id}</td>
                          <td className="p-3 font-bold">{r.project}</td>
                          <td className="p-3 font-semibold text-slate-600 dark:text-slate-350">{r.role}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">{r.skills}</td>
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
                <CardTitle className="text-md flex items-center gap-1.5"><LineChart className="h-5 w-5 text-[#f87941]" /> What-If Staffing Capacity Forecast Calculator</CardTitle>
                <CardDescription>Drag parameters to simulate hiring triggers, bench expansions, and skill availability timelines.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pipeline Growth Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-slate-500">
                      <span>Expected Pipeline Project Growth:</span>
                      <span className="text-[#f87941]">{pipelineGrowth}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pipelineGrowth}
                      onChange={e => setPipelineGrowth(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#f87941]"
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
                    <p className="text-xl font-black text-[#f87941]">
                      {Math.max(0, Math.round((employees.length * (attritionRate / 100)) + (employees.length * (pipelineGrowth / 120))))} hires
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: AGILE SPRINT TRACKER */}
          {activeTab === 'sprint' && (
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Agile Sprint Delivery & Team Velocity Logs</CardTitle>
                <CardDescription>Track delivered story points and velocity history metrics.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/10 border-b">
                      <th className="p-3 px-6">Active Sprint</th>
                      <th className="p-3">Assigned Team Size</th>
                      <th className="p-3">Sprint Commitments</th>
                      <th className="p-3">Delivered Points</th>
                      <th className="p-3 text-right">Team Velocity Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'Sprint 24', size: '8 Developers', commit: '82 story points', delivered: '78 story points', velocity: '95%' },
                      { id: 'Sprint 25', size: '9 Developers', commit: '90 story points', delivered: '88 story points', velocity: '97.7%' },
                      { id: 'Sprint 26', size: '10 Developers', commit: '105 story points', delivered: '82 story points', velocity: '78.1% (Breached)' }
                    ].map((s) => (
                      <tr key={s.id} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                        <td className="p-3 px-6 font-bold text-[#f87941]">{s.id}</td>
                        <td className="p-3 font-semibold text-slate-500">{s.size}</td>
                        <td className="p-3 font-semibold text-slate-600 dark:text-slate-350">{s.commit}</td>
                        <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-350">{s.delivered}</td>
                        <td className="p-3 text-right font-black text-slate-700 dark:text-slate-350">{s.velocity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Capability Matrix Section */}
          <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-md">Capabilities & Skills Coverage</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: 'Development', skill: 'React / Next.js', score: '92%', style: 'bg-emerald-500', color: 'text-emerald-500' },
                  { title: 'Cloud Arch', skill: 'Supabase / PostgreSQL', score: '84%', style: 'bg-orange-500', color: 'text-orange-500' },
                  { title: 'Data Security', skill: 'RLS / Compliance', score: '96%', style: 'bg-[#f87941]', color: 'text-[#f87941]' },
                  { title: 'UX / Design', skill: 'Tailwind CSS', score: '78%', style: 'bg-blue-500', color: 'text-blue-500' }
                ].map(item => (
                  <div key={item.title} className="p-4 border border-slate-100 dark:border-zinc-800/50 rounded-xl bg-slate-50 dark:bg-zinc-900/30">
                    <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{item.title}</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.skill}</span>
                      <span className={`font-bold font-mono text-xs ${item.color}`}>{item.score}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`${item.style} h-full`} style={{ width: item.score }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Column: Utilization & AI Suggestions */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Utilization Breakdown */}
          <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
              <CardTitle className="text-md flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[#f87941]" /> Current Utilization Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Engineering Department</span>
                  <span className="font-black text-rose-500">114%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-full"></div>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-rose-400">Critical: 3 members over capacity limit</div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">Design Team</span>
                  <span className="font-black text-[#f87941]">78%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-[#f87941] h-full w-[78%]"></div>
                </div>
                <div className="mt-2 text-[10px] font-semibold text-slate-400">Optimal: Available for sub-projects</div>
              </div>
            </CardContent>
          </Card>

          {/* AI Reallocation Suggestions */}
          <Card className="border-none shadow-xl relative overflow-hidden bg-slate-900 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f87941]/30 blur-3xl -mr-16 -mt-16 rounded-full"></div>
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-orange-400" />
                <CardTitle className="text-md font-bold text-orange-400">AI Reallocation Engine</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10 text-xs">
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-[9px] font-black text-orange-300 uppercase tracking-widest mb-1.5">Overload Detected</div>
                <p className="text-xs font-medium text-slate-300 mb-3">Resource SAJESHKUMAR is at 114% capacity this week.</p>
                <div className="flex items-center gap-2 text-[10px] font-semibold bg-orange-500/20 p-2 rounded border border-orange-500/30 text-orange-100">
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>Move <strong className="text-white">eSIM MDM Locks Task</strong> to design team.</span>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
