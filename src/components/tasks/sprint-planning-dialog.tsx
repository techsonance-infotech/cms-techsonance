'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { sprintFormSchema, sprintStatusOptions, type SprintFormValues } from '@/lib/forms/schemas';
import { Loader2, Zap, AlertCircle, CalendarDays, Target } from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

interface SprintPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectId?: number;
}

interface Project {
  id: number;
  name: string;
}

const statusMeta: Record<string, { label: string; color: string }> = {
  planning:  { label: 'Planning',  color: 'bg-slate-100 text-slate-700 border-slate-300' },
  active:    { label: 'Active',    color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 border-rose-300' },
};

export function SprintPlanningDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
}: SprintPlanningDialogProps) {
  const [loading, setLoading]               = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projects, setProjects]             = useState<Project[]>([]);
  const projectsFetchedRef = useRef(false);

  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: {
      projectId: projectId?.toString() || '',
      name:      '',
      goal:      '',
      startDate: '',
      endDate:   '',
      status:    'planning',
    },
  });

  // Fetch projects once when dialog opens (guarded to prevent double-fetch)
  const fetchProjects = useCallback(async () => {
    if (projectsFetchedRef.current && projects.length > 0) return;
    setLoadingProjects(true);
    try {
      const token = getStoredSessionToken();
      const response = await fetch('/api/projects?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setProjects(list);
        projectsFetchedRef.current = true;
      }
    } catch {
      console.error('Failed to load projects for sprint form');
    } finally {
      setLoadingProjects(false);
    }
  }, [projects.length]);

  useEffect(() => {
    if (open) {
      // Reset form and errors on open
      form.reset({
        projectId: projectId?.toString() || '',
        name:      '',
        goal:      '',
        startDate: '',
        endDate:   '',
        status:    'planning',
      });
      form.clearErrors();
      fetchProjects();
    }
  }, [open, projectId, form, fetchProjects]);

  // Compute sprint duration in days for preview
  const startDate = form.watch('startDate');
  const endDate   = form.watch('endDate');
  const durationDays = startDate && endDate
    ? Math.max(0, Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      ))
    : null;

  const handleSubmit = async (values: SprintFormValues) => {
    // Clear root error before each attempt
    form.clearErrors('root');

    // Client-side date validation
    if (values.endDate <= values.startDate) {
      form.setError('endDate', { message: 'End date must be after start date' });
      return;
    }

    setLoading(true);
    try {
      const token = getStoredSessionToken();
      const payload = {
        projectId: parseInt(values.projectId, 10),
        name:      values.name.trim(),
        goal:      values.goal?.trim() || null,
        startDate: values.startDate,
        endDate:   values.endDate,
        status:    values.status,
      };

      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Sprint created successfully!');
        onOpenChange(false);
        onSuccess();
      } else {
        const errorData = await response.json();
        const message: string = errorData.message || errorData.error || 'Failed to create sprint';
        // Show server errors inside the dialog
        form.setError('root', { message });
      }
    } catch {
      form.setError('root', { message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/40">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            Create New Sprint
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Plan a new sprint with a goal and duration. Fields marked <span className="text-destructive font-semibold">*</span> are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 pt-4">

            {/* Project selector */}
            <FormField control={form.control} name="projectId" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Project <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loading || loadingProjects || !!projectId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingProjects ? 'Loading projects…' : 'Select project'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            {/* Sprint name */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Sprint Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Sprint 1 — Auth Module"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            {/* Sprint goal */}
            <FormField control={form.control} name="goal" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  Sprint Goal
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="What should this sprint deliver?"
                    disabled={loading}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Start Date <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    End Date <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>

            {/* Duration preview */}
            {durationDays !== null && durationDays > 0 && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>{durationDays} day{durationDays !== 1 ? 's' : ''}</strong> sprint duration
                  {durationDays >= 7 && (
                    <span className="ml-1 text-emerald-600">
                      (~{Math.round(durationDays / 7)} week{durationDays >= 14 ? 's' : ''})
                    </span>
                  )}
                </span>
              </div>
            )}
            {durationDays !== null && durationDays <= 0 && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-lg border border-destructive/20">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                End date must be after start date
              </div>
            )}

            {/* Status */}
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sprintStatusOptions.map((status) => {
                      const meta = statusMeta[status];
                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] px-1.5 py-0 border ${meta.color}`}>
                              {meta.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Usually start with <strong>Planning</strong> and activate when ready.</p>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            {/* Root error banner */}
            {form.formState.errors.root && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{form.formState.errors.root.message}</span>
              </div>
            )}

            <DialogFooter className="pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || (durationDays !== null && durationDays <= 0)}
                className="min-w-[140px]"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" />Create Sprint</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
