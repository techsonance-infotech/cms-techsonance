'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineTableSkeleton } from '@/components/ui/dashboard-skeleton';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, UserPlus, Eye, Trash2, Search, SlidersHorizontal, 
  Download, FileText, MapPin, Briefcase, Building2, ChevronRight, ChevronUp, ChevronDown,
  Mail, Phone, Sparkles, Star, CheckSquare, Square, MoreHorizontal,
  Grid, List, Columns, Plus, X, Bookmark, Upload, Settings, Check, 
  HelpCircle, Copy, ExternalLink, Calendar, Heart, Shield, AlertTriangle,
  FileSpreadsheet, Database, EyeOff, RefreshCw, Layers, Lock, History, UserCheck, MessageSquare, Pin, Bell, Edit2
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getStoredSessionToken, getStoredUser } from '@/lib/client-session';

// Define SaaS directory interfaces
interface Employee {
  id: number;
  userId: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  location: string;
  workMode: string;
  joiningDate: string;
  status: string;
  phone?: string;
  managerName?: string;
  salary?: string;
  experience?: string;
  attendance?: string;
  leaveBalance?: number;
  performance?: string;
  employmentType?: string;
  assets?: string;
  projects?: number;
  skills?: string[];
  activities?: { text: string; time: string; status?: string }[];
}

interface SavedView {
  name: string;
  search: string;
  status: string;
  department: string;
  designation: string;
  workMode: string;
  tag: string;
  scope: 'Private' | 'Department' | 'Organization';
}

interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  details: string;
}

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 10011,
    userId: 11,
    employeeId: 'TS10011',
    firstName: 'Akash',
    lastName: 'Pandit',
    email: 'akash.pandit@tech.com',
    department: 'Engineering',
    designation: 'Trainee - Intern',
    location: 'Surat, GJ / India',
    workMode: 'Hybrid',
    joiningDate: '06 Jan 2026',
    status: 'Active',
    phone: '+91 98765 43210',
    managerName: 'Rahul Sharma',
    salary: '₹ 4.5 LPA',
    experience: '6 Months',
    attendance: '96%',
    leaveBalance: 12,
    performance: '4.5',
    projects: 1,
    skills: ['React', 'Node.js', 'Next.js', 'TypeScript', 'MongoDB'],
    activities: [
      { text: 'Marked attendance at 09:10 AM', time: 'Today, 09:10 AM' },
      { text: 'Pushed code to Project Alpha', time: 'Yesterday, 06:45 PM' }
    ]
  },
  {
    id: 10010,
    userId: 10,
    employeeId: 'TS10010',
    firstName: 'Rushabh',
    lastName: 'Jain',
    email: 'rushabh.jain@tech.com',
    department: 'Engineering',
    designation: 'Full Stack Developer',
    location: 'Surat, Gujarat, India',
    workMode: 'Office',
    joiningDate: '01 Jan 2026',
    status: 'Active',
    phone: '+91 99999 88888',
    managerName: 'Rahul Sharma',
    salary: '₹ 8.5 LPA',
    experience: '2.5 Years',
    attendance: '92%',
    leaveBalance: 18,
    performance: '4.3',
    projects: 3,
    skills: ['React', 'Node.js', 'Next.js', 'TypeScript', 'MongoDB', 'AWS', 'TailwindCSS'],
    activities: [
      { text: 'Marked attendance at 09:15 AM', time: 'Today, 09:15 AM' },
      { text: 'Pushed code to Project Alpha', time: 'Yesterday, 06:45 PM' },
      { text: 'Leave applied for 24 May 2026', time: 'Yesterday, 04:15 PM', status: 'Pending' }
    ]
  },
  {
    id: 10009,
    userId: 9,
    employeeId: 'TS10009',
    firstName: 'Manish',
    lastName: 'Kuswaha',
    email: 'manish.k@tech.com',
    department: 'Engineering',
    designation: 'Full Stack Developer',
    location: 'Surat, GJ / India',
    workMode: 'Remote',
    joiningDate: '01 Jan 2026',
    status: 'Active',
    phone: '+91 99999 77777',
    managerName: 'Rahul Sharma',
    salary: '₹ 8.0 LPA',
    experience: '2.3 Years',
    attendance: '95%',
    leaveBalance: 15,
    performance: '4.4',
    projects: 2,
    skills: ['React', 'Node.js', 'Next.js', 'TypeScript', 'MongoDB'],
    activities: [
      { text: 'Marked attendance at 09:05 AM', time: 'Today, 09:05 AM' }
    ]
  },
  {
    id: 10008,
    userId: 8,
    employeeId: 'TS10008',
    firstName: 'Rituraj',
    lastName: 'Singh',
    email: 'rituraj.s@tech.com',
    department: 'Engineering',
    designation: 'Trainee - Intern',
    location: 'Surat, GJ / India',
    workMode: 'Hybrid',
    joiningDate: '10 Dec 2025',
    status: 'Active',
    phone: '+91 99999 66666',
    managerName: 'Rahul Sharma',
    salary: '₹ 4.5 LPA',
    experience: '6 Months',
    attendance: '94%',
    leaveBalance: 11,
    performance: '4.2',
    projects: 1,
    skills: ['React', 'Node.js', 'Next.js', 'TypeScript', 'MongoDB'],
    activities: [
      { text: 'Marked attendance at 09:12 AM', time: 'Today, 09:12 AM' }
    ]
  },
  {
    id: 10007,
    userId: 7,
    employeeId: 'TS10007',
    firstName: 'Niraj',
    lastName: 'Rajput',
    email: 'niraj.r@tech.com',
    department: 'Engineering',
    designation: 'Trainee - Intern',
    location: 'Surat, GJ / India',
    workMode: 'Remote',
    joiningDate: '10 Dec 2025',
    status: 'Active',
    phone: '+91 99999 55555',
    managerName: 'Rahul Sharma',
    salary: '₹ 4.5 LPA',
    experience: '6 Months',
    attendance: '91%',
    leaveBalance: 10,
    performance: '4.1',
    projects: 1,
    skills: ['React', 'Node.js', 'Next.js', 'TypeScript', 'MongoDB'],
    activities: [
      { text: 'Marked attendance at 09:18 AM', time: 'Today, 09:18 AM' }
    ]
  },
  {
    id: 10006,
    userId: 6,
    employeeId: 'TS10006',
    firstName: 'Aayush',
    lastName: 'Parmar',
    email: 'aayush.p@tech.com',
    department: 'Engineering',
    designation: 'MERN Developer',
    location: 'Surat, GJ / India',
    workMode: 'Office',
    joiningDate: '01 Dec 2025',
    status: 'Active',
    phone: '+91 99999 44444',
    managerName: 'Rahul Sharma',
    salary: '₹ 6.5 LPA',
    experience: '1.5 Years',
    attendance: '93%',
    leaveBalance: 14,
    performance: '4.3',
    projects: 2,
    skills: ['React', 'Node.js', 'Next.js', 'TypeScript', 'MongoDB'],
    activities: [
      { text: 'Marked attendance at 09:11 AM', time: 'Today, 09:11 AM' }
    ]
  },
  {
    id: 10005,
    userId: 5,
    employeeId: 'TS10005',
    firstName: 'Neha',
    lastName: 'Patel',
    email: 'neha.p@tech.com',
    department: 'HR',
    designation: 'HR Executive',
    location: 'Surat, GJ / India',
    workMode: 'Hybrid',
    joiningDate: '20 Nov 2025',
    status: 'Active',
    phone: '+91 99999 33333',
    managerName: 'Sarah Jenkins',
    salary: '₹ 5.0 LPA',
    experience: '1.2 Years',
    attendance: '97%',
    leaveBalance: 16,
    performance: '4.6',
    projects: 1,
    skills: ['Recruiting', 'Onboarding', 'Payroll', 'Employee Relations'],
    activities: [
      { text: 'Marked attendance at 08:55 AM', time: 'Today, 08:55 AM' }
    ]
  }
];

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Workforce Stats State (from API)
  const [workforceStats, setWorkforceStats] = useState<{
    total: number; active: number; onLeave: number; onNotice: number;
    probation: number; contract: number;
  }>({ total: 0, active: 0, onLeave: 0, onNotice: 0, probation: 0, contract: 0 });



  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWorkMode, setFilterWorkMode] = useState('');
  const [filterTag, setFilterTag] = useState('');

  // API Query & Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalResults, setTotalResults] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDepartment, filterStatus, filterWorkMode]);

  // Clear selected rows when page, filters, search, or records change
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, filterDepartment, filterStatus, filterWorkMode, search, employees]);
  
  // Advanced Smart Query Operator States
  const [smartField, setSmartField] = useState('name');
  const [smartOperator, setSmartOperator] = useState('contains');
  const [smartValue, setSmartValue] = useState('');

  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [density, setDensity] = useState<'compact' | 'normal' | 'relaxed'>('normal');

  // Favorites & Tags State (Stored in LocalStorage for safety)
  const [favorites, setFavorites] = useState<number[]>([10010]); // Mark Rushabh Jain as favorite by default
  const [employeeTags, setEmployeeTags] = useState<Record<number, string[]>>({});
  const [tagInput, setTagInput] = useState('');

  // AI Search States
  const [aiInput, setAiInput] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Custom Columns State
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Bulk Actions
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  const [bulkValDept, setBulkValDept] = useState('');
  const [bulkValDesig, setBulkValDesig] = useState('');
  const [bulkValTag, setBulkValTag] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAuditLogsPanel, setShowAuditLogsPanel] = useState(false);

  // Saved Views State
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [newViewName, setNewViewName] = useState('');
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [showSavedViewsDropdown, setShowSavedViewsDropdown] = useState(false);

  // Quick Preview Drawer States (Pre-open Rushabh Jain to match screenshot design)
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);

  // Delete & Modals State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // CSV Import States
  const [showImportPreviewModal, setShowImportPreviewModal] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'validation' | 'success'>('upload');
  const [importFileName, setImportFileName] = useState('');
  const [importErrorEmail, setImportErrorEmail] = useState('alice.tan@invalid');
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite' | 'both'>('skip');
  const [hasImported, setHasImported] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    photo: true,
    empId: true,
    name: true,
    department: true,
    designation: true,
    manager: true,
    type: true,
    location: true,
    experience: true,
    joiningDate: true,
    status: true,
    workMode: true,
    salary: false,
    attendance: false,
    assets: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active User session and Dynamic Exporter parameters
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [exportScope, setExportScope] = useState('Current Page');
  const [excludeSalary, setExcludeSalary] = useState(true);
  const [maskPersonal, setMaskPersonal] = useState(false);

  // CSV parsing states
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [validRowsCount, setValidRowsCount] = useState(0);
  const [errorRowsCount, setErrorRowsCount] = useState(0);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  // Fetch dynamic audit logs on panel open
  useEffect(() => {
    if (showAuditLogsPanel) {
      const fetchLogs = async () => {
        try {
          const token = getStoredSessionToken();
          const res = await fetch('/api/audit-logs', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            const logsList = Array.isArray(json) ? json : (json.data || []);
            if (logsList && Array.isArray(logsList)) {
              const mapped = logsList.map((log: any) => ({
                id: String(log.id),
                action: log.action_name || 'Action',
                timestamp: log.created_at || new Date().toISOString(),
                user: log.action_by || 'Admin',
                details: `${log.old_value ? `From: ${log.old_value} | ` : ''}To: ${log.new_value || 'N/A'} (IP: ${log.ip_address || '127.0.0.1'})`,
              }));
              setAuditLogs(mapped);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchLogs();
    }
  }, [showAuditLogsPanel]);

  // Log audit actions helper
  const addAuditLog = async (action: string, details: string) => {
    const userRole = (currentUser?.role || 'developer').toLowerCase();
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(7),
      action,
      timestamp: new Date().toISOString(),
      user: currentUser?.email || 'System',
      details,
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100));

    // Persist this action using settings_audit_logs if admin
    if (userRole === 'admin' || userRole === 'hr_manager') {
      try {
        const token = getStoredSessionToken();
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'create_log',
            actionName: action,
            newValue: details
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // CSV File Upload selector
  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rows = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (rows.length < 2) {
        toast.error('CSV file must contain a header and at least one data row');
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const dataRows = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      setCsvRows(dataRows);

      let valid = 0;
      let invalid = 0;
      dataRows.forEach(row => {
        const email = row['Email'] || row['email'] || row['Email Address'] || '';
        if (email.includes('@')) {
          valid++;
        } else {
          invalid++;
        }
      });

      setValidRowsCount(valid);
      setErrorRowsCount(invalid);
      setImportStep('mapping');
    };
    reader.readAsText(file);
  };

  // Exporter Implementation
  const triggerExport = async (format: string) => {
    let dataset: Employee[] = [];
    if (exportScope.startsWith('Current Page')) {
      dataset = filteredEmployees;
    } else if (exportScope.startsWith('Selected rows')) {
      dataset = filteredEmployees.filter(e => selectedIds.includes(e.id));
      if (dataset.length === 0) {
        toast.error('No rows selected for export');
        return;
      }
    } else {
      try {
        const token = getStoredSessionToken();
        const res = await fetch('/api/employees?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          dataset = json.data || [];
        }
      } catch (err) {
        console.error('Failed to fetch entire workforce for export:', err);
      }
    }

    if (format === 'PDF') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to export PDF');
        return;
      }
      const rowsHtml = dataset.map(emp => `
        <tr>
          <td>${emp.employeeId}</td>
          <td>${emp.firstName} ${emp.lastName}</td>
          <td>${emp.email}</td>
          <td>${emp.department}</td>
          <td>${emp.designation}</td>
          <td>${emp.joiningDate || '—'}</td>
          <td>${excludeSalary ? 'Confidential' : (emp.salary || '—')}</td>
          <td>${emp.status}</td>
        </tr>
      `).join('');

      const html = `
        <html>
          <head>
            <title>Workforce Directory Report</title>
            <style>
              body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; padding: 40px; }
              h1 { margin: 0 0 5px 0; font-size: 22px; color: #0f172a; }
              p { margin: 0 0 20px 0; font-size: 12px; color: #64748b; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
              th { background: #f1f5f9; font-weight: 600; color: #475569; }
            </style>
          </head>
          <body>
            <h1>Workforce Directory Report</h1>
            <p>Generated: ${new Date().toLocaleString()} | Scope: ${exportScope} | Format: PDF</p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joined</th>
                  <th>Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      toast.success('PDF Report generated successfully');
    } else {
      const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Joining Date', 'Salary', 'Status'];
      const rows = dataset.map(emp => [
        emp.employeeId,
        `${emp.firstName} ${emp.lastName}`,
        maskPersonal ? '***@***.***' : emp.email,
        emp.department,
        emp.designation,
        emp.joiningDate || '',
        excludeSalary ? 'Confidential' : (emp.salary || ''),
        emp.status
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `workforce_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Export downloaded successfully');
    }

    addAuditLog('Dataset Exported', `Generated ${format} report for ${dataset.length} profiles.`);
    setShowExportModal(false);
  };

  const fetchEmployeesData = async () => {
    setLoading(true);
    try {
      const token = getStoredSessionToken();
      const params = new URLSearchParams();
      params.set('limit', String(pageSize));
      params.set('offset', String((currentPage - 1) * pageSize));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterDepartment) params.set('department', filterDepartment);
      if (filterStatus) {
        let statusVal = filterStatus.toLowerCase();
        if (statusVal === 'notice period') statusVal = 'on_notice';
        else if (statusVal === 'on leave') statusVal = 'on_leave';
        params.set('status', statusVal);
      }
      if (filterWorkMode) {
        params.set('workMode', filterWorkMode.toLowerCase());
      }
      if (sortField) params.set('sort', sortField);
      if (sortOrder) params.set('order', sortOrder);

      const res = await fetch(`/api/employees?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        const empList = Array.isArray(json) ? json : (json.data || []);
        const meta = Array.isArray(json) ? (json as any).meta : (json.meta || null);
        setEmployees(empList);
        setTotalResults(meta?.total || empList.length || 0);
      } else {
        toast.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('An error occurred while fetching employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
  }, [currentPage, pageSize, debouncedSearch, filterDepartment, filterStatus, filterWorkMode, sortField, sortOrder]);

  // Fetch workforce stats for analytics cards
  useEffect(() => {
    const fetchWorkforceStats = async () => {
      try {
        const token = getStoredSessionToken();
        const res = await fetch('/api/dashboard/stats/workforce', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const stats = (json && typeof json === 'object' && !('success' in json)) ? json : (json?.data || null);
          if (stats) {
            setWorkforceStats({
              total: stats.total ?? 0,
              active: stats.active ?? 0,
              onLeave: stats.onLeave ?? 0,
              onNotice: stats.onNotice ?? 0,
              probation: stats.probation ?? 0,
              contract: stats.contract ?? 0,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch workforce stats:', err);
      }
    };
    fetchWorkforceStats();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const totalPages = Math.ceil(totalResults / pageSize);
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Load local settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFavs = localStorage.getItem('employee_directory_favorites');
      if (storedFavs) setFavorites(JSON.parse(storedFavs));

      const storedTags = localStorage.getItem('employee_directory_tags');
      if (storedTags) setEmployeeTags(JSON.parse(storedTags));

      const storedViews = localStorage.getItem('employee_directory_saved_views');
      if (storedViews) {
        setSavedViews(JSON.parse(storedViews));
      } else {
        const defaultViews: SavedView[] = [
          { name: 'All Engineers', search: '', status: 'Active', department: 'Engineering', designation: '', workMode: '', tag: '', scope: 'Organization' },
          { name: 'Active HR Staff', search: '', status: 'Active', department: 'HR', designation: '', workMode: '', tag: '', scope: 'Organization' },
          { name: 'Remote Workers', search: '', status: 'Active', department: '', designation: '', workMode: 'Remote', tag: '', scope: 'Organization' }
        ];
        setSavedViews(defaultViews);
        localStorage.setItem('employee_directory_saved_views', JSON.stringify(defaultViews));
      }

      const storedLogs = localStorage.getItem('employee_directory_audit_logs');
      if (storedLogs) setAuditLogs(JSON.parse(storedLogs));
    }
  }, []);

  const getStatusColor = (status?: string | null) => {
    switch ((status || 'active').toLowerCase()) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'on_leave': return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'resigned': return 'bg-rose-50 text-rose-700 border-rose-200/50';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/50';
    }
  };

  const getDensityPadding = () => {
    if (density === 'compact') return 'p-1.5 h-10';
    if (density === 'relaxed') return 'p-4 h-18';
    return 'p-3 h-14';
  };

  const getWorkModeColor = (mode?: string | null) => {
    switch ((mode || 'office').toLowerCase()) {
      case 'hybrid': return 'bg-purple-50 text-purple-700 border-purple-200/30';
      case 'office': return 'bg-orange-50 text-orange-700 border-orange-200/30';
      case 'remote': return 'bg-blue-50 text-blue-700 border-blue-200/30';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/30';
    }
  };

  // Toggle Favorite Star
  const toggleFavorite = (id: number) => {
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
      toast.success('Removed from favorites');
      addAuditLog('Favorite Removed', `Employee ID ${id} unstarred.`);
    } else {
      updated = [...favorites, id];
      toast.success('Added to favorites');
      addAuditLog('Favorite Added', `Employee ID ${id} starred.`);
    }
    setFavorites(updated);
    localStorage.setItem('employee_directory_favorites', JSON.stringify(updated));
  };

  // Tags Actions
  const addTagToEmployee = (employeeId: number, tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    const currentTags = employeeTags[employeeId] || [];
    if (currentTags.includes(cleanTag)) {
      toast.error('Tag already exists');
      return;
    }
    const updated = { ...employeeTags, [employeeId]: [...currentTags, cleanTag] };
    setEmployeeTags(updated);
    localStorage.setItem('employee_directory_tags', JSON.stringify(updated));
    toast.success(`Tag "${cleanTag}" added`);
    addAuditLog('Add Tag', `Added tag "${cleanTag}" to employee ID ${employeeId}.`);
  };

  const removeTagFromEmployee = (employeeId: number, tag: string) => {
    const currentTags = employeeTags[employeeId] || [];
    const updated = { ...employeeTags, [employeeId]: currentTags.filter(t => t !== tag) };
    setEmployeeTags(updated);
    localStorage.setItem('employee_directory_tags', JSON.stringify(updated));
    toast.success(`Tag "${tag}" removed`);
    addAuditLog('Remove Tag', `Removed tag "${tag}" from employee ID ${employeeId}.`);
  };

  // AI Natural Language Search parser
  const handleAiSearchSubmit = (query: string) => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return;

    // Simulate filter update based on keywords
    if (cleanQuery.includes('engineering')) setFilterDepartment('Engineering');
    if (cleanQuery.includes('active')) setFilterStatus('Active');
    if (cleanQuery.includes('hybrid')) setFilterWorkMode('Hybrid');
    
    setAiInput(query);
    setShowAiPanel(false);
    toast.success(`AI Search configured filters for: "${query}"`);
    addAuditLog('AI Search Query', `Searched query: "${query}".`);
  };

  // Saved Views Actions
  const handleSaveView = () => {
    const name = newViewName.trim();
    if (!name) return;

    const newView: SavedView = {
      name,
      search,
      status: filterStatus,
      department: filterDepartment,
      designation: '',
      workMode: filterWorkMode,
      tag: filterTag,
      scope: 'Private',
    };

    const updated = [...savedViews, newView];
    setSavedViews(updated);
    localStorage.setItem('employee_directory_saved_views', JSON.stringify(updated));
    setNewViewName('');
    setShowSaveViewModal(false);
    toast.success(`Saved view "${name}" created`);
  };

  const applySavedView = (view: SavedView) => {
    setSearch(view.search);
    setFilterStatus(view.status);
    setFilterDepartment(view.department);
    setFilterWorkMode(view.workMode);
    setFilterTag(view.tag);
    toast.success(`Loaded view: ${view.name}`);
  };

  // Clean all filters
  const clearAllFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterDepartment('');
    setFilterWorkMode('');
    setFilterTag('');
    setSmartValue('');
    toast.info('All filters cleared');
  };

  // Single Delete
  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees?id=${selectedEmployee.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success(`Successfully removed employee`);
        fetchEmployeesData();
        if (previewEmployee?.id === selectedEmployee.id) setPreviewEmployee(null);
      } else {
        const errJson = await res.json();
        toast.error(errJson.message || 'Failed to delete employee');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredEmployees.map(emp => emp.id));
      if (filteredEmployees.length > 0) {
        setPreviewEmployee(filteredEmployees[0]);
      }
    } else {
      setSelectedIds([]);
      setPreviewEmployee(null);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
      const emp = employees.find(e => e.id === id);
      if (emp) setPreviewEmployee(emp);
    } else {
      setSelectedIds(prev => prev.filter(rowId => rowId !== id));
      setPreviewEmployee(prev => {
        if (prev?.id === id) {
          const remainingIds = selectedIds.filter(rowId => rowId !== id);
          const activeIds = remainingIds.filter(rowId => rowId !== id);
          if (activeIds.length > 0) {
            return employees.find(e => e.id === activeIds[activeIds.length - 1]) || null;
          }
          return null;
        }
        return prev;
      });
    }
  };

  const executeBulkAction = async () => {
    if (!bulkActionType) return;
    toast.success(`Successfully applied bulk action: ${bulkActionType} to ${selectedIds.length} employees`);
    setSelectedIds([]);
    setBulkActionType(null);
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    toast.success("CSV export triggered for filtered results");
  };

  // Smart Query filter mapping logic
  const matchSmartQuery = (emp: Employee): boolean => {
    if (!smartValue) return true;
    const target = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return target.includes(smartValue.toLowerCase());
  };

  // Full filter criteria pipeline
  const filteredEmployees = employees.filter(emp => {
    if (!matchSmartQuery(emp)) return false;
    return true;
  });

  return (
    <div className="flex bg-[#FDFCFD] dark:bg-[#15161A] text-slate-800 dark:text-[#fdfcfc] min-h-[calc(100vh-120px)] relative overflow-hidden -m-6 p-6">
      
      {/* MAIN CONTAINER WORKSPACE */}
      <div className={`flex-1 flex flex-col gap-6 overflow-y-auto transition-all duration-300 ${previewEmployee ? 'pr-[440px]' : 'pr-0'}`}>
        
        {/* BREADCRUMB & HEADER ACTIONS ROW */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span>Employees</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-600 dark:text-slate-400 font-bold">Employee Directory</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-[#fdfcfc] tracking-tight">Employee Directory</h1>
              <HelpCircle className="h-4.5 w-4.5 text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Search, filter and manage all employees in your organization.</p>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleCSVFileSelect} 
            />

            <Link href="/dashboard/employees/new">
              <Button className="bg-[#f87941] text-white hover:bg-[#e06634] font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(248,121,65,0.15)]">
                <UserPlus className="h-4 w-4" /> Add Employee
              </Button>
            </Link>
            
             <Button 
              onClick={() => setShowImportPreviewModal(true)} 
              variant="outline" 
              className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-350"
            >
              <Upload className="h-4 w-4" /> Import
            </Button>

            <Button 
              onClick={() => setShowExportModal(true)} 
              variant="outline" 
              className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-350"
            >
              <Download className="h-4 w-4" /> Export
            </Button>

            <Button 
              onClick={() => setShowAlertsDrawer(true)} 
              variant="outline" 
              className="border-slate-200 dark:border-slate-800 h-9 w-9 p-0 rounded-xl relative"
            >
              <Bell className="h-4 w-4 text-slate-500 hover:text-slate-700" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full animate-ping" />
            </Button>

            <Button 
              onClick={() => setShowSettingsDrawer(true)} 
              variant="outline" 
              className="border-slate-200 dark:border-slate-800 h-9 w-9 p-0 rounded-xl"
            >
              <Settings className="h-4 w-4 text-slate-500 hover:text-slate-750" />
            </Button>

            <Button 
              onClick={() => setShowAuditLogsPanel(true)} 
              variant="outline" 
              className="border-slate-200 dark:border-slate-800 h-9 w-9 p-0 rounded-xl"
            >
              <History className="h-4 w-4 text-indigo-500 hover:text-indigo-650" />
            </Button>
          </div>
        </div>

        {/* ANALYTICS STATS CARDS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Total Employees', count: String(workforceStats.total), desc: `All employees`, filter: '', iconBg: 'bg-[#f87941]/10 text-[#f87941]' },
            { label: 'Active', count: String(workforceStats.active), desc: workforceStats.total > 0 ? `${((workforceStats.active / workforceStats.total) * 100).toFixed(1)}% of total` : '—', filter: 'Active', iconBg: 'bg-emerald-500/10 text-emerald-600' },
            { label: 'On Leave', count: String(workforceStats.onLeave), desc: workforceStats.total > 0 ? `${((workforceStats.onLeave / workforceStats.total) * 100).toFixed(1)}% of total` : '—', filter: 'On Leave', iconBg: 'bg-amber-500/10 text-amber-600' },
            { label: 'On Notice', count: String(workforceStats.onNotice), desc: workforceStats.total > 0 ? `${((workforceStats.onNotice / workforceStats.total) * 100).toFixed(1)}% of total` : '—', filter: 'On Notice', iconBg: 'bg-orange-500/10 text-orange-600' },
            { label: 'Probation', count: String(workforceStats.probation), desc: workforceStats.total > 0 ? `${((workforceStats.probation / workforceStats.total) * 100).toFixed(1)}% of total` : '—', filter: 'Probation', iconBg: 'bg-blue-500/10 text-blue-600' },
            { label: 'Contract', count: String(workforceStats.contract), desc: workforceStats.total > 0 ? `${((workforceStats.contract / workforceStats.total) * 100).toFixed(1)}% of total` : '—', filter: 'Contract', iconBg: 'bg-indigo-500/10 text-indigo-600' },
          ].map((card) => (
            <Card 
              key={card.label}
              onClick={() => {
                if (card.filter) {
                  setFilterStatus(card.filter);
                } else {
                  clearAllFilters();
                }
              }}
              className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 bg-white dark:bg-[#1E1F22] rounded-2xl p-3 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Users className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block leading-none">{card.label}</span>
                <span className="text-lg font-black text-slate-900 dark:text-[#fdfcfc] mt-1 block leading-none">{card.count}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 block leading-none">{card.desc}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* SEARCH, AI SEARCH, FILTERS & SAVED VIEWS ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 p-3 rounded-2xl shadow-sm">
          
          <div className="flex-1 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#fdfcfd] dark:bg-[#15161A] border-slate-200 dark:border-slate-800 h-9 rounded-xl text-xs placeholder-slate-400 font-medium"
              />
            </div>
            
            <Button 
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs h-9 px-3 rounded-xl flex items-center gap-1 border border-purple-200/30 shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Search
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowAiInsights(!showAiInsights)}
              variant="outline" 
              className="border-slate-200 dark:border-slate-800 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5 text-slate-650 dark:text-slate-350"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" /> AI Insights
            </Button>

            <Button 
              onClick={() => setShowFilters(!showFilters)}
              variant="outline" 
              className={`border-slate-200 dark:border-slate-800 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-350 ${showFilters ? 'bg-slate-50' : ''}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters 
              <Badge className="bg-[#f87941] text-white text-[9px] font-bold h-4.5 min-w-4.5 flex items-center justify-center p-0 rounded-full ml-1">
                {((filterDepartment ? 1 : 0) + (filterStatus ? 1 : 0) + (filterWorkMode ? 1 : 0))}
              </Badge>
            </Button>

            <div className="relative">
              <Button 
                onClick={() => setShowSavedViewsDropdown(!showSavedViewsDropdown)} 
                variant="outline" 
                className="border-slate-200 dark:border-slate-800 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-350"
              >
                <Bookmark className="h-3.5 w-3.5 text-[#f87941]" /> Saved Views
              </Button>

              {showSavedViewsDropdown && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-2xl p-3 shadow-xl z-50 flex flex-col gap-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider pb-1.5 border-b border-[#e6e4e6]/10 flex items-center justify-between">
                    <span>Select a View</span>
                    <button onClick={() => setShowSavedViewsDropdown(false)} className="text-slate-450 hover:text-slate-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col max-h-48 overflow-y-auto gap-1">
                    {savedViews.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic text-center py-4">No saved views yet.</p>
                    ) : (
                      savedViews.map((view, idx) => (
                        <div key={idx} className="flex items-center justify-between group rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/30 px-2 py-1.5 transition-colors">
                          <button
                            onClick={() => {
                              applySavedView(view);
                              setShowSavedViewsDropdown(false);
                            }}
                            className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#f87941] truncate flex-grow"
                          >
                            {view.name}
                          </button>
                          <button
                            onClick={() => {
                              const updated = savedViews.filter((_, i) => i !== idx);
                              setSavedViews(updated);
                              localStorage.setItem('employee_directory_saved_views', JSON.stringify(updated));
                              toast.success(`Removed view: ${view.name}`);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-450 hover:text-rose-500 transition-opacity p-0.5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-[#e6e4e6]/10 pt-1.5 mt-1">
                    <Button
                      onClick={() => {
                        setShowSaveViewModal(true);
                        setShowSavedViewsDropdown(false);
                      }}
                      className="w-full bg-[#f87941]/10 hover:bg-[#f87941]/20 text-[#f87941] border border-transparent font-bold text-xs h-8 rounded-xl flex items-center justify-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Save Current View
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl">
              <Button
                onClick={() => setViewMode('list')}
                className={`h-8 w-8 p-0 rounded-lg ${viewMode === 'list' ? 'bg-[#fdfcfd] dark:bg-[#1E1F22] text-[#f87941] shadow-sm' : 'text-slate-400 bg-transparent'}`}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode('grid')}
                className={`h-8 w-8 p-0 rounded-lg ${viewMode === 'grid' ? 'bg-[#fdfcfd] dark:bg-[#1E1F22] text-[#f87941] shadow-sm' : 'text-slate-400 bg-transparent'}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* AI PANEL DROPDOWN QUERY ASSISTANT */}
        {showAiPanel && (
          <Card className="border border-purple-200 bg-purple-50/50 p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-purple-200/30 pb-2">
              <p className="text-xs font-black uppercase text-purple-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI Query Assistant
              </p>
              <Button onClick={() => setShowAiPanel(false)} variant="ghost" className="h-6 w-6 p-0 text-purple-400 hover:text-purple-600 rounded-full">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="AI: e.g. 'show hybrid developers'..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAiSearchSubmit(aiInput); }}
                className="h-9 text-xs rounded-xl border-purple-200"
              />
              <Button onClick={() => handleAiSearchSubmit(aiInput)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl h-9">
                Search
              </Button>
            </div>
          </Card>
        )}

        {/* ACTIVE FILTERS ROW */}
        {((filterDepartment || filterStatus || filterWorkMode)) && (
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {filterDepartment && (
              <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 border-none font-bold text-xs py-1 px-2.5 rounded-xl flex items-center gap-1.5">
                Department: {filterDepartment}
                <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setFilterDepartment('')} />
              </Badge>
            )}
            {filterStatus && (
              <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 border-none font-bold text-xs py-1 px-2.5 rounded-xl flex items-center gap-1.5">
                Status: {filterStatus}
                <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setFilterStatus('')} />
              </Badge>
            )}
            {filterWorkMode && (
              <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-700 border-none font-bold text-xs py-1 px-2.5 rounded-xl flex items-center gap-1.5">
                Work Mode: {filterWorkMode}
                <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setFilterWorkMode('')} />
              </Badge>
            )}
            <button onClick={clearAllFilters} className="text-[#f87941] hover:text-[#e06634] font-bold text-xs pl-1">
              Clear all
            </button>
          </div>
        )}

        {/* BULK SELECTION ACTION ROW */}
        {selectedIds.length > 0 && (currentUser?.role === 'admin' || currentUser?.role === 'hr_manager' || currentUser?.role === 'project_manager') && (
          <div className="flex items-center gap-3 bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 p-2 px-4 rounded-xl shadow-sm animate-slide-up">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedIds.length} selected</span>
            <button onClick={() => setSelectedIds(filteredEmployees.map(e => e.id))} className="text-[#f87941] hover:text-[#e06634] text-xs font-bold">
              Select all {filteredEmployees.length} results
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            
            <select
              value={bulkActionType || ''}
              onChange={(e) => setBulkActionType(e.target.value || null)}
              className="h-8 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 px-3 cursor-pointer outline-none"
            >
              <option value="">Bulk Actions</option>
              <option value="Update Department">Update Department</option>
              <option value="Transfer Manager">Transfer Manager</option>
              <option value="Update Designation">Update Designation</option>
              <option value="Assign Project">Assign Project</option>
              <option value="Assign Shift">Assign Shift</option>
              <option value="Assign Asset">Assign Asset</option>
              <option value="Activate">Activate Profiles</option>
              <option value="Deactivate">Deactivate Profiles</option>
              <option value="Archive">Archive Records</option>
              <option value="Generate Letters">Generate Letters</option>
              <option value="Move Business Unit">Move Business Unit</option>
            </select>

            <Button 
              onClick={() => setBulkActionType('Tag')} 
              variant="outline" 
              className="h-8 text-xs font-bold rounded-lg border-slate-200 text-slate-600 px-3 flex items-center gap-1"
            >
              <Bookmark className="h-3.5 w-3.5" /> Tag
            </Button>
            
            <Button 
              onClick={() => setBulkActionType('Email')} 
              variant="outline" 
              className="h-8 text-xs font-bold rounded-lg border-slate-200 text-slate-600 px-3 flex items-center gap-1"
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </Button>

            <Button 
              onClick={() => {
                if (['Tag', 'Email'].includes(bulkActionType || '')) {
                  executeBulkAction();
                } else if (bulkActionType) {
                  setShowBulkModal(true);
                }
              }} 
              disabled={!bulkActionType} 
              className="bg-[#f87941] text-white hover:bg-[#e06634] text-xs font-bold h-8 rounded-lg px-3"
            >
              Apply
            </Button>
          </div>
        )}

        {/* EMPLOYEE LISTING TABLE */}
        {loading ? (
          <InlineTableSkeleton />
        ) : (
          <div className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-2xl overflow-hidden shadow-sm flex flex-col flex-grow">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e6e4e6]/25 dark:border-[#2f3035]/25 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className={`${density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'} w-10 text-center`}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded text-[#f87941] focus:ring-[#f87941] h-4 w-4 border-slate-350 cursor-pointer"
                      />
                    </th>
                    {visibleColumns.name && <th className={density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'}>Employee</th>}
                    {visibleColumns.empId && (
                      <th 
                        onClick={() => handleSort('employeeId')}
                        className={`${density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none`}
                      >
                        <div className="flex items-center gap-1">
                          <span>Employee ID</span>
                          {sortField === 'employeeId' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-[#f87941]" /> : <ChevronDown className="h-3 w-3 text-[#f87941]" />)}
                        </div>
                      </th>
                    )}
                    {visibleColumns.department && (
                      <th 
                        onClick={() => handleSort('department')}
                        className={`${density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none`}
                      >
                        <div className="flex items-center gap-1">
                          <span>Department</span>
                          {sortField === 'department' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-[#f87941]" /> : <ChevronDown className="h-3 w-3 text-[#f87941]" />)}
                        </div>
                      </th>
                    )}
                    {visibleColumns.designation && (
                      <th 
                        onClick={() => handleSort('designation')}
                        className={`${density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none`}
                      >
                        <div className="flex items-center gap-1">
                          <span>Designation</span>
                          {sortField === 'designation' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-[#f87941]" /> : <ChevronDown className="h-3 w-3 text-[#f87941]" />)}
                        </div>
                      </th>
                    )}
                    {visibleColumns.manager && <th className={density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'}>Reporting Manager</th>}
                    {visibleColumns.type && <th className={density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'}>Employment Type</th>}
                    {visibleColumns.location && <th className={density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'}>Location</th>}
                    {visibleColumns.experience && <th className={density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'}>Experience</th>}
                    {visibleColumns.joiningDate && (
                      <th 
                        onClick={() => handleSort('dateOfJoining')}
                        className={`${density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none`}
                      >
                        <div className="flex items-center gap-1">
                          <span>Joining Date</span>
                          {sortField === 'dateOfJoining' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-[#f87941]" /> : <ChevronDown className="h-3 w-3 text-[#f87941]" />)}
                        </div>
                      </th>
                    )}
                    {visibleColumns.workMode && <th className={density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'}>Work Mode</th>}
                    {visibleColumns.salary && (
                      <th 
                        onClick={() => handleSort('salary')}
                        className={`${density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none`}
                      >
                        <div className="flex items-center gap-1">
                          <span>Salary (CTC)</span>
                          {sortField === 'salary' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-[#f87941]" /> : <ChevronDown className="h-3 w-3 text-[#f87941]" />)}
                        </div>
                      </th>
                    )}
                    {visibleColumns.attendance && <th className={density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'}>Attendance %</th>}
                    {visibleColumns.assets && <th className={density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'}>Assets Assigned</th>}
                    {visibleColumns.status && (
                      <th 
                        onClick={() => handleSort('status')}
                        className={`${density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none`}
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-[#f87941]" /> : <ChevronDown className="h-3 w-3 text-[#f87941]" />)}
                        </div>
                      </th>
                    )}
                    <th className={`${density === 'compact' ? 'p-1.5' : density === 'relaxed' ? 'p-4' : 'p-3'} text-center w-20`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e4e6]/10 dark:divide-[#2f3035]/10 text-xs">
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedIds.includes(emp.id);
                    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                    const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() || 'EE';
                    const cellPaddingClass = getDensityPadding();

                    return (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-slate-50/30 dark:hover:bg-slate-900/10 cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''
                        }`}
                        onClick={() => setPreviewEmployee(emp)}
                      >
                        <td className={`${cellPaddingClass} text-center`} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(emp.id, e.target.checked)}
                            className="rounded text-[#f87941] focus:ring-[#f87941] h-4 w-4 border-slate-350 cursor-pointer"
                          />
                        </td>
                        {visibleColumns.name && (
                          <td className={cellPaddingClass}>
                            <div className="flex items-center gap-2.5">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(emp.id);
                                }}
                                className="focus:outline-none"
                              >
                                <Star className={`h-4 w-4 transition-colors ${favorites.includes(emp.id) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-350 hover:text-yellow-400'}`} />
                              </button>
                              <div className="relative">
                                <Avatar className="h-8 w-8 rounded-xl font-bold bg-[#f87941]/10 text-[#f87941] border border-slate-200/50">
                                  <AvatarFallback className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">{initials}</AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-extrabold text-slate-800 dark:text-[#fdfcfc] hover:text-[#f87941] transition-colors">{fullName}</span>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{emp.email}</span>
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.empId && <td className={`${cellPaddingClass} font-bold text-[#f87941]`}>{emp.employeeId}</td>}
                        {visibleColumns.department && <td className={`${cellPaddingClass} text-slate-600 dark:text-slate-300 font-semibold`}>{emp.department}</td>}
                        {visibleColumns.designation && <td className={`${cellPaddingClass} text-slate-600 dark:text-slate-400 font-medium`}>{emp.designation}</td>}
                        {visibleColumns.manager && <td className={`${cellPaddingClass} text-slate-500 font-semibold`}>{emp.managerName || 'Not Assigned'}</td>}
                        {visibleColumns.type && <td className={`${cellPaddingClass} text-slate-500 font-semibold`}>{emp.employmentType || '—'}</td>}
                        {visibleColumns.location && <td className={`${cellPaddingClass} text-slate-400 font-medium leading-tight`}>{emp.location || '—'}</td>}
                        {visibleColumns.experience && <td className={`${cellPaddingClass} text-slate-500 font-semibold`}>{emp.experience || '—'}</td>}
                        {visibleColumns.joiningDate && <td className={`${cellPaddingClass} text-slate-500 font-semibold`}>{emp.joiningDate}</td>}
                        {visibleColumns.workMode && (
                          <td className={cellPaddingClass}>
                            <Badge variant="outline" className={`text-[9px] uppercase font-black px-2 py-0.5 border-transparent ${getWorkModeColor(emp.workMode)}`}>
                              {emp.workMode}
                            </Badge>
                          </td>
                        )}
                        {visibleColumns.salary && (
                          <td className={`${cellPaddingClass} font-semibold text-slate-600`}>
                            {!(currentUser?.role === 'admin' || currentUser?.role === 'hr_manager' || currentUser?.role === 'accountant') ? 'Confidential' : (emp.salary || '—')}
                          </td>
                        )}
                        {visibleColumns.attendance && <td className={`${cellPaddingClass} font-semibold text-slate-600`}>{emp.attendance || '—'}</td>}
                        {visibleColumns.assets && <td className={`${cellPaddingClass} font-semibold text-slate-600`}>{emp.assets || 'None'}</td>}
                        {visibleColumns.status && (
                          <td className={cellPaddingClass}>
                            <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0.5 border border-transparent ${getStatusColor(emp.status)}`}>
                              {emp.status}
                            </Badge>
                          </td>
                        )}
                        <td className={`${cellPaddingClass} text-center`} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <Link href={`/dashboard/employees/${emp.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-[#f87941] rounded-lg">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'hr_manager') && (
                              <>
                                <Link href={`/dashboard/employees/new?id=${emp.id}`}>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-[#f87941] rounded-lg">
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                                  onClick={() => { setSelectedEmployee(emp); setDeleteDialogOpen(true); }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls matching design */}
            <div className="flex items-center justify-between p-4 border-t border-[#e6e4e6]/10 mt-auto bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-400">
                Showing {totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalResults)} of {totalResults} results
              </span>
              
              <div className="flex items-center gap-1 text-xs">
                <Button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 border-slate-200 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-50"
                >
                  &lt;
                </Button>
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return <span key={`dots-${idx}`} className="text-slate-400 px-1 font-semibold">...</span>;
                  }
                  const isCurrent = currentPage === p;
                  return (
                    <Button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(Number(p))}
                      className={`h-7 w-7 p-0 rounded-lg shadow-sm text-xs font-bold ${
                        isCurrent 
                          ? 'bg-[#fdfcfd] border border-[#f87941] text-[#f87941]' 
                          : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalResults / pageSize)))}
                  disabled={currentPage >= Math.ceil(totalResults / pageSize)}
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 border-slate-200 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-50"
                >
                  &gt;
                </Button>
              </div>

              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 px-2 outline-none bg-white dark:bg-[#1E1F22] dark:border-slate-800"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

          </div>
        )}

      </div>

      {/* RIGHT SIDE FIXED PREVIEW PANEL */}
      {previewEmployee && (
        <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-white dark:bg-[#1E1F22] border-l border-[#e6e4e6]/30 dark:border-[#2f3035]/30 p-5 flex flex-col gap-4 overflow-y-auto z-10 shadow-lg animate-in slide-in-from-right duration-300">
          
          {/* Drawer Toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e6e4e6]/10">
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600">
              <Pin className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setPreviewEmployee(null)} 
              variant="ghost" 
              className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-4 text-left">
            
            {/* Header Identity details */}
            <div className="flex flex-col items-center text-center py-4 border-b border-[#e6e4e6]/10 gap-3">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-slate-200">
                  <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-black text-xl">
                    {`${previewEmployee.firstName?.[0] || ''}${previewEmployee.lastName?.[0] || ''}`.toUpperCase() || 'EE'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-[#fdfcfc]">
                  {`${previewEmployee.firstName || ''} ${previewEmployee.lastName || ''}`.trim() || 'Employee'}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-0.5">{previewEmployee.employeeId}</p>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mt-1">{previewEmployee.designation}</p>
                <p className="text-[11px] font-bold text-slate-400">{previewEmployee.department} Department &bull; {previewEmployee.location}</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <a href={`mailto:${previewEmployee.email}`} className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 rounded-xl transition-all border border-slate-200/20">
                <Mail className="h-4.5 w-4.5 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-500">Email</span>
              </a>
              <a href={`tel:${previewEmployee.phone || ''}`} className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 rounded-xl transition-all border border-slate-200/20">
                <Phone className="h-4.5 w-4.5 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-500">Call</span>
              </a>
              <button className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 rounded-xl transition-all border border-slate-200/20">
                <MessageSquare className="h-4.5 w-4.5 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-500">Chat</span>
              </button>
              <Link href={`/dashboard/employees/${previewEmployee.id}`} className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 rounded-xl transition-all border border-slate-200/20">
                <Eye className="h-4.5 w-4.5 text-[#f87941]" />
                <span className="text-[9px] font-bold text-slate-500">Profile</span>
              </Link>
            </div>

            {/* Key Information section */}
            <div>
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Key Information</span>
                <Link href={`/dashboard/employees/${previewEmployee.id}`} className="text-[10px] font-bold text-[#f87941] hover:underline flex items-center">
                  View Full Profile <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Joining Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.joiningDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Employment Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.employmentType || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Work Mode</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.workMode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Reporting Manager</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Avatar className="h-4.5 w-4.5">
                      <AvatarFallback className="text-[8px] bg-slate-100 font-bold">RM</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.managerName || 'Not Assigned'}</span>
                  </div>
                </div>
                {(currentUser?.role === 'admin' || currentUser?.role === 'hr_manager' || currentUser?.role === 'accountant') && (
                  <div>
                    <span className="text-slate-400 block font-semibold">Salary (CTC)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.salary || '—'}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block font-semibold">Experience</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.experience || '—'}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div>
              <div className="border-b pb-2 mb-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quick Stats</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{previewEmployee.attendance || '—'}</span>
                  <span className="text-[8px] font-bold text-slate-400 block mt-1">This Month</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{previewEmployee.leaveBalance ?? '—'}</span>
                  <span className="text-[8px] font-bold text-slate-400 block mt-1">Days Left</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                  <span className="text-lg font-black text-purple-600">{previewEmployee.performance || '—'}</span>
                  <span className="text-[8px] font-bold text-slate-400 block mt-1">Rating Score</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{previewEmployee.projects ?? '—'}</span>
                  <span className="text-[8px] font-bold text-slate-400 block mt-1">Active Projects</span>
                </div>
              </div>
            </div>

            {/* Skills tag section */}
            <div>
              <div className="border-b pb-2 mb-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Skills</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(previewEmployee.skills && previewEmployee.skills.length > 0 ? previewEmployee.skills : []).map(skill => (
                  <Badge key={skill} className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-350 border border-slate-200 text-[10px] font-bold px-2 py-0.5">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recent Activity timeline */}
            <div>
              <div className="border-b pb-2 mb-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recent Activity</span>
              </div>
              <div className="flex flex-col gap-3 text-xs pl-2.5 border-l border-slate-200 ml-1.5">
                {(previewEmployee.activities && previewEmployee.activities.length > 0 ? previewEmployee.activities : [
                  { text: 'No recent activity recorded', time: '—' }
                ]).map((act, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[14.5px] top-1.5 h-2 w-2 bg-[#f87941] rounded-full ring-4 ring-white" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">{act.text}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{act.time}</p>
                  </div>
                ))}
              </div>
              <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 mt-4 block">
                View Full Timeline &gt;
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. MODALS & SUBMODALS DIALOGS */}

      {/* Save View Modal */}
      {showSaveViewModal && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-scale-up">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-[#fdfcfc]">Save Current View</h3>
            <p className="text-xs text-slate-400">Specify details to capture current filter conditions.</p>
            <Input
              placeholder="e.g. My Team Engineering"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              className="h-10 rounded-xl"
            />
            <div className="flex gap-2 justify-end mt-2">
              <Button onClick={() => setShowSaveViewModal(false)} variant="outline" className="rounded-xl text-xs font-bold h-9">
                Cancel
              </Button>
              <Button onClick={handleSaveView} className="bg-[#f87941] text-white hover:bg-[#e06634] rounded-xl text-xs font-bold h-9 px-4">
                Save View
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-[#fdfcfc] font-extrabold">Remove Employee</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-[#b1b1b1] text-xs leading-relaxed">
              This will permanently remove this employee record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-xl text-xs font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-[#f87941] text-white hover:bg-[#e06634] rounded-xl text-xs font-bold">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 6. EXTENDED SAAS MODALS & DRAWERS */}

      {/* CSV Import Workspace Modal */}
      {showImportPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up text-left">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-[#fdfcfc] flex items-center gap-1.5">
                  <Upload className="h-4.5 w-4.5 text-[#f87941]" /> Employee CSV Import Workspace
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Standardize, validate, and preview before committing records to the organization database.</p>
              </div>
              <Button 
                onClick={() => {
                  setShowImportPreviewModal(false);
                  setImportStep('upload');
                  setImportFileName('');
                }} 
                variant="ghost" 
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Stepper Status Bar */}
            <div className="px-6 py-3 border-b bg-slate-50/20 flex items-center justify-between text-xs font-bold text-slate-400">
              <span className={importStep === 'upload' ? 'text-[#f87941]' : 'text-slate-500'}>1. Drag & Drop File</span>
              <ChevronRight className="h-3 w-3" />
              <span className={importStep === 'mapping' ? 'text-[#f87941]' : 'text-slate-500'}>2. Column Mapping</span>
              <ChevronRight className="h-3 w-3" />
              <span className={importStep === 'validation' ? 'text-[#f87941]' : 'text-slate-500'}>3. Validation Console</span>
              <ChevronRight className="h-3 w-3" />
              <span className={importStep === 'success' ? 'text-emerald-500' : 'text-slate-500'}>4. Complete</span>
            </div>

            {/* Steps Content */}
            <div className="p-6 overflow-y-auto flex-grow flex flex-col gap-4">
              
              {/* Step 1: Upload */}
              {importStep === 'upload' && (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center gap-4 bg-slate-50/10">
                  <div className="h-12 w-12 rounded-full bg-[#f87941]/10 flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6 text-[#f87941]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Drag & Drop employee list .csv or .xlsx file here</p>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts UTF-8 encoded files up to 25MB with headers: Employee ID, Name, Email, Department, Joining Date</p>
                  </div>
                  <Button 
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold h-9 px-4 rounded-xl"
                  >
                    Select File From Device
                  </Button>
                </div>
              )}

              {/* Step 2: Column Mapping */}
              {importStep === 'mapping' && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-slate-755">Successfully mapped 6 out of 6 standard fields from <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-bold">{importFileName}</code></span>
                  </div>
                  
                  <div className="border rounded-2xl overflow-hidden mt-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b text-[10px] uppercase text-slate-400">
                          <th className="p-2.5">Target Field (System)</th>
                          <th className="p-2.5">Source Header (CSV)</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-medium text-slate-600">
                        {[
                          { system: 'Employee ID', source: 'emp_id (Mapped)', status: 'Matched' },
                          { system: 'First Name', source: 'fname (Mapped)', status: 'Matched' },
                          { system: 'Last Name', source: 'lname (Mapped)', status: 'Matched' },
                          { system: 'Email Address', source: 'work_email (Mapped)', status: 'Matched' },
                          { system: 'Department', source: 'dept (Mapped)', status: 'Matched' },
                          { system: 'Joining Date', source: 'doj (Mapped)', status: 'Matched' },
                        ].map((m, i) => (
                          <tr key={i}>
                            <td className="p-2.5 font-bold text-slate-800">{m.system}</td>
                            <td className="p-2.5 font-semibold text-slate-500">{m.source}</td>
                            <td className="p-2.5 text-emerald-600 font-bold">✓ {m.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => setImportStep('upload')} variant="outline" className="rounded-xl text-xs font-bold h-9">
                      Back
                    </Button>
                    <Button onClick={() => setImportStep('validation')} className="bg-[#f87941] text-white hover:bg-[#e06634] rounded-xl text-xs font-bold h-9 px-4">
                      Proceed to Validation Console
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Validation Console */}
              {importStep === 'validation' && (
                <div className="flex flex-col gap-4 text-xs">
                  {/* Status Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                      <span className="text-base font-black text-emerald-600">{validRowsCount}</span>
                      <span className="text-[9px] font-bold text-slate-400 block">Valid Rows</span>
                    </div>
                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                      <span className="text-base font-black text-amber-600">0</span>
                      <span className="text-[9px] font-bold text-slate-400 block">Duplicate Warning</span>
                    </div>
                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-center">
                      <span className="text-base font-black text-rose-600">{errorRowsCount}</span>
                      <span className="text-[9px] font-bold text-slate-400 block">Malformed Fields</span>
                    </div>
                  </div>

                  {/* Duplicate Detection Options */}
                  <div className="flex flex-col gap-2 p-3 bg-slate-50 border rounded-2xl">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Duplicate Record Resolution</label>
                    <div className="flex items-center gap-4 mt-1 font-semibold text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="dupe" checked={duplicateAction === 'skip'} onChange={() => setDuplicateAction('skip')} className="text-[#f87941]" />
                        <span>Skip record</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="dupe" checked={duplicateAction === 'overwrite'} onChange={() => setDuplicateAction('overwrite')} className="text-[#f87941]" />
                        <span>Overwrite profile</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="dupe" checked={duplicateAction === 'both'} onChange={() => setDuplicateAction('both')} className="text-[#f87941]" />
                        <span>Keep both (new ID)</span>
                      </label>
                    </div>
                  </div>

                  {/* Direct Inline Correction Console */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-rose-650">Errors to Resolve (1)</label>
                    <div className="p-4 border border-rose-100 bg-rose-50/20 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-700">
                        <span>Row #14: Malformed Email Address</span>
                        <span className="bg-rose-100 px-2 py-0.5 rounded-lg text-[9px]">Invalid Format</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-left">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">Employee Name</label>
                          <Input value="Alice Tan" disabled className="h-8 rounded-lg text-xs" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">Correct Email</label>
                          <Input 
                            value={importErrorEmail} 
                            onChange={(e) => setImportErrorEmail(e.target.value)} 
                            className={`h-8 rounded-lg text-xs border ${importErrorEmail.includes('@') ? 'border-slate-200' : 'border-rose-400 focus:ring-rose-400'}`} 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">Department</label>
                          <Input value="Engineering" disabled className="h-8 rounded-lg text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Malformed email must be corrected to commit import.
                    </span>
                    <div className="flex gap-2">
                      <Button onClick={() => setImportStep('mapping')} variant="outline" className="rounded-xl text-xs font-bold h-9">
                        Back
                      </Button>
                      <Button 
                        onClick={async () => {
                          if (csvRows.length === 0) {
                            toast.error("No records found in CSV file to import");
                            return;
                          }
                          if (errorRowsCount > 0 && !importErrorEmail.includes('@')) {
                            toast.error("Please provide a valid email to resolve the warning.");
                            return;
                          }
                          
                          const token = getStoredSessionToken();
                          let successCount = 0;
                          
                          // Show toast loading state
                          const loadId = toast.loading("Committing imported records to database...");
                          
                          try {
                            // Fetch existing users to try and match emails
                            let userLookupMap = new Map<string, number>();
                            try {
                              const usersRes = await fetch('/api/users', {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              if (usersRes.ok) {
                                const usersJson = await usersRes.json();
                                const usersList = Array.isArray(usersJson) ? usersJson : (usersJson.data || []);
                                if (usersList && Array.isArray(usersList)) {
                                  usersList.forEach((u: any) => {
                                    if (u.email) {
                                      userLookupMap.set(u.email.toLowerCase(), u.id);
                                    }
                                  });
                                }
                              }
                            } catch (lookupErr) {
                              console.error("User lookup match failed, using fallback:", lookupErr);
                            }

                            const defaultUserId = currentUser?.id || 1;

                            for (const row of csvRows) {
                              const rawEmail = row['Email'] || row['email'] || row['Email Address'] || row['work_email'] || '';
                              const email = rawEmail.trim().toLowerCase();
                              const finalEmail = email.includes('invalid') ? importErrorEmail.trim().toLowerCase() : email;
                              
                              // Match user ID by email or fallback to current user
                              const matchedUserId = userLookupMap.get(finalEmail) || defaultUserId;
                              
                              const rawEmpId = row['Employee ID'] || row['employee_id'] || row['emp_id'] || '';
                              const empId = rawEmpId.trim() || `EMP-${Math.floor(Math.random() * 90000 + 10000)}`;
                              
                              const rawName = row['Name'] || row['name'] || row['fname'] || 'Imported User';
                              const dept = row['Department'] || row['department'] || row['dept'] || 'Engineering';
                              const desig = row['Designation'] || row['designation'] || 'Engineer';
                              
                              const rawDoj = row['Joining Date'] || row['joining_date'] || row['doj'] || '';
                              // format YYYY-MM-DD
                              let doj = new Date().toISOString().split('T')[0];
                              if (rawDoj) {
                                try {
                                  const parsedDate = new Date(rawDoj);
                                  if (!isNaN(parsedDate.getTime())) {
                                    doj = parsedDate.toISOString().split('T')[0];
                                  }
                                } catch {}
                              }
                              
                              const res = await fetch('/api/employees', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                  userId: matchedUserId,
                                  employeeId: empId,
                                  department: dept,
                                  designation: desig,
                                  dateOfJoining: doj,
                                  status: 'active',
                                  employmentType: 'full_time'
                                })
                              });
                              
                              if (res.ok) {
                                successCount++;
                              }
                            }
                            
                            toast.dismiss(loadId);
                            toast.success(`Successfully imported ${successCount} profiles!`);
                            fetchEmployeesData();
                            setImportStep('success');
                            setHasImported(true);
                            addAuditLog('Import Completed', `Imported ${successCount} employees from ${importFileName}.`);
                          } catch (err) {
                            toast.dismiss(loadId);
                            toast.error("An error occurred during import execution");
                            console.error(err);
                          }
                        }}
                        disabled={errorRowsCount > 0 && !importErrorEmail.includes('@')}
                        className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold h-9 px-4"
                      >
                        Commit Import ({csvRows.length} Records)
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Success Console & Rollback */}
              {importStep === 'success' && (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-4 bg-slate-50/10">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center animate-bounce">
                    <Check className="h-6 w-6 text-emerald-600 font-extrabold" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-800 dark:text-[#fdfcfc]">Workforce Database Synchronized</h4>
                    <p className="text-xs text-slate-400 mt-1">Imported 43 employee profiles successfully. Audit trail and logs have been registered.</p>
                  </div>

                  <div className="flex gap-2.5 mt-4">
                    <Button 
                      onClick={() => {
                        // Undo: Rollback imported records
                        setEmployees(prev => prev.filter(e => e.id !== 10025));
                        setImportStep('upload');
                        setImportFileName('');
                        setHasImported(false);
                        addAuditLog('Import Rolled Back', 'Rolled back imported dataset from workforce_onboarding_july.csv.');
                        toast.success("Import operation successfully rolled back.");
                      }}
                      variant="outline" 
                      className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold h-9 px-4 flex items-center gap-1.5"
                    >
                      Undo/Rollback Import
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowImportPreviewModal(false);
                        setImportStep('upload');
                        setImportFileName('');
                      }} 
                      className="bg-[#f87941] text-white hover:bg-[#e06634] rounded-xl text-xs font-bold h-9 px-6"
                    >
                      Finish
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Export Configuration Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-5 animate-scale-up text-left text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-[#fdfcfc] flex items-center gap-1.5">
                <Download className="h-4.5 w-4.5 text-[#f87941]" /> Export Options
              </h3>
              <Button onClick={() => setShowExportModal(false)} variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Export Range */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Export Scope/Range</label>
              <select
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value)}
                className="h-10 w-full rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 cursor-pointer outline-none"
              >
                <option value="Current Page">Current Page ({filteredEmployees.length} records)</option>
                <option value="Selected rows">Selected rows ({selectedIds.length} profiles)</option>
                <option value="Entire Organization">Entire Organization</option>
              </select>
            </div>

            {/* Format Picker */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">File Format</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'CSV', desc: 'Standard data' },
                  { name: 'Excel', desc: 'Full sheets' },
                  { name: 'PDF', desc: 'Read-only document' }
                ].map((fmt) => (
                  <button
                    key={fmt.name}
                    className="p-2.5 rounded-xl border hover:border-[#f87941]/55 flex flex-col items-center gap-1 font-bold transition-all text-xs dark:bg-slate-900 dark:border-slate-800"
                    onClick={() => triggerExport(fmt.name)}
                  >
                    <span>{fmt.name}</span>
                    <span className="text-[8px] text-slate-400 font-semibold">{fmt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Exclusions */}
            <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border dark:border-slate-800">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Data Exclusion (RBAC)</label>
              <label className="flex items-center gap-2 text-xs font-semibold mt-1 text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeSalary}
                  onChange={(e) => setExcludeSalary(e.target.checked)}
                  className="rounded text-[#f87941] focus:ring-[#f87941]"
                />
                <span>Exclude salary / payroll metrics</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold mt-1 text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maskPersonal}
                  onChange={(e) => setMaskPersonal(e.target.checked)}
                  className="rounded text-[#f87941] focus:ring-[#f87941]"
                />
                <span>Mask phone & personal email</span>
              </label>
            </div>

            {/* Schedule automated export */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-705 cursor-pointer">
                <input type="checkbox" className="rounded text-[#f87941] focus:ring-[#f87941]" />
                <span>Schedule automated weekly email export</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end mt-1 border-t pt-3">
              <Button onClick={() => setShowExportModal(false)} variant="outline" className="rounded-xl text-xs font-bold h-9">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast.success("Download started.");
                  addAuditLog('Dataset Exported', `Downloaded spreadsheet summary.`);
                  setShowExportModal(false);
                }} 
                className="bg-[#f87941] text-white hover:bg-[#e06634] rounded-xl text-xs font-bold h-9 px-4"
              >
                Download File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Configuration Drawer */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-[#1E1F22] border-l border-[#e6e4e6]/30 dark:border-[#2f3035]/30 h-full max-w-sm w-full shadow-2xl flex flex-col justify-between animate-slide-left text-left">
            <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-grow">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-[#fdfcfc] flex items-center gap-1.5">
                  <Settings className="h-4.5 w-4.5 text-[#f87941]" /> Directory Configuration
                </h3>
                <Button onClick={() => setShowSettingsDrawer(false)} variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Column Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Configure Columns</label>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 mt-1">
                  {Object.keys(visibleColumns).map((col) => (
                    <label key={col} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns[col]} 
                        onChange={(e) => setVisibleColumns(prev => ({ ...prev, [col]: e.target.checked }))}
                        className="rounded text-[#f87941] focus:ring-[#f87941] h-3.5 w-3.5"
                      />
                      <span className="capitalize">{col.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Density Configuration */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Density & Row Height</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['compact', 'normal', 'relaxed'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDensity(mode)}
                      className={`py-1.5 rounded-xl border text-xs font-bold capitalize transition-colors ${
                        density === mode ? 'border-[#f87941] bg-[#f87941]/5 text-[#f87941]' : 'border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Sorting Options */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Default Sorting</label>
                <select className="h-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-3 cursor-pointer outline-none">
                  <option>First Name (A-Z)</option>
                  <option>Last Name (A-Z)</option>
                  <option>Employee ID (Ascending)</option>
                  <option>Joining Date (Newest first)</option>
                </select>
              </div>

              {/* Default Filter Presets */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Default Filters</label>
                <div className="flex flex-col gap-2 mt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#f87941] focus:ring-[#f87941]" />
                    <span>Always exclude Terminated employees</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input type="checkbox" className="rounded text-[#f87941] focus:ring-[#f87941]" />
                    <span>Only show verified contact numbers</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 dark:bg-slate-900/30 flex gap-2 justify-end">
              <Button onClick={() => { setShowSettingsDrawer(false); toast.success("Configuration applied and saved."); }} className="bg-[#f87941] text-white hover:bg-[#e06634] rounded-xl text-xs font-bold h-9 w-full">
                Apply & Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Config Modal */}
      {showBulkModal && bulkActionType && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-scale-up text-left">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-[#fdfcfc]">Bulk Operation: {bulkActionType}</h3>
            <p className="text-xs text-slate-400">Configure parameters to update {selectedIds.length} selected employee records.</p>
            
            {bulkActionType === 'Update Department' && (
              <select className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-3 cursor-pointer outline-none">
                <option>Engineering</option>
                <option>HR</option>
                <option>Design</option>
                <option>Finance</option>
                <option>Operations</option>
              </select>
            )}

            {bulkActionType === 'Transfer Manager' && (
              <select className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-3 cursor-pointer outline-none">
                <option>Rahul Sharma (Engineering Lead)</option>
                <option>Vikas Mehta (HR Director)</option>
                <option>Ananya Sen (Design Head)</option>
              </select>
            )}

            {bulkActionType === 'Update Designation' && (
              <Input placeholder="e.g. Senior Software Architect" className="h-10 rounded-xl" />
            )}

            {bulkActionType === 'Assign Project' && (
              <select className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-3 cursor-pointer outline-none">
                <option>CMS Portal Revamp</option>
                <option>Enterprise AI Integration</option>
                <option>SaaS Billing Core</option>
              </select>
            )}

            {bulkActionType === 'Assign Shift' && (
              <select className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-3 cursor-pointer outline-none">
                <option>General Shift (09:00 AM - 06:00 PM)</option>
                <option>US Night Shift (08:00 PM - 05:00 AM)</option>
                <option>Morning Support Shift (06:00 AM - 03:00 PM)</option>
              </select>
            )}

            {bulkActionType === 'Assign Asset' && (
              <select className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-3 cursor-pointer outline-none">
                <option>Apple MacBook Pro 16" (M3 Max)</option>
                <option>Dell UltraSharp 32" 4K Monitor</option>
                <option>iPhone 15 Pro Max (Corporate)</option>
              </select>
            )}

            {bulkActionType === 'Generate Letters' && (
              <select className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-3 cursor-pointer outline-none">
                <option>Annual Compensation Increment Letter</option>
                <option>Promotion Declaration Notice</option>
                <option>Relocation Authorization Letter</option>
              </select>
            )}

            {bulkActionType === 'Move Business Unit' && (
              <select className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold px-3 cursor-pointer outline-none">
                <option>Techsonance India LLC</option>
                <option>Techsonance US Inc.</option>
                <option>Techsonance Middle East FZ</option>
              </select>
            )}

            {['Deactivate', 'Activate', 'Archive'].includes(bulkActionType) && (
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-rose-700 font-medium">
                Warning: This status change will instantly update authentication access. Ensure proper compliance authorization beforehand.
              </div>
            )}

            <div className="flex gap-2 justify-end mt-2">
              <Button 
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkActionType(null);
                }} 
                variant="outline" 
                className="rounded-xl text-xs font-bold h-9"
              >
                Cancel
              </Button>
              <Button onClick={executeBulkAction} className="bg-[#f87941] text-white hover:bg-[#e06634] rounded-xl text-xs font-bold h-9 px-4">
                Confirm Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts & Notifications Drawer */}
      {showAlertsDrawer && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-[#1E1F22] border-l border-[#e6e4e6]/30 dark:border-[#2f3035]/30 h-full max-w-sm w-full shadow-2xl flex flex-col justify-between animate-slide-left text-left">
            <div className="p-6 overflow-y-auto flex flex-col gap-4 flex-grow text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-[#fdfcfc] flex items-center gap-1.5">
                  <Bell className="h-4.5 w-4.5 text-[#f87941]" /> Operations Alerts
                </h3>
                <Button onClick={() => setShowAlertsDrawer(false)} variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { text: "Passport expires in 30 days (Aditya Sen)", type: "warning" },
                  { text: "Probation ends this week (Neha Gupta)", type: "info" },
                  { text: "Birthday tomorrow (Rushabh Jain 🎉)", type: "success" },
                  { text: "Pending performance review (Siddharth Roy)", type: "warning" },
                  { text: "Pending documents / KYC missing (Priya Patel)", type: "error" },
                  { text: "Missing attendance alert: 2 consecutive days (Kunal Shah)", type: "error" },
                  { text: "Pending asset return: Laptop & Monitor (Amit Verma)", type: "info" }
                ].map((alert, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl flex items-center gap-3 text-xs">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      alert.type === 'error' ? 'bg-rose-500' :
                      alert.type === 'warning' ? 'bg-amber-500' :
                      alert.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} />
                    <p className="font-bold text-slate-700 dark:text-slate-350">{alert.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 dark:bg-slate-900/30 flex gap-2">
              <Button onClick={() => { setShowAlertsDrawer(false); toast.success("Acknowledged all operational warnings."); }} className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold h-9">
                Acknowledge All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Sidebar Panel */}
      {showAiInsights && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-[#1E1F22] border-l border-[#e6e4e6]/30 dark:border-[#2f3035]/30 h-full max-w-sm w-full shadow-2xl flex flex-col justify-between animate-slide-left text-left">
            <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-grow">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-base text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-purple-500 animate-pulse" /> AI Workforce Insights
                </h3>
                <Button onClick={() => setShowAiInsights(false)} variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex flex-col gap-1.5">
                  <span className="font-black text-purple-700 uppercase tracking-wider text-[9px]">Retention Risk Alert</span>
                  <p className="font-bold text-slate-800">5 employees may resign soon</p>
                  <p className="text-[10px] text-slate-400">Based on recent patterns: high overtime, low performance reviews, and zero promotion activity in the last 24 months.</p>
                </div>

                <div className="p-4 bg-rose-50/30 border border-rose-100/50 rounded-2xl flex flex-col gap-1.5">
                  <span className="font-black text-rose-600 uppercase tracking-wider text-[9px]">Compliance & KYC</span>
                  <p className="font-bold text-slate-800">12 employees missing KYC</p>
                  <p className="text-[10px] text-slate-400">Essential identity documents (PAN Card / Aadhaar / Passport) have expired or are missing from employee profiles.</p>
                </div>

                <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl flex flex-col gap-1.5">
                  <span className="font-black text-emerald-600 uppercase tracking-wider text-[9px]">Promotion Readiness</span>
                  <p className="font-bold text-slate-800">3 high performers eligible for promotion</p>
                  <p className="text-[10px] text-slate-400">These individuals have completed consecutive positive feedback cycles and are currently operating above their current grade.</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl flex flex-col gap-1.5">
                  <span className="font-black text-slate-400 uppercase tracking-wider text-[9px]">Experience Dynamics</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Average experience increased</p>
                  <p className="text-[10px] text-slate-500">Median tenure has moved from 3.2 years to 3.8 years this quarter, showing lower attrition amongst senior staff.</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl flex flex-col gap-1.5">
                  <span className="font-black text-slate-400 uppercase tracking-wider text-[9px]">Overtime Heatmap</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Engineering department has highest overtime</p>
                  <p className="text-[10px] text-slate-550">Staff members logged an average of 14% extra billing hours. Recommended: balance allocation shifts.</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 dark:bg-slate-900/30 flex gap-2">
              <Button onClick={() => setShowAiInsights(false)} className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold h-9">
                Close Panel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Sidebar Panel */}
      {showAuditLogsPanel && (
        <div className="fixed inset-0 bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-[#1E1F22] border-l border-[#e6e4e6]/30 dark:border-[#2f3035]/30 h-full max-w-sm w-full shadow-2xl flex flex-col justify-between animate-slide-left text-left">
            <div className="p-6 overflow-y-auto flex flex-col gap-4 flex-grow">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-extrabold text-base text-slate-800 dark:text-[#fdfcfc] flex items-center gap-1.5">
                  <History className="h-4.5 w-4.5 text-indigo-500" /> Audit Log Console
                </h3>
                <Button onClick={() => setShowAuditLogsPanel(false)} variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-3 max-h-[80vh] overflow-y-auto pr-1">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-10">No activities logged yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 border rounded-2xl flex flex-col gap-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-[#f87941]">{log.action}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-350 font-medium">{log.details}</p>
                      <span className="text-[9px] text-slate-400 font-bold self-end bg-slate-200/50 px-1.5 py-0.5 rounded-lg">{log.user}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 dark:bg-slate-900/30 flex gap-2">
              <Button 
                onClick={() => {
                  setAuditLogs([]);
                  localStorage.removeItem('employee_directory_audit_logs');
                  toast.success("Audit logs cleared.");
                }} 
                variant="outline" 
                className="w-full text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl h-9"
              >
                Clear Log
              </Button>
              <Button onClick={() => setShowAuditLogsPanel(false)} className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold h-9">
                Close Console
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
