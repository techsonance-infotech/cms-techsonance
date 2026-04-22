'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus, Calendar as CalendarIcon, AlertCircle, Timer, Loader2
} from 'lucide-react';
import { isEmployeeRole, type UserRole } from '@/lib/permissions';
import { toast } from 'sonner';
import { KanbanSkeleton } from '@/components/ui/dashboard-skeleton';

interface Task {
  id: number;
  projectId: number;
  sprintId: number | null;
  title: string;
  description: string | null;
  assignedTo: number;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  storyPoints: number | null;
  dueDate: string | null;
  estimatedHours?: number;
  loggedHours?: number;
  blockedById?: number | null;
}

interface CurrentUser {
  id: number;
  role: string;
}

interface KanbanBoardProps {
  sprintId: number | null;
  projectId?: number;
  currentUser?: CurrentUser | null;   // ← passed from parent (no extra /api/auth/me call)
  onTaskClick?: (task: Task) => void;
  onCreateTask?: (status: string) => void;
}

const STATUS_COLUMNS = [
  {
    id: 'todo' as const,
    title: 'To Do',
    color: 'bg-slate-500/5',
    borderColor: 'border-slate-200 dark:border-slate-700',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'in_progress' as const,
    title: 'In Progress',
    color: 'bg-blue-500/5',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'review' as const,
    title: 'Review',
    color: 'bg-purple-500/5',
    borderColor: 'border-purple-200 dark:border-purple-800',
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'done' as const,
    title: 'Done',
    color: 'bg-emerald-500/5',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
] as const;

const PRIORITY_STYLES: Record<string, string> = {
  high:   'border-l-4 border-l-rose-500',
  medium: 'border-l-4 border-l-amber-400',
  low:    'border-l-4 border-l-emerald-400',
};

export function KanbanBoard({
  sprintId,
  projectId,
  currentUser,
  onTaskClick,
  onCreateTask,
}: KanbanBoardProps) {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [loading, setLoading]       = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const isEmployee = currentUser ? isEmployeeRole(currentUser.role as UserRole) : false;

  /* ── Fetch tasks (runs when sprintId / projectId changes) ── */
  const prevParamsRef = useRef<string>('');
  const fetchTasks = useCallback(async () => {
    const paramsKey = `${projectId ?? ''}-${sprintId ?? ''}`;
    if (!projectId) { setLoading(false); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      let url = `/api/tasks?limit=1000&projectId=${projectId}`;
      if (sprintId) url += `&sprintId=${sprintId}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result  = await response.json();
        const apiTasks: Task[] = Array.isArray(result) ? result : (result.data ?? []);

        // Employees only see their own tasks
        setTasks(
          isEmployee && currentUser
            ? apiTasks.filter((t) => t.assignedTo === currentUser.id)
            : apiTasks
        );
        prevParamsRef.current = paramsKey;
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [sprintId, projectId, isEmployee, currentUser]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* ── Drag & drop ── */
  const handleDragStart = (task: Task) => setDraggedTask(task);
  const handleDragOver  = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (status: string) => {
    if (!draggedTask || draggedTask.status === status) { setDraggedTask(null); return; }
    const previous = tasks;
    // Optimistic update
    setTasks(tasks.map((t) => t.id === draggedTask.id ? { ...t, status: status as Task['status'] } : t));

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/tasks?id=${draggedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setTasks(previous);
        const err = await response.json();
        toast.error(err.message || err.error || 'Failed to update task status');
      }
    } catch {
      setTasks(previous);
      toast.error('Failed to update task status');
    } finally {
      setDraggedTask(null);
    }
  };

  if (loading) return <KanbanSkeleton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);

        return (
          <div
            key={column.id}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <Card className={`${column.color} border-dashed ${column.borderColor} flex-1 min-h-[500px]`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold tracking-tight">
                    {column.title}
                  </CardTitle>
                  <Badge className={`text-xs font-bold ${column.badgeClass} border-none`}>
                    {columnTasks.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto px-4 pb-4">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground/60 italic">
                    No tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      draggable={!isEmployee}
                      onDragStart={!isEmployee ? () => handleDragStart(task) : undefined}
                      onClick={() => onTaskClick?.(task)}
                      className={`cursor-pointer hover:shadow-md transition-all duration-150 border-none bg-card/80 backdrop-blur-sm group ${PRIORITY_STYLES[task.priority] ?? ''}`}
                    >
                      <CardContent className="p-3.5 space-y-2.5">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium leading-snug flex-1 line-clamp-2">
                            {task.title}
                          </h4>
                          {task.storyPoints && (
                            <Badge variant="outline" className="text-[10px] shrink-0 px-1.5">
                              {task.storyPoints}pt
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {/* Priority badge */}
                          <Badge
                            className={`text-[10px] px-1.5 py-0 capitalize border-0 ${
                              task.priority === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : task.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {task.priority}
                          </Badge>

                          {/* Due date */}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          )}

                          {/* Hours */}
                          {((task.estimatedHours ?? 0) > 0 || (task.loggedHours ?? 0) > 0) && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              <Timer className="h-3 w-3" />
                              {task.loggedHours ?? 0}/{task.estimatedHours ?? 0}h
                            </div>
                          )}

                          {/* Blocked */}
                          {task.blockedById && (
                            <div className="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
                              <AlertCircle className="h-3 w-3" />
                              Blocked
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {/* Add Task button — shown for all, admin can create in any column */}
                {onCreateTask && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 mt-1"
                    onClick={() => onCreateTask(column.id)}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Task
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
