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
  Download, FileText, MapPin, Briefcase, Building2, ChevronRight,
  Mail, Phone, Sparkles, Star, CheckSquare, Square, MoreHorizontal,
  Grid, List, Columns, Plus, X, Bookmark, Upload, Settings, Check, 
  HelpCircle, Copy, ExternalLink, Calendar, Heart, Shield, AlertTriangle,
  FileSpreadsheet, Database, EyeOff, RefreshCw, Layers, Lock, History, UserCheck, MessageSquare, Pin
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

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

  // RBAC Simulation State
  const [simulatedRole, setSimulatedRole] = useState<'HR Admin' | 'HR Executive' | 'Manager' | 'Employee' | 'Auditor'>('HR Admin');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('Engineering'); // Set Engineering as default to match screenshot
  const [filterStatus, setFilterStatus] = useState('Active'); // Set Active as default to match screenshot
  const [filterWorkMode, setFilterWorkMode] = useState('');
  const [filterTag, setFilterTag] = useState('');
  
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
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    photo: true,
    employeeId: true,
    name: true,
    department: true,
    designation: true,
    location: true,
    workMode: true,
    joiningDate: true,
    status: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<number[]>([10010, 10009]); // Pre-select Rushabh Jain & Manish Kuswaha to match the screen
  
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

  // Quick Preview Drawer States (Pre-open Rushabh Jain to match screenshot design)
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);

  // Delete & Modals State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // CSV Import States
  const [showImportPreviewModal, setShowImportPreviewModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log audit actions helper
  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(7),
      action,
      timestamp: new Date().toISOString(),
      user: `${simulatedRole} (Simulated User)`,
      details,
    };
    const updated = [newLog, ...auditLogs].slice(0, 100);
    setAuditLogs(updated);
    localStorage.setItem('employee_directory_audit_logs', JSON.stringify(updated));
  };

  // Load local settings on mount
  useEffect(() => {
    // Populate mock employees initially
    setEmployees(MOCK_EMPLOYEES);
    setPreviewEmployee(MOCK_EMPLOYEES[1]); // Rushabh Jain is active preview
    setLoading(false);

    if (typeof window !== 'undefined') {
      const storedFavs = localStorage.getItem('employee_directory_favorites');
      if (storedFavs) setFavorites(JSON.parse(storedFavs));

      const storedTags = localStorage.getItem('employee_directory_tags');
      if (storedTags) setEmployeeTags(JSON.parse(storedTags));

      const storedViews = localStorage.getItem('employee_directory_saved_views');
      if (storedViews) setSavedViews(JSON.parse(storedViews));

      const storedLogs = localStorage.getItem('employee_directory_audit_logs');
      if (storedLogs) setAuditLogs(JSON.parse(storedLogs));
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'on_leave': return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'resigned': return 'bg-rose-50 text-rose-700 border-rose-200/50';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/50';
    }
  };

  const getWorkModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
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
    setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
    toast.success(`Removed ${selectedEmployee.employeeId}`);
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
    if (previewEmployee?.id === selectedEmployee.id) setPreviewEmployee(null);
  };

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(rowId => rowId !== id));
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
    // Simulated Role-Gate
    if (simulatedRole === 'Manager' && emp.department !== 'Engineering') return false;
    if (simulatedRole === 'Employee' && emp.id !== 10010) return false;

    // Filters
    if (filterDepartment && emp.department !== filterDepartment) return false;
    if (filterStatus && emp.status !== filterStatus) return false;
    if (filterWorkMode && emp.workMode !== filterWorkMode) return false;
    if (search) {
      const match = `${emp.firstName} ${emp.lastName} ${emp.employeeId} ${emp.email}`.toLowerCase();
      if (!match.includes(search.toLowerCase())) return false;
    }

    if (!matchSmartQuery(emp)) return false;

    return true;
  });

  return (
    <div className="flex bg-[#FDFCFD] dark:bg-[#15161A] text-slate-800 dark:text-[#fdfcfc] min-h-[calc(100vh-120px)] relative overflow-hidden -m-6 p-6">
      
      {/* MAIN CONTAINER WORKSPACE */}
      <div className="flex-1 flex flex-col gap-6 pr-[440px] overflow-y-auto">
        
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
            {/* Simulating Role Controller */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/50">
              <select
                value={simulatedRole}
                onChange={(e) => setSimulatedRole(e.target.value as any)}
                className="bg-transparent border-none text-[11px] font-bold text-[#f87941] cursor-pointer outline-none"
              >
                <option value="HR Admin">Admin view</option>
                <option value="Manager">Manager view</option>
                <option value="Employee">Employee view</option>
                <option value="Auditor">Auditor view</option>
              </select>
            </div>

            <Link href="/dashboard/employees/new">
              <Button className="bg-[#f87941] text-white hover:bg-[#e06634] font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-[0_4px_12px_rgba(248,121,65,0.15)]">
                <UserPlus className="h-4 w-4" /> Add Employee
              </Button>
            </Link>
            
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-350"
            >
              <Upload className="h-4 w-4" /> Import
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" />

            <Button 
              onClick={handleExportCSV} 
              variant="outline" 
              className="bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-350"
            >
              <Download className="h-4 w-4" /> Export
            </Button>

            <Button variant="outline" className="border-slate-200 dark:border-slate-800 h-9 w-9 p-0 rounded-xl">
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
        </div>

        {/* ANALYTICS STATS CARDS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Total Employees', count: '248', desc: '↑ 12.5% vs last month', filter: '', iconBg: 'bg-[#f87941]/10 text-[#f87941]' },
            { label: 'Active', count: '218', desc: '87.9% of total', filter: 'Active', iconBg: 'bg-emerald-500/10 text-emerald-600' },
            { label: 'On Leave', count: '12', desc: '4.8% of total', filter: 'On Leave', iconBg: 'bg-amber-500/10 text-amber-600' },
            { label: 'On Notice', count: '5', desc: '2.0% of total', filter: 'On Notice', iconBg: 'bg-orange-500/10 text-orange-600' },
            { label: 'Probation', count: '18', desc: '7.3% of total', filter: 'Probation', iconBg: 'bg-blue-500/10 text-blue-600' },
            { label: 'Contract', count: '24', desc: '9.7% of total', filter: 'Contract', iconBg: 'bg-indigo-500/10 text-indigo-600' },
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
                onClick={() => setShowSaveViewModal(true)} 
                variant="outline" 
                className="border-slate-200 dark:border-slate-800 text-xs font-bold h-9 px-3 rounded-xl flex items-center gap-1.5 text-slate-600 dark:text-slate-350"
              >
                <Bookmark className="h-3.5 w-3.5" /> Saved Views
              </Button>
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
        {selectedIds.length > 0 && simulatedRole !== 'Auditor' && (
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
              <option value="Deactivate">Deactivate Profiles</option>
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
              onClick={handleExportCSV} 
              variant="outline" 
              className="h-8 text-xs font-bold rounded-lg border-slate-200 text-slate-600 px-3 flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>

            <Button onClick={executeBulkAction} disabled={!bulkActionType} className="bg-[#f87941] text-white hover:bg-[#e06634] text-xs font-bold h-8 rounded-lg px-3">
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
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded text-[#f87941] focus:ring-[#f87941] h-4 w-4 border-slate-350 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Employee ID</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Work Mode</th>
                    <th className="p-3">Joining Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e4e6]/10 dark:divide-[#2f3035]/10 text-xs">
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedIds.includes(emp.id);
                    const fullName = `${emp.firstName} ${emp.lastName}`;
                    const initials = `${emp.firstName[0]}${emp.lastName[0]}`;

                    return (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-slate-50/30 dark:hover:bg-slate-900/10 cursor-pointer h-14 transition-colors ${
                          isSelected ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''
                        }`}
                        onClick={() => setPreviewEmployee(emp)}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(emp.id, e.target.checked)}
                            className="rounded text-[#f87941] focus:ring-[#f87941] h-4 w-4 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-slate-200/50">
                              <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <span className="font-extrabold text-slate-800 dark:text-[#fdfcfc] hover:text-[#f87941] transition-colors">{fullName}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{emp.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-[#f87941]">{emp.employeeId}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 font-semibold">{emp.department}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{emp.designation}</td>
                        <td className="p-3 text-slate-400 font-medium leading-tight">
                          {emp.location}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[9px] uppercase font-black px-2 py-0.5 border-transparent ${getWorkModeColor(emp.workMode)}`}>
                            {emp.workMode}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">{emp.joiningDate}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0.5 border border-transparent ${getStatusColor(emp.status)}`}>
                            {emp.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <Link href={`/dashboard/employees/${emp.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-[#f87941] rounded-lg">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {simulatedRole === 'HR Admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                                onClick={() => { setSelectedEmployee(emp); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
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
                Showing 1 to {filteredEmployees.length} of {filteredEmployees.length} results
              </span>
              
              <div className="flex items-center gap-1 text-xs">
                <Button variant="outline" size="sm" className="h-7 px-2 border-slate-200 text-slate-400 hover:text-slate-600 rounded-lg">&lt;</Button>
                <Button className="h-7 w-7 p-0 bg-[#fdfcfd] border border-[#f87941] text-[#f87941] font-bold rounded-lg shadow-sm">1</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-slate-200 text-slate-500 rounded-lg">2</Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-slate-200 text-slate-500 rounded-lg">3</Button>
                <span className="text-slate-400 px-1 font-semibold">...</span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-slate-200 text-slate-500 rounded-lg">22</Button>
                <Button variant="outline" size="sm" className="h-7 px-2 border-slate-200 text-slate-400 hover:text-slate-600 rounded-lg">&gt;</Button>
              </div>

              <select className="h-7 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 px-2 outline-none">
                <option>10 / page</option>
                <option>25 / page</option>
                <option>50 / page</option>
              </select>
            </div>

          </div>
        )}

      </div>

      {/* RIGHT SIDE FIXED PREVIEW PANEL */}
      <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-white dark:bg-[#1E1F22] border-l border-[#e6e4e6]/30 dark:border-[#2f3035]/30 p-5 flex flex-col gap-4 overflow-y-auto z-10 shadow-lg">
        
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

        {previewEmployee ? (
          <div className="flex flex-col gap-4 text-left">
            
            {/* Header Identity details */}
            <div className="flex flex-col items-center text-center py-4 border-b border-[#e6e4e6]/10 gap-3">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-slate-200">
                  <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-black text-xl">
                    {previewEmployee.firstName[0]}{previewEmployee.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-[#fdfcfc]">
                  {previewEmployee.firstName} {previewEmployee.lastName}
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
                  <span className="font-bold text-slate-800 dark:text-slate-200">Full Time</span>
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
                    <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.managerName || 'Rahul Sharma'}</span>
                  </div>
                </div>
                {simulatedRole !== 'Manager' && (
                  <div>
                    <span className="text-slate-400 block font-semibold">Salary (CTC)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.salary || '₹ 8.5 LPA'}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 block font-semibold">Experience</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewEmployee.experience || '2.5 Years'}</span>
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
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{previewEmployee.attendance || '92%'}</span>
                  <span className="text-[8px] font-bold text-slate-400 block mt-1">This Month</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{previewEmployee.leaveBalance || 18}</span>
                  <span className="text-[8px] font-bold text-slate-400 block mt-1">Days Left</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                  <span className="text-lg font-black text-purple-600">{previewEmployee.performance || '4.3'}</span>
                  <span className="text-[8px] font-bold text-slate-400 block mt-1">Rating Score</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border rounded-xl">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-200">{previewEmployee.projects || 3}</span>
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
                {(previewEmployee.skills || ['React', 'Node.js', 'TypeScript', 'Next.js']).map(skill => (
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
                {(previewEmployee.activities || [
                  { text: 'Marked attendance at 09:15 AM', time: 'Today, 09:15 AM' }
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
        ) : (
          <p className="text-slate-400 text-xs italic text-center py-10">Select an employee row to view summary statistics.</p>
        )}

      </div>

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

    </div>
  );
}
