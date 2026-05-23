// @ts-nocheck
'use client';

import { useState } from 'react';
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
  employeeCreateFormSchema,
  employeeDepartmentOptions,
  employeeRoleOptions,
  employmentTypeOptions,
  type EmployeeCreateFormValues,
} from '@/lib/forms/schemas';
import { Loader2, AlertCircle, User as UserIcon, Briefcase, IndianRupee, Mail, Phone, Lock, Calendar, CreditCard, Building, Building2, AlignLeft, Shield, Hash, MapPin, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<EmployeeCreateFormValues>({
    resolver: zodResolver(employeeCreateFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
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
      role: 'developer',
    },
  });

  const employmentType = form.watch('employmentType');
  const isIntern = employmentType === 'intern';

  const resetForm = () => form.reset();
  
  const handleSubmit = async (values: EmployeeCreateFormValues) => {
    setLoading(true);
    setSubmitError(null);

    try {
      const userPayload = {
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        role: values.role,
        phone: values.phone?.trim() || null,
      };

      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(userPayload),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        const message = errorData.error || errorData.message || 'Failed to create user account';
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

      const userData = await userResponse.json();

      const employeePayload = {
        userId: userData.id,
        employeeId: values.employeeId.trim(),
        department: values.department.trim(),
        designation: values.designation.trim(),
        employmentType: values.employmentType,
        dateOfJoining: values.dateOfJoining,
        dateOfBirth: values.dateOfBirth || null,
        salary: values.salary ? Number(values.salary) : null,
        hourlyRate: values.hourlyRate ? Number(values.hourlyRate) : null,
        ctc: values.ctc ? Number(values.ctc) : null,
        pfNumber: values.pfNumber?.trim() || null,
        uanNumber: values.uanNumber?.trim() || null,
        bankName: values.bankName?.trim() || null,
        bankAccountNumber: values.bankAccountNumber?.trim() || null,
        ifscCode: values.ifscCode?.trim() || null,
        managerId: values.managerId ? Number(values.managerId) : null,
        skills: values.skills?.trim() ? values.skills.split(',').map((skill) => skill.trim()).filter(Boolean) : [],
        status: 'active',
      };

      const employeeResponse = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: JSON.stringify(employeePayload),
      });

      if (!employeeResponse.ok) {
        const errorData = await employeeResponse.json();
        const message = errorData.error || errorData.message || 'Failed to create employee record';
        if (message.toLowerCase().includes('employeeid') || message.toLowerCase().includes('employee id')) {
          form.setError('employeeId', { message });
          return;
        }
        throw new Error(message);
      }

      toast.success('Employee added successfully');
      onOpenChange(false);
      onSuccess();
      resetForm();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add employee');
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
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            Add New Employee
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Create an employee profile and onboard them into the workspace. All required fields are marked with an asterisk (*).
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
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem className="min-w-0 space-y-1.5">
                          <Label className="text-xs font-semibold">Initial Password *</Label>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="password" {...field} disabled={loading} autoComplete="new-password" className="pl-9 h-10" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )} />
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
                    <div className="grid grid-cols-2 gap-5">
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
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Save Employee'}
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
