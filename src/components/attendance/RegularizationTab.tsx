import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Check, X, FileText, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RegularizationTabProps {
  tenantId: string;
  isFullAccess: boolean;
  employeeId: number | null;
  employees: any[];
}

export default function RegularizationTab({ tenantId, isFullAccess, employeeId, employees }: RegularizationTabProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // Rejection modal state
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reasonType: 'forgotten_punch',
    notes: '',
    requestedTimeIn: '',
    requestedTimeOut: '',
    attachmentUrl: '',
    gpsLatitude: '',
    gpsLongitude: '',
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data || []);
      }
    } catch (err) {
      toast.error('Failed to load regularization requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setSubmitting(true);
    try {
      const formattedTimeIn = form.requestedTimeIn ? new Date(`${form.date}T${form.requestedTimeIn}:00+05:30`).toISOString() : null;
      const formattedTimeOut = form.requestedTimeOut ? new Date(`${form.date}T${form.requestedTimeOut}:00+05:30`).toISOString() : null;

      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          date: form.date,
          timeIn: formattedTimeIn || new Date().toISOString(),
          timeOut: formattedTimeOut,
          notes: form.notes,
          locationLatitude: form.gpsLatitude ? Number(form.gpsLatitude) : null,
          locationLongitude: form.gpsLongitude ? Number(form.gpsLongitude) : null,
          metadata: {
            reasonType: form.reasonType,
            attachmentUrl: form.attachmentUrl,
            notes: form.notes,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.routedToQueue ? 'Regularization request submitted and routed to approval queue.' : 'Attendance updated successfully.');
        setShowRequestDialog(false);
        fetchRequests();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit request');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRequest = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const payload: any = { id, action };
      if (action === 'reject') {
        payload.rejection_reason = rejectionReason;
      }

      const response = await fetch('/api/attendance/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        setRejectingRequest(null);
        setRejectionReason('');
        fetchRequests();
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
      case 'approved': return <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 text-[10px] font-bold flex items-center w-fit gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case 'rejected': return <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[10px] font-bold flex items-center w-fit gap-1"><X className="h-3.5 w-3.5" /> Rejected</Badge>;
      default: return <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50 text-[10px] font-bold flex items-center w-fit gap-1"><AlertCircle className="h-3.5 w-3.5" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#f87941]" />
                {isFullAccess ? 'Employee Regularization Approvals Queue' : 'My Past Regularization Claims'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isFullAccess
                  ? 'Review pending attendance adjustments, check credentials, and resolve exception approvals.'
                  : 'Submit and track shift regularization request overrides for missing timestamps.'}
              </CardDescription>
            </div>
            {!isFullAccess && (
              <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs flex items-center gap-1.5 self-start md:self-center">
                    <Plus className="h-4 w-4" /> Request Override
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-bold">New Regularization Request</DialogTitle>
                    <DialogDescription className="text-xs">
                      Provide correct punch details and reasoning to update your attendance register.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Target Date</Label>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Reason Category</Label>
                        <Select
                          value={form.reasonType}
                          onValueChange={(val) => setForm({ ...form, reasonType: val })}
                        >
                          <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="Select Reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="forgotten_punch" className="text-xs">Forgotten Punch</SelectItem>
                            <SelectItem value="missing_punch" className="text-xs">Missing Punch</SelectItem>
                            <SelectItem value="travel" className="text-xs">Business Travel</SelectItem>
                            <SelectItem value="wfh" className="text-xs">Work From Home</SelectItem>
                            <SelectItem value="dispute" className="text-xs">Attendance Dispute</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Requested Time In (HH:MM)</Label>
                        <Input
                          type="time"
                          value={form.requestedTimeIn}
                          onChange={(e) => setForm({ ...form, requestedTimeIn: e.target.value })}
                          className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Requested Time Out (HH:MM)</Label>
                        <Input
                          type="time"
                          value={form.requestedTimeOut}
                          onChange={(e) => setForm({ ...form, requestedTimeOut: e.target.value })}
                          className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">GPS Latitude (Optional)</Label>
                        <Input
                          type="text"
                          placeholder="e.g. 12.9716"
                          value={form.gpsLatitude}
                          onChange={(e) => setForm({ ...form, gpsLatitude: e.target.value })}
                          className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">GPS Longitude (Optional)</Label>
                        <Input
                          type="text"
                          placeholder="e.g. 77.5946"
                          value={form.gpsLongitude}
                          onChange={(e) => setForm({ ...form, gpsLongitude: e.target.value })}
                          className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Attachment / Receipt URL (Optional)</Label>
                      <Input
                        type="url"
                        placeholder="https://example.com/receipt.jpg"
                        value={form.attachmentUrl}
                        onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                        className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Detailed Explanatory Notes *</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Provide details about the check-in discrepancy..."
                        className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs resize-none"
                        rows={3}
                        required
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowRequestDialog(false)} className="h-9 text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#f87941]" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              No regularization requests found.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-white dark:bg-[#1E1F22] shadow-sm">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                    {isFullAccess && <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-3">Employee</TableHead>}
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Requested Punches</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Reason Category</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Explanatory Notes</TableHead>
                    {isFullAccess && <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">AI Fraud Check</TableHead>}
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                    {isFullAccess && <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors border-b border-border">
                      {isFullAccess && (
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
                      )}
                      <TableCell className="font-bold text-slate-900 dark:text-white">{req.date}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300 font-semibold">
                        <div>In: {req.time_in ? new Date(req.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                        <div>Out: {req.time_out ? new Date(req.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-600 dark:text-slate-400 capitalize">
                          {req.reason_type?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate font-medium text-slate-500" title={req.notes}>
                        {req.notes || 'None'}
                      </TableCell>
                      {isFullAccess && (
                        <TableCell className="text-center">
                          {req.ai_fraud_check?.isAnomaly ? (
                            <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[9px] font-bold">
                              Anomaly ({req.ai_fraud_check.confidenceScore}%)
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 text-[9px] font-bold flex items-center justify-center w-fit mx-auto gap-0.5">
                              <ShieldCheck className="h-3 w-3" /> Clear
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      {isFullAccess && (
                        <TableCell className="py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {req.status === 'pending' ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessRequest(req.id, 'approve')}
                                  disabled={processingId === req.id}
                                  className="h-8 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                                >
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setRejectingRequest(req)}
                                  disabled={processingId === req.id}
                                  className="h-8 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1"
                                >
                                  <X className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold">Closed</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectingRequest !== null} onOpenChange={() => setRejectingRequest(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Reject Regularization Request</DialogTitle>
            <DialogDescription className="text-xs">
              Explain why this adjustment is being declined. This comments will be sent to the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 pt-2">
            <Label className="text-slate-500">Rejection Reason *</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setReReason(e.target.value)}
              placeholder="e.g. Time stamps do not match office logs..."
              rows={3}
              className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs"
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setRejectingRequest(null)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs"
              onClick={() => {
                if (rejectingRequest) {
                  handleProcessRequest(rejectingRequest.id, 'reject');
                }
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function setReReason(val: string) {
    setRejectionReason(val);
  }
}
