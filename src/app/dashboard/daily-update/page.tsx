'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Eraser, Plus, Trash2, Loader2, Calendar, Clock, Edit, Eye, Users, FileText, UserCheck, UserMinus, UserX, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsSkeleton, TableSkeleton, PageHeaderSkeleton, TabsSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { dailyReportSubmissionSchema } from '@/lib/forms/schemas';
import { enforceRBACPermission, hasRBACPermission } from '@/server/rbac/auth-integration';

interface Project {
  id: number;
  name: string;
}

interface ProjectReport {
  id: string;
  projectId: number;
  description: string;
  trackerTime: number;
  isCoveredWork: boolean;
  isExtraWork: boolean;
}

interface DailyReport {
  id: number;
  date: string;
  availableStatus: string;
  createdAt: string;
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  userId: number;
}

interface DailyReportProject {
  id: number;
  projectId: number;
  description: string;
  trackerTime: number;
  isCoveredWork: boolean;
  isExtraWork: boolean;
  dailyReportId: number;
  createdAt: string;
  firstName?: string;
  lastName?: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  status: string;
  email?: string;
  designation?: string;
  userId?: number;
}

interface User {
  id: number;
  role: string;
}

const checkIsAdmin = (role?: string) => {
  const r = role?.toLowerCase() || '';
  return ['admin', 'superadmin', 'super_admin', 'manager', 'project_manager', 'hr_manager', 'ceo', 'cto'].includes(r);
};

export default function DailyUpdatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Render diagnostic
  console.log('[DailyUpdate] Rendering component state...');
  const [projects, setProjects] = useState<Project[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableStatus, setAvailableStatus] = useState('present');
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([{
    id: 'temp_1',
    projectId: 0,
    description: '',
    trackerTime: 0,
    isCoveredWork: false,
    isExtraWork: false,
  }]);

  // Active tab tracking to prevent redundant API calls
  const [activeTab, setActiveTab] = useState<string>('');

  // Admin-specific state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchUrlRef = useRef("");
  const initialDataLoadedRef = useRef({ employees: false, directory: false });
  const [allDailyReports, setAllDailyReports] = useState<DailyReport[]>([]);
  const [allReportsTotal, setAllReportsTotal] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('all');
  const [adminStartDate, setAdminStartDate] = useState('');
  const [adminEndDate, setAdminEndDate] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [deletingReport, setDeletingReport] = useState<DailyReport | null>(null);
  const [viewingReportDetails, setViewingReportDetails] = useState<DailyReport | null>(null);
  const [reportProjects, setReportProjects] = useState<DailyReportProject[]>([]);
  const [loadingReportProjects, setLoadingReportProjects] = useState(false);

  const [extraWorkStartDate, setExtraWorkStartDate] = useState('');
  const [extraWorkEndDate, setExtraWorkEndDate] = useState('');
  const [selectedProjectFilterExtra, setSelectedProjectFilterExtra] = useState('all');
  const [extraWorkReports, setExtraWorkReports] = useState<DailyReportProject[]>([]);

  const [coveredWorkStartDate, setCoveredWorkStartDate] = useState('');
  const [coveredWorkEndDate, setCoveredWorkEndDate] = useState('');
  const [selectedProjectFilterCovered, setSelectedProjectFilterCovered] = useState('all');
  const [coveredWorkReports, setCoveredWorkReports] = useState<DailyReportProject[]>([]);

  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState("");
  const [scanningDirectory, setScanningDirectory] = useState(false);

  const [myHistoryReports, setMyHistoryReports] = useState<DailyReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState<'month' | 'range'>('month');
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [loadingExtraWork, setLoadingExtraWork] = useState(false);
  const [loadingCoveredWork, setLoadingCoveredWork] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [extraWorkPage, setExtraWorkPage] = useState(0);
  const [extraWorkTotal, setExtraWorkTotal] = useState(0);
  const [coveredWorkPage, setCoveredWorkPage] = useState(0);
  const [coveredWorkTotal, setCoveredWorkTotal] = useState(0);
  const [allReportsPage, setAllReportsPage] = useState(0);
  const [projectsPage, setProjectsPage] = useState(0);
  const [tabProjects, setTabProjects] = useState<Project[]>([]);
  const [loadingTabProjects, setLoadingTabProjects] = useState(false);
  const pageSize = 10;

  const [isExtraWorkMonthFilter, setIsExtraWorkMonthFilter] = useState(true);
  const [extraWorkMonth, setExtraWorkMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployeeExtraWork, setSelectedEmployeeExtraWork] = useState('all');

  const [isCoveredWorkMonthFilter, setIsCoveredWorkMonthFilter] = useState(true);
  const [coveredWorkMonth, setCoveredWorkMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployeeCoveredWork, setSelectedEmployeeCoveredWork] = useState('all');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && !activeTab) {
      const initialTab = checkIsAdmin(currentUser.role) ? 'all-reports' : 'daily-report';
      setActiveTab(initialTab);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (checkIsAdmin(currentUser.role)) {
        fetchEmployees();
      }
      fetchAllProjectsList();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchProjects();
      fetchExistingReport();
    }
  }, [currentUser, date]);

  useEffect(() => {
    if (currentUser && checkIsAdmin(currentUser.role) && activeTab === 'all-reports') {
      fetchAllDailyReports();
    }
  }, [currentUser, activeTab, selectedEmployeeFilter, adminStartDate, adminEndDate, adminStatusFilter, allReportsPage]);

  // Separate effect for one-time background directory sync
  useEffect(() => {
    if (currentUser && checkIsAdmin(currentUser.role) && activeTab === 'all-reports') {
      fetchUniversalDirectory();
    }
  }, [currentUser, activeTab]);



  const fetchExistingReport = async () => {
    if (!currentUser || !date) return;

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/daily-reports?startDate=${date}&endDate=${date}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        const reports = result.data || [];
        const existing = reports.find((r: DailyReport) => r.date.startsWith(date));

        if (existing) {
          setAvailableStatus(existing.availableStatus);
          const projectsResponse = await fetch(`/api/daily-report-projects?dailyReportId=${existing.id}&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (projectsResponse.ok) {
            const prsResult = await projectsResponse.json();
            const prs = prsResult.data || [];
            if (prs.length > 0) {
              setProjectReports(prs.map((p: any) => ({
                id: p.id.toString(),
                projectId: p.projectId,
                description: p.description,
                trackerTime: p.trackerTime,
                isCoveredWork: p.isCoveredWork,
                isExtraWork: p.isExtraWork,
                isSubmitted: true
              })));
              return;
            }
          }
        }
      }

      if (!viewingReportDetails) {
        setProjectReports([{
          id: 'temp_' + Date.now().toString(),
          projectId: 0,
          description: '',
          trackerTime: 0,
          isCoveredWork: false,
          isExtraWork: false,
        }]);
      }
      setAvailableStatus('present');
    } catch {
      toast.error('Failed to load existing daily report');
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch {
      toast.error('Failed to load user profile');
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const token = localStorage.getItem('session_token');
      const isAdmin = checkIsAdmin(currentUser?.role);

      if (isAdmin) {
        const response = await fetch('/api/projects?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setProjects(result.data || []);
        }
      } else {
        const memberResponse = await fetch('/api/project-members?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (memberResponse.ok) {
          const membersResult = await memberResponse.json();
          const members = membersResult.data || [];
          const userProjectIds = members
            .filter((m: any) => m.userId === currentUser?.id)
            .map((m: any) => m.projectId);

          const projectsResponse = await fetch('/api/projects?limit=100', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (projectsResponse.ok) {
            const allProjectsResult = await projectsResponse.json();
            const allProjects = allProjectsResult.data || [];
            const filteredProjects = allProjects.filter((p: Project) =>
              userProjectIds.includes(p.id)
            );
            setProjects(filteredProjects);
          }
        }
      }
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchAllProjectsList = async () => {
    try {
      const token = localStorage.getItem('session_token');

      if (checkIsAdmin(currentUser?.role)) {
        const response = await fetch('/api/projects?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setProjectsList(result.data || []);
        }
      } else {
        const memberResponse = await fetch('/api/project-members?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (memberResponse.ok) {
          const membersResult = await memberResponse.json();
          const members = membersResult.data || [];
          const userProjectIds = members
            .filter((m: any) => m.userId === currentUser?.id)
            .map((m: any) => m.projectId);

          const projectsResponse = await fetch('/api/projects?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (projectsResponse.ok) {
            const result = await projectsResponse.json();
            const allProjects = result.data || [];
            const filteredProjects = allProjects.filter((p: Project) =>
              userProjectIds.includes(p.id)
            );
            setProjectsList(filteredProjects);
          }
        }
      }
    } catch {
      toast.error('Failed to load project list');
    }
  };

  const fetchTabProjects = async () => {
    setLoadingTabProjects(true);
    try {
      const token = localStorage.getItem('session_token');

      if (checkIsAdmin(currentUser?.role)) {
        const response = await fetch(`/api/projects?limit=${pageSize}&offset=${projectsPage * pageSize}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setTabProjects(result.data || []);
        }
      } else {
        const memberResponse = await fetch('/api/project-members?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (memberResponse.ok) {
          const result = await memberResponse.json();
          const members = result.data || [];
          const userProjectIds = members
            .filter((m: any) => m.userId === currentUser?.id)
            .map((m: any) => m.projectId);

          const projectsResponse = await fetch(`/api/projects?limit=${pageSize}&offset=${projectsPage * pageSize}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (projectsResponse.ok) {
            const result = await projectsResponse.json();
            const allProjects = result.data || [];
            const filteredProjects = allProjects.filter((p: Project) =>
              userProjectIds.includes(p.id)
            );
            setTabProjects(filteredProjects);
          }
        }
      }
    } catch {
      toast.error('Failed to load tab projects');
    } finally {
      setLoadingTabProjects(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('session_token');
      
      const [empRes, userRes] = await Promise.allSettled([
        fetch('/api/employees?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      let employeesRaw: any[] = [];
      let usersRaw: any[] = [];

      if (empRes.status === 'fulfilled' && empRes.value.ok) {
        const data = await empRes.value.json();
        employeesRaw = data.data || [];
      }
      
      if (userRes.status === 'fulfilled' && userRes.value.ok) {
        const data = await userRes.value.json();
        usersRaw = data.data || [];
      }

      let finalEmployees: Employee[] = [];

      if (employeesRaw.length > 0) {
        finalEmployees = employeesRaw.map((emp: any) => {
          const user = usersRaw.find((u: any) => 
            Number(u.id) === Number(emp.userId) || u.email === emp.email
          );
          return {
            ...emp,
            firstName: user?.firstName || emp.firstName || '',
            lastName: user?.lastName || emp.lastName || '',
            email: user?.email || emp.email || ''
          };
        });
      } else if (usersRaw.length > 0) {
        // Fallback: Use all users as employees if employees table is empty
        console.log('[DailyUpdate] Employees table empty, falling back to Users table');
        finalEmployees = usersRaw.map((u: any) => ({
          id: u.id,
          userId: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          employeeId: `U-${u.id}`,
          status: u.isActive ? 'active' : 'inactive'
        }));
      }

      setEmployees(finalEmployees);
    } catch (error) {
      console.error('[DailyUpdate] Error in fetchEmployees:', error);
    }
  };

  const discoverNamesFromReports = (reports: DailyReport[]) => {
    if (!reports || reports.length === 0) return;
    
    setEmployees(prev => {
      const existingIds = new Set(prev.map(e => e.id.toString()));
      const newDiscoveries: Employee[] = [];
      
      reports.forEach(report => {
        const reportUserId = report.userId?.toString();
        // Skip if we already have this user ID, but ONLY if ID is valid
        if (reportUserId && reportUserId !== '0' && existingIds.has(reportUserId)) return;

        // Check if we already have this person by name (in case IDs are different)
        const fullName = `${report.firstName || ''} ${report.lastName || ''}`.trim();
        const hasByName = prev.some(e => `${e.firstName} ${e.lastName}`.trim() === fullName);
        const hasByEmail = report.email && prev.some(e => e.email === report.email);
        const hasById = reportUserId && reportUserId !== '0' && existingIds.has(reportUserId);

        if (!hasById && !hasByName && !hasByEmail && (fullName || report.email)) {
          newDiscoveries.push({
            id: report.userId || Math.floor(Math.random() * 1000000),
            userId: report.userId,
            firstName: report.firstName || '',
            lastName: report.lastName || '',
            email: report.email || '',
            employeeId: `D-${report.userId || 'NEW'}`,
            status: 'active'
          });
          if (reportUserId) existingIds.add(reportUserId);
        }
      });
      
      if (newDiscoveries.length > 0) {
        return [...prev, ...newDiscoveries];
      }
      return prev;
    });
  };

  const fetchUniversalDirectory = async () => {
    if (initialDataLoadedRef.current.directory || employees.length > 50) return;
    
    setScanningDirectory(true);
    try {
      const token = localStorage.getItem('session_token');
      // Fetch a larger batch of report headers to "learn" names
      const response = await fetch('/api/daily-reports?limit=500', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        let reportsArray: DailyReport[] = [];
        if (Array.isArray(result.data)) {
          reportsArray = result.data;
        } else if (Array.isArray(result)) {
          reportsArray = result;
        } else if (result?.data?.data) {
          reportsArray = result.data.data;
        }
        
        if (reportsArray.length > 0) {
          discoverNamesFromReports(reportsArray);
        }
        initialDataLoadedRef.current.directory = true;
      }
    } catch {
      // Background scan silenty fails
    } finally {
      setScanningDirectory(false);
    }
  };

  const applyDatePreset = (preset: 'today' | 'yesterday' | 'this-week' | 'this-month') => {
    const now = new Date();
    let start = "";
    let end = format(now, 'yyyy-MM-dd');

    switch (preset) {
      case 'today':
        start = format(now, 'yyyy-MM-dd');
        end = start;
        break;
      case 'yesterday':
        start = format(subDays(now, 1), 'yyyy-MM-dd');
        end = start;
        break;
      case 'this-week':
        start = format(startOfWeek(now), 'yyyy-MM-dd');
        end = format(endOfWeek(now), 'yyyy-MM-dd');
        break;
      case 'this-month':
        start = format(startOfMonth(now), 'yyyy-MM-dd');
        end = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
    }

    setAdminStartDate(start);
    setAdminEndDate(end);
    setAllReportsPage(0);
  };

  const resetFilters = () => {
    setSelectedEmployeeFilter('all');
    setEmployeeSearchValue("");
    setAdminStartDate("");
    setAdminEndDate("");
    setAdminStatusFilter('all');
    setAllReportsPage(0);
  };

  const fetchAllDailyReports = async () => {
    const token = localStorage.getItem('session_token');
    let url = `/api/daily-reports?limit=${pageSize}&offset=${allReportsPage * pageSize}`;

    if (selectedEmployeeFilter !== 'all') url += `&employeeId=${selectedEmployeeFilter}`;
    if (adminStartDate) url += `&startDate=${adminStartDate}`;
    if (adminEndDate) url += `&endDate=${adminEndDate}`;
    if (adminStatusFilter !== 'all') url += `&availableStatus=${adminStatusFilter}`;

    if (isFetchingRef.current || url === lastFetchUrlRef.current) {
      return;
    }

    setLoading(true);
    isFetchingRef.current = true;
    lastFetchUrlRef.current = url;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        let reportsArray: DailyReport[] = [];
        if (Array.isArray(result.data)) {
          reportsArray = result.data;
        } else if (Array.isArray(result)) {
          reportsArray = result;
        } else if (result && result.data && Array.isArray(result.data.data)) {
          reportsArray = result.data.data;
        }
        
        setAllDailyReports(reportsArray);
        
        let total = 0;
        if (result?.meta?.total !== undefined) {
          total = result.meta.total;
        } else if (result?.total !== undefined) {
          total = result.total;
        } else {
          total = reportsArray.length;
        }
        
        setAllReportsTotal(total);
        if (reportsArray.length > 0) {
          discoverNamesFromReports(reportsArray);
        }
      } else {
        lastFetchUrlRef.current = "";
      }
    } catch (error) {
      lastFetchUrlRef.current = "";
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchReportProjects = async (reportId: number) => {
    setLoadingReportProjects(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/daily-report-projects?dailyReportId=${reportId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        let projectsArr = [];
        if (Array.isArray(result.data)) {
          projectsArr = result.data;
        } else if (Array.isArray(result)) {
          projectsArr = result;
        } else if (result && result.data && Array.isArray(result.data.data)) {
          projectsArr = result.data.data;
        }
        setReportProjects(projectsArr);
      }
    } catch {
      toast.error('Failed to load report details');
    } finally {
      setLoadingReportProjects(false);
    }
  };

  const handleViewReportDetails = async (report: DailyReport) => {
    setViewingReportDetails(report);
    await fetchReportProjects(report.id);
  };

  const handleDeleteReport = async () => {
    if (!deletingReport) return;

    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/daily-reports?id=${deletingReport.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Daily report deleted successfully!');
        fetchAllDailyReports();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete report');
      }
    } catch {
      toast.error('An error occurred while deleting the report');
    } finally {
      setDeletingReport(null);
    }
  };

  const addProjectReport = () => {
    setProjectReports([...projectReports, {
      id: 'temp_' + Date.now().toString(),
      projectId: 0,
      description: '',
      trackerTime: 0,
      isCoveredWork: false,
      isExtraWork: false,
    }]);
  };

  const removeProjectReport = (id: string) => {
    setProjectReports(projectReports.filter(pr => pr.id !== id));
  };

  const updateProjectReport = (id: string, field: string, value: any) => {
    setProjectReports(projectReports.map(pr =>
      pr.id === id ? { ...pr, [field]: value } : pr
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('session_token');
      const validation = dailyReportSubmissionSchema.safeParse({
        date,
        availableStatus,
        projectReports,
      });

      if (!validation.success) {
        toast.error(validation.error.issues[0]?.message || 'Please fill all project report fields');
        return;
      }

      const reportResponse = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, availableStatus }),
      });

      if (!reportResponse.ok) {
        const error = await reportResponse.json();
        toast.error(error.error || 'Failed to create daily report');
        setLoading(false);
        return;
      }

      const dailyReport = await reportResponse.json();

      for (const pr of projectReports) {
        if (!pr.id.toString().startsWith('temp_')) {
          await fetch(`/api/daily-report-projects?id=${pr.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: pr.projectId,
              description: pr.description,
              trackerTime: pr.trackerTime,
              isCoveredWork: pr.isCoveredWork,
              isExtraWork: pr.isExtraWork,
            }),
          });
        } else {
          await fetch('/api/daily-report-projects', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dailyReportId: dailyReport.id,
              projectId: pr.projectId,
              description: pr.description,
              trackerTime: pr.trackerTime,
              isCoveredWork: pr.isCoveredWork,
              isExtraWork: pr.isExtraWork,
            }),
          });
        }
      }

      toast.success('Daily report details saved successfully!');
      fetchExistingReport();
      setAvailableStatus('present');

      if (checkIsAdmin(currentUser?.role)) {
        fetchAllDailyReports();
      }
      fetchMyHistory();
    } catch {
      toast.error('An error occurred while submitting the report');
    } finally {
      setLoading(false);
    }
  };

  const fetchExtraWork = async () => {
    setLoadingExtraWork(true);
    try {
      const token = localStorage.getItem('session_token');
      let url = `/api/daily-report-projects?isExtraWork=true&limit=${pageSize}&offset=${extraWorkPage * pageSize}`;

      if (isExtraWorkMonthFilter && extraWorkMonth) {
        const [year, month] = extraWorkMonth.split('-');
        const start = `${year}-${month}-01`;
        const end = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        url += `&startDate=${start}&endDate=${end}`;
      } else {
        if (extraWorkStartDate) url += `&startDate=${extraWorkStartDate}`;
        if (extraWorkEndDate) url += `&endDate=${extraWorkEndDate}`;
      }

      if (selectedProjectFilterExtra !== 'all') url += `&projectId=${selectedProjectFilterExtra}`;
      if (checkIsAdmin(currentUser?.role) && selectedEmployeeExtraWork !== 'all') url += `&employeeId=${selectedEmployeeExtraWork}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        const dataArr = result.data || [];
        setExtraWorkReports(dataArr);
        setExtraWorkTotal(extraWorkPage * pageSize + dataArr.length + (dataArr.length === pageSize ? 1 : 0));
      }
    } catch {
      toast.error('Failed to load extra work reports');
    } finally {
      setLoadingExtraWork(false);
    }
  };

  const fetchCoveredWork = async () => {
    setLoadingCoveredWork(true);
    try {
      const token = localStorage.getItem('session_token');
      let url = `/api/daily-report-projects?isCoveredWork=true&limit=${pageSize}&offset=${coveredWorkPage * pageSize}`;

      if (isCoveredWorkMonthFilter && coveredWorkMonth) {
        const [year, month] = coveredWorkMonth.split('-');
        const start = `${year}-${month}-01`;
        const end = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        url += `&startDate=${start}&endDate=${end}`;
      } else {
        if (coveredWorkStartDate) url += `&startDate=${coveredWorkStartDate}`;
        if (coveredWorkEndDate) url += `&endDate=${coveredWorkEndDate}`;
      }

      if (selectedProjectFilterCovered !== 'all') url += `&projectId=${selectedProjectFilterCovered}`;
      if (checkIsAdmin(currentUser?.role) && selectedEmployeeCoveredWork !== 'all') url += `&employeeId=${selectedEmployeeCoveredWork}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        const dataArr = result.data || [];
        setCoveredWorkReports(dataArr);
        setCoveredWorkTotal(coveredWorkPage * pageSize + dataArr.length + (dataArr.length === pageSize ? 1 : 0));
      }
    } catch {
      toast.error('Failed to load covered work reports');
    } finally {
      setLoadingCoveredWork(false);
    }
  };

  const fetchMyHistory = async () => {
    if (!currentUser) return;

    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('session_token');

      let url = `/api/daily-reports?limit=${pageSize}&offset=${historyPage * pageSize}`;

      if (checkIsAdmin(currentUser?.role)) {
        const adminEmployee = employees.find(emp => emp.userId === currentUser.id);
        if (adminEmployee) {
          url += `&employeeId=${adminEmployee.id}`;
        }
      }

      if (historyFilterType === 'month' && historyMonth) {
        const [year, month] = historyMonth.split('-');
        const start = `${year}-${month}-01`;
        const end = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        url += `&startDate=${start}&endDate=${end}`;
      } else if (historyFilterType === 'range') {
        if (historyStartDate) url += `&startDate=${historyStartDate}`;
        if (historyEndDate) url += `&endDate=${historyEndDate}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        let reports = result.data || [];
        if (checkIsAdmin(currentUser?.role)) {
          reports = reports.filter((r: DailyReport) => r.userId === currentUser.id);
        }
        setMyHistoryReports(reports);
        setHistoryTotal(historyPage * pageSize + reports.length + (reports.length === pageSize ? 1 : 0));
      }
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (currentUser && activeTab === 'my-history') {
      fetchMyHistory();
    }
  }, [currentUser, activeTab, historyMonth, historyFilterType, historyStartDate, historyEndDate, historyPage, employees]);

  useEffect(() => {
    if (currentUser && activeTab === 'extra-work') {
      fetchExtraWork();
    }
  }, [currentUser, activeTab, extraWorkMonth, isExtraWorkMonthFilter, extraWorkStartDate, extraWorkEndDate, selectedProjectFilterExtra, selectedEmployeeExtraWork, extraWorkPage]);

  useEffect(() => {
    if (currentUser && activeTab === 'covered-work') {
      fetchCoveredWork();
    }
  }, [currentUser, activeTab, coveredWorkMonth, isCoveredWorkMonthFilter, coveredWorkStartDate, coveredWorkEndDate, selectedProjectFilterCovered, selectedEmployeeCoveredWork, coveredWorkPage]);

  const getProjectName = (projectId: number) => {
    const project = projectsList.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getEmployeeName = (report: DailyReport) => {
    if (report.firstName || report.lastName) {
      return `${report.firstName || ''} ${report.lastName || ''}`.trim();
    }
    return `Employee #${report.employeeId || report.userId || 'Unknown'}`;
  };

  const isAdmin = checkIsAdmin(currentUser?.role);

  useEffect(() => {
    if (currentUser && activeTab === 'projects') {
      fetchTabProjects();
    }
  }, [currentUser, activeTab, projectsPage]);

  if (!currentUser || loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TabsSkeleton count={isAdmin ? 6 : 5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {isAdmin ? 'Daily Updates Management' : 'My Daily Update'}
        </h2>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Manage all employee daily reports and track work activities'
            : 'Track your daily work progress and project activities'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={isAdmin ? "grid w-full grid-cols-6" : "grid w-full grid-cols-5"}>
          {isAdmin && <TabsTrigger value="all-reports"><Users className="mr-2 h-4 w-4" />All Reports</TabsTrigger>}
          <TabsTrigger value="daily-report">Daily Report</TabsTrigger>
          <TabsTrigger value="my-history">My History</TabsTrigger>

          <TabsTrigger value="extra-work">Extra Work</TabsTrigger>
          <TabsTrigger value="covered-work">Covered Work</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Admin: All Reports Tab */}
        {isAdmin && (
          <TabsContent value="all-reports">
            <Card>
              <CardHeader>
                <CardTitle>All Employee Daily Reports</CardTitle>
                <CardDescription>View, manage, and track all employee daily work reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SaaS-Ready Filtering Bar */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
                  <div className="flex flex-col gap-6">
                    {/* Top Row: Main Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employee Name</Label>
                        <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={employeeSearchOpen}
                              className="w-full justify-between bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                            >
                              {selectedEmployeeFilter === 'all' 
                                ? "All Employees" 
                                : employees.find((e) => e.id.toString() === selectedEmployeeFilter)
                                  ? `${employees.find((e) => e.id.toString() === selectedEmployeeFilter)?.firstName} ${employees.find((e) => e.id.toString() === selectedEmployeeFilter)?.lastName}`.trim() || employees.find((e) => e.id.toString() === selectedEmployeeFilter)?.email
                                  : "Select employee..."}
                              {scanningDirectory ? (
                                <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                              ) : (
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder={scanningDirectory ? "Scanning directory..." : "Search employee..."} className="h-9" />
                              <CommandList>
                                {scanningDirectory && employees.length === 0 && (
                                  <div className="py-6 text-center text-sm text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                    Scanning history for names...
                                  </div>
                                )}
                                <CommandEmpty>{scanningDirectory ? "Scanning..." : "No employee found."}</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="all"
                                    onSelect={() => {
                                      setSelectedEmployeeFilter("all");
                                      setEmployeeSearchOpen(false);
                                      setAllReportsPage(0);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", selectedEmployeeFilter === "all" ? "opacity-100" : "opacity-0")} />
                                    All Employees
                                  </CommandItem>
                                  {employees.map((emp, idx) => {
                                    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                                    const label = fullName || emp.email || `ID: ${emp.id}`;
                                    // Use a composite key to prevent React duplicate key errors
                                    const itemKey = `emp-${emp.id}-${fullName || idx}`;
                                    return (
                                      <CommandItem
                                        key={itemKey}
                                        value={label}
                                        onSelect={() => {
                                          setSelectedEmployeeFilter(emp.id.toString());
                                          setEmployeeSearchValue(label);
                                          setEmployeeSearchOpen(false);
                                          setAllReportsPage(0);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", selectedEmployeeFilter === emp.id.toString() ? "opacity-100" : "opacity-0")} />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{label}</span>
                                          {emp.designation && <span className="text-[10px] text-slate-400 capitalize">{emp.designation.replace('_', ' ')}</span>}
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={adminStartDate}
                            onChange={(e) => {
                              setAdminStartDate(e.target.value);
                              setAllReportsPage(0);
                            }}
                            className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">End Date</Label>
                        <Input
                          type="date"
                          value={adminEndDate}
                          onChange={(e) => {
                            setAdminEndDate(e.target.value);
                            setAllReportsPage(0);
                          }}
                          className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</Label>
                        <Select value={adminStatusFilter} onValueChange={(v) => {
                          setAdminStatusFilter(v);
                          setAllReportsPage(0);
                        }}>
                          <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                            <SelectValue placeholder="Filter Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="half_day">Half Day</SelectItem>
                            <SelectItem value="early_leave">Early Leave</SelectItem>
                            <SelectItem value="on_leave">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Bottom Row: Quick Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">Quick Date:</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          onClick={() => applyDatePreset('today')}
                        >
                          Today
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          onClick={() => applyDatePreset('yesterday')}
                        >
                          Yesterday
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          onClick={() => applyDatePreset('this-week')}
                        >
                          This Week
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          onClick={() => applyDatePreset('this-month')}
                        >
                          This Month
                        </Button>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                        onClick={fetchEmployees}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Refresh List
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        onClick={resetFilters}
                      >
                        <Eraser className="h-3.5 w-3.5" />
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                {loading ? (
                  <StatsSkeleton />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-100 dark:border-blue-900 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          Total Reports
                        </CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{allReportsTotal}</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-100 dark:border-emerald-900 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Present
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                          {allDailyReports.filter(r => r.availableStatus === 'present').length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-100 dark:border-amber-900 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          Half Day
                        </CardTitle>
                        <UserMinus className="h-4 w-4 text-amber-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                          {allDailyReports.filter(r => r.availableStatus === 'half_day').length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50 border-rose-100 dark:border-rose-900 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-300">
                          On Leave
                        </CardTitle>
                        <UserX className="h-4 w-4 text-rose-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-rose-900 dark:text-rose-100">
                          {allDailyReports.filter(r => r.availableStatus === 'on_leave').length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Table */}
                <div className="rounded-md border max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableSkeleton columns={5} rows={5} />
                      ) : allDailyReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No daily reports found
                          </TableCell>
                        </TableRow>
                      ) : (
                        allDailyReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                              {getEmployeeName(report)}
                            </TableCell>
                            <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge className={
                                report.availableStatus === 'present' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                                  report.availableStatus === 'on_leave' ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                                    'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              } variant="outline">
                                {report.availableStatus.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(report.createdAt).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewReportDetails(report)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingReport(report)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllReportsPage(p => Math.max(0, p - 1))}
                    disabled={allReportsPage === 0}
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium">Page {allReportsPage + 1}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllReportsPage(p => p + 1)}
                    disabled={allDailyReports.length < pageSize}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Daily Report Tab */}
        <TabsContent value="daily-report">
          <Card>
            <CardHeader>
              <CardTitle>Add Daily Report</CardTitle>
              <CardDescription>
                Submit your daily work report and project activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="pl-8"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Available Status *</Label>
                    <Select value={availableStatus} onValueChange={setAvailableStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                        <SelectItem value="early_leave">Early Leave</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Project-wise Reports *</Label>
                    <Button type="button" size="sm" onClick={addProjectReport}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Project
                    </Button>
                  </div>

                  {projectReports.map((pr, index) => (
                    <Card key={pr.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Project {index + 1}</h4>
                          {projectReports.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProjectReport(pr.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Project *</Label>
                            <Select
                              value={pr.projectId.toString()}
                              onValueChange={(value) => updateProjectReport(pr.id, 'projectId', parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map(project => (
                                  <SelectItem key={project.id} value={project.id.toString()}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Tracker Time *</Label>
                            <div className="flex gap-2 items-center">
                              <div className="relative flex-1">
                                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="0"
                                  value={Math.floor(pr.trackerTime / 60) || ''}
                                  onChange={(e) => {
                                    const h = parseInt(e.target.value) || 0;
                                    const m = pr.trackerTime % 60;
                                    updateProjectReport(pr.id, 'trackerTime', h * 60 + m);
                                  }}
                                  className="pl-8"
                                  placeholder="Hours"
                                />
                                <span className="absolute right-2 top-2 text-xs text-muted-foreground">h</span>
                              </div>
                              <div className="relative flex-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={pr.trackerTime % 60 || ''}
                                  onChange={(e) => {
                                    const h = Math.floor(pr.trackerTime / 60);
                                    let m = parseInt(e.target.value) || 0;
                                    if (m > 59) m = 59;
                                    updateProjectReport(pr.id, 'trackerTime', h * 60 + m);
                                  }}
                                  className="pr-6"
                                  placeholder="Mins"
                                />
                                <span className="absolute right-2 top-2 text-xs text-muted-foreground">m</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Textarea
                            value={pr.description}
                            onChange={(e) => updateProjectReport(pr.id, 'description', e.target.value)}
                            placeholder="Describe what you worked on..."
                            rows={3}
                            required
                          />
                        </div>

                        <div className="flex gap-4 items-center">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`covered-${pr.id}`}
                              checked={pr.isCoveredWork}
                              onCheckedChange={(checked) => updateProjectReport(pr.id, 'isCoveredWork', checked)}
                            />
                            <Label htmlFor={`covered-${pr.id}`} className="font-normal">
                              Is Covered Work?
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`extra-${pr.id}`}
                              checked={pr.isExtraWork}
                              onCheckedChange={(checked) => updateProjectReport(pr.id, 'isExtraWork', checked)}
                            />
                            <Label htmlFor={`extra-${pr.id}`} className="font-normal">
                              Is Extra Work?
                            </Label>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Daily Report'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extra Work Tab */}
        <TabsContent value="extra-work">
          <Card>
            <CardHeader>
              <CardTitle>Extra Work Report</CardTitle>
              <CardDescription>View all extra work activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2 min-w-[150px]">
                  <Label>Filter By</Label>
                  <Select value={isExtraWorkMonthFilter ? "month" : "range"} onValueChange={(v) => setIsExtraWorkMonthFilter(v === "month")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="range">Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isExtraWorkMonthFilter ? (
                  <div className="space-y-2">
                    <Label>Select Month</Label>
                    <Input
                      type="month"
                      value={extraWorkMonth}
                      onChange={(e) => setExtraWorkMonth(e.target.value)}
                      className="w-full md:w-[200px]"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={extraWorkStartDate}
                        onChange={(e) => setExtraWorkStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={extraWorkEndDate}
                        onChange={(e) => setExtraWorkEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 min-w-[200px]">
                  <Label>Project</Label>
                  <Select value={selectedProjectFilterExtra} onValueChange={setSelectedProjectFilterExtra}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projectsList.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAdmin && (
                  <div className="space-y-2 min-w-[200px]">
                    <Label>Employee</Label>
                    <Select value={selectedEmployeeExtraWork} onValueChange={setSelectedEmployeeExtraWork}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-end">
                  <Button onClick={fetchExtraWork} className="w-full">
                    Apply Filter
                  </Button>
                </div>
              </div>

              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      {isAdmin && <TableHead>Employee</TableHead>}
                      <TableHead>Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Time (hrs)</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingExtraWork ? (
                      <TableSkeleton columns={isAdmin ? 5 : 4} rows={5} />
                    ) : extraWorkReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                          No extra work found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      extraWorkReports.map((report) => (
                        <TableRow key={report.id}>
                          {isAdmin && (
                            <TableCell className="font-medium text-primary">
                              {report.firstName} {report.lastName}
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {getProjectName(report.projectId)}
                          </TableCell>
                          <TableCell>{report.description}</TableCell>
                          <TableCell>{Math.floor(report.trackerTime / 60)}h {report.trackerTime % 60}m</TableCell>
                          <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExtraWorkPage(p => Math.max(0, p - 1))}
                  disabled={extraWorkPage === 0}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">Page {extraWorkPage + 1}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExtraWorkPage(p => p + 1)}
                  disabled={extraWorkReports.length < pageSize}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Covered Work Tab */}
        <TabsContent value="covered-work">
          <Card>
            <CardHeader>
              <CardTitle>Covered Work Report</CardTitle>
              <CardDescription>View all covered work activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2 min-w-[150px]">
                  <Label>Filter By</Label>
                  <Select value={isCoveredWorkMonthFilter ? "month" : "range"} onValueChange={(v) => setIsCoveredWorkMonthFilter(v === "month")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="range">Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isCoveredWorkMonthFilter ? (
                  <div className="space-y-2">
                    <Label>Select Month</Label>
                    <Input
                      type="month"
                      value={coveredWorkMonth}
                      onChange={(e) => setCoveredWorkMonth(e.target.value)}
                      className="w-full md:w-[200px]"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={coveredWorkStartDate}
                        onChange={(e) => setCoveredWorkStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={coveredWorkEndDate}
                        onChange={(e) => setCoveredWorkEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 min-w-[200px]">
                  <Label>Project</Label>
                  <Select value={selectedProjectFilterCovered} onValueChange={setSelectedProjectFilterCovered}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projectsList.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAdmin && (
                  <div className="space-y-2 min-w-[200px]">
                    <Label>Employee</Label>
                    <Select value={selectedEmployeeCoveredWork} onValueChange={setSelectedEmployeeCoveredWork}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.firstName} {emp.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-end">
                  <Button onClick={fetchCoveredWork} className="w-full">
                    Apply Filter
                  </Button>
                </div>
              </div>

              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      {isAdmin && <TableHead>Employee</TableHead>}
                      <TableHead>Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Time (hrs)</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCoveredWork ? (
                      <TableSkeleton columns={isAdmin ? 5 : 4} rows={5} />
                    ) : coveredWorkReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                          No covered work found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      coveredWorkReports.map((report) => (
                        <TableRow key={report.id}>
                          {isAdmin && (
                            <TableCell className="font-medium text-primary">
                              {report.firstName} {report.lastName}
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {getProjectName(report.projectId)}
                          </TableCell>
                          <TableCell>{report.description}</TableCell>
                          <TableCell>{Math.floor(report.trackerTime / 60)}h {report.trackerTime % 60}m</TableCell>
                          <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCoveredWorkPage(p => Math.max(0, p - 1))}
                  disabled={coveredWorkPage === 0}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">Page {coveredWorkPage + 1}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCoveredWorkPage(p => p + 1)}
                  disabled={coveredWorkReports.length < pageSize}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>View all your assigned projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTabProjects ? (
                      <TableSkeleton columns={4} rows={5} />
                    ) : tabProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No projects assigned
                        </TableCell>
                      </TableRow>
                    ) : (
                      tabProjects.map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'in_progress' ? 'default' : 'secondary'}>
                              {project.status?.replace('_', ' ') || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={project.priority === 'high' ? 'destructive' : 'default'}>
                              {project.priority || 'N/A'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProjectsPage(p => Math.max(0, p - 1))}
                  disabled={projectsPage === 0}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">Page {projectsPage + 1}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProjectsPage(p => p + 1)}
                  disabled={tabProjects.length < pageSize}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My History Tab */}
        <TabsContent value="my-history">
          <Card>
            <CardHeader>
              <CardTitle>My Daily Updates History</CardTitle>
              <CardDescription>View your past daily reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2 min-w-[150px]">
                  <Label>Filter By</Label>
                  <Select value={historyFilterType} onValueChange={(v: 'month' | 'range') => setHistoryFilterType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="range">Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {historyFilterType === 'month' ? (
                  <div className="space-y-2">
                    <Label>Select Month</Label>
                    <Input
                      type="month"
                      value={historyMonth}
                      onChange={(e) => setHistoryMonth(e.target.value)}
                      className="w-full md:w-[200px]"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={historyStartDate}
                        onChange={(e) => setHistoryStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={historyEndDate}
                        onChange={(e) => setHistoryEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-end">
                  <Button onClick={fetchMyHistory} disabled={loadingHistory} variant="outline">
                    {loadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                  </Button>
                </div>
              </div>

              {/* History Table */}
              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Projects Worked On</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingHistory ? (
                      <TableSkeleton columns={5} rows={5} />
                    ) : myHistoryReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No reports found for the selected period
                        </TableCell>
                      </TableRow>
                    ) : (
                      myHistoryReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {new Date(report.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              report.availableStatus === 'present' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                                report.availableStatus === 'on_leave' ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                                  'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            } variant="outline">
                              {report.availableStatus.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-muted-foreground text-sm">
                            Click 'View' to see projects
                          </TableCell>
                          <TableCell>{new Date(report.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReportDetails(report)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                  disabled={historyPage === 0}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">Page {historyPage + 1}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage(p => p + 1)}
                  disabled={myHistoryReports.length < pageSize}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Report Details Dialog */}
      {isAdmin || viewingReportDetails ? (
        <AlertDialog open={viewingReportDetails !== null} onOpenChange={() => setViewingReportDetails(null)}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Daily Report Details</AlertDialogTitle>
              <AlertDialogDescription>
                View complete information about this daily report
              </AlertDialogDescription>
            </AlertDialogHeader>
            {viewingReportDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Employee Name</Label>
                    <p className="font-medium">{getEmployeeName(viewingReportDetails)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-medium">{new Date(viewingReportDetails.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={
                      viewingReportDetails.availableStatus === 'present' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                        viewingReportDetails.availableStatus === 'on_leave' ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                          'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    } variant="outline">
                      {viewingReportDetails.availableStatus.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Submitted At</Label>
                    <p>{new Date(viewingReportDetails.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block font-semibold text-blue-900 dark:text-blue-100">Project Activities</Label>
                  <div className="space-y-4">
                    {loadingReportProjects ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className="p-4 border-dashed animate-pulse bg-slate-50 dark:bg-slate-900/40">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                        </Card>
                      ))
                    ) : (
                      <>
                        {reportProjects.map((rp) => (
                          <Card key={rp.id} className="p-4 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div className="font-bold text-blue-800 dark:text-blue-300">
                                {rp.projectName || getProjectName(rp.projectId)}
                              </div>
                              <div className="flex gap-2">
                                {rp.isExtraWork && <Badge className="bg-orange-100 text-orange-800 border-orange-200" variant="outline">Extra Work</Badge>}
                                {rp.isCoveredWork && <Badge className="bg-purple-100 text-purple-800 border-purple-200" variant="outline">Covered Work</Badge>}
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed line-clamp-3">
                              {rp.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                <Clock className="h-3.3 w-3 h-3 w-3" />
                                <span>{Math.floor(rp.trackerTime / 60)}h {rp.trackerTime % 60}m</span>
                              </div>
                            </div>
                          </Card>
                        ))}
                        {reportProjects.length === 0 && (
                          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/20 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No project activities recorded for this day
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter className="border-t pt-4">
              <AlertDialogAction className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]" onClick={() => setViewingReportDetails(null)}>
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {/* Delete Confirmation Dialog */}
      {isAdmin && (
        <AlertDialog open={deletingReport !== null} onOpenChange={() => setDeletingReport(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Daily Report?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this daily report? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteReport} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
