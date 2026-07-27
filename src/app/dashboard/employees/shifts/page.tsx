'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Clock, Calendar, UserCheck, Plus, CheckCircle2, RefreshCw, ClipboardList, Timer, Building
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export default function ShiftManagementPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Shift Form
  const [shiftName, setShiftName] = useState('');
  const [shiftStart, setShiftStart] = useState('09:30');
  const [shiftEnd, setShiftEnd] = useState('18:30');
  const [shiftGrace, setShiftGrace] = useState('15');

  // Assignment Form
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();

      const shiftsRes = await fetch('/api/shifts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const shiftsData = await shiftsRes.json();
      setShifts(shiftsData);

      if (shiftsData.length > 0) {
        setSelectedShiftId(shiftsData[0].id);
      }

      const assignmentsRes = await fetch('/api/shifts/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assignmentsData = await assignmentsRes.json();
      setAssignments(assignmentsData);

      const employeesRes = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const employeesData = await employeesRes.json();
      setEmployees(employeesData.data || []);

      if (employeesData.data && employeesData.data.length > 0) {
        setSelectedEmpId(employeesData.data[0].id);
      }

      // Default start date is today
      setStartDate(new Date().toISOString().split('T')[0]);

    } catch {
      toast.error('Failed to load shift details');
    } finally {
      setLoading(false);
    }
  };

  const createShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName || !shiftStart || !shiftEnd) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: shiftName,
          startTime: `${shiftStart}:00`,
          endTime: `${shiftEnd}:00`,
          gracePeriodMinutes: Number(shiftGrace),
          halfDayHours: 4
        })
      });
      if (res.ok) {
        toast.success('Shift timetable created successfully');
        setShiftName('');
        setShiftGrace('15');
        fetchData();
      } else {
        toast.error('Failed to create shift schedule');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const assignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !selectedShiftId || !startDate) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/shifts/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          shiftId: selectedShiftId,
          startDate,
          isActive: true
        })
      });
      if (res.ok) {
        toast.success('Employee shift assignment set active');
        fetchData();
      } else {
        toast.error('Failed to assign shift');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#f87941] to-[#f87941]/70 bg-clip-text text-transparent">Shift Management</h1>
          <p className="text-muted-foreground">Define business shift hours, manage team rotations, and assign active office schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-3 py-1 text-sm border-none">
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Automatic Rostering
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timetables Builder */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#f87941]" />
                Create Shift Timing
              </CardTitle>
              <CardDescription>Setup standard shifts hours</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={createShift} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="sh-name">Shift Name</Label>
                  <Input
                    id="sh-name"
                    placeholder="e.g. Afternoon Engineering"
                    value={shiftName}
                    onChange={e => setShiftName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sh-start">Start Time</Label>
                    <Input
                      id="sh-start"
                      type="time"
                      value={shiftStart}
                      onChange={e => setShiftStart(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sh-end">End Time</Label>
                    <Input
                      id="sh-end"
                      type="time"
                      value={shiftEnd}
                      onChange={e => setShiftEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sh-grace">Grace Period (Minutes)</Label>
                  <Input
                    id="sh-grace"
                    type="number"
                    value={shiftGrace}
                    onChange={e => setShiftGrace(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#f87941]/90 text-white">
                  Add Timetable
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Assignments builder */}
          <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/30">
              <CardTitle className="text-lg">Shift Assignment</CardTitle>
              <CardDescription>Link employee to standard shifts</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={assignShift} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="as-emp">Select Employee</Label>
                  <select
                    id="as-emp"
                    className="w-full border rounded-md p-2 bg-transparent text-sm border-input"
                    value={selectedEmpId || ''}
                    onChange={e => setSelectedEmpId(Number(e.target.value))}
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="as-shift">Select Shift Schedule</Label>
                  <select
                    id="as-shift"
                    className="w-full border rounded-md p-2 bg-transparent text-sm border-input"
                    value={selectedShiftId || ''}
                    onChange={e => setSelectedShiftId(Number(e.target.value))}
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.start_time.substring(0,5)} - {s.end_time.substring(0,5)})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="as-date">Activation Date</Label>
                  <Input
                    id="as-date"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#f87941]/90 text-white">
                  Activate Roster
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Assignments Visual Lists */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#f87941]" />
                Shift Assignments List
              </CardTitle>
              <CardDescription>Track active shifts schedule rosters per employee</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {assignments.map((as) => (
                  <div
                    key={as.id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-semibold text-sm">Shift: {as.shifts?.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-slate-200">
                          Start Date: {as.start_date}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-slate-200">
                          {as.shifts?.start_time.substring(0,5)} - {as.shifts?.end_time.substring(0,5)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`capitalize font-semibold border-none ${
                          as.is_active
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-slate-500/10 text-slate-500'
                        }`}
                      >
                        {as.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <div className="text-center p-6 text-muted-foreground text-sm">
                    No active shift rosters assigned yet. Define shifts and roster employees above.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
