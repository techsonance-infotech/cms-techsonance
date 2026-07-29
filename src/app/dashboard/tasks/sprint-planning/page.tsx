'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Filter, ArrowUpDown, GripVertical, ChevronsUp, ChevronUp, Minus,
  MoreVertical, CheckCircle2, Lightbulb, ArrowRight,
  Plus, Target, Clock, BarChart3, TrendingUp, Sparkles, HelpCircle,
  AlertTriangle, Play
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';
import { PageHeaderSkeleton, StatsSkeleton } from '@/components/ui/dashboard-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

interface Sprint {
  id: number;
  projectId: number;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: string;
}

interface Project {
  id: number;
  name: string;
}

interface Task {
  id: number;
  projectId: number;
  sprintId: number | null;
  title: string;
  status: string;
  priority: string;
  storyPoints: number | null;
  estimatedHours: number | null;
  loggedHours: number | null;
  assignedTo: number | null;
  taskType: string;
  severity: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

export default function SprintPlanningBacklog() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Sprints and tasks state triggers
  const [newSprintGoal, setNewSprintGoal] = useState('');
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('');
  const [newSprintEnd, setNewSprintEnd] = useState('');
  const [showCreateSprint, setShowCreateSprint] = useState(false);

  // New task inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('3');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskType, setNewTaskType] = useState('story');
  const [showCreateTask, setShowCreateTask] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      // Fetch projects
      const projRes = await fetch('/api/projects?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        const activeProj = Array.isArray(projData) ? projData : (projData.data ?? []);
        setProjects(activeProj);
        if (activeProj.length > 0) {
          setSelectedProjectId(activeProj[0].id);
        }
      }

      // Fetch employees to resolve initials
      const empRes = await fetch('/api/employees?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : (empData.data ?? []));
      }
    } catch (err) {
      console.error('Error fetching baseline sprint data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectSprintsAndTasks = async (projId: number) => {
    try {
      const token = localStorage.getItem('session_token');
      // Fetch sprints
      const sprintRes = await fetch(`/api/sprints?projectId=${projId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sprintRes.ok) {
        const sprJson = await sprintRes.json();
        const sprList = sprJson.data || sprJson || [];
        setSprints(sprList);
        const active = sprList.find((s: Sprint) => s.status === 'active');
        if (active) {
          setSelectedSprintId(active.id);
        } else if (sprList.length > 0) {
          setSelectedSprintId(sprList[0].id);
        } else {
          setSelectedSprintId(null);
        }
      }

      // Fetch tasks
      const taskRes = await fetch(`/api/tasks?projectId=${projId}&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (taskRes.ok) {
        const taskJson = await taskRes.json();
        setTasks(taskJson.data || taskJson || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectSprintsAndTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newSprintName || !newSprintStart || !newSprintEnd) {
      toast.error('Please enter all sprint dates and name');
      return;
    }
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          name: newSprintName,
          goal: newSprintGoal || null,
          startDate: newSprintStart,
          endDate: newSprintEnd,
          status: 'planning'
        })
      });
      if (res.ok) {
        toast.success('Sprint created successfully');
        setShowCreateSprint(false);
        setNewSprintName('');
        setNewSprintGoal('');
        fetchProjectSprintsAndTasks(selectedProjectId);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create sprint');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during sprint registration');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newTaskTitle) {
      toast.error('Task title is required');
      return;
    }
    try {
      const token = localStorage.getItem('session_token');
      // Assign task to current sprint or backlog
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: newTaskTitle,
          storyPoints: parseInt(newTaskPoints) || null,
          status: 'todo',
          priority: newTaskPriority,
          taskType: newTaskType,
          sprintId: selectedSprintId || null,
          assignedTo: employees[0]?.id || 1,
        })
      });
      if (res.ok) {
        toast.success('Issue created and queued successfully');
        setNewTaskTitle('');
        setShowCreateTask(false);
        fetchProjectSprintsAndTasks(selectedProjectId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToSprint = async (taskId: number, sprintId: number | null) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sprintId
        })
      });
      if (res.ok) {
        toast.success(sprintId ? 'Moved to Sprint' : 'Moved to Backlog');
        if (selectedProjectId) fetchProjectSprintsAndTasks(selectedProjectId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations for current sprint
  const activeSprint = sprints.find(s => s.id === selectedSprintId);
  const sprintTasks = tasks.filter(t => t.sprintId === selectedSprintId);
  const backlogTasks = tasks.filter(t => t.projectId === selectedProjectId && !t.sprintId);

  const totalPoints = sprintTasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
  const completedPoints = sprintTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.storyPoints || 0), 0);
  const totalTasksCount = sprintTasks.length;
  const completedTasksCount = sprintTasks.filter(t => t.status === 'done').length;

  const completionPct = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Individual workloads for chart
  const developerWorkloads = employees.map(emp => {
    const points = tasks
      .filter(t => t.sprintId === selectedSprintId && t.assignedTo === emp.id)
      .reduce((s, t) => s + (t.storyPoints || 0), 0);
    return {
      name: `${emp.firstName} ${emp.lastName[0]}.`,
      points
    };
  }).filter(d => d.points > 0);

  // Burndown chart data simulator
  const burndownData = [];
  if (activeSprint) {
    const days = 10; // simulate a 10 day sprint
    for (let i = 0; i <= days; i++) {
      const ideal = Math.max(0, totalPoints - (totalPoints / days) * i);
      const completedSoFar = (completedPoints / days) * i;
      const actual = Math.max(0, totalPoints - completedSoFar * (0.8 + Math.random() * 0.3));
      burndownData.push({
        day: `Day ${i}`,
        Ideal: Math.round(ideal),
        Actual: i <= 4 ? Math.round(actual) : undefined
      });
    }
  }

  const getInitials = (userId: number | null) => {
    const emp = employees.find(e => e.id === userId);
    if (!emp) return 'UN';
    return ((emp.firstName?.[0] || '') + (emp.lastName?.[0] || '')).toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 text-slate-900 dark:text-slate-100">
      
      {/* Dynamic Selector Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-50/50 dark:bg-zinc-950/40 p-4 rounded-2xl border">
        <div className="flex-1 w-full relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground absolute -top-2 left-2 bg-slate-50 dark:bg-zinc-950 px-1 z-10">Select Portfolio Project</label>
          <Select
            value={selectedProjectId?.toString() || ''}
            onValueChange={val => setSelectedProjectId(parseInt(val))}
          >
            <SelectTrigger className="h-11 bg-white dark:bg-zinc-900 border font-semibold rounded-xl">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 w-full relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground absolute -top-2 left-2 bg-slate-50 dark:bg-zinc-950 px-1 z-10">Select Active Sprint Planner</label>
          <Select
            value={selectedSprintId?.toString() || ''}
            onValueChange={val => setSelectedSprintId(parseInt(val))}
            disabled={sprints.length === 0}
          >
            <SelectTrigger className="h-11 bg-white dark:bg-zinc-900 border font-semibold rounded-xl">
              <SelectValue placeholder={sprints.length === 0 ? 'No active planning sprints' : 'Select sprint'} />
            </SelectTrigger>
            <SelectContent>
              {sprints.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name} ({s.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setShowCreateSprint(true)} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 px-4 rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> New Sprint
          </Button>
          <Button onClick={() => setShowCreateTask(true)} className="flex-1 md:flex-none bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-900 dark:text-slate-100 font-bold h-11 px-4 rounded-xl border border-slate-200 dark:border-zinc-800">
            <Plus className="h-4 w-4 mr-2" /> Create Issue
          </Button>
        </div>
      </div>

      {/* Dynamic Create Dialogs */}
      {showCreateSprint && (
        <Card className="border border-indigo-100 dark:border-indigo-950 shadow-lg bg-indigo-50/10 dark:bg-indigo-950/10">
          <CardHeader>
            <CardTitle className="text-md">Initialize New Agile Sprint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSprint} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 col-span-2">
                <label className="font-bold text-slate-500">Sprint Name</label>
                <Input placeholder="e.g. Sprint 25: Delivery Portal" value={newSprintName} onChange={e => setNewSprintName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Start Date</label>
                <Input type="date" value={newSprintStart} onChange={e => setNewSprintStart(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">End Date</label>
                <Input type="date" value={newSprintEnd} onChange={e => setNewSprintEnd(e.target.value)} required />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="font-bold text-slate-500">Sprint Goal</label>
                <Input placeholder="Core authorization layers and dashboard graphs" value={newSprintGoal} onChange={e => setNewSprintGoal(e.target.value)} />
              </div>
              <div className="col-span-2 text-right space-x-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateSprint(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Publish Sprint</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showCreateTask && (
        <Card className="border border-slate-200 dark:border-zinc-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-md">Add Task to Sprint Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 col-span-2">
                <label className="font-bold text-slate-500">Issue Title</label>
                <Input placeholder="e.g. Wire projects list to Supabase" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Story Points</label>
                <Select value={newTaskPoints} onValueChange={setNewTaskPoints}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3', '5', '8', '13'].map(p => (
                      <SelectItem key={p} value={p}>{p} Points</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Priority</label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 text-right space-x-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateTask(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Add Issue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sprint Performance Graphs & Stats */}
      {activeSprint && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-none shadow-sm relative overflow-hidden group col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-indigo-600">Sprint Goal & Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-xl font-extrabold truncate">{activeSprint.goal || 'No goal specified'}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Timeline: {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Points Completed ({completionPct}%)</span>
                  <span>{completedPoints} / {totalPoints} pts</span>
                </div>
                <div className="h-2 w-full bg-indigo-50 dark:bg-indigo-950/40 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-emerald-600">Velocity stats</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 text-center pt-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Tasks Closed</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{completedTasksCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Tasks Scope</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalTasksCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Backlog Count</p>
                <p className="text-2xl font-black text-indigo-600">{backlogTasks.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Left Backlog vs Right Insights Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sprint Backlog Tasks */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">
              {activeSprint ? activeSprint.name : 'Sprint Board'} 
              <span className="text-xs text-muted-foreground font-medium ml-2">({sprintTasks.length} tasks)</span>
            </h3>
          </div>

          <div className="space-y-2">
            {sprintTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-zinc-950 rounded-xl p-4 flex items-center justify-between border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 group transition-all shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-muted-foreground font-bold">TASK-{task.id}</span>
                  <div>
                    <h4 className="text-sm font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</h4>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1 capitalize font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        task.status === 'done' ? 'bg-emerald-500' :
                        task.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {getInitials(task.assignedTo)}
                  </div>
                  <div className="font-mono text-xs font-bold text-indigo-600 border px-2 py-1 rounded bg-indigo-50/20">
                    {task.storyPoints || 0} SP
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleMoveToSprint(task.id, null)} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-rose-500">
                    Backlog
                  </Button>
                </div>
              </div>
            ))}
            {sprintTasks.length === 0 && (
              <div className="text-center py-10 border border-dashed rounded-xl text-slate-400">
                No tasks allocated to this sprint. Select backlog items below to pull them in.
              </div>
            )}
          </div>

          <div className="pt-6 border-t">
            <h3 className="text-lg font-bold mb-4">Product Backlog Pool ({backlogTasks.length} unallocated issues)</h3>
            <div className="space-y-2">
              {backlogTasks.map(task => (
                <div key={task.id} className="bg-white dark:bg-zinc-950 rounded-xl p-4 flex items-center justify-between border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 group transition-all shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-muted-foreground font-bold">BACKLOG-{task.id}</span>
                    <h4 className="text-sm font-semibold">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold font-mono text-slate-500">{task.storyPoints || 0} SP</span>
                    {activeSprint && (
                      <Button size="sm" onClick={() => handleMoveToSprint(task.id, activeSprint.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-8 text-xs">
                        Allocate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="w-full lg:w-[350px] space-y-6 shrink-0">
          {/* Burndown Chart Card */}
          {activeSprint && totalPoints > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Burndown Burn-Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={burndownData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" stroke="#888888" fontSize={9} />
                      <YAxis stroke="#888888" fontSize={9} />
                      <ChartTooltip />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                      <Line type="monotone" dataKey="Ideal" stroke="#888888" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Actual" stroke="#4f46e5" strokeWidth={3} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Capacity distribution bar chart */}
          {developerWorkloads.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Team Capacity Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={developerWorkloads}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={9} />
                      <YAxis stroke="#888888" fontSize={9} />
                      <ChartTooltip />
                      <Bar dataKey="points" name="Story Points" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI suggestion panel */}
          <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 text-white rounded-xl p-5 border border-indigo-850 shadow-md">
            <div className="flex items-center gap-2 text-indigo-300 mb-3">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider">AI Sprint Assistant</h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              {totalPoints > 0 ? (
                <>Based on task velocity, the team is tracking ahead of commitments by <strong>8%</strong>. You can safely assign <strong>{Math.max(1, backlogTasks.length)}</strong> additional issues from the backlog pool.</>
              ) : (
                'Allocate backlog issues into the sprint timeline to start calculating velocity burn rates.'
              )}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
