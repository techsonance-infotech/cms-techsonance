import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Calendar, Award } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EmployeeOvertimeTabProps {
  employeeId: number | null;
}

export default function EmployeeOvertimeTab({ employeeId }: EmployeeOvertimeTabProps) {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '1.0',
    reason: ''
  });

  const fetchClaims = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance/overtime?employee_id=${employeeId}`);
      if (response.ok) {
        const data = await response.json();
        setClaims(data || []);
      }
    } catch (err) {
      toast.error('Failed to load overtime claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/attendance/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          date: form.date,
          hours: Number(form.hours),
          reason: form.reason
        }),
      });

      if (response.ok) {
        toast.success('Overtime claim submitted successfully!');
        setShowForm(false);
        setForm({
          date: new Date().toISOString().split('T')[0],
          hours: '1.0',
          reason: ''
        });
        fetchClaims();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to submit claim');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setSubmitting(false);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-[#f87941]" />
                My Overtime & Allowance Claims
              </CardTitle>
              <CardDescription className="text-xs">
                View auto-calculated check-out overtime logs or submit manual claims for manager authorization.
              </CardDescription>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs flex items-center gap-1.5 self-start sm:self-center">
                  <Plus className="h-4 w-4" /> File Overtime Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold flex items-center gap-1 text-slate-800 dark:text-white">
                    <Award className="h-5 w-5 text-[#f87941]" /> Submit Overtime Request
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    File a claim for extra hours worked during project deadlines or off-hours support.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Date of Claim</Label>
                      <Input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-500">Requested Hours</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.hours}
                        onChange={(e) => setForm({ ...form, hours: e.target.value })}
                        className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-500">Work Description / Justification</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Critical release support, client deployment..."
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 h-9 text-xs"
                      required
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-9 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9 text-xs">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Claim'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#f87941]" />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              No overtime claims logged for this payroll cycle.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-white dark:bg-[#1E1F22] shadow-sm">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-3">Date</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Requested Time</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Approved Time</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Justification Reason</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim.id} className="border-b border-border hover:bg-slate-50/40 dark:hover:bg-slate-850/10">
                      <TableCell className="font-bold py-3.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#f87941]" /> {claim.date}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700 dark:text-slate-300">
                        {(claim.calculated_overtime_minutes / 60).toFixed(2)} hrs
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-white">
                        {claim.approved_overtime_minutes !== null ? `${(claim.approved_overtime_minutes / 60).toFixed(2)} hrs` : 'Pending'}
                      </TableCell>
                      <TableCell className="max-w-xs font-semibold text-slate-500 truncate">
                        {claim.reason || 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
