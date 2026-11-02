'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Target, TrendingUp, Sparkles, Clock, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { StatsSkeleton, KanbanSkeleton, PageHeaderSkeleton } from '@/components/ui/dashboard-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { SprintPlanningDialog } from '@/components/tasks/sprint-planning-dialog';
import { TaskDialog } from '@/components/tasks/task-dialog';
import { isEmployeeRole, hasFullAccess, type UserRole } from '@/lib/permissions';
import { getStoredSessionToken } from '@/lib/client-session';

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

interface User {
  id: number;
  role: string;
  firstName: string;
  lastName: string;
}

export default function TasksPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<number | null>(null);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogStatus, setTaskDialogStatus] = useState<string>('todo');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalPoints: 0,
    completedPoints: 0,
  });

  // Guard: prevents the auth+fetch chain from running more than once
  const initializedRef = useRef(false);

  // Sort sprints so active sprint always appears first
  const sortSprintsActivFirst = (list: Sprint[]) =>
    [...list].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return  1;
      return 0;
    });

  const fetchSprints = useCallback(async (projectId: number) => {
    try {
      const token = getStoredSessionToken();
      const response = await fetch(`/api/sprints?projectId=${projectId}&limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        const raw: Sprint[] = Array.isArray(result) ? result : (result.data ?? []);
        const filtered = raw.filter((s) => s.status !== 'cancelled');
        // Active sprint always listed first
        const sorted = sortSprintsActivFirst(filtered);
        setSprints(sorted);
        const activeSprint = sorted.find((s) => s.status === 'active');
        if (activeSprint) {
          setSelectedSprint(activeSprint.id);
        } else if (sorted.length > 0) {
          setSelectedSprint(sorted[0].id);
        } else {
          setSelectedSprint(null);
        }
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  }, []);

  const fetchTaskStats = useCallback(async (sprintId: number) => {
    try {
      const token = getStoredSessionToken();
      const response = await fetch(`/api/tasks?sprintId=${sprintId}&limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        const tasks: any[] = Array.isArray(result) ? result : (result.data ?? []);
        const completedTasks  = tasks.filter((t) => t.status === 'done').length;
        const totalPoints     = tasks.reduce((s: number, t: any) => s + (t.storyPoints || 0), 0);
        const completedPoints = tasks
          .filter((t: any) => t.status === 'done')
          .reduce((s: number, t: any) => s + (t.storyPoints || 0), 0);
        setStats({ totalTasks: tasks.length, completedTasks, totalPoints, completedPoints });
      }
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  }, []);

  const fetchProjects = useCallback(async (user: User) => {
    setLoading(true);
    try {
      const token = getStoredSessionToken();
      const response = await fetch('/api/projects?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (!response.ok) return;
      const result = await response.json();
      const allProjects: Project[] = Array.isArray(result) ? result : (result.data ?? []);

      if (isEmployeeRole(user.role as UserRole)) {
        // Employees: filter to only their assigned projects
        const membersRes = await fetch('/api/project-members?limit=1000', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include'
        });
        if (membersRes.ok) {
          const membersResult = await membersRes.json();
          const members: any[] = Array.isArray(membersResult) ? membersResult : (membersResult.data ?? []);
          const userProjectIds = members
            .filter((m) => m.userId === user.id)
            .map((m) => m.projectId);
          const filtered = allProjects.filter((p) => userProjectIds.includes(p.id));
          setProjects(filtered);
          if (filtered.length > 0) {
            setSelectedProject(filtered[0].id);
            await fetchSprints(filtered[0].id);
          }
        }
      } else {
        setProjects(allProjects);
        if (allProjects.length > 0) {
          setSelectedProject(allProjects[0].id);
          await fetchSprints(allProjects[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchSprints]);

  // Single guarded init: auth → projects → sprints (runs exactly once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        const token = getStoredSessionToken();
        const res = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const user: User = data.user;
          setCurrentUser(user);
          await fetchProjects(user);
        }
      } catch (error) {
        console.error('Error initializing tasks page:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchProjects]);

  // Re-fetch sprints when user changes project
  useEffect(() => {
    if (!initializedRef.current || !selectedProject) return;
    fetchSprints(selectedProject);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  // Re-fetch stats when sprint selection changes
  useEffect(() => {
    if (selectedSprint) fetchTaskStats(selectedSprint);
  }, [selectedSprint, fetchTaskStats]);


  const handleRefresh = () => {
    if (selectedSprint) fetchTaskStats(selectedSprint);
    setRefreshKey((prev) => prev + 1);
  };


  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const handleCreateTask = (status: string) => {
    setSelectedTask(null);
    setTaskDialogStatus(status);
    setTaskDialogOpen(true);
  };

  const handleTaskDialogClose = () => {
    setTaskDialogOpen(false);
    setSelectedTask(null);
  };

  const currentSprint = sprints.find(s => s.id === selectedSprint);
  const daysRemaining = currentSprint
    ? Math.ceil((new Date(currentSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isEmployee = currentUser && isEmployeeRole(currentUser.role as UserRole);

  if (!currentUser || loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" animation="pulse" />
          <Skeleton className="h-10 flex-1" animation="pulse" />
        </div>
        <StatsSkeleton count={4} />
        <KanbanSkeleton columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      {/* Brand Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#312e81] p-6 text-white shadow-xl border border-indigo-950/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-blue-400/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                {isEmployee ? 'My Active Sprints' : 'Pipeline Task Board'}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
              {isEmployee ? 'Task Workspace' : 'Project Task Board (Kanban)'}
            </h2>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              {isEmployee ? 'Review and manage your assigned responsibilities across active projects.' : 'System-wide pipeline tracker, sprint velocity coordination, and high-contrast drag indicators.'}
            </p>
          </div>
          <div className="flex gap-2">
            {!isEmployee && (
              <Button
                onClick={() => setSprintDialogOpen(true)}
                variant="outline"
                className="border-indigo-400/50 bg-indigo-950/50 text-white hover:bg-indigo-900"
              >
                <Plus className="mr-1.5 h-4 w-4" /> New Sprint
              </Button>
            )}
            <Button onClick={() => handleCreateTask('todo')} className="bg-indigo-600 hover:bg-indigo-500 text-white border-none font-bold">
              <Plus className="mr-1.5 h-4 w-4" /> New Task
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900">
        <div className="flex-1 relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground absolute -top-2 left-2 bg-slate-50 dark:bg-zinc-950 px-1 z-10">Select Project</label>
          <Select
            value={selectedProject?.toString() || ''}
            onValueChange={(value) => setSelectedProject(parseInt(value))}
          >
            <SelectTrigger className="h-11 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm font-semibold">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground absolute -top-2 left-2 bg-slate-50 dark:bg-zinc-950 px-1 z-10">Select Sprint / Backlog</label>
          <Select
            value={selectedSprint?.toString() || 'none'}
            onValueChange={(value) => setSelectedSprint(value === 'none' ? null : parseInt(value))}
            disabled={!selectedProject || sprints.length === 0}
          >
            <SelectTrigger className="h-11 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-lg shadow-sm font-semibold">
              <SelectValue placeholder={sprints.length === 0 ? 'No sprints available' : 'Select sprint'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Backlog (No Sprint)</SelectItem>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id.toString()}>
                  <span className="flex items-center gap-2">
                    {sprint.status === 'active' && (
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    {sprint.name}
                    <span className="text-muted-foreground text-xs font-normal">
                      ({sprint.status === 'active' ? 'Active' : sprint.status})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentSprint && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Sprint Health & Velocity Dashboard
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {stats.completedTasks} Done</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> {stats.totalTasks - stats.completedTasks} Pending</span>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Sprint Goal</p>
                    <h4 className="text-sm font-extrabold truncate max-w-[150px]">{currentSprint.goal || 'No goal set'}</h4>
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-indigo-50 dark:bg-indigo-950/40 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-1/3 group-hover:w-1/2 transition-all duration-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-rose-500 group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Time Linear</p>
                    <h4 className="text-3xl font-black text-rose-600">{daysRemaining > 0 ? `${daysRemaining}d` : 'Ended'}</h4>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-bold">Ends {new Date(currentSprint.endDate).toLocaleDateString()}</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-emerald-500 group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Task Velocity</p>
                    <h4 className="text-3xl font-black text-emerald-600">{stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</h4>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">{stats.completedTasks} Closed</span>
                  <span className="text-muted-foreground">/ {stats.totalTasks} Total</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-amber-500 group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Capacity Load</p>
                    <h4 className="text-3xl font-black text-amber-600">{stats.completedPoints} <span className="text-sm text-muted-foreground">/ {stats.totalPoints}</span></h4>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 font-bold">{stats.totalPoints > 0 ? Math.round((stats.completedPoints / stats.totalPoints) * 100) : 0}% Points Delivered</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {selectedProject ? (
        <div className="rounded-2xl border border-indigo-100 dark:border-zinc-800 bg-slate-50/20 dark:bg-zinc-950/20 p-2 shadow-inner">
          <KanbanBoard
            key={refreshKey}
            sprintId={selectedSprint}
            projectId={selectedProject}
            currentUser={currentUser}
            onTaskClick={handleTaskClick}
            onCreateTask={handleCreateTask}
          />
        </div>
      ) : (
        <Card className="border-dashed bg-card/30 border-2">
          <CardHeader className="flex flex-col items-center justify-center py-20 text-center">
            <Target className="h-16 w-16 text-indigo-500/20 mb-4 animate-pulse" />
            <CardTitle className="text-2xl font-bold">Welcome to the Task Workspace</CardTitle>
            <CardDescription className="max-w-md mt-2 text-sm">
              {isEmployee ? 'Select an assigned project above to start tracking your tasks in the Kanban board.' : 'Please select a project to manage sprints, development tasks, and coordinate with the team.'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isEmployee && (
        <SprintPlanningDialog
          open={sprintDialogOpen}
          onOpenChange={setSprintDialogOpen}
          onSuccess={() => {
            if (selectedProject) {
              fetchSprints(selectedProject);
            }
          }}
          projectId={selectedProject || undefined}
        />
      )}

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={handleTaskDialogClose}
        onSuccess={handleRefresh}
        projectId={selectedProject || undefined}
        sprintId={selectedSprint || undefined}
        initialStatus={taskDialogStatus}
        task={selectedTask}
      />
    </div>
  );
}