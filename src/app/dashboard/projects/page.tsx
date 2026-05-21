'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, LayoutList, LayoutGrid, Eye, Edit, Trash2, Download, Filter, X, Timer, AlertTriangle, CheckCircle2, TrendingUp, FolderKanban, IndianRupee, Clock } from 'lucide-react';
import { KanbanSkeleton, TableSkeleton, ProjectSummarySkeleton, PageHeaderSkeleton } from '@/components/ui/dashboard-skeleton';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { ProjectKanban } from '@/components/projects/project-kanban';
import { isEmployeeRole, hasFullAccess, type UserRole } from '@/lib/permissions';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

interface Project {
  id: number;
  name: string;
  description: string | null;
  clientId: number;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  isActive: boolean;
}

interface Client {
  id: number;
  companyName: string;
}

interface User {
  id: number;
  role: string;
  firstName: string;
  lastName: string;
}

function getProjectHealth(project: Project): { label: string; color: string; bgColor: string } {
  if (!project.endDate) return { label: 'No Deadline', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800' };
  const now = new Date();
  const end = new Date(project.endDate);
  const start = project.startDate ? new Date(project.startDate) : now;
  
  if (project.status === 'completed') return { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' };
  if (now > end) return { label: 'Behind Schedule', color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30' };
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentElapsed = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  
  if (percentElapsed > 85) return { label: 'At Risk', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' };
  return { label: 'On Track', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' };
}

function getTimelineProgress(project: Project): { percent: number; color: string } {
  if (!project.startDate || !project.endDate) return { percent: 0, color: 'bg-gray-300' };
  if (project.status === 'completed') return { percent: 100, color: 'bg-emerald-500' };
  
  const now = new Date();
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct = Math.max(0, Math.min(100, total > 0 ? (elapsed / total) * 100 : 0));
  
  if (pct > 85) return { percent: pct, color: 'bg-rose-500' };
  if (pct > 60) return { percent: pct, color: 'bg-amber-500' };
  return { percent: pct, color: 'bg-emerald-500' };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sorting
  const [sortBy, setSortBy] = useState<string>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const debouncedSearch = useDebouncedValue(search, 300);

  // Guard: prevents auth + fetch from running more than once (React StrictMode / hot-reload)
  const initializedRef = useRef(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      let url = '/api/projects?limit=100';

      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (priorityFilter !== 'all') url += `&priority=${priorityFilter}`;
      if (clientFilter !== 'all') url += `&clientId=${clientFilter}`;
      if (activeFilter !== 'all') url += `&isActive=${activeFilter}`;
      if (sortBy && sortBy !== 'default') url += `&sort=${sortBy}&order=${sortOrder}`;
      if (startDateFilter) url += `&startDate=${startDateFilter}`;
      if (endDateFilter) url += `&endDate=${endDateFilter}`;

      // Optimized: Use API-level scoping for employee roles
      const user = currentUser;
      if (user && isEmployeeRole(user.role as UserRole)) {
        url += `&assignedTo=${user.id}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, clientFilter, activeFilter, sortBy, sortOrder, startDateFilter, endDateFilter, currentUser]);

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/clients?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(Array.isArray(data) ? data : (data.data ?? []));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []); // stable — no deps, token read from localStorage

  // Single guarded init: auth → projects (+ clients for admin) — runs exactly once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        const token = localStorage.getItem('session_token');
        if (!token) return;
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const user: User = data.user;
        setCurrentUser(user);

        // Fetch projects and clients (admin only) in parallel after auth resolves
        const fetches: Promise<void>[] = [fetchProjects()];
        if (user.role && hasFullAccess(user.role as UserRole)) {
          fetches.push(fetchClients());
        }
        await Promise.all(fetches);
      } catch (error) {
        console.error('Error initializing projects page:', error);
      }
    };

    init();
  }, [fetchProjects, fetchClients]);

  // Re-fetch projects when any filter/sort changes (only after init)
  useEffect(() => {
    if (!initializedRef.current || !currentUser) return;
    fetchProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, clientFilter, activeFilter, sortBy, sortOrder, startDateFilter, endDateFilter]);


  const handleDelete = async () => {
    if (!deletingProject) return;
    
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/projects?id=${deletingProject.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        toast.success('Project deleted successfully!');
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('An error occurred while deleting the project');
    } finally {
      setDeletingProject(null);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (project.description?.toLowerCase() || '').includes(debouncedSearch.toLowerCase())
  );

  // Approaching deadlines (within 7 days)
  const approachingDeadlines = filteredProjects.filter(p => {
    if (!p.endDate) return false;
    const end = new Date(p.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7 && p.status !== 'completed';
  }).length;

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = () => {
    const headers = ['Project Name', 'Client', 'Status', 'Priority', 'Budget', 'Start Date', 'End Date', 'Active'];
    const rows = filteredProjects.map(project => {
      const client = clients.find(c => c.id === project.clientId);
      return [
        project.name,
        client?.companyName || 'Unknown',
        project.status,
        project.priority,
        project.budget || 0,
        project.startDate || '',
        project.endDate || '',
        project.isActive ? 'Active' : 'Inactive'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Projects exported to CSV!');
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setClientFilter('all');
    setActiveFilter('all');
    setSortBy('default');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearch('');
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || 
                           clientFilter !== 'all' || activeFilter !== 'all' || 
                           sortBy !== 'default' || search !== '' || 
                           startDateFilter !== '' || endDateFilter !== '';

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client?.companyName || 'Unknown';
  };

  const isEmployee = currentUser && isEmployeeRole(currentUser.role as UserRole);
  const isAdmin = currentUser && hasFullAccess(currentUser.role as UserRole);
  const canEdit = isAdmin || currentUser?.role === 'project_manager';

  if (loading || !currentUser) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-full bg-muted animate-pulse rounded" />
            ))}
          </div>
        </Card>
        <ProjectSummarySkeleton />
        <div className="mt-8">
          {view === 'kanban' ? <KanbanSkeleton columns={4} /> : <TableSkeleton columns={7} rows={6} />}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      {/* Brand Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#111827] p-6 text-white shadow-xl border border-indigo-950/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-blue-400/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                {isEmployee ? 'My Assignments' : 'Portfolio Command Center'}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
              {isEmployee ? 'My Projects Hub' : 'Project Portfolio Overview'}
            </h2>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              {isEmployee ? 'Review your active project assignments, timelines, and progress tracks.' : 'Global overview of strategic accounts, milestone progress tracks, and operational velocity.'}
            </p>
          </div>
          {canEdit && (
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 rounded-lg py-2.5 px-4 shadow-lg border-none transition-all"
            >
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          )}
        </div>
      </div>

      {/* Overview Bento Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pipeline */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isEmployee ? 'Active Assignments' : 'Total Pipeline'}
            </CardTitle>
            <FolderKanban className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{filteredProjects.filter(p => p.isActive).length}</div>
            <p className="text-[10px] text-muted-foreground mt-2">Active project portfolio</p>
          </CardContent>
        </Card>

        {/* Portfolio Budget */}
        {!isEmployee ? (
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio Budget</CardTitle>
              <IndianRupee className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600">
                ₹{(filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0)).toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Aggregated active budget</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Involved</CardTitle>
              <FolderKanban className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-indigo-600">{filteredProjects.length}</div>
              <p className="text-[10px] text-muted-foreground mt-2">Lifetime involvements</p>
            </CardContent>
          </Card>
        )}

        {/* Approaching Deadlines */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due Soon</CardTitle>
            <Clock className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">{approachingDeadlines}</div>
            <p className="text-[10px] text-muted-foreground mt-2">Due within 7 days</p>
          </CardContent>
        </Card>

        {/* Health Distribution */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Health Dist.</CardTitle>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-lg font-bold">{filteredProjects.filter(p => getProjectHealth(p).label === 'On Track').length}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="text-lg font-bold">{filteredProjects.filter(p => getProjectHealth(p).label === 'At Risk').length}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <span className="text-lg font-bold">{filteredProjects.filter(p => getProjectHealth(p).label === 'Behind Schedule').length}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Track / Risk / Behind</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filter Panel & View Toggles */}
      <Card className="border border-indigo-100 dark:border-indigo-950/40 shadow-sm rounded-xl">
        <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-500" />
                Pipeline Matrix Filters
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters} className="text-rose-600 hover:text-rose-700 h-6 text-[10px] uppercase font-bold ml-2">
                  <X className="mr-1 h-3 w-3" /> Clear
                </Button>
              )}
            </div>
            
            {/* View Toggles */}
            <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs font-semibold">
              <button onClick={() => setView('list')} className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`}>
                <LayoutList className="mr-1.5 h-3.5 w-3.5" /> List
              </button>
              <button onClick={() => setView('kanban')} className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`}>
                <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Kanban
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-8 text-xs h-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          {!isEmployee ? (
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Active Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          )}

          {!isEmployee && (
            <Button size="sm" className="h-9 w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none font-bold text-xs" onClick={exportToCSV}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Main View Area */}
      {view === 'kanban' ? (
        <ProjectKanban projects={filteredProjects} onUpdate={fetchProjects} />
      ) : (
        <Card className="shadow-sm rounded-xl overflow-hidden border-indigo-100/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-950/40 border-b">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4">Project Name</TableHead>
                    {!isEmployee && <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4">Client</TableHead>}
                    {!isEmployee && <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4">Budget</TableHead>}
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4">Timeline / Milestone</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4">Health</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4">Priority</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4">Active</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider py-3 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isEmployee ? 7 : 9} className="text-center py-12 text-muted-foreground text-xs font-semibold italic bg-slate-50/20">
                        No projects match the current filter matrix.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {project.name}
                        </td>
                        {!isEmployee && (
                          <td className="py-4 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {getClientName(project.clientId)}
                          </td>
                        )}
                        {!isEmployee && (
                          <td className="py-4 px-4 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                            {project.budget ? `₹${(project.budget / 1000).toFixed(0)}K` : '—'}
                          </td>
                        )}
                        <td className="py-4 px-4 w-40">
                          {(() => {
                            const tl = getTimelineProgress(project);
                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase">
                                  <span>{project.startDate ? new Date(project.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
                                  <span>{project.endDate ? new Date(project.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${tl.color}`} style={{ width: `${tl.percent}%` }} />
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-4">
                          {(() => {
                            const health = getProjectHealth(project);
                            return (
                              <Badge variant="outline" className={`text-[9px] uppercase font-bold border-0 px-2 ${health.bgColor} ${health.color}`}>
                                {health.label}
                              </Badge>
                            );
                          })()}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary" className="text-[9px] uppercase font-bold px-2">
                            {project.priority}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            className={`text-[9px] uppercase font-bold px-2 ${
                              project.status === 'completed' ? 'bg-emerald-500 text-white' :
                              project.status === 'in_progress' ? 'bg-indigo-500 text-white' :
                              'bg-slate-500 text-white'
                            }`}
                          >
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            project.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {project.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/dashboard/projects/${project.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {canEdit && (
                              <>
                                <Button 
                                  variant="ghost" size="icon"
                                  onClick={() => setEditingProject(project)}
                                  className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" size="icon"
                                  onClick={() => setDeletingProject(project)}
                                  className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t p-4 bg-slate-50/50 dark:bg-slate-900/20">
                <p className="text-xs text-muted-foreground font-semibold">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 text-xs">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 text-xs">
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog - For admin and project managers */}
      {canEdit && (
        <ProjectFormDialog
          open={showAddDialog || editingProject !== null}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddDialog(false);
              setEditingProject(null);
            }
          }}
          onSuccess={() => {
            fetchProjects();
            setEditingProject(null);
          }}
          project={editingProject}
        />
      )}

      {/* Delete Confirmation Dialog - For admin and project managers */}
      {canEdit && (
        <AlertDialog open={deletingProject !== null} onOpenChange={() => setDeletingProject(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark "{deletingProject?.name}" as cancelled. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
