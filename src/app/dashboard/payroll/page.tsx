'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Check, DollarSign, Users, Calendar, TrendingUp, Settings2 } from 'lucide-react';
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
    const pageSize = 10;

    const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
    const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
    const [adjustmentBonuses, setAdjustmentBonuses] = useState('');
    const [adjustmentDeductions, setAdjustmentDeductions] = useState('');
    const [adjustmentNotes, setAdjustmentNotes] = useState('');
    const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

    useEffect(() => {
        fetchEmployees();
        fetchBusinessSettings();
    }, []);

    useEffect(() => {
        fetchPayrolls();
    }, [selectedMonth, selectedYear]);

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

                // Dynamic import to avoid SSR issues
                const html2pdf = (await import('html2pdf.js')).default;
                
                const opt = {
                  margin:       0.5,
                  filename:     filename,
                  image:        { type: 'jpeg' as const, quality: 0.98 },
                  html2canvas:  { scale: 2 },
                  jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
                };

                // Create a temporary container
                const tempDiv = document.createElement('div');
                // Hide it from view but keep it in normal document flow so html2canvas can render it
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
            // Add a small delay to prevent browser from blocking multiple downloads
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Payroll Management</h2>
                <p className="text-muted-foreground">Generate and manage employee payroll based on attendance</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Select month, year, and employee to fetch attendance data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Month</Label>
                            <Select
                                value={selectedMonth.toString()}
                                onValueChange={(value) => setSelectedMonth(parseInt(value))}
                            >
                                <SelectTrigger>
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
                            <Label>Year</Label>
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(value) => setSelectedYear(parseInt(value))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year = new Date().getFullYear() - 2 + i;
                                        return (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            <Select value={selectedEmployeeFilter} onValueChange={setSelectedEmployeeFilter}>
                                <SelectTrigger>
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
                            <Button onClick={fetchAttendanceSummary} disabled={isFetching} className="w-full">
                                {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Fetch Attendance
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {attendanceSummary.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-background border-none shadow-sm pb-1">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                Working Days
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold">{totalWorkingDays}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-background border-none shadow-sm pb-1">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                    <Users className="h-4 w-4" />
                                </div>
                                Total Employees
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold">{attendanceSummary.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-background border-none shadow-sm pb-1">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                                Avg Attendance
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold">{avgAttendance}%</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-background border-none shadow-sm pb-1">
                        <CardHeader className="pb-3">
                            <CardDescription className="flex items-center gap-2 font-medium text-violet-600 dark:text-violet-400">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                Expected Disb.
                            </CardDescription>
                            <CardTitle className="text-3xl font-bold">₹{totalDisbursement.toLocaleString()}</CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Attendance Summary Table */}
            {attendanceSummary.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Attendance Summary</CardTitle>
                                <CardDescription>Select employees to generate payroll</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleGeneratePayroll(false)}
                                    disabled={isGenerating || selectedEmployees.length === 0}
                                >
                                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate Selected
                                </Button>
                                <Button
                                    onClick={() => handleGeneratePayroll(true)}
                                    disabled={isGenerating}
                                    variant="outline"
                                >
                                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate All
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedEmployees.length === attendanceSummary.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Present</TableHead>
                                        <TableHead>Half Days</TableHead>
                                        <TableHead>Holidays</TableHead>
                                        <TableHead>Paid Leave</TableHead>
                                        <TableHead>Unpaid Leave</TableHead>
                                        <TableHead>Absent</TableHead>
                                        <TableHead>Work %</TableHead>
                                        <TableHead>Estimated Salary</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceSummary.slice(attendancePage * pageSize, (attendancePage + 1) * pageSize).map((summary) => (
                                        <TableRow key={summary.employeeId}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedEmployees.includes(summary.employeeId)}
                                                    onCheckedChange={() => toggleEmployeeSelection(summary.employeeId)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{summary.employeeName}</TableCell>
                                            <TableCell>{summary.presentDays}</TableCell>
                                            <TableCell>{summary.halfDays}</TableCell>
                                            <TableCell>{summary.holidayDays}</TableCell>
                                            <TableCell>{summary.paidLeaveDays}</TableCell>
                                            <TableCell>{summary.unpaidLeaveDays}</TableCell>
                                            <TableCell className="text-destructive font-medium">{summary.absentDays > 0 ? summary.absentDays : '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={summary.workPercentage >= 80 ? 'default' : 'secondary'}>
                                                    {summary.workPercentage}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                ₹{summary.calculatedSalary.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAttendancePage(Math.max(0, attendancePage - 1))}
                                disabled={attendancePage === 0}
                            >
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {attendancePage + 1} of {Math.ceil(attendanceSummary.length / pageSize) || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAttendancePage(Math.min(Math.ceil(attendanceSummary.length / pageSize) - 1, attendancePage + 1))}
                                disabled={attendancePage >= Math.ceil(attendanceSummary.length / pageSize) - 1}
                            >
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Generated Payrolls */}
            {generatedPayrolls.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Generated Payrolls</CardTitle>
                                <CardDescription>Manage and export payroll records</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleDownloadAllPayslips} variant="outline" disabled={generatedPayrolls.length === 0}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download All Payslips
                                </Button>
                                <Button onClick={handleExportCSV} variant="outline">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export CSV
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[400px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
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
                                        <TableRow key={payroll.id}>
                                            <TableCell className="font-medium">{getEmployeeName(payroll.employeeId)}</TableCell>
                                            <TableCell>{payroll.month}</TableCell>
                                            <TableCell>₹{payroll.calculatedSalary?.toLocaleString() || payroll.baseSalary.toLocaleString()}</TableCell>
                                            <TableCell className="text-emerald-600 dark:text-emerald-400">
                                                {payroll.bonuses > 0 ? `+₹${payroll.bonuses.toLocaleString()}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-destructive">
                                                {payroll.deductions > 0 ? `-₹${payroll.deductions.toLocaleString()}` : '-'}
                                            </TableCell>
                                            <TableCell className="font-bold">₹{payroll.netSalary.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        payroll.status === 'paid' ? 'default' :
                                                            payroll.status === 'approved' ? 'secondary' :
                                                                'outline'
                                                    }
                                                >
                                                    {payroll.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDownloadPayslip(payroll)}
                                                        title="Download Payslip"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    {payroll.status === 'draft' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleOpenAdjustment(payroll)}
                                                                title="Adjust Bonuses & Deductions"
                                                            >
                                                                <Settings2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleUpdateStatus(payroll.id, 'approved')}
                                                                title="Approve Payroll"
                                                            >
                                                                <Check className="h-4 w-4 text-emerald-500" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDeletePayroll(payroll.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </>
                                                    )}
                                                    {payroll.status === 'approved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleUpdateStatus(payroll.id, 'paid')}
                                                        >
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPayrollPage(Math.max(0, payrollPage - 1))}
                                disabled={payrollPage === 0}
                            >
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {payrollPage + 1} of {Math.ceil(generatedPayrolls.length / pageSize) || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPayrollPage(Math.min(Math.ceil(generatedPayrolls.length / pageSize) - 1, payrollPage + 1))}
                                disabled={payrollPage >= Math.ceil(generatedPayrolls.length / pageSize) - 1}
                            >
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adjust Payroll</DialogTitle>
                        <DialogDescription>
                            Add bonuses or deductions to the calculated salary for {editingPayroll ? getEmployeeName(editingPayroll.employeeId) : ''}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Bonuses (₹)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={adjustmentBonuses}
                                onChange={(e) => setAdjustmentBonuses(e.target.value)}
                                placeholder="e.g. 5000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Deductions (₹)</Label>
                            <Input
                                type="number"
                                min="0"
                                value={adjustmentDeductions}
                                onChange={(e) => setAdjustmentDeductions(e.target.value)}
                                placeholder="e.g. 2000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={adjustmentNotes}
                                onChange={(e) => setAdjustmentNotes(e.target.value)}
                                placeholder="Reason for adjustments..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAdjustment} disabled={isSavingAdjustment}>
                            {isSavingAdjustment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Adjustments
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
