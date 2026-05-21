// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton, InlineTableSkeleton } from '@/components/ui/dashboard-skeleton';
import Link from 'next/link';
import { AddEmployeeDialog } from '@/components/team/add-employee-dialog';
import { EditEmployeeDialog } from '@/components/team/edit-employee-dialog';
import { hasFullAccess, type UserRole } from '@/lib/permissions';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Building, 
  UsersRound, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  UserCog, 
  Calendar, 
  Search,
  Grid,
  List,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';

interface Employee {
  id: number;
  userId: number;
  employeeId: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  employmentType: string;
  status: string;
  gender?: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function TeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<{ employee: Employee; user: User } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const pageSize = 8;

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    fetchCurrentUser();
    fetchTeamData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const [employeesRes, usersRes] = await Promise.all([
        fetch('/api/employees?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/users?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
      ]);

      if (employeesRes.ok) {
        const data = await employeesRes.json();
        setEmployees(data);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: number) => {
    return users.find(u => u.id === userId);
  };

  const handleEdit = (employee: Employee) => {
    const user = getUserById(employee.userId);
    if (user) {
      setSelectedEmployee(employee);
      setSelectedUser(user);
      setEditDialogOpen(true);
    }
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;

    try {
      const token = localStorage.getItem('session_token');
      
      const response = await fetch(`/api/employees?id=${deletingEmployee.employee.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Employee record archived successfully!');
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to archive employee');
      }
    } catch (error) {
      console.error('Error archiving employee:', error);
      toast.error('An error occurred while archiving');
    } finally {
      setDeletingEmployee(null);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const user = getUserById(emp.userId);
    const searchLower = search.toLowerCase();
    const matchesSearch = (
      emp.employeeId.toLowerCase().includes(searchLower) ||
      emp.department.toLowerCase().includes(searchLower) ||
      emp.designation.toLowerCase().includes(searchLower) ||
      user?.firstName.toLowerCase().includes(searchLower) ||
      user?.lastName.toLowerCase().includes(searchLower)
    );
    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const paginatedEmployees = filteredEmployees.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [search, departmentFilter]);

  const isAdmin = currentUser && hasFullAccess(currentUser.role as UserRole);

  const departments = Array.from(new Set(employees.map(e => e.department)));

  if (!loading && currentUser && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <UserCog className="h-16 w-16 text-indigo-500 animate-bounce" />
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          The HRM Employee Directory is strictly reserved for Admin and HR groups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#311042] to-[#111827] p-6 text-white shadow-xl border border-indigo-950/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">HRM Directory Suite</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-violet-200 bg-clip-text text-transparent">
              HRM Employee Directory
            </h2>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              Cross-tenant team mapping, active contracts monitor, and role deployment matrices.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setAddDialogOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none shadow-sm hover:brightness-110">
              <Plus className="mr-2 h-4 w-4" /> Add New Employee
            </Button>
          )}
        </div>
      </div>

      {/* Bento Stats */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Cohort</CardTitle>
              <Users className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{employees.length}</div>
              <p className="text-[10px] text-muted-foreground mt-2">Active corporate accounts</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Roster</CardTitle>
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {employees.filter(e => e.status === 'active').length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Currently on duty</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved Leave</CardTitle>
              <Calendar className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {employees.filter(e => e.status === 'on_leave').length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Active PTO cycles</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departments</CardTitle>
              <Building className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {departments.length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Cross-functional verticals</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Grid Ledger Card */}
      <Card>
        <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Staff Ledger</CardTitle>
              <CardDescription>Deploy, filter, and audit active staff deployments</CardDescription>
            </div>
            
            {/* Interactive Filters Block */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff, ID, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs h-9 bg-white dark:bg-zinc-900"
                />
              </div>

              {/* Department Dropdown Filter */}
              <select 
                value={departmentFilter} 
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-white dark:bg-zinc-900 border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Grid / List Layout toggle */}
              <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <InlineTableSkeleton rows={6} columns={7} />
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs flex flex-col items-center gap-2">
              <UserCog className="h-10 w-10 text-slate-300 animate-pulse" />
              <p className="font-bold">No active employees found matching the search criteria.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Premium Grid View Layout */
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {paginatedEmployees.map((employee) => {
                const user = getUserById(employee.userId);
                return (
                  <div key={employee.id} className="p-4 border rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all flex flex-col gap-3 relative group">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center font-bold text-indigo-600 text-xs">
                        {user ? `${user.firstName[0]}${user.lastName[0]}` : 'EM'}
                      </div>
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="text-[9px] uppercase px-1.5">
                        {employee.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{user ? `${user.firstName} ${user.lastName}` : 'Unknown'}</h4>
                      <p className="text-[11px] text-muted-foreground">{employee.designation}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{employee.employeeId}</p>
                    </div>

                    <div className="border-t pt-2 mt-1 space-y-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>{employee.department}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Joined {new Date(employee.dateOfJoining).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Quick actions overlay */}
                    <div className="flex justify-end gap-1.5 pt-2 mt-auto border-t">
                      <Link href={`/dashboard/team/${employee.id}`}>
                        <Button variant="ghost" size="xs" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="xs" className="h-7 w-7 p-0" onClick={() => handleEdit(employee)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="xs" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => user && setDeletingEmployee({ employee, user })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View Layout */
            <div className="rounded-xl border max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((employee) => {
                    const user = getUserById(employee.userId);
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-bold font-mono text-indigo-600">{employee.employeeId}</TableCell>
                        <TableCell className="font-bold">
                          {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                        </TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.designation}</TableCell>
                        <TableCell className="capitalize">{employee.gender || 'Not set'}</TableCell>
                        <TableCell className="capitalize">{employee.employmentType?.replace('_', ' ') || 'Full time'}</TableCell>
                        <TableCell>
                          {new Date(employee.dateOfJoining).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                            {employee.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/dashboard/team/${employee.id}`}>
                              <Button variant="ghost" size="xs">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {isAdmin && (
                              <>
                                <Button variant="ghost" size="xs" onClick={() => handleEdit(employee)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="xs" className="text-rose-600" onClick={() => user && setDeletingEmployee({ employee, user })}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4 mt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <div className="text-xs font-semibold">Page {currentPage + 1} of {Math.ceil(filteredEmployees.length / pageSize) || 1}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={(currentPage + 1) * pageSize >= filteredEmployees.length}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Containers */}
      {isAdmin && (
        <>
          <AddEmployeeDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            onSuccess={fetchTeamData}
          />

          <EditEmployeeDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={fetchTeamData}
            employee={selectedEmployee}
            user={selectedUser}
          />

          <AlertDialog open={deletingEmployee !== null} onOpenChange={() => setDeletingEmployee(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to archive this record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will safely lock "{deletingEmployee?.user.firstName} {deletingEmployee?.user.lastName}" and block active profile directory lookups.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}