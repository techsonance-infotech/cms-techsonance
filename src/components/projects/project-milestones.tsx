'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, CheckCircle2, Circle, Clock, AlertCircle, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
}

/* ── Milestone form schema ── */
const milestoneFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(300),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['pending', 'in_progress', 'completed']),
});
type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

const statusLabels: Record<string, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Completed',
};

/* ── Add / Edit Milestone Dialog ── */
function MilestoneFormDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  milestone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  projectId: number;
  milestone?: Milestone | null;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: { title: '', description: '', dueDate: '', status: 'pending' },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        milestone
          ? {
              title:       milestone.title,
              description: milestone.description ?? '',
              dueDate:     milestone.dueDate?.split('T')[0] ?? '',
              status:      milestone.status as MilestoneFormValues['status'],
            }
          : { title: '', description: '', dueDate: '', status: 'pending' }
      );
    }
  }, [open, milestone, form]);

  const handleSubmit = async (values: MilestoneFormValues) => {
    form.clearErrors('root');
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const url    = milestone ? `/api/milestones?id=${milestone.id}` : '/api/milestones';
      const method = milestone ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          title:       values.title.trim(),
          description: values.description?.trim() || null,
          dueDate:     values.dueDate,
          status:      values.status,
        }),
      });

      if (response.ok) {
        toast.success(milestone ? 'Milestone updated' : 'Milestone added successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        const err = await response.json();
        form.setError('root', { message: err.message || err.error || 'Failed to save milestone' });
      }
    } catch {
      form.setError('root', { message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            {milestone ? 'Edit Milestone' : 'Add Milestone'}
          </DialogTitle>
          <DialogDescription>
            {milestone ? 'Update milestone details.' : 'Define a key milestone for this project.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            {/* Title */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Design sign-off" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            {/* Description */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Optional details..." className="resize-none" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {/* Status */}
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>

            {/* Root error banner */}
            {form.formState.errors.root && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{form.formState.errors.root.message}</span>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : (milestone ? 'Update' : 'Add Milestone')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Milestones Component ── */
export function ProjectMilestones({
  projectId,
  canEdit = false,
}: {
  projectId: number;
  canEdit?: boolean;
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing]       = useState<Milestone | null>(null);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/milestones?projectId=${projectId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        // API returns { success, data: [...] } or plain array
        setMilestones(Array.isArray(result) ? result : (result.data ?? []));
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

  const completedCount      = milestones.filter((m) => m.status === 'completed').length;
  const progressPercentage  = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  const openAdd  = () => { setEditing(null); setShowDialog(true); };
  const openEdit = (m: Milestone) => { setEditing(m); setShowDialog(true); };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>
                {completedCount} of {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} completed
              </CardDescription>
            </div>
            {canEdit && (
              <Button size="sm" onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} />
          </div>

          {milestones.length === 0 ? (
            <div className="text-center py-10">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">No milestones yet</p>
              {canEdit && (
                <Button size="sm" variant="outline" className="mt-3" onClick={openAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first milestone
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : milestone.status === 'in_progress' ? (
                      <Clock className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{milestone.title}</h4>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={
                          milestone.status === 'completed' ? 'secondary' :
                          milestone.status === 'in_progress' ? 'default' :
                          'outline'
                        }>
                          {statusLabels[milestone.status] ?? milestone.status}
                        </Badge>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => openEdit(milestone)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MilestoneFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSuccess={fetchMilestones}
        projectId={projectId}
        milestone={editing}
      />
    </div>
  );
}
