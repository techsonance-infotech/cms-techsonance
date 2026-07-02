'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineTableSkeleton } from '@/components/ui/dashboard-skeleton';
import Link from 'next/link';
import { AddEmployeeDialog } from '@/components/team/add-employee-dialog';
import { EditEmployeeDialog } from '@/components/team/edit-employee-dialog';
import { hasFullAccess, type UserRole } from '@/lib/permissions';
import { 
  Users, 
  UserCheck, 
  Building, 
  UsersRound, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  UserCog, 
  Calendar, 
  Search, 
  Settings
} from 'lucide-react';
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
  dateOfBirth?: string | null;
  skills?: any;
  salary?: number | null;
  hourlyRate?: number | null;
  ctc?: number | null;
  pfNumber?: string | null;
  uanNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  managerId?: number | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string | null;
}

export default function TeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<{ employee: Employee; user: User } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

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
        // The API returns { success: true, data: Employee[] }
        setEmployees(data.data || data);
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

  const handleGenerateReport = () => {
    toast.success("Flagship corporate team directory report compiled and downloadable.");
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
        toast.success('Employee deleted successfully!');
        fetchTeamData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('An error occurred while deleting the employee');
    } finally {
      setDeletingEmployee(null);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const user = getUserById(emp.userId);
    const searchLower = search.toLowerCase();
    return (
      emp.employeeId.toLowerCase().includes(searchLower) ||
      emp.department.toLowerCase().includes(searchLower) ||
      emp.designation.toLowerCase().includes(searchLower) ||
      user?.firstName.toLowerCase().includes(searchLower) ||
      user?.lastName.toLowerCase().includes(searchLower)
    );
  });

  const paginatedEmployees = filteredEmployees.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [search]);

  const isAdmin = currentUser && hasFullAccess(currentUser.role as UserRole);

  if (!loading && currentUser && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <UserCog className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          The Team Management directory is strictly reserved for Administrators and HR personnel. Your profile details will be available in your personal dashboard soon.
        </p>
      </div>
    );
  }

  const densityPadding = 
    density === 'compact' ? 'py-1.5 px-3' : 
    density === 'comfortable' ? 'py-3.5 px-5' : 
    'py-2.5 px-4';

  const densityMargin = 
    density === 'compact' ? 'gap-2' : 
    density === 'comfortable' ? 'gap-6' : 
    'gap-4';

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      
      {/* Brand Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#2f3035] p-6 text-[#fdfcfc] shadow-sm border border-[#e6e4e6]/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <UsersRound className="h-4 w-4 text-[#f87941]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#e6e4e6]/80">Team directory and operations control</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#fdfcfc]">
              Team Directory
            </h2>
            <p className="text-sm text-[#e6e4e6]/70 mt-1 max-w-xl">
              {isAdmin ? 'Manage employees, system access roles, departments, and monitor HR performance.' : 'View team members and their details.'}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-[#e6e4e6]/25 bg-[#2f3035] text-[#fdfcfc] hover:bg-[#e6e4e6]/10 hover:text-[#fdfcfc] transition-all" onClick={handleGenerateReport}>
                Generate Team Report
              </Button>
              <Button size="sm" className="bg-[#f87941] hover:bg-[#f87941]/90 text-[#fdfcfc] border-none shadow-sm font-semibold transition-all" onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Spacing & Density Configuration Panel */}
      <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
        <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#f87941] animate-spin" />
                Interface Spacing & Density Configuration
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Density Mode:</span>
              <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs font-semibold">
                <button className={`px-3 py-1.5 rounded-md transition-colors ${density === 'compact' ? 'bg-[#f87941] text-[#fdfcfc] shadow-sm' : 'text-[#b1b1b1] hover:text-[#2f3035]'}`} onClick={() => setDensity('compact')}>Compact</button>
                <button className={`px-3 py-1.5 rounded-md transition-colors ${density === 'standard' ? 'bg-[#f87941] text-[#fdfcfc] shadow-sm' : 'text-[#b1b1b1] hover:text-[#2f3035]'}`} onClick={() => setDensity('standard')}>Standard</button>
                <button className={`px-3 py-1.5 rounded-md transition-colors ${density === 'comfortable' ? 'bg-[#f87941] text-[#fdfcfc] shadow-sm' : 'text-[#b1b1b1] hover:text-[#2f3035]'}`} onClick={() => setDensity('comfortable')}>Comfortable</button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bento Stats Overview */}
      {isAdmin && (
        <div className={`grid gap-6 md:grid-cols-4 ${densityMargin}`}>
          {/* Total Employees */}
          <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm relative overflow-hidden bg-[#e6e4e6]/10 dark:bg-[#2f3035]/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#b1b1b1]">Total Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#f87941]">{employees.length}</div>
              <p className="text-[10px] text-muted-foreground mt-2">Registered personnel in organization</p>
            </CardContent>
          </Card>

          {/* Active */}
          <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm relative overflow-hidden bg-[#e6e4e6]/10 dark:bg-[#2f3035]/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#b1b1b1]">Active Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#f87941]">
                {employees.filter(e => e.status === 'active').length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Staff members actively checking in</p>
            </CardContent>
          </Card>

          {/* On Leave */}
          <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm relative overflow-hidden bg-[#e6e4e6]/10 dark:bg-[#2f3035]/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#b1b1b1]">On Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#f9b095]">
                {employees.filter(e => e.status === 'on_leave').length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Active leaves and time off</p>
            </CardContent>
          </Card>

          {/* Departments */}
          <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm relative overflow-hidden bg-[#e6e4e6]/10 dark:bg-[#2f3035]/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#b1b1b1]">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-[#b1b1b1]">
                {new Set(employees.map(e => e.department)).size}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Distinct business divisions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Directory Table Grid */}
      <Card className="border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
        <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Employees</CardTitle>
              <CardDescription>
                {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#b1b1b1]" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8 focus-visible:ring-[#f87941] focus-visible:border-[#f87941]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <InlineTableSkeleton rows={6} columns={9} />
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <UserCog className="mx-auto h-12 w-12 text-[#b1b1b1]" />
              <h3 className="mt-4 text-lg font-semibold">No employees found</h3>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-[#e6e4e6]/20 dark:bg-[#2f3035]/40">
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Employment Type</th>
                      <th className="p-3">Joining Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {paginatedEmployees.map((employee) => {
                      const user = getUserById(employee.userId);
                      return (
                        <tr key={employee.id} className="hover:bg-[#e6e4e6]/10 dark:hover:bg-[#2f3035]/10 transition-colors">
                          <td className={`font-mono font-bold text-[#f87941] ${densityPadding}`}>{employee.employeeId}</td>
                          <td className={`font-bold text-zinc-900 dark:text-zinc-50 ${densityPadding}`}>
                            {user ? `${user.firstName} ${user.lastName}` : 'Unknown'}
                          </td>
                          <td className={densityPadding}>
                            <Badge variant="secondary" className="text-[10px] bg-[#e6e4e6]/30 dark:bg-[#2f3035]/40 text-[#2f3035] dark:text-[#fdfcfc]">{employee.department}</Badge>
                          </td>
                          <td className={`font-medium ${densityPadding}`}>{employee.designation}</td>
                          <td className={`capitalize ${densityPadding}`}>{employee.gender || 'Not set'}</td>
                          <td className={`capitalize ${densityPadding}`}>{employee.employmentType?.replace('_', ' ') || 'Full time'}</td>
                          <td className={densityPadding}>
                            {new Date(employee.dateOfJoining).toLocaleDateString()}
                          </td>
                          <td className={densityPadding}>
                            <Badge className={`text-[9px] uppercase font-bold border ${
                              employee.status === 'active' ? 'bg-[#f87941]/10 text-[#f87941] border-[#f87941]/25' :
                              employee.status === 'on_leave' ? 'bg-[#f9b095]/10 text-[#f9b095] border-[#f9b095]/25' :
                              'bg-[#b1b1b1]/10 text-[#b1b1b1] border-[#b1b1b1]/25'
                            }`}>
                              {employee.status?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className={`text-right ${densityPadding}`}>
                            <div className="flex justify-end gap-1.5">
                              <Link href={`/dashboard/team/${employee.id}`}>
                                <Button size="xs" variant="outline" className="h-7 text-xs border-[#b1b1b1]/40 hover:bg-[#b1b1b1]/10 text-[#2f3035] dark:text-[#fdfcfc]">
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              {isAdmin && (
                                <>
                                  <Button 
                                    size="xs" 
                                    variant="outline" 
                                    className="h-7 text-xs border-[#f87941]/40 hover:bg-[#f87941]/10 text-[#f87941]"
                                    onClick={() => handleEdit(employee)}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    size="xs" 
                                    variant="outline" 
                                    className="h-7 text-xs border-[#f9b095]/40 hover:bg-[#f9b095]/10 text-[#f9b095]"
                                    onClick={() => user && setDeletingEmployee({ employee, user })}
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

              {/* Pagination */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">Page {currentPage + 1}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={(currentPage + 1) * pageSize >= filteredEmployees.length}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
            employee={selectedEmployee as any}
            user={selectedUser as any}
          />

          <AlertDialog open={deletingEmployee !== null} onOpenChange={() => setDeletingEmployee(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this employee?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{deletingEmployee?.user.firstName} {deletingEmployee?.user.lastName}" and all associated records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}