// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  taskFormSchema,
  taskPriorityOptions,
  taskStatusOptions,
  taskStoryPointOptions,
  type TaskFormValues,
} from '@/lib/forms/schemas';
import { Loader2, LayoutGrid, Timer, Target, AlertCircle, Info, Hash, Clock, User, Flag, Calendar as CalendarIcon, Link2, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { isEmployeeRole, type UserRole } from '@/lib/permissions';
import { getStoredSessionToken } from '@/lib/client-session';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId?: number;
  sprintId?: number;
  initialStatus?: string;
  task?: any;
}

interface Project {
  id: number;
  name: string;
}

interface Sprint {
  id: number;
  name: string;
  status: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
}

export function TaskDialog({ open, onOpenChange, onSuccess, projectId, sprintId, initialStatus, task }: TaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projectMemberIds, setProjectMemberIds] = useState<number[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [checklist, setChecklist] = useState<any[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      projectId: projectId?.toString() || '',
      sprintId: sprintId?.toString() || '',
      title: '',
      description: '',
      assignedTo: '',
      status: (initialStatus as TaskFormValues['status']) || 'todo',
      priority: 'medium',
      storyPoints: '',
      estimatedHours: '',
      loggedHours: '',
      blockedById: '',
      dueDate: '',
      parentTaskId: '',
      taskType: 'task',
      severity: 'medium',
      epicId: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchData();
      if (task) {
        setChecklist(task.checklists || []);
        form.reset({
          projectId: task.projectId?.toString() || '',
          sprintId: task.sprintId?.toString() || '',
          title: task.title || '',
          description: task.description || '',
          assignedTo: task.assignedTo?.toString() || '',
          status: (task.status as TaskFormValues['status']) || 'todo',
          priority: (task.priority as TaskFormValues['priority']) || 'medium',
          storyPoints: task.storyPoints?.toString() || '',
          estimatedHours: task.estimatedHours?.toString() || '',
          loggedHours: task.loggedHours?.toString() || '',
          blockedById: task.blockedById?.toString() || '',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          parentTaskId: task.parentTaskId?.toString() || '',
          taskType: task.taskType || 'task',
          severity: task.severity || 'medium',
          epicId: task.epicId?.toString() || '',
        });
      } else {
        setChecklist([]);
        form.reset({
          projectId: projectId?.toString() || '',
          sprintId: sprintId?.toString() || '',
          title: '',
          description: '',
          assignedTo: '',
          status: (initialStatus as TaskFormValues['status']) || 'todo',
          priority: 'medium',
          storyPoints: '',
          estimatedHours: '',
          loggedHours: '',
          blockedById: '',
          dueDate: '',
          parentTaskId: '',
          taskType: 'task',
          severity: 'medium',
          epicId: '',
        });
      }
    }
  }, [open, task, projectId, sprintId, initialStatus, form]);

  const selectedProjectId = form.watch('projectId');

  useEffect(() => {
    if (selectedProjectId) {
      const pId = parseInt(selectedProjectId, 10);
      fetchSprints(pId);
      
      // Fetch members if employee
      if (currentUser && isEmployeeRole(currentUser.role as UserRole)) {
        fetchProjectMembers(pId);
      } else {
        setProjectMemberIds([]);
      }
      fetchProjectTasks(pId);
    } else {
      setSprints([]);
      setProjectMemberIds([]);
      setProjectTasks([]);
    }
  }, [selectedProjectId, currentUser]);

  const fetchProjectTasks = async (pId: number) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/tasks?projectId=${pId}&limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.data || [];
        // Filter out current task if editing to avoid self-dependency
        setProjectTasks(items.filter((t: any) => t.id !== task?.id));
      }
    } catch (error) {
      console.error('Failed to fetch project tasks:', error);
    }
  };

  const fetchProjectMembers = async (pId: number) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/project-members?projectId=${pId}&limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setProjectMemberIds(data.map((m: any) => m.userId));
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error);
    }
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const token = getStoredSessionToken();
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const [projectsRes, usersRes, meRes] = await Promise.all([
        fetch('/api/projects?limit=100', {
          headers: authHeaders,
          credentials: 'include'
        }),
        fetch('/api/users?limit=100', {
          headers: authHeaders,
          credentials: 'include'
        }),
        fetch('/api/auth/me', {
          headers: authHeaders,
          credentials: 'include'
        }),
      ]);

      let availableProjects: Project[] = [];
      let currentUser: any = null;

      if (meRes.ok) {
        const data = await meRes.json();
        const user = data.user;
        setCurrentUser(user);
        currentUser = user;
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        availableProjects = Array.isArray(data) ? data : data.data ?? [];
        
        // Filter for employees
        if (currentUser && isEmployeeRole(currentUser.role as UserRole)) {
          const membersRes = await fetch(`/api/project-members?limit=1000`, {
            headers: authHeaders,
            credentials: 'include'
          });
          if (membersRes.ok) {
            const members = await membersRes.json();
            const assignedProjectIds = members
              .filter((m: any) => m.userId === currentUser.id)
              .map((m: any) => m.projectId);
            availableProjects = availableProjects.filter(p => assignedProjectIds.includes(p.id));
          }
        }
        setProjects(availableProjects);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        const items = Array.isArray(data) ? data : data.data ?? [];
        setUsers(items);
      }
    } catch {
      toast.error('Failed to load task setup data');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSprints = async (projectId: number) => {
    try {
      const token = getStoredSessionToken();
      const response = await fetch(`/api/sprints?projectId=${projectId}&limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const items = (Array.isArray(data) ? data : data.data ?? []) as Sprint[];
        setSprints(items.filter((sprint) => sprint.status !== 'cancelled'));
      }
    } catch {
      toast.error('Failed to load sprints');
    }
  };

  const handleSubmit = async (values: TaskFormValues) => {
    setLoading(true);

    try {
      const payload: any = {
        projectId: parseInt(values.projectId, 10),
        title: values.title.trim(),
        assignedTo: parseInt(values.assignedTo, 10),
        status: values.status,
        priority: values.priority,
        parentTaskId: values.parentTaskId ? parseInt(values.parentTaskId, 10) : null,
        taskType: values.taskType || 'task',
        severity: values.severity || 'medium',
        checklists: checklist,
        epicId: values.epicId ? parseInt(values.epicId, 10) : null,
      };

      if (values.description?.trim()) {
        payload.description = values.description.trim();
      }

      if (values.sprintId) {
        payload.sprintId = parseInt(values.sprintId, 10);
      }

      if (values.storyPoints) {
        payload.storyPoints = parseInt(values.storyPoints, 10);
      }

      if (values.estimatedHours) {
        payload.estimatedHours = parseFloat(values.estimatedHours);
      }

      if (values.loggedHours) {
        payload.loggedHours = parseFloat(values.loggedHours);
      }

      if (values.blockedById) {
        payload.blockedById = parseInt(values.blockedById, 10);
      }

      if (values.dueDate) {
        payload.dueDate = values.dueDate;
      }

      const url = task ? `/api/tasks?id=${task.id}` : '/api/tasks';
      const method = task ? 'PUT' : 'POST';

      const token = getStoredSessionToken();
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${task ? 'update' : 'create'} task`);
      }

      toast.success(`Task ${task ? 'updated' : 'created'} successfully`);
      onOpenChange(false);
      onSuccess();

      if (!task) {
        form.reset({
          projectId: projectId?.toString() || '',
          sprintId: sprintId?.toString() || '',
          title: '',
          description: '',
          assignedTo: '',
          status: (initialStatus as TaskFormValues['status']) || 'todo',
          priority: 'medium',
          storyPoints: '',
          dueDate: '',
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update task details' : 'Add a new task to the board'}. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, () => toast.error('Please fix the validation errors'))} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                <TabsTrigger value="general" className="gap-2">
                  <LayoutGrid className="h-4 w-4" /> General
                </TabsTrigger>
                <TabsTrigger value="productivity" className="gap-2">
                  <Timer className="h-4 w-4" /> Productivity
                </TabsTrigger>
                <TabsTrigger value="checklists" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Checklists
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                            <Target className="h-3 w-3" /> Project *
                          </Label>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={loading || loadingData || !!projectId || !!task}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 w-full">
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sprintId"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                            <CalendarIcon className="h-3 w-3" /> Sprint
                          </Label>
                          <Select
                            value={field.value || 'none'}
                            onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                            disabled={loading || !selectedProjectId}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 w-full">
                                <SelectValue placeholder="Select sprint" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Sprint</SelectItem>
                              {sprints.map((sprint) => (
                                <SelectItem key={sprint.id} value={sprint.id.toString()}>
                                  {sprint.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                          <Info className="h-3 w-3" /> Task Title *
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={loading}
                            placeholder="e.g., Design System Refactor"
                            className="bg-background/50"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                           Detail View
                        </Label>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={loading}
                            placeholder="Provide deep context for this task..."
                            className="bg-background/50 min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => {
                        const isEmployee = currentUser && isEmployeeRole(currentUser.role as UserRole);
                        const filteredUsers = isEmployee && projectMemberIds.length > 0 
                          ? users.filter(u => projectMemberIds.includes(u.id))
                          : users;

                        return (
                          <FormItem className="min-w-0">
                            <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                              <User className="h-3 w-3" /> Assigned To *
                            </Label>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={loading || loadingData || (isEmployee && !selectedProjectId)}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-background/50 w-full">
                                  <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredUsers.map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.firstName} {user.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                            <Clock className="h-3 w-3" /> Final Deadline
                          </Label>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              disabled={loading}
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                             Status
                          </Label>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {taskStatusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                            <Flag className="h-3 w-3" /> Priority
                          </Label>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 border-l-4 border-l-primary w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {taskPriorityOptions.map((priority) => (
                                <SelectItem key={priority} value={priority} className="capitalize">
                                  {priority}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="productivity" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="storyPoints"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                            <Hash className="h-3 w-3" /> Story Points (Fibonacci)
                          </Label>
                          <Select
                            value={field.value || 'none'}
                            onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {taskStoryPointOptions.map((v) => (
                                <SelectItem key={v} value={v}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="blockedById"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                            <Link2 className="h-3 w-3" /> Blocked By
                          </Label>
                          <Select
                            value={field.value || 'none'}
                            onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                            disabled={loading || !selectedProjectId}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 w-full">
                                <SelectValue placeholder="Select dependency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Dependency</SelectItem>
                              {projectTasks.map((t: any) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  #{t.id} - {t.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimatedHours"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                             Est. Hours
                          </Label>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type="number"
                                disabled={loading}
                                placeholder="0.0"
                                className="bg-background/50 pl-8"
                              />
                              <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="loggedHours"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                             Logged Hours
                          </Label>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type="number"
                                disabled={loading}
                                placeholder="0.0"
                                className={`bg-background/50 pl-8 ${form.watch('status') === 'done' && (!field.value || parseFloat(field.value) <= 0) ? 'border-rose-500' : ''}`}
                              />
                              <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
                            </div>
                          </FormControl>
                          {form.watch('status') === 'done' && (!field.value || parseFloat(field.value) <= 0) && (
                            <p className="text-[10px] font-bold text-rose-500 mt-1 animate-pulse">Required for completion</p>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  {(form.watch('status') === 'done' && (!form.watch('loggedHours') || parseFloat(form.watch('loggedHours')) <= 0)) && (
                    <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 flex gap-3 text-rose-600">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold">Completion Blocked</p>
                        <p className="opacity-80">You must log your hours in this tab before marking the task as Done.</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="checklists" className="space-y-4">
                  {/* Issue Type & Severity */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taskType"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                             Issue Type
                          </Label>
                          <Select
                            value={field.value || 'task'}
                            onValueChange={field.onChange}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="task">Task</SelectItem>
                              <SelectItem value="subtask">Subtask</SelectItem>
                              <SelectItem value="bug">Bug</SelectItem>
                              <SelectItem value="story">Story</SelectItem>
                              <SelectItem value="epic">Epic</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                             Priority Severity
                          </Label>
                          <Select
                            value={field.value || 'medium'}
                            onValueChange={field.onChange}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Parent Task Selector */}
                  {form.watch('taskType') === 'subtask' && (
                    <FormField
                      control={form.control}
                      name="parentTaskId"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <Label className="flex items-center gap-1.5 peer-disabled:opacity-70 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-2">
                            Parent Task Link
                          </Label>
                          <Select
                            value={field.value || 'none'}
                            onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                            disabled={loading || !selectedProjectId}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background/50 w-full">
                                <SelectValue placeholder="Link parent issue" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Parent Link</SelectItem>
                              {projectTasks.filter(t => t.id !== task?.id).map((t: any) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  #{t.id} - {t.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Checklist Manager */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Definition Checklist Items</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add acceptance criteria checklist item..."
                        value={newCheckItem}
                        onChange={e => setNewCheckItem(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCheckItem.trim()) {
                              setChecklist(prev => [...prev, { id: Math.random().toString(), text: newCheckItem.trim(), checked: false }]);
                              setNewCheckItem('');
                            }
                          }
                        }}
                        className="h-9 bg-background/50"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newCheckItem.trim()) {
                            setChecklist(prev => [...prev, { id: Math.random().toString(), text: newCheckItem.trim(), checked: false }]);
                            setNewCheckItem('');
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                      {checklist.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900 rounded border text-xs">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, checked } : c));
                              }}
                              className="rounded border-slate-300 accent-indigo-600"
                            />
                            <span className={item.checked ? 'line-through text-slate-400' : 'font-semibold'}>{item.text}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600"
                            onClick={() => setChecklist(prev => prev.filter((_, i) => i !== idx))}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  task ? 'Save Changes' : 'Create Task'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
