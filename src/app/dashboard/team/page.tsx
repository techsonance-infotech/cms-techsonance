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
import { Users, UserCheck, UserMinus, Building, UsersRound, Plus, MoreHorizontal, Eye, Edit, Trash2, Mail, Phone, MapPin, Building2, UserCog, UserMinus2, Calendar, Search } from 'lucide-react';
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
      
      // Delete employee record
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

  // Calculate paginated employees
  const paginatedEmployees = filteredEmployees.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  // Reset page when search changes
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <UsersRound className="h-6 w-6 text-primary" />
            </div>
            Team Management
          </h2>
          <p className="text-muted-foreground mt-2">
            {isAdmin ? 'Manage employees, attendance, and monitor HR performance' : 'View team members and their details'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-card to-primary/5 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-emerald-500/5 hover:border-emerald-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter(e => e.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-amber-500/5 hover:border-amber-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
              <Calendar className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter(e => e.status === 'on_leave').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-card to-indigo-500/5 hover:border-indigo-500/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(employees.map(e => e.department)).size}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Employees</CardTitle>
              <CardDescription>
                {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <InlineTableSkeleton rows={6} columns={7} />
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <UserCog className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No employees found</h3>
            </div>
          ) : (
            <>
              <div className="rounded-md border max-h-[600px] overflow-y-auto">
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
                          <TableCell className="font-medium">{employee.employeeId}</TableCell>
                          <TableCell>
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
                            <Badge variant={
                              employee.status === 'active' ? 'default' :
                              employee.status === 'on_leave' ? 'secondary' :
                              'outline'
                            }>
                              {employee.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/dashboard/team/${employee.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {isAdmin && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEdit(employee)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => user && setDeletingEmployee({ employee, user })}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
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
            employee={selectedEmployee}
            user={selectedUser}
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