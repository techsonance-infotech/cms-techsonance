// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  employeeDepartmentOptions,
  employeeEditFormSchema,
  employeeRoleOptions,
  employeeStatusOptions,
  employmentTypeOptions,
  type EmployeeEditFormValues,
} from '@/lib/forms/schemas';
import { Loader2, AlertCircle, User as UserIcon, Briefcase, IndianRupee, Mail, Phone, Lock, Calendar, CreditCard, Building, Building2, AlignLeft, Shield, Hash, MapPin, Search, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: number;
  userId: number;
  employeeId: string;
  department: string;
  designation: string;
  employmentType?: string;
  dateOfJoining: string;
  dateOfBirth: string | null;
  skills: any;
  salary: number | null;
  hourlyRate?: number | null;
  ctc?: number | null;
  pfNumber?: string | null;
  uanNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  managerId?: number | null;
  status: string;
  gender?: string | null;
  originalRole?: string | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employee: Employee | null;
  user: User | null;
}

export function EditEmployeeDialog({ open, onOpenChange, onSuccess, employee, user }: EditEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<EmployeeEditFormValues>({
    resolver: zodResolver(employeeEditFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'developer',
      employeeId: '',
      department: 'Engineering',
      designation: '',
      employmentType: 'full_time',
      dateOfJoining: '',
      dateOfBirth: '',
      salary: '',
      hourlyRate: '',
      ctc: '',
      pfNumber: '',
      uanNumber: '',
      bankName: '',
      bankAccountNumber: '',
      ifscCode: '',
      managerId: '',
      skills: '',
      gender: '',
      status: 'active',
    },
  });

  const employmentType = form.watch('employmentType');
  const isIntern = employmentType === 'intern';

  useEffect(() => {
    if (employee && user && open) {
      const skills = employee.skills
        ? (typeof employee.skills === 'string' ? JSON.parse(employee.skills) : employee.skills)
        : [];

      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: (employee.originalRole as EmployeeEditFormValues['role']) || (user.role as EmployeeEditFormValues['role']) || 'developer',
        employeeId: employee.employeeId || '',
        department: (employee.department as EmployeeEditFormValues['department']) || 'Engineering',
        designation: employee.designation || '',
        employmentType: (employee.employmentType as EmployeeEditFormValues['employmentType']) || 'full_time',
        dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.split('T')[0] : '',
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
        salary: employee.salary?.toString() || '',
        hourlyRate: employee.hourlyRate?.toString() || '',
        ctc: employee.ctc?.toString() || '',
        pfNumber: employee.pfNumber || '',
        uanNumber: employee.uanNumber || '',
        bankName: employee.bankName || '',
        bankAccountNumber: employee.bankAccountNumber || '',
        ifscCode: employee.ifscCode || '',
        managerId: employee.managerId?.toString() || '',
        skills: Array.isArray(skills) ? skills.join(', ') : '',
        gender: employee.gender || '',
        status: (employee.status as EmployeeEditFormValues['status']) || 'active',
      });
    }
  }, [employee, user, open, form]);

  const handleSubmit = async (values: EmployeeEditFormValues) => {
    if (!employee || !user) return;

    setLoading(true);
    setSubmitError(null);

    try {
      const userPayload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        role: values.role,
      };

      const userResponse = await fetch(`/api/users?id=${user.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(userPayload),
      });

      const extractMessage = (data: any, fallback: string) => {
        if (!data) return fallback;
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const msgs = data.errors.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`).filter(Boolean);
          if (msgs.length > 0) return msgs.join(', ');
        }
        return data.error || data.message || fallback;
      };

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        const message = extractMessage(errorData, 'Failed to update user information');
        if (message.toLowerCase().includes('email')) {
          form.setError('email', { message });
          return;
        }
        if (message.toLowerCase().includes('phone')) {
          form.setError('phone', { message });
          return;
        }
        throw new Error(message);
      }

      const safeManagerId = values.managerId && !isNaN(Number(values.managerId)) && Number(values.managerId) > 0 
        ? Number(values.managerId) 
        : null;

      const employeePayload = {
        employeeId: values.employeeId.trim(),
        department: values.department,
        designation: values.designation.trim(),
        employmentType: (values.employmentType || '').toLowerCase().replace('-', '_'),
        dateOfJoining: values.dateOfJoining ? values.dateOfJoining.split('T')[0] : '',
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.split('T')[0] : null,
        salary: values.salary ? Number(String(values.salary).replace(/[^0-9.-]/g, '')) || null : null,
        hourlyRate: values.hourlyRate ? Number(String(values.hourlyRate).replace(/[^0-9.-]/g, '')) || null : null,
        ctc: values.ctc ? Number(String(values.ctc).replace(/[^0-9.-]/g, '')) || null : null,
        pfNumber: values.pfNumber?.trim() || null,
        uanNumber: values.uanNumber?.trim() || null,
        bankName: values.bankName?.trim() || null,
        bankAccountNumber: values.bankAccountNumber?.trim() || null,
        ifscCode: values.ifscCode?.trim() || null,
        managerId: safeManagerId,
        skills: values.skills?.trim() ? values.skills.split(',').map((skill) => skill.trim()).filter(Boolean) : [],
        gender: values.gender || null,
        status: (values.status || 'active').toLowerCase().replace(/[\s-]+/g, '_'),
      };

      const employeeResponse = await fetch(`/api/employees?id=${employee.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(employeePayload),
      });

      if (!employeeResponse.ok) {
        const errorData = await employeeResponse.json();
        const message = extractMessage(errorData, 'Failed to update employee information');
        if (message.toLowerCase().includes('employeeid') || message.toLowerCase().includes('employee id')) {
          form.setError('employeeId', { message });
          return;
        }
        throw new Error(message);
      }

      toast.success('Employee updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 py-6 pb-2 border-b border-border/40">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Edit2 className="h-5 w-5 text-primary" />
            </div>
            Edit Employee
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Update employee information and profile details.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="px-6 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
            <Tabs defaultValue="personal" className="flex flex-col flex-1">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" /> Personal
                  </TabsTrigger>
                  <TabsTrigger value="work" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Work Profile
                  </TabsTrigger>
                  <TabsTrigger value="financials" className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" /> Financials & PF
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 pb-12 min-h-[400px]">
                {/* PERSONAL TAB */}
                <TabsContent value="personal" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <UserIcon className="h-3.5 w-3.5" /> Identity & Access
                    </p>
                    <div className="grid grid-cols-2 gap-5">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">First Name *</Label>
                          <FormControl><Input {...field} disabled={loading} placeholder="Jane" className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Last Name *</Label>
                          <FormControl><Input {...field} disabled={loading} placeholder="Doe" className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Email Directory *</Label>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="email" {...field} disabled={loading} className="pl-9 h-10" placeholder="jane@company.com" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Mobile Phone</Label>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="tel" {...field} disabled={loading} className="pl-9 h-10" placeholder="+1 (555) 000-0000" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Date of Birth</Label>
                          <FormControl>
                            <div className="relative">
                              <Input type="date" {...field} disabled={loading} className="h-10" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Gender *</Label>
                          <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </TabsContent>

                {/* WORK PROFILE TAB */}
                <TabsContent value="work" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5" /> Employment Specifics
                    </p>
                    <div className="grid grid-cols-3 gap-5">
                      <FormField control={form.control} name="employeeId" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Employee ID *</Label>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input {...field} disabled={loading} placeholder="EMP-001" className="pl-9 h-10" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="employmentType" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Employment Type *</Label>
                          <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employmentTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Status *</Label>
                          <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employeeStatusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status === 'on_leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Department *</Label>
                          <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employeeDepartmentOptions.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="designation" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Designation *</Label>
                          <FormControl><Input {...field} disabled={loading} placeholder="e.g. Frontend Engineer" className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">System Access Role *</Label>
                          <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                            <FormControl>
                              <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {employeeRoleOptions.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role === 'project_manager' ? 'Project Manager' : role.charAt(0).toUpperCase() + role.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="dateOfJoining" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Date of Joining *</Label>
                          <FormControl><Input type="date" {...field} disabled={loading} className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>
                    
                    <FormField control={form.control} name="skills" render={({ field }) => (
                      <FormItem className="min-w-0 space-y-1.5">
                        <Label className="text-xs font-semibold">Skills Profile (Comma Separated)</Label>
                        <FormControl><Input {...field} disabled={loading} placeholder="React, Node.js, Systems Design" className="h-10" /></FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )} />
                  </div>
                </TabsContent>

                {/* FINANCIALS TAB */}
                <TabsContent value="financials" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <IndianRupee className="h-3.5 w-3.5" /> Payroll Data
                    </p>
                    {isIntern ? (
                      <div className="grid grid-cols-2 gap-5">
                        <FormField control={form.control} name="hourlyRate" render={({ field }) => (
                          <FormItem className="min-w-0 space-y-1.5">
                            <Label className="text-xs font-semibold">Hourly Rate (Stipend)</Label>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                                <Input type="number" {...field} disabled={loading} placeholder="e.g. 200" className="pl-7 h-10" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="salary" render={({ field }) => (
                          <FormItem className="min-w-0 space-y-1.5">
                            <Label className="text-xs font-semibold">Monthly Stipend Target</Label>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                                <Input type="number" {...field} disabled={loading} placeholder="e.g. 15000" className="pl-7 h-10" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-5">
                        <FormField control={form.control} name="ctc" render={({ field }) => (
                          <FormItem className="min-w-0 space-y-1.5">
                            <Label className="text-xs font-semibold">Total Annual CTC</Label>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                                <Input type="number" {...field} disabled={loading} placeholder="e.g. 1200000" className="pl-7 h-10" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="salary" render={({ field }) => (
                          <FormItem className="min-w-0 space-y-1.5">
                            <Label className="text-xs font-semibold">Monthly Salary</Label>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₹</span>
                                <Input type="number" {...field} disabled={loading} placeholder="e.g. 100000" className="pl-7 h-10" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" /> Banking Integration
                    </p>
                    <div className="grid grid-cols-2 gap-5">
                      <FormField control={form.control} name="bankName" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Bank Name</Label>
                          <FormControl><Input {...field} disabled={loading} placeholder="HDFC, ICICI, etc." className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Account Number</Label>
                          <FormControl><Input {...field} disabled={loading} placeholder="000123456789" className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-5">
                      <FormField control={form.control} name="ifscCode" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">IFSC Code</Label>
                          <FormControl><Input {...field} disabled={loading} placeholder="HDFC0000123" className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="pfNumber" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">PF Number</Label>
                          <FormControl><Input {...field} disabled={loading} className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="uanNumber" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">UAN Number</Label>
                          <FormControl><Input {...field} disabled={loading} className="h-10" /></FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </TabsContent>
              </div>

              <div className="p-6 pt-0 mt-auto border-t">
                <div className="flex justify-end gap-2 pt-6">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Employee'}
                  </Button>
                </div>
              </div>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
