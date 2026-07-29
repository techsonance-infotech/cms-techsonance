'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, UserPlus, AlertCircle, Trash2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  assignedAt?: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const memberRoleOptions = ['developer', 'designer', 'qa', 'manager', 'lead', 'member'] as const;

/* ── Add Member Dialog ── */
const addMemberSchema = z.object({
  userId: z.string().min(1, 'Please select a team member'),
  role:   z.string().min(1, 'Please select a role'),
});
type AddMemberValues = z.infer<typeof addMemberSchema>;

function AddMemberDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  existingUserIds,
  allUsers,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  projectId: number;
  existingUserIds: number[];
  allUsers: User[];
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<AddMemberValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: '', role: 'member' },
  });

  useEffect(() => {
    if (open) form.reset({ userId: '', role: 'member' });
  }, [open, form]);

  // Only show users not already in the team
  const available = allUsers.filter((u) => !existingUserIds.includes(u.id));

  const handleSubmit = async (values: AddMemberValues) => {
    form.clearErrors('root');
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/project-members', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          userId: parseInt(values.userId, 10),
          role:   values.role,
        }),
      });

      if (response.ok) {
        toast.success('Team member assigned successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        const err = await response.json();
        form.setError('root', { message: err.message || err.error || 'Failed to assign member' });
      }
    } catch {
      form.setError('root', { message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            Assign Team Member
          </DialogTitle>
          <DialogDescription>
            Select an employee and their role for this project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            {/* Member select */}
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem>
                <FormLabel>Employee <span className="text-destructive">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={available.length === 0 ? 'All employees assigned' : 'Select employee'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {available.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        All employees are already assigned
                      </div>
                    ) : (
                      available.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.firstName} {u.lastName}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({u.role.replace(/_/g, ' ')})
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            {/* Role select */}
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Project Role <span className="text-destructive">*</span></FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {memberRoleOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            {/* Root error */}
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
              <Button
                type="submit"
                disabled={loading || available.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning…</> : 'Assign Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Team Component ── */
export function ProjectTeam({ projectId }: { projectId: number }) {
  const [members, setMembers]       = useState<ProjectMember[]>([]);
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [removingMember, setRemovingMember] = useState<ProjectMember | null>(null);

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const [membersRes, usersRes] = await Promise.all([
        fetch(`/api/project-members?projectId=${projectId}&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/users?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        // API returns { success, data: [...] } or plain array
        setMembers(Array.isArray(membersData) ? membersData : (membersData.data ?? []));
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const list = Array.isArray(usersData) ? usersData : (usersData.data ?? []);
        setUsers(list.filter((u: User) => u.role !== 'client'));
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchTeamData(); }, [fetchTeamData]);

  const handleRemove = async () => {
    if (!removingMember) return;
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/project-members?id=${removingMember.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success('Team member removed');
        fetchTeamData();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to remove member');
      }
    } catch {
      toast.error('An error occurred while removing the member');
    } finally {
      setRemovingMember(null);
    }
  };

  const getUserById = (userId: number) => users.find((u) => u.id === userId);
  const memberUserIds = members.map((m) => m.userId).filter(Boolean) as number[];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Team</CardTitle>
              <CardDescription>
                {members.length} team member{members.length !== 1 ? 's' : ''} assigned
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-10">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">No team members assigned yet</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign first member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const user = getUserById(member.userId);
                const initials = user
                  ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
                  : '??';
                const displayName = user ? `${user.firstName} ${user.lastName}` : `User #${member.userId}`;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <Avatar>
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-700 font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                      {user && (
                        <Badge variant="secondary" className="capitalize text-xs">
                          {user.role.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Remove from project"
                        onClick={() => setRemovingMember(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchTeamData}
        projectId={projectId}
        existingUserIds={memberUserIds}
        allUsers={users}
      />

      {/* Remove Confirmation */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{' '}
              <strong>
                {removingMember ? (getUserById(removingMember.userId)
                  ? `${getUserById(removingMember.userId)!.firstName} ${getUserById(removingMember.userId)!.lastName}`
                  : `User #${removingMember.userId}`)
                  : ''}
              </strong>{' '}
              from this project. You can re-assign them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
