'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, ShieldAlert, CheckCircle, AlertTriangle, Search, Filter, 
  Sparkles, ShieldCheck, RefreshCw, Eye, Check, X, MapPin 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExceptionsTabProps {
  tenantId: string;
}

export default function ExceptionsTab({ tenantId }: ExceptionsTabProps) {
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedException, setSelectedException] = useState<any | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/exceptions');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setExceptions(data);
        } else {
          setExceptions([]);
        }
      }
    } catch (err) {
      toast.error('Failed to load attendance exceptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleResolve = async () => {
    if (!selectedException) return;
    setResolvingId(selectedException.id);

    try {
      const response = await fetch('/api/attendance/exceptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exceptionId: selectedException.id,
          resolutionNotes,
        }),
      });

      if (response.ok) {
        toast.success('Anomaly exception marked as resolved');
        setSelectedException(null);
        setResolutionNotes('');
        fetchExceptions();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to resolve exception');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setResolvingId(null);
    }
  };

  const stats = useMemo(() => {
    const total = exceptions.length;
    const openCount = exceptions.filter(e => e.status !== 'resolved').length;
    const criticalCount = exceptions.filter(e => e.severity === 'critical' && e.status !== 'resolved').length;
    const resolvedCount = exceptions.filter(e => e.status === 'resolved').length;
    return { total, openCount, criticalCount, resolvedCount };
  }, [exceptions]);

  const filteredExceptions = useMemo(() => {
    return exceptions.filter(ex => {
      if (statusFilter === 'open' && ex.status === 'resolved') return false;
      if (statusFilter === 'resolved' && ex.status !== 'resolved') return false;
      if (severityFilter !== 'all' && ex.severity !== severityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (ex.employeeName || '').toLowerCase();
        const cat = (ex.category || '').toLowerCase();
        const details = (ex.telemetry || '').toLowerCase();
        const id = String(ex.employee_id || '');
        if (!name.includes(q) && !cat.includes(q) && !details.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [exceptions, statusFilter, severityFilter, searchQuery]);

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[10px] font-bold">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-900/50 text-[10px] font-bold">High</Badge>;
      default:
        return <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50 text-[10px] font-bold">Medium</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Anomalies</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-[#f87941] flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Critical Breaches</span>
              <p className="text-2xl font-black text-rose-600">{stats.criticalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Active Open</span>
              <p className="text-2xl font-black text-amber-600">{stats.openCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-white dark:bg-[#18191B] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Resolved</span>
              <p className="text-2xl font-black text-emerald-600">{stats.resolvedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                AI Anomaly & Policy Exceptions Panel
              </CardTitle>
              <CardDescription className="text-xs">
                Review automatically detected buddy punching alerts, GPS spoofing coordinates, and geofence/IP violations.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={fetchExceptions}
                disabled={loading}
                className="h-9 text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>
          </div>

          {/* Controls Bar */}
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
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'open'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
              >
                Open ({stats.openCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'resolved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                Resolved ({stats.resolvedCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search exception or staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#f87941]" />
            </div>
          ) : filteredExceptions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs font-semibold flex flex-col items-center justify-center gap-3 border border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <span>All clear! No attendance anomalies or policy violations detected in live database.</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl bg-white dark:bg-[#1E1F22] shadow-sm">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-3.5">Employee</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Exception Category</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Telemetry Details</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">AI Confidence</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Severity</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExceptions.map((ex) => (
                    <TableRow key={ex.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors border-b border-border">
                      <TableCell className="font-semibold text-slate-900 dark:text-white py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-[10px] font-black text-rose-500 border border-rose-200 dark:border-rose-800">
                            {(ex.employeeName || `E${ex.employee_id}`).charAt(0)}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900 dark:text-slate-100">{ex.employeeName || `Staff ID #${ex.employee_id}`}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold">{ex.department || ex.employees?.department || 'Operations'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white">{ex.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                          {ex.category || 'Biometric Outlier'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate font-medium text-slate-500 dark:text-slate-400" title={ex.telemetry}>
                        {ex.telemetry || 'Flagged by real-time presence audit daemon'}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 text-[10px]">
                          {ex.confidenceScore || 88}%
                        </Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(ex.severity)}</TableCell>
                      <TableCell>
                        {ex.status === 'resolved' ? (
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-[10px] font-bold">Resolved</Badge>
                        ) : (
                          <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 text-[10px] font-bold">Open</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {ex.status !== 'resolved' ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedException(ex)}
                            className="h-8 text-[11px] font-bold bg-[#f87941] hover:bg-[#e06634] text-white"
                          >
                            Resolve Alert
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Closed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={selectedException !== null} onOpenChange={() => setSelectedException(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Resolve AI Policy Exception
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm resolution remarks and supervisor sign-off for this anomaly record.
            </DialogDescription>
          </DialogHeader>

          {selectedException && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Exception Category</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedException.category}</p>
                <p className="text-[11px] text-slate-500 mt-1">{selectedException.telemetry}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-500">Resolution Explanation *</Label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Employee verified via security camera or manager verbal confirmation..."
                  rows={3}
                  className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs"
                  required
                />
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setSelectedException(null)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={resolvingId !== null}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs"
                >
                  {resolvingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Resolution'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
