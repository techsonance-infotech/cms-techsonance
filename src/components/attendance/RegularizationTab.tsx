'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, Plus, Check, X, FileText, CheckCircle2, AlertCircle, ShieldCheck, 
  Search, Filter, Clock, Eye, Sparkles, MapPin, ExternalLink, RefreshCw, ShieldAlert,
  UserCheck, AlertTriangle, ArrowUpDown
} from 'lucide-react';
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  // Inspection modal state
  const [inspectingRequest, setInspectingRequest] = useState<any | null>(null);

  // Rejection modal state
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(employeeId ? String(employeeId) : '');
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reasonType: 'forgotten_punch',
    notes: '',
    requestedTimeIn: '09:00',
    requestedTimeOut: '18:00',
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
        if (Array.isArray(data) && data.length > 0) {
          setRequests(data);
        } else {
          // If empty, keep empty but allow user to toggle demo data or add request
          setRequests([]);
        }
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
    const targetEmployeeId = isFullAccess && selectedStaffId ? Number(selectedStaffId) : employeeId;
    
    if (!targetEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (!form.date) {
      toast.error('Please select a date for regularization');
      return;
    }

    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDate > today) {
      toast.error('Cannot submit regularization for a future date');
      return;
    }

    if (form.requestedTimeIn && form.requestedTimeOut) {
      if (form.requestedTimeOut <= form.requestedTimeIn) {
        toast.error('Requested Time Out must be later than Time In');
        return;
      }
    }

    if (!form.notes || form.notes.trim().length < 5) {
      toast.error('Please provide a detailed justification (at least 5 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const formattedTimeIn = form.requestedTimeIn ? new Date(`${form.date}T${form.requestedTimeIn}:00+05:30`).toISOString() : `${form.date}T09:00:00+05:30`;
      const formattedTimeOut = form.requestedTimeOut ? new Date(`${form.date}T${form.requestedTimeOut}:00+05:30`).toISOString() : `${form.date}T18:00:00+05:30`;

      const response = await fetch('/api/attendance/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: targetEmployeeId,
          date: form.date,
          timeIn: formattedTimeIn,
          timeOut: formattedTimeOut,
          reasonType: form.reasonType,
          notes: form.notes.trim(),
          locationLatitude: form.gpsLatitude ? Number(form.gpsLatitude) : null,
          locationLongitude: form.gpsLongitude ? Number(form.gpsLongitude) : null,
          attachmentUrl: form.attachmentUrl,
        }),
      });

      if (response.ok) {
        toast.success('Regularization request submitted and routed to approval queue.');
        setShowRequestDialog(false);
        fetchRequests();
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message || err.error || 'Failed to submit regularization request');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRequest = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Please specify a rejection reason before declining');
      return;
    }

    setProcessingId(id);
    try {
      const payload: any = { id, action };
      if (action === 'reject') {
        payload.rejection_reason = rejectionReason.trim();
      }

      const response = await fetch('/api/attendance/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        setRejectingRequest(null);
        setInspectingRequest(null);
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

  // KPI Calculations
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const anomalies = requests.filter(r => r.ai_fraud_check?.isAnomaly).length;
    return { total, pending, approved, rejected, anomalies };
  }, [requests]);

  // Filtered list
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Status filter
      if (statusFilter !== 'all' && req.status?.toLowerCase() !== statusFilter) {
        return false;
      }
      // Reason filter
      if (reasonFilter !== 'all' && req.reason_type !== reasonFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = req.employeeName?.toLowerCase() || '';
        const dept = req.department?.toLowerCase() || req.employees?.department?.toLowerCase() || '';
        const staffId = String(req.employee_id || '');
        const notes = (req.notes || '').toLowerCase();
        const reason = (req.reason_type || '').toLowerCase();
        if (!empName.includes(q) && !dept.includes(q) && !staffId.includes(q) && !notes.includes(q) && !reason.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, reasonFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': 
        return <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 text-[10px] font-bold flex items-center w-fit gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case 'rejected': 
        return <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[10px] font-bold flex items-center w-fit gap-1"><X className="h-3.5 w-3.5" /> Rejected</Badge>;
      default: 
        return <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50 text-[10px] font-bold flex items-center w-fit gap-1"><AlertCircle className="h-3.5 w-3.5" /> Pending</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'forgotten_punch': return 'Forgotten Punch';
      case 'missing_punch': return 'Missing Punch';
      case 'travel': return 'Business Travel';
      case 'wfh': return 'Work From Home';
      case 'dispute': return 'Attendance Dispute';
      default: return reason ? reason.replace('_', ' ') : 'General Adjustment';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm hover:border-[#f87941]/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Claims</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-[#f87941] flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm hover:border-amber-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Approval</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm hover:border-rose-500/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">AI Anomalies</span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.anomalies}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Container */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#f87941]" />
                {isFullAccess ? 'Employee Regularization Approvals Queue' : 'My Past Regularization Claims'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isFullAccess
                  ? 'Review pending attendance adjustments, evaluate AI fraud alerts, and process manager overrides.'
                  : 'Submit and track shift regularization request overrides for missing or erroneous punch records.'}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchRequests}
                disabled={loading}
                className="h-9 text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>

              {/* Action Button: Accessible to both Admins and Employees */}
              <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> 
                    {isFullAccess ? 'Create Manual Regularization' : 'Request Override'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#f87941]" />
                      {isFullAccess ? 'New Staff Regularization Entry' : 'New Regularization Request'}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {isFullAccess 
                        ? 'Submit an official attendance adjustment override on behalf of an employee.' 
                        : 'Provide accurate punch details and reasoning to update your attendance register.'}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold pt-2">
                    {/* Admin Employee Selector */}
                    {isFullAccess && employees && employees.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Target Employee *</Label>
                        <Select
                          value={selectedStaffId}
                          onValueChange={setSelectedStaffId}
                        >
                          <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="Choose employee..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={String(emp.id)} className="text-xs">
                                {emp.firstName} {emp.lastName} ({emp.department} - #{emp.employeeId || emp.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Target Date *</Label>
                        <Input
                          type="date"
                          value={form.date}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={(e) => {
                            const val = e.target.value;
                            const todayStr = new Date().toISOString().split('T')[0];
                            if (val && val > todayStr) {
                              toast.error('Future dates cannot be selected for attendance regularization');
                              return;
                            }
                            setForm({ ...form, date: val });
                          }}
                          className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-500">Reason Category *</Label>
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
                        <Label className="text-slate-500">Requested Time In (HH:MM) *</Label>
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

                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Detailed Explanatory Notes *</Label>
                      <Textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Provide reasons, reference tickets, or context regarding this punch adjustment..."
                        className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs resize-none"
                        rows={3}
                        required
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowRequestDialog(false)} className="h-9 text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Adjustment'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-border/60">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                Rejected ({stats.rejected})
              </button>
            </div>

            {/* Search & Reason dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search staff, ID, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="h-8 text-xs w-36 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Reason Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                  <SelectItem value="forgotten_punch" className="text-xs">Forgotten Punch</SelectItem>
                  <SelectItem value="missing_punch" className="text-xs">Missing Punch</SelectItem>
                  <SelectItem value="travel" className="text-xs">Business Travel</SelectItem>
                  <SelectItem value="wfh" className="text-xs">Work From Home</SelectItem>
                  <SelectItem value="dispute" className="text-xs">Dispute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#f87941]" />
              <p className="text-xs font-semibold text-slate-400">Loading regularization records...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="h-14 w-14 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-[#f87941] flex items-center justify-center mx-auto shadow-sm">
                <FileText className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No regularization requests match your filters
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {requests.length === 0
                    ? 'All employee punches are synchronized with biometric hardware or no adjustments have been requested.'
                    : 'Try clearing your search query or switching your status filter to see other records.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                {requests.length === 0 ? (
                  <Button
                    size="sm"
                    onClick={() => setShowRequestDialog(true)}
                    className="h-8 text-xs font-bold bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> {isFullAccess ? 'Create Manual Regularization' : 'Request Override'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setStatusFilter('all'); setReasonFilter('all'); setSearchQuery(''); }}
                    className="h-8 text-xs font-semibold"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl bg-white dark:bg-[#1E1F22] shadow-sm">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                    {isFullAccess && <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-3.5">Employee</TableHead>}
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Requested Punches</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Reason Category</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Explanatory Notes</TableHead>
                    {isFullAccess && <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">AI Fraud Check</TableHead>}
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => {
                    const empName = req.employeeName || (req.employees ? `Staff #${req.employee_id}` : `Staff #${req.employee_id}`);
                    const dept = req.department || req.employees?.department || 'Operations';
                    
                    return (
                      <TableRow key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors border-b border-border">
                        {isFullAccess && (
                          <TableCell className="font-semibold text-slate-900 dark:text-white py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-[10px] font-black text-[#f87941] border border-orange-200/60 dark:border-orange-800/50">
                                {empName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="block font-bold text-slate-900 dark:text-slate-100">{empName}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                                  <span>ID #{req.employee_id}</span>
                                  <span>•</span>
                                  <span>{dept}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        )}

                        <TableCell className="font-bold text-slate-900 dark:text-white">
                          <div>{req.date}</div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(req.date).toLocaleDateString(undefined, { weekday: 'short' })}
                          </span>
                        </TableCell>

                        <TableCell className="text-slate-600 dark:text-slate-300 font-semibold">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">In</span>
                              <span>{req.requested_time_in ? new Date(req.requested_time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (req.time_in ? new Date(req.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold">Out</span>
                              <span>{req.requested_time_out ? new Date(req.requested_time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (req.time_out ? new Date(req.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:00 PM')}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                            {getReasonLabel(req.reason_type)}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-[200px] truncate font-medium text-slate-500 dark:text-slate-400" title={req.notes}>
                          {req.notes || 'No description provided'}
                        </TableCell>

                        {isFullAccess && (
                          <TableCell className="text-center">
                            {req.ai_fraud_check?.isAnomaly ? (
                              <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[10px] font-bold inline-flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Anomaly ({req.ai_fraud_check.confidenceScore}%)
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 text-[10px] font-bold inline-flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Validated ({req.ai_fraud_check?.confidenceScore || 95}%)
                              </Badge>
                            )}
                          </TableCell>
                        )}

                        <TableCell>{getStatusBadge(req.status)}</TableCell>

                        <TableCell className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setInspectingRequest(req)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              title="Inspect Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {isFullAccess && req.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessRequest(req.id, 'approve')}
                                  disabled={processingId === req.id}
                                  className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 px-2.5 shadow-sm"
                                >
                                  {processingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setRejectingRequest(req)}
                                  disabled={processingId === req.id}
                                  className="h-8 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 px-2.5 shadow-sm"
                                >
                                  <X className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect Details Dialog */}
      <Dialog open={inspectingRequest !== null} onOpenChange={() => setInspectingRequest(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#f87941]" />
              Regularization Audit & Inspection
            </DialogTitle>
            <DialogDescription className="text-xs">
              Detailed audit trail, GPS coordinates, and AI integrity evaluation.
            </DialogDescription>
          </DialogHeader>

          {inspectingRequest && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Staff Member</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {inspectingRequest.employeeName || `Employee #${inspectingRequest.employee_id}`}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Target Date</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{inspectingRequest.date}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Reason Category</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                    {getReasonLabel(inspectingRequest.reason_type)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Current Status</span>
                  <div className="mt-0.5">{getStatusBadge(inspectingRequest.status)}</div>
                </div>
              </div>

              {/* Punch Timestamps */}
              <div className="p-3 bg-white dark:bg-[#18191B] border border-border rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested Timestamps</span>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-400 text-[10px] block">Check In</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {inspectingRequest.requested_time_in ? new Date(inspectingRequest.requested_time_in).toLocaleTimeString() : '09:00:00 AM'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-slate-400 text-[10px] block">Check Out</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {inspectingRequest.requested_time_out ? new Date(inspectingRequest.requested_time_out).toLocaleTimeString() : '06:00:00 PM'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Justification</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                  {inspectingRequest.notes || 'No description provided.'}
                </p>
              </div>

              {/* AI Fraud Verdict */}
              {inspectingRequest.ai_fraud_check && (
                <div className={`p-3 rounded-xl border ${
                  inspectingRequest.ai_fraud_check.isAnomaly 
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300' 
                    : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {inspectingRequest.ai_fraud_check.isAnomaly ? (
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    )}
                    <span>AI Verification Verdict ({inspectingRequest.ai_fraud_check.confidenceScore}% Confidence)</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-normal">
                    {inspectingRequest.ai_fraud_check.verdict || 'Location and timing are within standard operational variance.'}
                  </p>
                </div>
              )}

              {/* GPS Coordinates */}
              {inspectingRequest.gps_latitude && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-[#f87941]" />
                    <span>Coordinates: {inspectingRequest.gps_latitude}, {inspectingRequest.gps_longitude}</span>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${inspectingRequest.gps_latitude},${inspectingRequest.gps_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f87941] hover:underline flex items-center gap-1 text-[11px] font-bold"
                  >
                    View Map <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Action Buttons inside inspection */}
              {isFullAccess && inspectingRequest.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const req = inspectingRequest;
                      setInspectingRequest(null);
                      setRejectingRequest(req);
                    }}
                    className="h-8 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Reject Claim
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleProcessRequest(inspectingRequest.id, 'approve')}
                    className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Approve Adjustment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectingRequest !== null} onOpenChange={() => setRejectingRequest(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Reject Regularization Request</DialogTitle>
            <DialogDescription className="text-xs">
              Explain why this adjustment is being declined. These comments will be dispatched to the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 pt-2">
            <Label className="text-slate-500">Rejection Reason *</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Punch timestamp does not match turnstile security logs..."
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
}
