import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Award, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OvertimeTabProps {
  tenantId: string;
}

export default function OvertimeTab({ tenantId }: OvertimeTabProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedOvertime, setSelectedOvertime] = useState<any | null>(null);
  const [approvedHours, setApprovedHours] = useState('');

  const fetchOvertimeRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/overtime');
      if (response.ok) {
        const data = await response.json();
        setRequests(data || []);
      }
    } catch (err) {
      toast.error('Failed to load overtime requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertimeRequests();
  }, []);

  const handleProcess = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const payload: any = { id, action };
      if (action === 'approve') {
        payload.approvedHours = approvedHours ? Number(approvedHours) : null;
      }

      const response = await fetch('/api/attendance/overtime', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Overtime request ${action === 'approve' ? 'approved' : 'rejected'}`);
        setSelectedOvertime(null);
        setApprovedHours('');
        fetchOvertimeRequests();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Operation failed');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 text-[10px] font-bold">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[10px] font-bold">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50 text-[10px] font-bold">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-[#f87941]" />
                Overtime Claims & Allowances Queue
              </CardTitle>
              <CardDescription className="text-xs">
                Review auto-calculated overtime hours from checkout punch telemetry and sign off for payroll processing.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#f87941]" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              No overtime requests pending.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-white dark:bg-[#1E1F22] shadow-sm">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-3">Employee</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Calculated OT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Approved OT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Submission Reason</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors border-b border-border">
                      <TableCell className="font-semibold text-slate-900 dark:text-white py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-[#f87941] border border-slate-200 dark:border-slate-700">
                            E{req.employee_id}
                          </div>
                          <div>
                            <span className="block font-bold">Staff ID #{req.employee_id}</span>
                            <span className="block text-[9px] text-slate-400 font-semibold">Dept: {req.employees?.department || 'N/A'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white">{req.date}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 font-semibold">
                        {(req.calculated_overtime_minutes / 60).toFixed(2)} hrs
                        <span className="block text-[10px] text-slate-400 font-normal">({req.calculated_overtime_minutes} mins)</span>
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-white font-bold">
                        {req.approved_overtime_minutes !== null ? `${(req.approved_overtime_minutes / 60).toFixed(2)} hrs` : 'Pending'}
                      </TableCell>
                      <TableCell className="max-w-xs font-semibold text-slate-500">
                        {req.reason || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {req.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedOvertime(req);
                                  setApprovedHours(String((req.calculated_overtime_minutes / 60).toFixed(2)));
                                }}
                                className="h-8 text-[10px] font-bold bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-0.5"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleProcess(req.id, 'reject')}
                                disabled={processingId === req.id}
                                className="h-8 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-0.5"
                              >
                                <X className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Closed</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjust and Approve Overtime Dialog */}
      <Dialog open={selectedOvertime !== null} onOpenChange={() => setSelectedOvertime(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-white">
              <Award className="h-5 w-5 text-[#f87941]" />
              Approve Overtime Hours
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm or adjust the calculated hours to be processed for overtime payouts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 pt-2">
            <Label className="text-slate-500">Approved OT Hours</Label>
            <Input
              type="number"
              step="0.1"
              value={approvedHours}
              onChange={(e) => setApprovedHours(e.target.value)}
              className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedOvertime(null)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs"
              onClick={() => {
                if (selectedOvertime) {
                  handleProcess(selectedOvertime.id, 'approve');
                }
              }}
              disabled={processingId !== null}
            >
              {processingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
