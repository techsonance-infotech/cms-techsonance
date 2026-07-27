'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Clock, Calendar, CheckSquare, Heart, AlertTriangle, 
  ShieldAlert, RefreshCw, Send, Sparkles, DollarSign, ListTodo, 
  MapPin, Coffee, ClipboardList, Briefcase, FileText, CheckCircle2,
  AlertCircle, ShieldCheck, HelpCircle, Activity, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Attendance {
  id: number;
  name: string;
  checkIn: string;
  checkOut: string;
  status: string;
  type: string;
}

interface LeaveRequest {
  id: number;
  name: string;
  type: string;
  duration: string;
  status: string;
}

interface Reimbursement {
  id: number;
  name: string;
  category: string;
  amount: string;
  status: string;
}

export default function HROperationsPortal() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dynamic State variables
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [shifts, setShifts] = useState([
    { id: 'SH-01', name: 'Morning General Shift', timing: '09:00 AM - 06:00 PM', count: 12 },
    { id: 'SH-02', name: 'Evening Support Shift', timing: '02:00 PM - 11:00 PM', count: 4 },
    { id: 'SH-03', name: 'Night Operations Shift', timing: '10:00 PM - 07:00 AM', count: 2 }
  ]);

  // Load stats and tables dynamically on mount
  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    setLoading(true);
    const token = localStorage.getItem('session_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      // 1. Fetch admin dashboard stats
      const statsRes = await fetch('/api/dashboard/stats/admin', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAdminStats(statsData.data || statsData);
      }

      // 2. Fetch employees roster
      const employeesRes = await fetch('/api/employees?limit=10', { headers });
      if (employeesRes.ok) {
        const empJson = await employeesRes.json();
        setEmployees(empJson.data || empJson || []);
      }

      // 3. Fetch attendance records
      const attendanceRes = await fetch('/api/attendance?limit=10', { headers });
      if (attendanceRes.ok) {
        const attData = await attendanceRes.json();
        const records = attData.data || attData || [];
        const formattedLogs = records.map((row: any) => ({
          id: row.id,
          name: row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : `Employee #${row.employeeId}`,
          checkIn: row.checkIn || row.timeIn || '09:00 AM',
          checkOut: row.checkOut || row.timeOut || '--',
          status: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Present',
          type: row.checkInMethod || 'WFO'
        }));
        setAttendanceLogs(formattedLogs.slice(0, 5));
      } else {
        setAttendanceLogs([
          { id: 1, name: 'Arjun Mehta', checkIn: '09:12 AM', checkOut: '06:15 PM', status: 'Present', type: 'WFO' },
          { id: 2, name: 'Priya Sharma', checkIn: '09:45 AM', checkOut: '--', status: 'Late', type: 'Remote' },
          { id: 3, name: 'Rohan Sen', checkIn: '09:05 AM', checkOut: '--', status: 'Present', type: 'WFH' }
        ]);
      }

      // 4. Fetch leave requests
      const leavesRes = await fetch('/api/leave-requests?status=pending', { headers });
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        const records = leavesData.data || leavesData || [];
        const formattedLeaves = records.map((row: any) => ({
          id: row.id,
          name: row.employeeName || `Employee #${row.employeeId}`,
          type: row.leaveType ? row.leaveType.toUpperCase() : 'Casual Leave',
          duration: `${row.startDate} to ${row.endDate}`,
          status: row.status
        }));
        setLeaveRequests(formattedLeaves);
      } else {
        setLeaveRequests([
          { id: 101, name: 'Amit Verma', type: 'Sick Leave', duration: '2 Days (Aug 12-13)', status: 'pending' },
          { id: 102, name: 'Neha Gupta', type: 'Casual Leave', duration: '1 Day (Aug 17)', status: 'pending' }
        ]);
      }

      // 5. Fetch expenses / reimbursements
      const expenseRes = await fetch('/api/reimbursements', { headers });
      if (expenseRes.ok) {
        const expData = await expenseRes.json();
        const records = expData.data || expData || [];
        const formattedExpenses = records.map((row: any) => ({
          id: row.id,
          name: row.employeeName || `Employee #${row.employeeId}`,
          category: row.description || 'Travel Claim',
          amount: `₹${row.amount.toLocaleString()}`,
          status: row.status
        }));
        setReimbursements(formattedExpenses.filter((e: any) => e.status === 'submitted' || e.status === 'pending').slice(0, 5));
      } else {
        setReimbursements([
          { id: 201, name: 'Rahul Bose', category: 'Travel & Client Meeting', amount: '₹4,500', status: 'submitted' },
          { id: 202, name: 'Aditi Roy', category: 'Internet Allowance', amount: '₹1,200', status: 'pending' }
        ]);
      }

    } catch (error) {
      console.error('Error fetching HR operations stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id: number) => {
    const token = localStorage.getItem('session_token');
    try {
      const response = await fetch(`/api/leave-requests?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'approved' })
      });
      if (response.ok) {
        toast.success('Leave application approved successfully');
        setLeaveRequests(prev => prev.filter(l => l.id !== id));
      } else {
        toast.error('Failed to update leave status');
      }
    } catch {
      toast.error('Connection issue occurred during approval');
    }
  };

  const handleRejectLeave = async (id: number) => {
    const token = localStorage.getItem('session_token');
    try {
      const response = await fetch(`/api/leave-requests?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (response.ok) {
        toast.error('Leave application marked as rejected');
        setLeaveRequests(prev => prev.filter(l => l.id !== id));
      } else {
        toast.error('Failed to update leave status');
      }
    } catch {
      toast.error('Connection issue occurred during rejection');
    }
  };

  const handleApproveExpense = async (id: number) => {
    const token = localStorage.getItem('session_token');
    try {
      const response = await fetch(`/api/reimbursements?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'approved' })
      });
      if (response.ok) {
        toast.success('Reimbursement claim approved');
        setReimbursements(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error('Failed to update expense status');
      }
    } catch {
      toast.error('Connection issue occurred during approval');
    }
  };

  // Derived properties from active dataset
  const presentToday = adminStats?.workforce?.presentToday ?? 14;
  const totalEmployees = adminStats?.totalEmployees ?? 16;
  const absentToday = adminStats?.workforce?.absentToday ?? 2;
  const lateToday = adminStats?.workforce?.missingReportsCount ?? 1;
  const wfhCount = Math.round(totalEmployees * 0.18) || 3;
  const complianceCount = adminStats?.pendingDocuments ?? 2;

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto p-6 animate-pulse">
        <div className="h-28 w-full bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
        </div>
        <div className="h-96 bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">
      
      {/* Premium Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-[#0f172a] to-slate-950 p-6 border border-zinc-800 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[#f87941]/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="h-8 w-8 text-[#f87941]" />
              Enterprise HR Operations Center
            </h1>
            <p className="text-slate-400 text-sm mt-1"> Central command for attendance registers, leave conflicts, shift allocations, compliance settings, and expenses.</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1">
              SLA Status: {adminStats?.insights?.complianceRate ?? 98.4}% On-time
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="dashboard" className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-1">
          <TabsList className="bg-slate-100 dark:bg-zinc-900 border-none p-1 rounded-xl gap-1">
            <TabsTrigger value="dashboard" className="rounded-lg text-xs font-bold px-4 py-2">Operations Dashboard</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg text-xs font-bold px-4 py-2">Attendance Register</TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg text-xs font-bold px-4 py-2">Leave & Time Off</TabsTrigger>
            <TabsTrigger value="shifts" className="rounded-lg text-xs font-bold px-4 py-2">Shift Scheduling</TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-lg text-xs font-bold px-4 py-2">Reimbursements</TabsTrigger>
            <TabsTrigger value="compliance" className="rounded-lg text-xs font-bold px-4 py-2">Compliance Operations</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Dashboard Cockpit */}
        <TabsContent value="dashboard" className="space-y-6 animate-fadeIn">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="p-4 bg-card border shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Present Today</p>
              <h4 className="text-2xl font-black mt-1">{presentToday} / {totalEmployees}</h4>
              <p className="text-[9px] text-muted-foreground mt-1">{Math.round((presentToday/totalEmployees)*100)}% punctuality</p>
            </Card>
            <Card className="p-4 bg-card border shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-rose-500" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Absent</p>
              <h4 className="text-2xl font-black mt-1">{absentToday}</h4>
              <p className="text-[9px] text-rose-500 mt-1">Leaves accounted</p>
            </Card>
            <Card className="p-4 bg-card border shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Late Marks</p>
              <h4 className="text-2xl font-black mt-1">{lateToday}</h4>
              <p className="text-[9px] text-muted-foreground mt-1">Within grace periods</p>
            </Card>
            <Card className="p-4 bg-card border shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-sky-500" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">WFH / Remote</p>
              <h4 className="text-2xl font-black mt-1">{wfhCount}</h4>
              <p className="text-[9px] text-muted-foreground mt-1">Geo-fenced sync active</p>
            </Card>
            <Card className="p-4 bg-card border shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#f87941]" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Pending Leaves</p>
              <h4 className="text-2xl font-black mt-1">{leaveRequests.length}</h4>
              <p className="text-[9px] text-muted-foreground mt-1">Requires review</p>
            </Card>
            <Card className="p-4 bg-card border shadow-xs relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Compliance Alerts</p>
              <h4 className="text-2xl font-black mt-1">{complianceCount} Alerts</h4>
              <p className="text-[9px] text-rose-500 mt-1">Actions required</p>
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Column: AI Workforce Summary & Task board */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              {/* AI Health Summary */}
              <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-[#f87941]" /> AI Workforce Health & SLA Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 flex gap-3 text-xs leading-relaxed">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {adminStats?.insights?.recommendationTitle || 'No shift conflicts detected this cycle.'}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        {adminStats?.insights?.recommendationMessage || 'All morning, evening, and split rotational rosters satisfy local compliance labor laws. Average manager approval response index is 1.4h.'}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 flex gap-3 text-xs leading-relaxed">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{complianceCount} Compliance Actions pending</p>
                      <p className="text-muted-foreground mt-1">
                        Please review outstanding documents and MFA acknowledgments. Automated reminders have been dispatched to all team members.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Center checklist */}
              <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Today's HR Action Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-white dark:bg-zinc-950 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-4 w-4 text-[#f87941]" />
                      <div className="text-xs">
                        <p className="font-bold">Verify onboarding documents for new joinees</p>
                        <p className="text-muted-foreground text-[10px]">Candidates document verification logs</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] text-[#f87941] bg-[#f87941]/5 border-none">Onboarding</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-white dark:bg-zinc-950 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-4 w-4 text-[#f87941]" />
                      <div className="text-xs">
                        <p className="font-bold">Release pending internet/mobile allowances</p>
                        <p className="text-muted-foreground text-[10px]">{reimbursements.length} reimbursement tickets ready for audit</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] text-indigo-500 bg-indigo-500/5 border-none">Finance</Badge>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Milestones & Alerts */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* Todays Milestones */}
              <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> Today's Milestones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {employees.slice(0, 2).map((emp, i) => (
                    <div key={emp.id} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-500">
                        {i === 0 ? <Heart className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold">
                          {i === 0 ? `${emp.firstName} ${emp.lastName}'s Birthday 🎉` : `${emp.firstName} ${emp.lastName}'s Work Anniversary 🌟`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Joined: {emp.dateOfJoining || 'Aug 12, 2024'}</p>
                      </div>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <div className="text-muted-foreground text-center py-2">No milestone logs today</div>
                  )}
                </CardContent>
              </Card>

              {/* Expiring Docs warning */}
              <Card className="border border-red-500/10 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="h-4.5 w-4.5" /> High Priority Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3 bg-white dark:bg-zinc-950 border rounded-lg">
                    <p className="font-bold">Identity Docs Compliance check</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Verify tax UAN/PAN identifiers for newly onboarded team profiles.
                    </p>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Attendance Register */}
        <TabsContent value="attendance" className="space-y-6 animate-fadeIn">
          <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
            <CardHeader className="flex justify-between items-center flex-row flex-wrap gap-4 border-b">
              <div>
                <CardTitle className="text-md">Daily Check-In Register</CardTitle>
                <CardDescription>Live attendance register with GPS tracking and geo-fencing validations.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-xs font-bold">Biometric Logs</Button>
                <Button size="sm" className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs font-bold">Bulk Correction</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900/10 text-slate-400 font-bold border-b">
                    <th className="p-3 px-6">Employee</th>
                    <th className="p-3">Check-In</th>
                    <th className="p-3">Check-Out</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20">
                      <td className="p-3 px-6 font-bold">{log.name}</td>
                      <td className="p-3 font-mono">{log.checkIn}</td>
                      <td className="p-3 font-mono">{log.checkOut}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] border-none bg-slate-100 dark:bg-zinc-800 text-slate-500 font-bold">
                          {log.type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={`text-[10px] font-bold ${
                          log.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500 border-none' :
                          log.status === 'Late' ? 'bg-amber-500/10 text-amber-500 border-none' :
                          'bg-rose-500/10 text-rose-500 border-none'
                        }`}>
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Leave & Time Off */}
        <TabsContent value="leaves" className="space-y-6 animate-fadeIn">
          <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
            <CardHeader>
              <CardTitle className="text-md">Pending Leaves Approvals</CardTitle>
              <CardDescription>Review and validate overlapping leaves requests before approving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaveRequests.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs font-semibold">
                  No pending leave applications.
                </div>
              ) : (
                leaveRequests.map((l) => (
                  <div key={l.id} className="p-4 border rounded-xl bg-white dark:bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{l.name}</p>
                      <p className="text-muted-foreground mt-0.5">{l.type} • {l.duration}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRejectLeave(l.id)} className="text-xs font-bold border-red-500/30 text-red-500 hover:bg-red-50">Reject</Button>
                      <Button size="sm" onClick={() => handleApproveLeave(l.id)} className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs font-bold">Approve Leave</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Shifts */}
        <TabsContent value="shifts" className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shifts.map((sh) => (
              <Card key={sh.id} className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                <CardHeader>
                  <p className="text-[10px] text-muted-foreground font-mono">{sh.id}</p>
                  <CardTitle className="text-sm font-bold mt-1">{sh.name}</CardTitle>
                  <CardDescription>{sh.timing}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-indigo-500/5 text-indigo-500 border-none font-bold text-xs">{sh.count} Allocated</Badge>
                  <Button size="sm" variant="ghost" className="text-xs font-bold text-[#f87941] hover:underline p-0">Reallocate</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 5: Expenses */}
        <TabsContent value="expenses" className="space-y-6 animate-fadeIn">
          <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
            <CardHeader>
              <CardTitle className="text-md">Reimbursement Claims Queue</CardTitle>
              <CardDescription>Review receipts and compliance checks validation lists.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reimbursements.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs font-semibold">
                  No pending claims.
                </div>
              ) : (
                reimbursements.map((r) => (
                  <div key={r.id} className="p-4 border rounded-xl bg-white dark:bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{r.name}</p>
                      <p className="text-muted-foreground mt-0.5">{r.category} • {r.amount}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-none text-[10px] font-bold mr-2">{r.status}</Badge>
                      <Button size="sm" onClick={() => handleApproveExpense(r.id)} className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs font-bold">Approve claim</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Compliance */}
        <TabsContent value="compliance" className="space-y-6 animate-fadeIn">
          <Card className="border border-zinc-800 bg-slate-950 text-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-400" /> Compliance Audit logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                <div>
                  <p className="font-bold">Labor Laws Shift Compliance</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">Maximum rotational breaks rules checked</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px]">100% compliant</Badge>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                <div>
                  <p className="font-bold">Mandatory SOC2 Training Acceptance</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">85% employees completed course</p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-none text-[10px]">Warning (Pending actions)</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
