'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Calendar, CalendarDays, Flag, Plus, Eye, ChevronLeft, ChevronRight, Check, X, Trash2, RefreshCcw, ChevronsUpDown, Eraser, MessageSquareQuote, CheckCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { LeaveRequestDialog } from '@/components/dashboard/LeaveRequestDialog';
import { HolidayDialog } from '@/components/dashboard/HolidayDialog';
import { hasPermission } from '@/lib/permissions';
import { PageHeaderSkeleton, MetricCardGridSkeleton, TabsSkeleton } from '@/components/ui/dashboard-skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

interface LeaveRequest {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
  employeeId: number;
}

interface CompanyHoliday {
  id: number;
  date: string;
  reason: string;
  year: number;
}

interface AuthUser {
  id: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

interface EmployeeData {
  id: number;
  userId?: number | null;
  employeeId?: string | null;
  department?: string | null;
  designation?: string | null;
  dateOfJoining?: string | null;
  status?: string | null;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

const formatDisplayDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateOrdinal = (value: string | null | undefined) => {
  if (!value) return '-';
  const date = new Date(value);
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${formatted.replace(String(day), `${day}${suffix}`)}`;
};

const getLeaveStatusBadge = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'approved') return <Badge className="bg-emerald-100 text-emerald-700">Approved</Badge>;
  if (normalized === 'rejected') return <Badge className="bg-rose-100 text-rose-700">Rejected</Badge>;
  if (normalized === 'pending') return <Badge className="bg-sky-100 text-sky-700">Pending</Badge>;
  return <Badge className="bg-secondary text-secondary-foreground">{status}</Badge>;
};

const years = [new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() - 1];
const PAGE_SIZE = 20;

export default function LeavesPage() {
  const [activeTab, setActiveTab] = useState('leave');
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());
  const [showDialog, setShowDialog] = useState(false);
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Admin states
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [leavePage, setLeavePage] = useState(0);
  const [personalLeavePage, setPersonalLeavePage] = useState(0);
  const [holidayPage, setHolidayPage] = useState(0);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [adminLeaveStatusFilter, setAdminLeaveStatusFilter] = useState('all');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [approvingLeave, setApprovingLeave] = useState<LeaveRequest | null>(null);
  const [rejectingLeave, setRejectingLeave] = useState<LeaveRequest | null>(null);
  const [deletingLeave, setDeletingLeave] = useState<LeaveRequest | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<CompanyHoliday | null>(null);
  
  const stats = useMemo(() => {
    const pending = allLeaveRequests.filter(l => l.status === 'pending').length;
    const approvedMonth = allLeaveRequests.filter(l => {
      const date = new Date(l.startDate);
      const now = new Date();
      return l.status === 'approved' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const onLeaveToday = allLeaveRequests.filter(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const now = new Date();
      now.setHours(0,0,0,0);
      return l.status === 'approved' && now >= start && now <= end;
    }).length;
    
    return { pending, approvedMonth, onLeaveToday };
  }, [allLeaveRequests]);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch employee profile when user is loaded
  useEffect(() => {
    if (user) {
      fetchEmployeeData();
      if (isFullAccessUser) {
        fetchAllLeaveRequests();
        fetchAdminMappingData(); // Unified admin fetcher
      }
    }
  }, [user]);

  // Fetch filters/tabs specific data only when ready
  useEffect(() => {
    if (!user) return;
    
    // STRICT GUARD: We must wait for employeeData to be loaded before fetching leaves
    // to ensure the 'My Leaves' section is correctly scoped to the current user's ID
    // and to prevent a double-fetch (one without ID, one with ID).
    if (!employeeData?.id) return;

    fetchLeaveRequests();
    fetchCompanyHolidays();
  }, [employeeData?.id, statusFilter, holidayYear]);

  const isFullAccessUser = user && (
    ['admin', 'cms_administrator', 'hr_manager', 'project_manager', 'management', 'ceo', 'cto', 'super_admin'].includes(user.role.toLowerCase()) ||
    (employeeData?.designation && /admin|hr|manager|director|ceo|cto/i.test(employeeData.designation))
  );
  const canApproveLeaves = user && (
    hasPermission(user.role, 'myAccount', 'canApprove') || 
    ['admin', 'hr_manager', 'project_manager'].includes(user.role.toLowerCase())
  );
  const canDeleteRecords = user && (
    hasPermission(user.role, 'myAccount', 'canDelete') || 
    ['admin', 'hr_manager'].includes(user.role.toLowerCase())
  );

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('session_token');
    if (!token) return;

    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      toast.error('Unable to load user profile');
      return;
    }

    const data = await response.json();
    setUser(data?.user ?? data?.data ?? null);
  };

  const fetchEmployeeData = async () => {
    const token = localStorage.getItem('session_token');
    if (!token || !user) return;

    const response = await fetch(`/api/employees?userId=${user.id}&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      toast.error('Unable to load employee profile');
      return;
    }

    const json = await response.json();
    const emps = Array.isArray(json) ? json : json?.data ?? [];
    const currentEmployee = emps[0];

    if (currentEmployee) {
      setEmployeeData({
        id: currentEmployee.id,
        userId: currentEmployee.userId ?? null,
        employeeId: currentEmployee.employeeId ?? null,
        department: currentEmployee.department ?? null,
        designation: currentEmployee.designation ?? null,
        dateOfJoining: currentEmployee.dateOfJoining ?? null,
        status: currentEmployee.status ?? null,
        gender: currentEmployee.gender ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        avatarUrl: user.avatarUrl ?? null,
      });
    }
  };

  const fetchAdminMappingData = async () => {
    const token = localStorage.getItem('session_token');
    if (!token || !user) return;

    try {
      const [empRes, usrRes] = await Promise.all([
        fetch('/api/employees?limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users?limit=1000', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (empRes.ok) {
        const empJson = await empRes.json();
        setEmployees(Array.isArray(empJson) ? empJson : empJson?.data ?? []);
      }
      if (usrRes.ok) {
        const usrJson = await usrRes.json();
        setUsers(Array.isArray(usrJson) ? usrJson : usrJson?.data ?? []);
      }
    } catch (e) {
      console.error('Failed to fetch admin mapping data', e);
    }
  };

  const fetchAllLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/leave-requests?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const json = await response.json();
        setAllLeaveRequests(Array.isArray(json) ? json : json?.data ?? []);
      }
    } catch {}
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      if (!token) return;

      let url = '/api/leave-requests?limit=100';
      if (employeeData?.id) {
        url += `&employeeId=${employeeData.id}`;
      } else {
        // If we don't have an employeeId, we shouldn't attempt a personal fetch
        // because it might return 'all records' for an admin caller.
        setLeaveRequests([]);
        setLoading(false);
        return;
      }
      if (statusFilter !== 'all') {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        toast.error('Failed to load leave requests');
        return;
      }

      const json = await response.json();
      const leaveList = Array.isArray(json) ? json : json?.data ?? [];
      setLeaveRequests(leaveList);
    } catch (error) {
      console.error(error);
      toast.error('Unable to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyHolidays = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) return;

      const response = await fetch(`/api/company-holidays?year=${holidayYear}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        toast.error('Failed to load company holidays');
        return;
      }

      const json = await response.json();
      const holidayList = Array.isArray(json) ? json : json?.data ?? [];
      setHolidays(holidayList);
    } catch (error) {
      console.error(error);
      toast.error('Unable to fetch company holidays');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchLeaveRequests(), fetchCompanyHolidays(), isFullAccessUser && fetchAllLeaveRequests()]);
      toast.success('Leave and holiday data refreshed');
    } catch {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const updateLeaveStatus = async (id: number, status: string, isApproval: boolean, comment?: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/leave-requests?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, adminComment: comment })
      });

      if (!res.ok) throw new Error('Update failed');
      toast.success(`Leave request ${isApproval ? 'approved' : 'rejected'}`);
      fetchAllLeaveRequests();
      setApprovingLeave(null);
      setRejectingLeave(null);
      setAdminComment("");
    } catch {
      toast.error('Failed to update leave request');
    }
  };

  const handleLeaveDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/leave-requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Deletion failed');
      toast.success('Leave request deleted');
      fetchAllLeaveRequests();
      setDeletingLeave(null);
    } catch {
      toast.error('Failed to delete leave request');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/company-holidays?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Delete failed');
      toast.success('Holiday deleted successfully');
      fetchCompanyHolidays();
      setDeletingHoliday(null);
    } catch {
      toast.error('Failed to delete holiday');
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return 'Unknown';
    const usr = users.find(u => Number(u.id) === emp.userId || u.id === String(emp.userId));
    return usr ? `${usr.firstName} ${usr.lastName}` : 'Unknown';
  };

  const leaveCount = useMemo(() => leaveRequests.length, [leaveRequests]);

  const filteredAllLeaveRequests = allLeaveRequests.filter((leave) => {
    if (selectedEmployeeFilter !== 'all' && leave.employeeId !== Number(selectedEmployeeFilter)) return false;
    if (adminLeaveStatusFilter !== 'all' && leave.status !== adminLeaveStatusFilter) return false;
    if (leaveStartDate && new Date(leave.startDate) < new Date(leaveStartDate)) return false;
    if (leaveEndDate && new Date(leave.endDate) > new Date(leaveEndDate)) return false;
    return true;
  });

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <MetricCardGridSkeleton count={4} />
        <div className="mt-8">
          <TabsSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Leaves & Holidays</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage time-off requests and view company calendar</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowDialog(true)}
            className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" /> Apply Leave
          </Button>
        </div>
      </div>

      {isFullAccessUser && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-900 border-blue-100 dark:border-blue-900/20 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <CalendarDays className="h-12 w-12 text-blue-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pending}</div>
              <p className="text-xs text-slate-500 mt-1">Leaves awaiting review</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-slate-900 border-emerald-100 dark:border-emerald-900/20 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Approved this Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.approvedMonth}</div>
              <p className="text-xs text-slate-500 mt-1">Total approvals in {format(new Date(), 'MMMM')}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/10 dark:to-slate-900 border-indigo-100 dark:border-indigo-900/20 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <User className="h-12 w-12 text-indigo-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">On Leave Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.onLeaveToday}</div>
              <p className="text-xs text-slate-500 mt-1">Team members currently out</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardContent className="grid gap-4 lg:grid-cols-[1.75fr_1fr] p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Employee</p>
            <p className="text-2xl font-semibold">{user ? `${user.firstName} ${user.lastName}` : 'Employee details'}</p>
            <p className="text-sm text-muted-foreground">
              {employeeData?.designation ? `${employeeData.designation} • ${employeeData.department ?? 'No department'}` : 'Employee record not available yet.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Employee ID</p>
              <p className="mt-2 text-base font-semibold">{employeeData?.employeeId ?? 'N/A'}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Joined</p>
              <p className="mt-2 text-base font-semibold">{formatDisplayDate(employeeData?.dateOfJoining)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="rounded-full bg-muted/50 p-1">
          {isFullAccessUser && (
            <TabsTrigger value="all-leaves" className="rounded-full px-4 py-2">
              All Leaves
            </TabsTrigger>
          )}
          <TabsTrigger value="leave" className="rounded-full px-4 py-2">
            My Leaves
          </TabsTrigger>
          <TabsTrigger value="holidays" className="rounded-full px-4 py-2">
            Company Holidays
          </TabsTrigger>
        </TabsList>

        {isFullAccessUser && (
          <TabsContent value="all-leaves">
            <Card>
              <CardHeader>
                <CardTitle>All Employee Leave Requests</CardTitle>
                <CardDescription>View, approve, reject, and manage all employee leave requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-sm space-y-4">
                  <div className="flex flex-wrap items-end gap-5">
                    <div className="flex-1 min-w-[240px] space-y-2.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Employee Name</Label>
                      <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={employeeSearchOpen}
                            className="w-full justify-between bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl h-10"
                          >
                            {selectedEmployeeFilter === "all" ? "All Employees" : getEmployeeName(Number(selectedEmployeeFilter))}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search employee..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No employee found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    setSelectedEmployeeFilter("all")
                                    setEmployeeSearchOpen(false)
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedEmployeeFilter === "all" ? "opacity-100" : "opacity-0")} />
                                  All Employees
                                </CommandItem>
                                {employees.map((emp) => (
                                  <CommandItem
                                    key={emp.id}
                                    value={getEmployeeName(emp.id)}
                                    onSelect={() => {
                                      setSelectedEmployeeFilter(emp.id.toString())
                                      setEmployeeSearchOpen(false)
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", selectedEmployeeFilter === emp.id.toString() ? "opacity-100" : "opacity-0")} />
                                    {getEmployeeName(emp.id)}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="w-[180px] space-y-2.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Status</Label>
                      <Select value={adminLeaveStatusFilter} onValueChange={setAdminLeaveStatusFilter}>
                        <SelectTrigger className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-[160px] space-y-2.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Start Date</Label>
                      <div className="relative">
                        <Input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} className="rounded-xl h-10 pl-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="w-[160px] space-y-2.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">End Date</Label>
                      <div className="relative">
                        <Input type="date" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} className="rounded-xl h-10 pl-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 rounded-xl gap-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors"
                        onClick={() => {
                          setSelectedEmployeeFilter('all');
                          setAdminLeaveStatusFilter('all');
                          setLeaveStartDate('');
                          setLeaveEndDate('');
                        }}
                      >
                        <Eraser className="h-3.5 w-3.5" />
                        Reset
                      </Button>
                      <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto rounded-md border text-[13px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>From Date</TableHead>
                        <TableHead>To Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></TableCell></TableRow>
                      ) : filteredAllLeaveRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leave requests found</TableCell>
                        </TableRow>
                      ) : (
                        filteredAllLeaveRequests.slice(leavePage * PAGE_SIZE, (leavePage + 1) * PAGE_SIZE).map((leave) => (
                          <TableRow key={leave.id}>
                            <TableCell className="font-medium">{getEmployeeName(leave.employeeId)}</TableCell>
                            <TableCell className="capitalize">{leave.leaveType.replace(/_/g, ' ')}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDateOrdinal(leave.startDate)}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDateOrdinal(leave.endDate)}</TableCell>
                            <TableCell>{getLeaveStatusBadge(leave.status)}</TableCell>
                            <TableCell className="max-w-[400px] whitespace-normal break-words text-xs leading-relaxed py-4 italic text-muted-foreground">
                              {leave.reason || <span className="opacity-30 italic">No reason provided</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setViewingLeave(leave)}><Eye className="h-4 w-4 text-blue-600" /></Button>
                                {canApproveLeaves && leave.status === 'pending' && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => setApprovingLeave(leave)}><Check className="h-4 w-4 text-green-600" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => setRejectingLeave(leave)}><X className="h-4 w-4 text-red-600" /></Button>
                                  </>
                                )}
                                {canDeleteRecords && (
                                  <Button variant="ghost" size="sm" onClick={() => setDeletingLeave(leave)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex items-center justify-between space-x-2 py-4 border-t">
                  <div className="text-sm text-muted-foreground">Page {leavePage + 1}</div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setLeavePage(prev => Math.max(0, prev - 1))} disabled={leavePage === 0 || loading}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setLeavePage(prev => prev + 1)} disabled={filteredAllLeaveRequests.length <= (leavePage + 1) * PAGE_SIZE || loading}>
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="leave" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>My Leave History</CardTitle>
                  <CardDescription>View and manage your leave requests.</CardDescription>
                </div>

              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" placeholder="dd/mm/yyyy" disabled />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" placeholder="dd/mm/yyyy" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Leave Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" className="w-full" onClick={() => setStatusFilter('all')}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto rounded-xl border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>From Date</TableHead>
                      <TableHead>To Date</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : leaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          No leave requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests.slice(personalLeavePage * PAGE_SIZE, (personalLeavePage + 1) * PAGE_SIZE).map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium capitalize">{leave.leaveType.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDateOrdinal(leave.startDate)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDateOrdinal(leave.endDate)}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDateOrdinal(leave.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getLeaveStatusBadge(leave.status)}
                              {leave.adminComment && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium cursor-help hover:text-slate-600 transition-colors">
                                        <MessageSquareQuote className="h-3 w-3" />
                                        Admin feedback
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs p-3 rounded-xl shadow-xl border-slate-200">
                                      <p className="text-xs font-semibold mb-1 text-slate-800">Administrator Comment</p>
                                      <p className="text-[11px] text-slate-600 leading-relaxed italic">"{leave.adminComment}"</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[250px] whitespace-normal break-words text-xs py-4 text-muted-foreground italic">
                            {leave.reason}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setViewingLeave(leave)}>
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {personalLeavePage + 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPersonalLeavePage(p => Math.max(0, p - 1))}
                    disabled={personalLeavePage === 0 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPersonalLeavePage(p => p + 1)}
                    disabled={leaveRequests.length <= (personalLeavePage + 1) * PAGE_SIZE || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Company Holidays</CardTitle>
                  <CardDescription>View company holidays and plan your time off.</CardDescription>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 sm:w-auto w-full">
                  <Select value={String(holidayYear)} onValueChange={(value) => setHolidayYear(Number(value))}>
                    <SelectTrigger className="rounded-xl h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((yearOption) => (
                        <SelectItem key={yearOption} value={String(yearOption)}>
                          {yearOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {isFullAccessUser && (
                    <Button 
                      onClick={() => {
                        setEditingHoliday(null);
                        setIsHolidayDialogOpen(true);
                      }}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Holiday
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {holidays.length === 0 ? (
                <p className="text-sm text-muted-foreground">No holidays found for the selected year.</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {holidays.slice(holidayPage * PAGE_SIZE, (holidayPage + 1) * PAGE_SIZE).map((holiday) => (
                      <div key={holiday.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{holiday.reason}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDisplayDate(holiday.date)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-medium px-3 py-0.5 rounded-full">{holiday.year}</Badge>
                            {isFullAccessUser && (
                              <div className="flex items-center gap-1 ml-2 border-l pl-3 dark:border-slate-800">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  onClick={() => {
                                    setEditingHoliday(holiday);
                                    setIsHolidayDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  onClick={() => setDeletingHoliday(holiday)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Page {holidayPage + 1}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHolidayPage(p => Math.max(0, p - 1))}
                        disabled={holidayPage === 0 || loading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHolidayPage(p => p + 1)}
                        disabled={holidays.length <= (holidayPage + 1) * PAGE_SIZE || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LeaveRequestDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        employeeData={employeeData ?? { id: 0 }}
        userRole={user?.role ?? 'Employee'}
        onSuccess={() => {
          fetchLeaveRequests();
          if (isFullAccessUser) fetchAllLeaveRequests();
          setShowDialog(false);
        }}
      />

      <Dialog open={viewingLeave !== null} onOpenChange={() => setViewingLeave(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-5 w-5 text-primary" />
              Leave Application
            </DialogTitle>
            <DialogDescription>Full details of the submitted leave request</DialogDescription>
          </DialogHeader>

          {viewingLeave && (
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Leave Type</span>
                  <p className="font-semibold text-sm capitalize">{viewingLeave.leaveType.replace(/_/g, ' ')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                  <div>{getLeaveStatusBadge(viewingLeave.status)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Applied On</span>
                  <p className="font-medium text-xs text-muted-foreground">{formatDateOrdinal(viewingLeave.createdAt)}</p>
                </div>
                {viewingLeave.adminComment && (
                  <div className="col-span-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-lg">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider block mb-1">Administrator Comment</span>
                    <p className="text-sm italic text-slate-700 dark:text-slate-300">"{viewingLeave.adminComment}"</p>
                  </div>
                )}
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] text-primary/70 uppercase font-bold tracking-wider mb-1 block">From</span>
                    <p className="font-bold text-primary">{formatDateOrdinal(viewingLeave.startDate)}</p>
                  </div>
                  <div className="h-10 w-px bg-primary/20 mx-4" />
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-primary/70 uppercase font-bold tracking-wider mb-1 block">To</span>
                    <p className="font-bold text-primary">{formatDateOrdinal(viewingLeave.endDate)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Reason for Leave</Label>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px] shadow-sm">
                  {viewingLeave.reason}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button className="w-full sm:w-auto px-8" onClick={() => setViewingLeave(null)}>
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Action Dialogs */}
      <Dialog open={approvingLeave !== null} onOpenChange={() => setApprovingLeave(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              Approve Leave Request
            </DialogTitle>
            <DialogDescription className="pt-2">
              Reviewing <strong>{approvingLeave?.leaveType?.replace(/_/g, ' ')}</strong> for <span className="text-slate-900 font-medium">{approvingLeave ? getEmployeeName(approvingLeave.employeeId) : ''}</span>. 
              {approvingLeave && (
                <div className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-2 rounded border-l-2 border-slate-300">
                  "{approvingLeave.reason}"
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Decision Comment (Optional)</Label>
              <Textarea 
                placeholder="Good to go! Enjoy your time off." 
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="min-h-[100px] rounded-xl bg-slate-50/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApprovingLeave(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={() => approvingLeave && updateLeaveStatus(approvingLeave.id, 'approved', true, adminComment)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">Approve Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectingLeave !== null} onOpenChange={() => setRejectingLeave(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                <X className="h-4 w-4 text-rose-600" />
              </div>
              Reject Leave Request
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are rejecting the request from <strong>{rejectingLeave ? getEmployeeName(rejectingLeave.employeeId) : ''}</strong>. 
              A justification reason is mandatory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={`text-[10px] font-bold uppercase tracking-widest px-1 ${!adminComment.trim() ? 'text-rose-500' : 'text-slate-400'}`}>
                Rejection Reason (Required)
              </Label>
              <Textarea 
                placeholder="Unfortunately, we have overlapping deadlines during this period..." 
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="min-h-[120px] rounded-xl border-rose-200 focus-visible:ring-rose-500 bg-rose-50/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectingLeave(null)} className="rounded-xl">Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => rejectingLeave && updateLeaveStatus(rejectingLeave.id, 'rejected', false, adminComment)}
              disabled={!adminComment.trim()}
              className="rounded-xl px-6"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingLeave !== null} onOpenChange={() => setDeletingLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Record</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the leave request.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLeave(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingLeave && handleLeaveDelete(deletingLeave.id)}>Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingHoliday !== null} onOpenChange={() => setDeletingHoliday(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Holiday?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deletingHoliday?.reason}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center pt-2">
            <Button variant="ghost" onClick={() => setDeletingHoliday(null)} className="rounded-xl flex-1">Cancel</Button>
            <Button variant="destructive" onClick={() => deletingHoliday && handleDeleteHoliday(deletingHoliday.id)} className="rounded-xl flex-1">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HolidayDialog 
        open={isHolidayDialogOpen}
        onOpenChange={setIsHolidayDialogOpen}
        holiday={editingHoliday}
        onSuccess={() => {
          fetchCompanyHolidays();
          setEditingHoliday(null);
        }}
      />
    </div>
  );
}