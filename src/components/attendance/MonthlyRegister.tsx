import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, Lock, Unlock, Loader2, Calendar, LayoutGrid, CheckCircle, RefreshCw } from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

interface MonthlyRegisterProps {
  tenantId: string;
  isFullAccess: boolean;
  employees: any[];
  refreshTrigger?: number;
}

export default function MonthlyRegister({ tenantId, isFullAccess, employees, refreshTrigger }: MonthlyRegisterProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [locks, setLocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [2025, 2026, 2027];

  const isCurrentMonthLocked = locks.some(
    (l) => l.year === selectedYear && l.month === selectedMonth && l.locked
  );

  const fetchLocks = async () => {
    try {
      const token = getStoredSessionToken() || localStorage.getItem('session_token');
      const response = await fetch('/api/attendance/lock', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setLocks(data);
      }
    } catch (err) {
      console.error('Failed to load locks:', err);
    }
  };

  const fetchMonthlyAttendance = async () => {
    setLoading(true);
    try {
      const token = getStoredSessionToken() || localStorage.getItem('session_token');
      const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`;
      
      let url = `/api/attendance?start_date=${start}&end_date=${end}&limit=1000`;
      if (selectedEmployee !== 'all') {
        url += `&employee_id=${selectedEmployee}`;
      }

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const result = await response.json();
        const records = Array.isArray(result) ? result : (result.data || []);
        setAttendanceData(records);
      }
    } catch (err) {
      toast.error('Failed to fetch monthly attendance register');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocks();
  }, []);

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [selectedMonth, selectedYear, selectedEmployee, refreshTrigger]);

  const handleToggleLock = async () => {
    setTogglingLock(true);
    try {
      const token = getStoredSessionToken() || localStorage.getItem('session_token');
      const response = await fetch('/api/attendance/lock', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          locked: !isCurrentMonthLocked,
        }),
      });

      if (response.ok) {
        toast.success(
          isCurrentMonthLocked
            ? 'Payroll month unlocked successfully'
            : 'Payroll month locked. Attendance entries frozen.'
        );
        fetchLocks();
      } else {
        toast.error('Failed to update lock state');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setTogglingLock(false);
    }
  };

  const handleExportCSV = () => {
    if (attendanceData.length === 0) {
      toast.error('No attendance data available to export');
      return;
    }

    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Time In', 'Time Out', 'Duration (mins)', 'Status', 'Method', 'Location'];
    const rows = attendanceData.map((a) => [
      a.employee?.employeeId || a.employeeId,
      a.employee?.firstName ? `${a.employee.firstName} ${a.employee.lastName}` : 'N/A',
      a.employee?.department || 'N/A',
      a.date,
      a.timeIn || '',
      a.timeOut || '',
      a.duration || '',
      a.status,
      a.checkInMethod || '',
      a.location || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Attendance_Register_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Register exported to CSV');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'present': return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'late': return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'half_day': return 'bg-orange-400 hover:bg-orange-500 text-white';
      case 'absent': return 'bg-rose-500 hover:bg-rose-600 text-white';
      case 'leave': return 'bg-sky-500 hover:bg-sky-600 text-white';
      case 'holiday': return 'bg-violet-500 hover:bg-violet-600 text-white';
      case 'weekly_off': return 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200';
      case 'wfh': return 'bg-indigo-500 hover:bg-indigo-600 text-white';
      case 'missing_punch': return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'unrecorded': return 'bg-slate-100 dark:bg-[#2B2D31] text-slate-400';
      default: return 'bg-slate-100 dark:bg-[#2B2D31] text-slate-400';
    }
  };

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#f87941]" />
                Monthly Roster Grid & Payroll Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Visualize multi-tenant monthly shifts, monitor policy infractions, and freeze calendar periods.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMonthlyAttendance}
                disabled={loading}
                className="h-9 text-xs font-semibold flex items-center gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#2B2D31]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-9 text-xs font-semibold flex items-center gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#2B2D31]"
              >
                <Download className="h-3.5 w-3.5" /> Export Ledger
              </Button>
              {isFullAccess && (
                <Button
                  variant={isCurrentMonthLocked ? 'destructive' : 'default'}
                  size="sm"
                  disabled={togglingLock}
                  onClick={handleToggleLock}
                  className={`h-9 text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    !isCurrentMonthLocked && 'bg-[#f87941] hover:bg-[#e06634] text-white'
                  }`}
                >
                  {togglingLock ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isCurrentMonthLocked ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" /> Unlock Period
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Freeze Period
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-slate-50/50 dark:bg-[#18191B]/50 border border-slate-100 dark:border-slate-900">
            <div className="w-48 space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Period Month</label>
              <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 focus:ring-[#f87941]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-36 space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Period Year</label>
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 focus:ring-[#f87941]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-56 space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Employee Directory</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 focus:ring-[#f87941]">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Staff Members</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)} className="text-xs">
                      {e.firstName || ''} {e.lastName || ''} ({e.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#f87941]" />
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-white dark:bg-[#1E1F22] shadow-sm">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-[#18191B] border-b border-border">
                    <TableHead className="w-52 font-bold text-slate-700 dark:text-slate-300 py-3">Employee</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Department</TableHead>
                    <TableHead className="font-bold text-center text-slate-700 dark:text-slate-300 w-44">Monthly Metrics</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Daily Matrix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees
                    .filter((emp) => selectedEmployee === 'all' || String(emp.id) === selectedEmployee)
                    .map((emp) => {
                      const empRecords = attendanceData.filter((r) => 
                        Number(r.employeeId) === Number(emp.id) ||
                        (r.employee?.employeeId && String(r.employee.employeeId).trim() === String(emp.employeeId).trim())
                      );
                      
                      const stats = {
                        present: empRecords.filter(r => r.status === 'present').length,
                        late: empRecords.filter(r => r.status === 'late').length,
                        halfDay: empRecords.filter(r => r.status === 'half_day').length,
                        absent: empRecords.filter(r => r.status === 'absent').length,
                        wfh: empRecords.filter(r => r.status === 'wfh').length,
                        leave: empRecords.filter(r => r.status === 'leave').length,
                      };

                      const initialFirst = emp.firstName ? emp.firstName[0] : 'E';
                      const initialLast = emp.lastName ? emp.lastName[0] : '';

                      return (
                        <TableRow key={emp.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors border-b border-border">
                          <TableCell className="font-semibold text-slate-900 dark:text-white py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-bold text-[#f87941] border border-slate-200 dark:border-slate-700">
                                {initialFirst}{initialLast}
                              </div>
                              <div>
                                <span className="block font-bold">{emp.firstName || ''} {emp.lastName || ''}</span>
                                <span className="block text-[10px] text-slate-400 font-medium">{emp.employeeId}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 dark:text-slate-400 font-semibold">
                            {emp.department || 'General'}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-wrap gap-1 items-center justify-center">
                              <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 text-[9px] px-1.5 py-0.5 font-bold">P:{stats.present}</Badge>
                              <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50 text-[9px] px-1.5 py-0.5 font-bold">L:{stats.late}</Badge>
                              <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 text-[9px] px-1.5 py-0.5 font-bold">A:{stats.absent}</Badge>
                              <Badge className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-900/50 text-[9px] px-1.5 py-0.5 font-bold">H:{stats.halfDay}</Badge>
                              <Badge className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-900/50 text-[9px] px-1.5 py-0.5 font-bold">LV:{stats.leave}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-[860px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                              {daysArray.map((day) => {
                                const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const record = empRecords.find((r) => {
                                  const rDate = r.date ? (r.date.includes('T') ? r.date.split('T')[0] : r.date) : '';
                                  return rDate === dateStr;
                                });

                                const now = new Date();
                                const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === (now.getMonth() + 1);
                                const isFuture = isCurrentMonth && day > now.getDate();
                                const isToday = isCurrentMonth && day === now.getDate();
                                const dayDate = new Date(selectedYear, selectedMonth - 1, day);
                                const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                                
                                let status = 'unrecorded';
                                if (record) {
                                  status = record.status;
                                } else if (isWeekend) {
                                  status = 'weekly_off';
                                } else if (!isFuture) {
                                  status = 'absent';
                                }
                                
                                return (
                                  <div
                                    key={day}
                                    title={`Date: ${dateStr}\nStatus: ${status}${isToday ? ' (Today)' : ''}`}
                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm transition-all hover:scale-110 cursor-help border border-transparent hover:border-slate-400 dark:hover:border-slate-500 ${isToday ? 'ring-2 ring-[#f87941] ring-offset-1 dark:ring-offset-slate-900' : ''} ${getStatusColor(status)}`}
                                  >
                                    {day}
                                  </div>
                                );
                              })}
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
    </div>
  );
}

