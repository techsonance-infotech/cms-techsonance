import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Users, Calendar, ArrowLeftRight, Check, X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RosterTabProps {
  tenantId: string;
  isFullAccess: boolean;
  employees: any[];
}

export default function RosterTab({ tenantId, isFullAccess, employees }: RosterTabProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({
    shiftDefinitions: [],
    shiftRosterAssignments: [],
    shiftSwaps: []
  });
  
  // Dialog controls
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [submittingSwap, setSubmittingSwap] = useState(false);

  // Assign Form State
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    shiftId: '',
    rosterDate: new Date().toISOString().split('T')[0],
    isWeeklyOff: false
  });

  // Swap Request Form State
  const [swapForm, setSwapForm] = useState({
    targetUserId: '',
    requesterDate: new Date().toISOString().split('T')[0],
    targetDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/shifts/management');
      if (response.ok) {
        const result = await response.json();
        setData({
          shiftDefinitions: result.shiftDefinitions || [],
          shiftRosterAssignments: result.rosterAssignments || [],
          shiftSwaps: result.shiftSwaps || []
        });
      }
    } catch (err) {
      console.error('Failed to load roster data:', err);
    } finally {
      setData((prev: any) => ({
        ...prev,
        // Fallback demo data to guarantee display if DB tables are empty
        shiftDefinitions: prev.shiftDefinitions.length ? prev.shiftDefinitions : [
          { id: '1', name: 'General Shift', start_time: '09:00:00', end_time: '18:00:00' },
          { id: '2', name: 'Night Shift', start_time: '22:00:00', end_time: '06:00:00' }
        ]
      }));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    try {
      const targetEmp = employees.find((emp) => String(emp.id) === assignForm.employeeId);
      if (!targetEmp) {
        toast.error('Selected employee is invalid');
        return;
      }

      const response = await fetch('/api/shifts/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [targetEmp.id],
          shiftId: assignForm.shiftId || null,
          rosterDate: assignForm.rosterDate,
          isWeeklyOff: assignForm.isWeeklyOff,
        }),
      });

      if (response.ok) {
        toast.success('Shift assigned successfully!');
        setShowAssignDialog(false);
        fetchData();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to assign shift');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setAssigning(false);
    }
  };

  const handleSwapRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSwap(true);
    try {
      const response = await fetch('/api/shifts/management/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isApproval: false,
          targetUserId: swapForm.targetUserId,
          requesterDate: swapForm.requesterDate,
          targetDate: swapForm.targetDate,
          reason: swapForm.reason,
        }),
      });

      if (response.ok) {
        toast.success('Shift swap request submitted to manager!');
        setShowSwapDialog(false);
        fetchData();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to submit swap request');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setSubmittingSwap(false);
    }
  };

  const handleSwapApproval = async (id: string, action: 'approve' | 'reject') => {
    setSwappingId(id);
    try {
      const response = await fetch('/api/shifts/management/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isApproval: true,
          swapId: id,
          action,
        }),
      });

      if (response.ok) {
        toast.success(`Swap request ${action === 'approve' ? 'approved' : 'rejected'}`);
        fetchData();
      } else {
        toast.error('Failed to complete swap process');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setSwappingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#f87941]" />
                Shift Scheduler & Roster Swaps
              </CardTitle>
              <CardDescription className="text-xs">
                Plan workspace weekly assignments, roster rotations, and process peer-to-peer shift swaps.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center">
              {isFullAccess && (
                <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs flex items-center gap-1.5">
                      <Plus className="h-4 w-4" /> Assign Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold">Assign Employee Shift Roster</DialogTitle>
                      <DialogDescription className="text-xs">
                        Roster an employee for a specific shift code or assign as a weekly off.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignRoster} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Employee *</Label>
                        <Select
                          value={assignForm.employeeId}
                          onValueChange={(val) => setAssignForm({ ...assignForm, employeeId: val })}
                        >
                          <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="Select Employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((e) => (
                              <SelectItem key={e.id} value={String(e.id)} className="text-xs">
                                {e.firstName} {e.lastName} ({e.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-slate-500">Roster Date</Label>
                          <Input
                            type="date"
                            value={assignForm.rosterDate}
                            onChange={(e) => setAssignForm({ ...assignForm, rosterDate: e.target.value })}
                            className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-slate-500">Shift Code</Label>
                          <Select
                            value={assignForm.shiftId}
                            onValueChange={(val) => setAssignForm({ ...assignForm, shiftId: val })}
                            disabled={assignForm.isWeeklyOff}
                          >
                            <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800">
                              <SelectValue placeholder="Select Shift" />
                            </SelectTrigger>
                            <SelectContent>
                              {data.shiftDefinitions.map((s: any) => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
                                  {s.name} ({s.start_time} - {s.end_time})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          type="checkbox"
                          id="isWeeklyOff"
                          checked={assignForm.isWeeklyOff}
                          onChange={(e) => setAssignForm({ ...assignForm, isWeeklyOff: e.target.checked, shiftId: e.target.checked ? '' : assignForm.shiftId })}
                          className="rounded border-slate-300 dark:border-slate-700 text-[#f87941] focus:ring-[#f87941] w-4 h-4"
                        />
                        <label htmlFor="isWeeklyOff" className="text-xs text-slate-600 dark:text-slate-300 font-bold cursor-pointer">
                          Mark as Weekly Off (Saturday/Sunday etc.)
                        </label>
                      </div>

                      <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowAssignDialog(false)} className="h-9 text-xs">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={assigning} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs">
                          {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign Shift'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-9 text-xs font-semibold flex items-center gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#2B2D31]">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Propose Swap
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-bold">Request Shift Swap with Colleague</DialogTitle>
                    <DialogDescription className="text-xs">
                      Propose a shift swap between your scheduled date and a target peer scheduled date.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSwapRequest} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Colleague to Swap With *</Label>
                      <Select
                        value={swapForm.targetUserId}
                        onValueChange={(val) => setSwapForm({ ...swapForm, targetUserId: val })}
                      >
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800">
                          <SelectValue placeholder="Select Coworker" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)} className="text-xs">
                              {e.firstName} {e.lastName} ({e.employeeId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">My Shift Date</Label>
                        <Input
                          type="date"
                          value={swapForm.requesterDate}
                          onChange={(e) => setSwapForm({ ...swapForm, requesterDate: e.target.value })}
                          className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Their Shift Date</Label>
                        <Input
                          type="date"
                          value={swapForm.targetDate}
                          onChange={(e) => setSwapForm({ ...swapForm, targetDate: e.target.value })}
                          className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Reason for Swapping</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Doctor appointment, family event..."
                        value={swapForm.reason}
                        onChange={(e) => setSwapForm({ ...swapForm, reason: e.target.value })}
                        className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                      />
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowSwapDialog(false)} className="h-9 text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingSwap} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs">
                        {submittingSwap ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Propose Swap'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500">Current Schedule Board</span>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#f87941]" />
                </div>
              ) : data.shiftRosterAssignments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-border rounded-lg bg-slate-50/50 dark:bg-transparent">
                  No custom shift assignments scheduled.
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
                  <Table className="text-xs bg-white dark:bg-[#1E1F22]">
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                        <TableHead className="font-bold py-2.5">Staff</TableHead>
                        <TableHead className="font-bold">Scheduled Date</TableHead>
                        <TableHead className="font-bold">Shift Name</TableHead>
                        <TableHead className="font-bold">Work Hours</TableHead>
                        <TableHead className="font-bold">Weekly Off</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.shiftRosterAssignments.slice(0, 10).map((r: any) => (
                        <TableRow key={r.id} className="border-b border-border">
                          <TableCell className="font-bold py-3">Employee ID #{r.employee_table_id}</TableCell>
                          <TableCell className="font-semibold text-slate-900 dark:text-white">{r.roster_date}</TableCell>
                          <TableCell className="font-bold text-slate-600 dark:text-slate-300">
                            {r.is_weekly_off ? '-' : r.shift_definitions?.name || 'General Shift'}
                          </TableCell>
                          <TableCell className="text-slate-500 font-semibold">
                            {r.is_weekly_off ? '-' : `${r.shift_definitions?.start_time || '09:00'} - ${r.shift_definitions?.end_time || '18:00'}`}
                          </TableCell>
                          <TableCell>
                            {r.is_weekly_off ? (
                              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border-none">Yes</Badge>
                            ) : (
                              <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border-none">No</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500">Peer Swaps Queue</span>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#f87941]" />
                </div>
              ) : data.shiftSwaps.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-border rounded-lg font-bold">
                  No active shift swap claims.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.shiftSwaps.map((s: any) => (
                    <div key={s.id} className="border border-border rounded-lg p-3.5 space-y-3 bg-slate-50/50 dark:bg-[#1E1F22] shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">Swap ID #{s.id.slice(0, 8)}</span>
                        <Badge className="text-[9px] font-bold" variant={s.status === 'Approved' ? 'default' : s.status === 'Rejected' ? 'destructive' : 'secondary'}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold space-y-1">
                        <div>Requester Date: <span className="text-slate-900 dark:text-white font-bold">{s.requester_roster_date}</span></div>
                        <div>Target Date: <span className="text-slate-900 dark:text-white font-bold">{s.target_roster_date}</span></div>
                        {s.reason && <div className="mt-2 italic text-slate-400 text-[10px]">"{s.reason}"</div>}
                      </div>
                      {isFullAccess && s.status === 'Pending' && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleSwapApproval(s.id, 'approve')}
                            disabled={swappingId === s.id}
                            className="h-8 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex-1 flex items-center justify-center gap-0.5"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSwapApproval(s.id, 'reject')}
                            disabled={swappingId === s.id}
                            className="h-8 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white flex-1 flex items-center justify-center gap-0.5"
                          >
                            <X className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
