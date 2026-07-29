'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Check, DollarSign, Users, Calendar, TrendingUp, Settings2, Sparkles, AlertCircle, FileSpreadsheet, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Employee {
    id: number;
    userId: number;
    employeeId: string;
    department: string;
    designation: string;
    salary: number;
}

interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

interface AttendanceSummary {
    employeeId: number;
    employeeName: string;
    presentDays: number;
    halfDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    absentDays: number;
    holidayDays: number;
    workPercentage: number;
    baseSalary: number;
    calculatedSalary: number;
}

interface Payroll {
    id: number;
    employeeId: number;
    month: string;
    year: number;
    baseSalary: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    leaveDays: number;
    totalWorkingDays: number;
    calculatedSalary: number;
    deductions: number;
    bonuses: number;
    netSalary: number;
    status: string;
    generatedAt: string;
    notes?: string;
}

interface BusinessSettings {
    id?: number;
    businessName: string;
    email: string;
    phone: string;
    address: string;
    gstNo: string;
    pan: string;
    tan: string;
    registrationNo: string;
    logoUrl: string;
}

export default function PayrollPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
    const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [generatedPayrolls, setGeneratedPayrolls] = useState<Payroll[]>([]);
    const [activePayrollJobId, setActivePayrollJobId] = useState<number | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [totalWorkingDays, setTotalWorkingDays] = useState(0);
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
    const [attendancePage, setAttendancePage] = useState(0);
    const [payrollPage, setPayrollPage] = useState(0);
    const pageSize = 8;

    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
    const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
    const [adjustmentBonuses, setAdjustmentBonuses] = useState('');
    const [adjustmentDeductions, setAdjustmentDeductions] = useState('');
    const [adjustmentNotes, setAdjustmentNotes] = useState('');
    const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadInitial() {
            setLoading(true);
            await Promise.all([
                fetchEmployees(),
                fetchBusinessSettings(),
                fetchPayrolls()
            ]);
            setLoading(false);
        }
        loadInitial();
    }, [selectedMonth, selectedYear, selectedEmployeeFilter]);

    useEffect(() => {
        if (!activePayrollJobId) return;

        const token = localStorage.getItem('session_token');
        const intervalId = window.setInterval(async () => {
            try {
                const response = await fetch(`/api/payroll/jobs?id=${activePayrollJobId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) return;
                const job = await response.json();

                if (job.status === 'completed') {
                    toast.success('Payroll generation completed successfully');
                    setActivePayrollJobId(null);
                    setIsGenerating(false);
                    setSelectedEmployees([]);
                    fetchPayrolls();
                } else if (job.status === 'failed') {
                    toast.error(job.error || 'Payroll generation failed');
                    setActivePayrollJobId(null);
                    setIsGenerating(false);
                }
            } catch {
                // keep polling quietly
            }
        }, 2000);

        return () => window.clearInterval(intervalId);
    }, [activePayrollJobId]);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('session_token');
            const response = await fetch('/api/employees?limit=100', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setEmployees(data);

                const userIds = data.map((emp: Employee) => emp.userId);
                if (userIds.length > 0) {
                    const usersResponse = await fetch('/api/users?limit=100', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (usersResponse.ok) {
                        const usersData = await usersResponse.json();
                        setUsers(usersData);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchBusinessSettings = async () => {
        try {
            const token = localStorage.getItem('session_token');
            const response = await fetch('/api/business-settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBusinessSettings(data);
            } else {
                console.error('Failed to fetch business settings');
            }
        } catch (error) {
            console.error('Error fetching business settings:', error);
        }
    };

    const fetchAttendanceSummary = async () => {
        setIsFetching(true);
        try {
            const token = localStorage.getItem('session_token');

            const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
            const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

            let url = `/api/attendance?startDate=${startDate}&endDate=${endDate}&limit=1000`;
            if (selectedEmployeeFilter !== 'all') {
                url += `&employeeId=${selectedEmployeeFilter}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const holidaysResp = await fetch(`/api/company-holidays?startDate=${startDate}&endDate=${endDate}&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const leavesResp = await fetch(`/api/leave-requests?startDate=${startDate}&endDate=${endDate}&status=approved&limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const attendanceData = await response.json();
                const holidaysData = holidaysResp.ok ? (await holidaysResp.json()).data || [] : [];
                const leavesData = leavesResp.ok ? (await leavesResp.json()).data || [] : [];

                const holidayDates = new Set(holidaysData.map((h: any) => h.date));
                const unpaidLeaveDatesByEmp = new Map<number, Set<string>>();
                
                for (const lr of leavesData) {
                    if (String(lr.leaveType).toLowerCase().includes('unpaid') || String(lr.leaveType) === 'LWP') {
                        const empSet = unpaidLeaveDatesByEmp.get(lr.employeeId) || new Set<string>();
                        let curr = new Date(Math.max(new Date(lr.startDate).getTime(), new Date(startDate).getTime()));
                        const lrEnd = new Date(Math.min(new Date(lr.endDate).getTime(), new Date(endDate).getTime()));
                        while (curr <= lrEnd) {
                            empSet.add(curr.toISOString().split('T')[0]);
                            curr.setDate(curr.getDate() + 1);
                        }
                        unpaidLeaveDatesByEmp.set(lr.employeeId, empSet);
                    }
                }

                const employeeMap = new Map<number, AttendanceSummary>();
                const employeesToProcess = selectedEmployeeFilter !== 'all'
                    ? employees.filter(e => e.id === parseInt(selectedEmployeeFilter))
                    : employees;

                employeesToProcess.forEach(emp => {
                    const user = users.find(u => u.id === emp.userId);
                    employeeMap.set(emp.id, {
                        employeeId: emp.id,
                        employeeName: user ? `${user.firstName} ${user.lastName}` : emp.employeeId,
                        presentDays: 0,
                        halfDays: 0,
                        paidLeaveDays: 0,
                        unpaidLeaveDays: 0,
                        absentDays: 0,
                        holidayDays: 0,
                        workPercentage: 0,
                        baseSalary: emp.salary || 0,
                        calculatedSalary: 0,
                    });
                });

                const attByEmpDate = new Map<string, string>();
                attendanceData.forEach((record: any) => {
                    attByEmpDate.set(`${record.employeeId}_${record.date}`, record.status);
                });

                let workingDays = 0;
                for (let curr = new Date(startDate); curr <= new Date(endDate); curr.setDate(curr.getDate() + 1)) {
                    const dateStr = curr.toISOString().split('T')[0];
                    const dayOfWeek = curr.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isHoliday = holidayDates.has(dateStr);

                    if (!isWeekend && !isHoliday) workingDays++;

                    employeeMap.forEach(summary => {
                        const attStatus = attByEmpDate.get(`${summary.employeeId}_${dateStr}`);
                        const unpaidSet = unpaidLeaveDatesByEmp.get(summary.employeeId);
                        
                        if (attStatus) {
                            if (attStatus === 'present' || attStatus === 'late') {
                                summary.presentDays++;
                            } else if (attStatus === 'half_day') {
                                summary.halfDays++;
                            } else if (attStatus === 'leave' || attStatus === 'on_leave') {
                                if (unpaidSet?.has(dateStr)) {
                                    summary.unpaidLeaveDays++;
                                } else {
                                    summary.paidLeaveDays++;
                                }
                            } else {
                                if (!isWeekend && !isHoliday) summary.absentDays++;
                            }
                        } else {
                            if (!isWeekend) {
                                if (isHoliday) {
                                    summary.holidayDays++;
                                } else {
                                    summary.absentDays++;
                                }
                            }
                        }
                    });
                }
                setTotalWorkingDays(workingDays);

                employeeMap.forEach(summary => {
                    const effectiveDays = summary.presentDays + summary.paidLeaveDays + (summary.halfDays * 0.5) + summary.holidayDays;
                    summary.workPercentage = workingDays > 0 ? Math.round((effectiveDays / workingDays) * 100) : 0;
                    if (summary.baseSalary > 0 && workingDays > 0) {
                        summary.calculatedSalary = Math.round((summary.baseSalary / workingDays) * effectiveDays);
                    }
                });

                setAttendanceSummary(Array.from(employeeMap.values()));
                setAttendancePage(0); // Reset to first page
                toast.success('Attendance summary fetched successfully');
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to fetch attendance summary');
        } finally {
            setIsFetching(false);
        }
    };

    const fetchPayrolls = async () => {
        try {
            const token = localStorage.getItem('session_token');
            const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

            let url = `/api/payroll?month=${monthStr}&year=${selectedYear}`;
            if (selectedEmployeeFilter !== 'all') {
                url += `&employeeId=${selectedEmployeeFilter}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setGeneratedPayrolls(Array.isArray(result) ? result : (result.data || []));
                setPayrollPage(0); // Reset to first page
            }
        } catch (error) {
            console.error('Error fetching payrolls:', error);
        }
    };

    const handleGeneratePayroll = async (forAll: boolean = false) => {
        if (!forAll && selectedEmployees.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }

        setIsGenerating(true);
        try {
            const token = localStorage.getItem('session_token');
            const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

            const response = await fetch('/api/payroll/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeIds: forAll ? 'all' : selectedEmployees,
                    month: monthStr,
                    year: selectedYear,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Payroll generation queued successfully');
                if (typeof data.jobId === 'number') {
                    setActivePayrollJobId(data.jobId);
                } else {
                    fetchPayrolls();
                    setSelectedEmployees([]);
                    setIsGenerating(false);
                }
            } else {
                toast.error(data.error || 'Failed to generate payroll');
            }
        } catch (error) {
            console.error('Error generating payroll:', error);
            toast.error('An error occurred while generating payroll');
        } finally {
            if (!activePayrollJobId) {
                setIsGenerating(false);
            }
        }
    };

    const handleUpdateStatus = async (payrollId: number, newStatus: string) => {
        try {
            const token = localStorage.getItem('session_token');

            const response = await fetch(`/api/payroll`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: payrollId,
                    status: newStatus,
                }),
            });

            if (response.ok) {
                toast.success(`Payroll ${newStatus} successfully`);
                fetchPayrolls();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to update payroll');
            }
        } catch (error) {
            console.error('Error updating payroll:', error);
            toast.error('An error occurred while updating payroll');
        }
    };

    const handleDeletePayroll = async (payrollId: number) => {
        if (!confirm('Are you sure you want to delete this payroll record?')) {
            return;
        }

        try {
            const token = localStorage.getItem('session_token');

            const response = await fetch(`/api/payroll?id=${payrollId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Payroll deleted successfully');
                fetchPayrolls();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to delete payroll');
            }
        } catch (error) {
            console.error('Error deleting payroll:', error);
            toast.error('An error occurred while deleting payroll');
        }
    };

    const handleOpenAdjustment = (payroll: Payroll) => {
        setEditingPayroll(payroll);
        setAdjustmentBonuses(String(payroll.bonuses || 0));
        setAdjustmentDeductions(String(payroll.deductions || 0));
        setAdjustmentNotes(payroll.notes || '');
        setIsAdjustmentDialogOpen(true);
    };

    const handleSaveAdjustment = async () => {
        if (!editingPayroll) return;
        setIsSavingAdjustment(true);
        try {
            const token = localStorage.getItem('session_token');
            const response = await fetch(`/api/payroll`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: editingPayroll.id,
                    bonuses: Number(adjustmentBonuses),
                    deductions: Number(adjustmentDeductions),
                    notes: adjustmentNotes,
                }),
            });

            if (response.ok) {
                toast.success('Payroll adjustments saved');
                setIsAdjustmentDialogOpen(false);
                fetchPayrolls();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to save adjustments');
            }
        } catch (error) {
            console.error('Error saving adjustments:', error);
            toast.error('An error occurred');
        } finally {
            setIsSavingAdjustment(false);
        }
    };

    const handleExportCSV = () => {
        const csv = [
            ['Employee', 'Month', 'Base Salary', 'Present Days', 'Half Days', 'Leave Days', 'Absent Days', 'Net Salary', 'Status'],
            ...generatedPayrolls.map(p => {
                const employee = employees.find(e => e.id === p.employeeId);
                const user = users.find(u => u.id === employee?.userId);
                const empName = user ? `${user.firstName} ${user.lastName}` : employee?.employeeId || 'Unknown';

                return [
                    empName,
                    p.month,
                    p.baseSalary,
                    p.presentDays,
                    p.halfDays,
                    p.leaveDays,
                    p.absentDays,
                    p.netSalary,
                    p.status,
                ];
            })
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll_${selectedYear}_${selectedMonth}.csv`;
        a.click();
        toast.success('Payroll exported successfully');
    };

    const handleDownloadPayslip = async (payroll: Payroll) => {
        try {
            const token = localStorage.getItem('session_token');
            const response = await fetch(`/api/payroll/payslip?payrollId=${payroll.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const htmlString = await response.text();
                
                const employee = employees.find(e => e.id === payroll.employeeId);
                const user = users.find(u => u.id === employee?.userId);
                const empName = user ? `${user.firstName} ${user.lastName}` : employee?.employeeId || 'Unknown';
                const filename = `Payslip_${empName}_${payroll.month}_${payroll.year}.pdf`;

                const html2pdf = (await import('html2pdf.js')).default;
                
                const opt = {
                  margin:       0.5,
                  filename:     filename,
                  image:        { type: 'jpeg' as const, quality: 0.98 },
                  html2canvas:  { scale: 2 },
                  jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
                };

                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '0';
                tempDiv.innerHTML = htmlString;
                document.body.appendChild(tempDiv);
                
                html2pdf().set(opt).from(tempDiv).save().then(() => {
                   document.body.removeChild(tempDiv);
                   toast.success('Payslip downloaded successfully');
                });
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to download payslip');
            }
        } catch (error) {
            console.error('Error downloading payslip:', error);
            toast.error('An error occurred while downloading payslip');
        }
    };

    const handleDownloadAllPayslips = async () => {
        if (generatedPayrolls.length === 0) {
            toast.info('No payrolls to download.');
            return;
        }
        toast.info('Downloading all payslips...');
        for (const payroll of generatedPayrolls) {
            await handleDownloadPayslip(payroll);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        toast.success('All payslips downloaded.');
    };

    const toggleEmployeeSelection = (employeeId: number) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedEmployees.length === attendanceSummary.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(attendanceSummary.map(s => s.employeeId));
        }
    };

    const getEmployeeName = (employeeId: number) => {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return 'Unknown';
        const user = users.find(u => u.id === employee.userId);
        return user ? `${user.firstName} ${user.lastName}` : employee.employeeId;
    };

    const avgAttendance = attendanceSummary.length > 0
        ? Math.round(attendanceSummary.reduce((sum, s) => sum + s.workPercentage, 0) / attendanceSummary.length)
        : 0;

    const totalDisbursement = attendanceSummary.reduce((sum, s) => sum + s.calculatedSalary, 0);

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse">
                {/* Header Skeleton */}
                <div className="h-28 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full"></div>
                {/* Stats cards skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
                    <div className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
                    <div className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
                    <div className="h-20 bg-slate-100 dark:bg-zinc-800/50 rounded-xl"></div>
                </div>
                {/* Tables skeleton */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="h-96 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
            
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#030712] via-[#0f172a] to-[#1e1b4b] p-6 text-white shadow-xl border border-zinc-800">
                <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
                <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">HRM Financials Console</span>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent">
                            Payroll & Benefits Administration
                        </h2>
                        <p className="text-sm text-zinc-300 mt-1 max-w-xl">
                            Generate multi-tenant monthly payroll schedules, apply bonuses or regulatory deductions, and export digital payslips.
                        </p>
                    </div>
                    {generatedPayrolls.length > 0 && (
                        <div className="flex gap-2">
                            <Button onClick={handleDownloadAllPayslips} size="sm" variant="outline" className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700">
                                <Download className="mr-1.5 h-4 w-4 text-indigo-400" /> Payslips PDF
                            </Button>
                            <Button onClick={handleExportCSV} size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 border-none shadow-sm">
                                <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export Ledger CSV
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Config & Fetch Filters panel */}
            <Card className="border border-indigo-100 dark:border-indigo-950">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                        Select Accounting Interval
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Month</Label>
                        <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                            <SelectTrigger className="h-10 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Year</Label>
                        <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                            <SelectTrigger className="h-10 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => {
                                    const yr = new Date().getFullYear() - 2 + i;
                                    return <SelectItem key={yr} value={yr.toString()}>{yr}</SelectItem>;
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Employee Focus</Label>
                        <Select value={selectedEmployeeFilter} onValueChange={setSelectedEmployeeFilter}>
                            <SelectTrigger className="h-10 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {employees.map(emp => {
                                    const user = users.find(u => u.id === emp.userId);
                                    return (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>
                                            {user ? `${user.firstName} ${user.lastName} (${emp.employeeId})` : emp.employeeId}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button onClick={fetchAttendanceSummary} disabled={isFetching} className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-sm text-xs font-bold">
                            {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Compile Timesheets & Fetch
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bento Stats Display */}
            {attendanceSummary.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="border-none shadow-sm relative overflow-hidden group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cycle Working Days</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-indigo-600">{totalWorkingDays} days</div>
                            <p className="text-[10px] text-muted-foreground mt-2">Active business cycle</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm relative overflow-hidden group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">{attendanceSummary.length} staff</div>
                            <p className="text-[10px] text-muted-foreground mt-2">Timesheet verified</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm relative overflow-hidden group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Capacity Fill</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-emerald-600">{avgAttendance}%</div>
                            <p className="text-[10px] text-muted-foreground mt-2">Overall cohort productivity</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm relative overflow-hidden group">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected Liabilities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold">₹{totalDisbursement.toLocaleString()}</div>
                            <p className="text-[10px] text-muted-foreground mt-2">Estimated base gross pay</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Attendance & Time Ledger Table */}
            {attendanceSummary.length > 0 && (
                <Card>
                    <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <CardTitle>Cycle Timesheet Ledger</CardTitle>
                                <CardDescription>Verify employee logs and launch payroll batches</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => handleGeneratePayroll(false)} disabled={isGenerating || selectedEmployees.length === 0} size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500">
                                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate Selected ({selectedEmployees.length})
                                </Button>
                                <Button onClick={() => handleGeneratePayroll(true)} disabled={isGenerating} size="sm" variant="outline">
                                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate All
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox checked={selectedEmployees.length === attendanceSummary.length} onCheckedChange={toggleSelectAll} />
                                    </TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Present</TableHead>
                                    <TableHead>Half Days</TableHead>
                                    <TableHead>Holidays</TableHead>
                                    <TableHead>Paid Leave</TableHead>
                                    <TableHead>Unpaid Leave</TableHead>
                                    <TableHead>Absent</TableHead>
                                    <TableHead>Work %</TableHead>
                                    <TableHead className="text-right">Estimated Gross</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceSummary.slice(attendancePage * pageSize, (attendancePage + 1) * pageSize).map((summary) => (
                                    <TableRow key={summary.employeeId} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                                        <TableCell>
                                            <Checkbox checked={selectedEmployees.includes(summary.employeeId)} onCheckedChange={() => toggleEmployeeSelection(summary.employeeId)} />
                                        </TableCell>
                                        <TableCell className="font-bold text-zinc-900 dark:text-zinc-50">{summary.employeeName}</TableCell>
                                        <TableCell className="font-semibold">{summary.presentDays}</TableCell>
                                        <TableCell>{summary.halfDays}</TableCell>
                                        <TableCell>{summary.holidayDays}</TableCell>
                                        <TableCell>{summary.paidLeaveDays}</TableCell>
                                        <TableCell>{summary.unpaidLeaveDays}</TableCell>
                                        <TableCell className="text-rose-500 font-bold">{summary.absentDays > 0 ? summary.absentDays : '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={summary.workPercentage >= 80 ? 'default' : 'secondary'} className="text-[10px] font-bold">
                                                {summary.workPercentage}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-extrabold text-indigo-600 dark:text-indigo-400 text-right">
                                            ₹{summary.calculatedSalary.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        
                        <div className="flex items-center justify-end space-x-2 py-4 border-t mt-4">
                            <Button variant="outline" size="sm" onClick={() => setAttendancePage(Math.max(0, attendancePage - 1))} disabled={attendancePage === 0}>
                                Previous
                            </Button>
                            <div className="text-xs font-semibold">
                                Page {attendancePage + 1} of {Math.ceil(attendanceSummary.length / pageSize) || 1}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setAttendancePage(Math.min(Math.ceil(attendanceSummary.length / pageSize) - 1, attendancePage + 1))} disabled={attendancePage >= Math.ceil(attendanceSummary.length / pageSize) - 1}>
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Generated Payroll Batches Ledger */}
            {generatedPayrolls.length > 0 && (
                <Card>
                    <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Calculated Payroll Ledger</CardTitle>
                                <CardDescription>Disburse payments and review salary brackets</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto pt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Calc. Salary</TableHead>
                                    <TableHead>Bonuses</TableHead>
                                    <TableHead>Deductions</TableHead>
                                    <TableHead>Net Salary</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedPayrolls.slice(payrollPage * pageSize, (payrollPage + 1) * pageSize).map((payroll) => (
                                    <TableRow key={payroll.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                                        <TableCell className="font-bold text-zinc-900 dark:text-zinc-50">{getEmployeeName(payroll.employeeId)}</TableCell>
                                        <TableCell className="font-mono text-xs">{payroll.month}</TableCell>
                                        <TableCell className="font-semibold">₹{(payroll.calculatedSalary || payroll.baseSalary).toLocaleString()}</TableCell>
                                        <TableCell className="text-emerald-600 font-bold">
                                            {payroll.bonuses > 0 ? `+₹${payroll.bonuses.toLocaleString()}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-rose-500 font-bold">
                                            {payroll.deductions > 0 ? `-₹${payroll.deductions.toLocaleString()}` : '-'}
                                        </TableCell>
                                        <TableCell className="font-extrabold text-zinc-900 dark:text-zinc-50">₹{payroll.netSalary.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={payroll.status === 'paid' ? 'default' : payroll.status === 'approved' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-bold">
                                                {payroll.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <Button size="xs" variant="ghost" onClick={() => handleDownloadPayslip(payroll)} title="Download Payslip">
                                                    <Download className="h-4 w-4 text-indigo-500" />
                                                </Button>
                                                {payroll.status === 'draft' && (
                                                    <>
                                                        <Button size="xs" variant="ghost" onClick={() => handleOpenAdjustment(payroll)} title="Adjust Parameters">
                                                            <Settings2 className="h-4 w-4 text-amber-500" />
                                                        </Button>
                                                        <Button size="xs" variant="ghost" onClick={() => handleUpdateStatus(payroll.id, 'approved')} title="Approve">
                                                            <Check className="h-4 w-4 text-emerald-500" />
                                                        </Button>
                                                        <Button size="xs" variant="ghost" className="text-rose-500 hover:text-rose-600" onClick={() => handleDeletePayroll(payroll.id)}>
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                                {payroll.status === 'approved' && (
                                                    <Button size="xs" className="bg-emerald-600 hover:bg-emerald-500 text-white h-7" onClick={() => handleUpdateStatus(payroll.id, 'paid')}>
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        
                        <div className="flex items-center justify-end space-x-2 py-4 border-t mt-4">
                            <Button variant="outline" size="sm" onClick={() => setPayrollPage(Math.max(0, payrollPage - 1))} disabled={payrollPage === 0}>
                                Previous
                            </Button>
                            <div className="text-xs font-semibold">
                                Page {payrollPage + 1} of {Math.ceil(generatedPayrolls.length / pageSize) || 1}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setPayrollPage(Math.min(Math.ceil(generatedPayrolls.length / pageSize) - 1, payrollPage + 1))} disabled={payrollPage >= Math.ceil(generatedPayrolls.length / pageSize) - 1}>
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Adjustments Popup Dialog */}
            <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Payroll Parameters</DialogTitle>
                        <DialogDescription>
                            Configure additional bonuses or cycle deductions for {editingPayroll ? getEmployeeName(editingPayroll.employeeId) : ''}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Bonuses (₹)</Label>
                            <Input type="number" min="0" value={adjustmentBonuses} onChange={(e) => setAdjustmentBonuses(e.target.value)} placeholder="e.g. 5000" className="text-xs" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Deductions (₹)</Label>
                            <Input type="number" min="0" value={adjustmentDeductions} onChange={(e) => setAdjustmentDeductions(e.target.value)} placeholder="e.g. 2000" className="text-xs" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Adjustment Note</Label>
                            <Textarea value={adjustmentNotes} onChange={(e) => setAdjustmentNotes(e.target.value)} placeholder="Reasoning for payroll adjustment..." rows={3} className="text-xs" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)} size="sm">Cancel</Button>
                        <Button onClick={handleSaveAdjustment} disabled={isSavingAdjustment} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                            {isSavingAdjustment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply & Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
