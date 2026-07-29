import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
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

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/exceptions');
      if (response.ok) {
        const data = await response.json();
        setExceptions(data || []);
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

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[9px] font-bold">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-900/50 text-[9px] font-bold">High</Badge>;
      default:
        return <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50 text-[9px] font-bold">Medium</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                AI Anomaly & Policy Exceptions Panel
              </CardTitle>
              <CardDescription className="text-xs">
                Review automatically detected buddy punching alerts, GPS spoofing coordinates, and geofence/IP violations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#f87941]" />
            </div>
          ) : exceptions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs font-semibold flex flex-col items-center justify-center gap-3">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <span>All clean! No attendance anomalies or policy violations detected.</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-white dark:bg-[#1E1F22] shadow-sm">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-3">Employee</TableHead>
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
                  {exceptions.map((ex) => (
                    <TableRow key={ex.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors border-b border-border">
                      <TableCell className="font-semibold text-slate-900 dark:text-white py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-rose-500 border border-slate-200 dark:border-slate-700">
                            E{ex.employee_id}
                          </div>
                          <div>
                            <span className="block font-bold">Staff ID #{ex.employee_id}</span>
                            <span className="block text-[9px] text-slate-400 font-semibold">Dept: {ex.employees?.department || 'N/A'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white">{ex.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] font-bold border-rose-200/50 text-rose-600 dark:text-rose-400 capitalize">
                          {ex.exception_type?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs font-semibold text-slate-500 text-left">
                        {ex.details}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-800 dark:text-slate-200">
                        {ex.ai_detected ? `${ex.ai_confidence}%` : 'Heuristic'}
                      </TableCell>
                      <TableCell>{getSeverityBadge(ex.severity)}</TableCell>
                      <TableCell>
                        {ex.resolved ? (
                          <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 text-[9px] font-bold">Resolved</Badge>
                        ) : (
                          <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[9px] font-bold flex items-center w-fit gap-0.5"><AlertTriangle className="h-3 w-3" /> Unresolved</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {!ex.resolved ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedException(ex)}
                            className="h-8 text-[10px] font-bold bg-[#f87941] hover:bg-[#e06634] text-white"
                          >
                            Resolve Alert
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold" title={ex.resolution_notes}>
                            Closed
                          </span>
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

      {/* Resolve Exception Dialog */}
      <Dialog open={selectedException !== null} onOpenChange={() => setSelectedException(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-white">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Resolve Attendance Alert
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide resolution comments explaining why this exception is cleared (e.g., employee confirmed working from location).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 pt-2">
            <Label className="text-slate-500">Resolution Notes *</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Employee was working offsite. Validated with client email confirmation..."
              rows={3}
              className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs"
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedException(null)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs"
              onClick={handleResolve}
              disabled={resolvingId !== null}
            >
              {resolvingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
