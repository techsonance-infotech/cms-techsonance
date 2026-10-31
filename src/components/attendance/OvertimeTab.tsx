'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, Award, Check, X, Search, Filter, Sparkles, 
  Clock, IndianRupee, RefreshCw, CheckCircle2, AlertCircle 
} from 'lucide-react';
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchOvertimeRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/overtime');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setRequests(data);
        } else {
          setRequests([]);
        }
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

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const totalMinutes = requests.reduce((acc, curr) => acc + (curr.calculated_overtime_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    return { total, pending, approved, totalHours };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter !== 'all' && r.status?.toLowerCase() !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.employeeName || '').toLowerCase();
        const reason = (r.reason || '').toLowerCase();
        const id = String(r.employee_id || '');
        if (!name.includes(q) && !reason.includes(q) && !id.includes(q)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 w-fit"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 text-[10px] font-bold flex items-center gap-1 w-fit"><X className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 text-[10px] font-bold flex items-center gap-1 w-fit"><AlertCircle className="h-3 w-3" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Claims</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-[#f87941] flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Sign-off</span>
              <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Approved Claims</span>
              <p className="text-2xl font-black text-emerald-600">{stats.approved}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Total Logged Hours</span>
              <p className="text-2xl font-black text-indigo-600">{stats.totalHours} hrs</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-[#f87941]" />
                Overtime Claims & Allowances Queue
              </CardTitle>
              <CardDescription className="text-xs">
                Review auto-calculated overtime hours from checkout punch telemetry and sign off for payroll processing.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchOvertimeRequests}
                disabled={loading}
                className="h-9 text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                Approved ({stats.approved})
              </button>
            </div>

            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search staff or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#f87941]" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs font-semibold flex flex-col items-center justify-center gap-3 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
              <Award className="h-10 w-10 text-orange-400" />
              <span>No overtime requests found in live database.</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl bg-white dark:bg-[#1E1F22] shadow-sm">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-3.5">Employee</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Calculated OT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Approved OT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Submission Reason</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors border-b border-border">
                      <TableCell className="font-semibold text-slate-900 dark:text-white py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-[10px] font-bold text-[#f87941] border border-orange-200">
                            {(req.employeeName || `E${req.employee_id}`).charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold">{req.employeeName || `Staff ID #${req.employee_id}`}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold">{req.department || req.employees?.department || 'Operations'}</span>
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
                      <TableCell className="max-w-xs truncate font-semibold text-slate-500" title={req.reason}>
                        {req.reason || 'General overtime logged'}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {req.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedOvertime(req);
                                  setApprovedHours((req.calculated_overtime_minutes / 60).toFixed(2));
                                }}
                                className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Sign Off
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleProcess(req.id, 'reject')}
                                disabled={processingId === req.id}
                                className="h-8 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white"
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Signed Off</span>
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

      {/* Approve Dialog */}
      <Dialog open={selectedOvertime !== null} onOpenChange={() => setSelectedOvertime(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-[#f87941]" />
              Sign Off Overtime Hours
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm payable overtime hours for this shift.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-slate-500">Approved Hours (Hours)</Label>
              <Input
                type="number"
                step="0.25"
                value={approvedHours}
                onChange={(e) => setApprovedHours(e.target.value)}
                className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs h-9"
              />
            </div>
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
            >
              Confirm Sign-off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
