'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Building2, Palette, Users, Plug, Plus, Key, User as UserIcon, Calendar, Mail, Shield, Briefcase, Phone, Banknote, Award, Globe, Fingerprint, Activity, Database } from 'lucide-react';
import { DetailedPageSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { DynamicSchemaTab } from '@/components/settings/dynamic-schema-tab';

import { passwordChangeFormSchema, type PasswordChangeFormValues } from '@/lib/forms/schemas';
import { UserRole, hasFullAccess, getRoleName } from '@/lib/permissions';

interface CompanySettings {
  companyName: string;
  email: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
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
  termsAndConditions: string;
  notes: string;
  paymentTerms: string;
  logoUrl: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
  joiningDate?: string | null;
  designation?: string | null;
  phone?: string | null;
  department?: string | null;
  dateOfBirth?: string | null;
  skills?: any;
  salary?: number | null;
  status?: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    logoUrl: '',
  });
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    gstNo: '',
    pan: '',
    tan: '',
    registrationNo: '',
    termsAndConditions: '',
    notes: '',
    paymentTerms: '',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const userRes = await fetchCurrentUser();
      if (userRes && hasFullAccess(userRes.role)) {
        await fetchSettings();
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

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
        return data.user as User;
      }
    } catch {
      toast.error('Failed to load user profile');
    }
    return null;
  };

  const fetchSettings = async () => {
    try {
      const [companyRes, businessRes] = await Promise.all([
        fetch('/api/company-settings'),
        fetch('/api/business-settings')
      ]);

      if (companyRes.ok) {
        setSettings(await companyRes.json());
      }

      if (businessRes.ok) {
        setBusinessSettings(await businessRes.json());
      }
    } catch {
      toast.error('Failed to load company settings');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusinessSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/business-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessSettings)
      });
      if (res.ok) {
        toast.success('Business settings saved successfully');
        fetchSettings();
      } else {
        toast.error('Failed to save business settings');
      }
    } catch {
      toast.error('An error occurred while saving business settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (values: PasswordChangeFormValues) => {
    setChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully!');
        passwordForm.reset();
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch {
      toast.error('An error occurred while changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSkills = (skills: any) => {
    if (!skills) return [];
    if (typeof skills === 'string') {
      try {
        return JSON.parse(skills);
      } catch {
        return skills.split(',').map((s: string) => s.trim());
      }
    }
    return Array.isArray(skills) ? skills : [];
  };

  if (loading) {
    return <DetailedPageSkeleton />;
  }

  const isAdmin = currentUser && hasFullAccess(currentUser.role);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage company profile, appearance, and integrations' : 'View your profile and manage account security'}
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? "company" : "profile"} className="w-full">
        <TabsList className="flex flex-wrap justify-start h-auto gap-1 bg-transparent border-b rounded-none p-0 mb-6">
          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2">
            <UserIcon className="mr-2 h-4 w-4" />
            My Information
          </TabsTrigger>
          
          {isAdmin && (
            <>
              <TabsTrigger value="company" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2">
                <Building2 className="mr-2 h-4 w-4" />
                Company Profile
              </TabsTrigger>
              <TabsTrigger value="appearance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2">
                <Palette className="mr-2 h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2">
                <Users className="mr-2 h-4 w-4" />
                Users & Roles
              </TabsTrigger>
              <TabsTrigger value="integrations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2">
                <Plug className="mr-2 h-4 w-4" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="business" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2">
                <Building2 className="mr-2 h-4 w-4" />
                Invoice Settings
              </TabsTrigger>
              <TabsTrigger value="dynamic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2">
                <Database className="mr-2 h-4 w-4" />
                Dynamic Schema Engine
              </TabsTrigger>
            </>
          )}


          <TabsTrigger value="password" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-4 py-2">
            <Key className="mr-2 h-4 w-4" />
            Change Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6">
            {/* Header Card */}
            <Card className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-primary/10">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
                    <UserIcon className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-3xl font-bold tracking-tight">{currentUser?.firstName} {currentUser?.lastName}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <Badge variant="default" className="text-xs uppercase tracking-wider px-3 py-1">
                        {currentUser ? getRoleName(currentUser.role) : 'Standard User'}
                      </Badge>
                      <Badge variant="outline" className="text-xs uppercase tracking-wider px-3 py-1 border-primary/20 text-primary">
                        {currentUser?.employeeId || 'TSI-PENDING'}
                      </Badge>
                      <Badge 
                        variant={currentUser?.status === 'active' ? 'secondary' : 'outline'} 
                        className={`text-xs uppercase tracking-wider px-3 py-1 ${currentUser?.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}`}
                      >
                        <Activity className="mr-1 h-3 w-3" />
                        {currentUser?.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Column 1: Employment Details */}
              <div className="space-y-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Employment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-widest">Department</Label>
                      <p className="font-semibold">{currentUser?.department || 'Not Assigned'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-widest">Designation</Label>
                      <p className="font-semibold text-primary">{currentUser?.designation || 'Not Assigned'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-widest">Joining Date</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">
                          {currentUser?.joiningDate 
                            ? new Date(currentUser.joiningDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Column 2: Personal Details */}
              <div className="space-y-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-primary" />
                      Personal Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-widest">Email Address</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium truncate">{currentUser?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-widest">Phone Number</Label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{currentUser?.phone || 'Not Provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground uppercase tracking-widest">Date of Birth</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {currentUser?.dateOfBirth 
                            ? new Date(currentUser.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) 
                            : 'Not Provided'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Column 3: Compensation & Skills */}
              <div className="space-y-6">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Professional
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-widest">Annual Salary</Label>
                        <Banknote className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(currentUser?.salary)}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-widest">Technical Skills</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {getSkills(currentUser?.skills).length > 0 ? (
                          getSkills(currentUser?.skills).map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary" className="px-2 py-0 text-[10px] bg-slate-100 dark:bg-slate-800 border-none">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No skills listed</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Update your company details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={settings.companyName}
                        onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={settings.phone || ''}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={settings.website || ''}
                        onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settings.address || ''}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Customization</CardTitle>
                  <CardDescription>Customize the look and feel of your CMS</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.primaryColor || '#3B82F6'}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={settings.primaryColor || '#3B82F6'}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={settings.secondaryColor || '#10B981'}
                          onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                          className="w-20 h-10"
                        />
                        <Input
                          value={settings.secondaryColor || '#10B981'}
                          onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={settings.logoUrl || ''}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Theme
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Manage system users and permissions</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">User management interface</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Connected Channels & Templates (Left/Mid) */}
                <div className="xl:col-span-2 space-y-6">
                  
                  {/* Connected Channels */}
                  <Card className="border-slate-100 dark:border-slate-800 shadow-xs">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Plug className="h-5 w-5 text-primary" />
                            Connected Communication Channels
                          </CardTitle>
                          <CardDescription>Manage your active enterprise omnichannel integrations.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => toast.info('Integration manager launching...')}>
                          Add Integration
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Gmail/Outlook */}
                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary/45 transition-colors flex items-start gap-4 bg-slate-50/30 dark:bg-slate-900/10">
                          <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">Gmail Workspace</h4>
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[9px] py-0.5 px-2.5 rounded-full uppercase tracking-wider">
                                Active
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">support@techsonance.com</p>
                            <div className="flex items-center gap-3 mt-3">
                              <button onClick={() => toast.success('Synchronized successfully')} className="text-[10px] font-bold text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors">Sync Settings</button>
                              <button onClick={() => toast.error('Connection protected')} className="text-[10px] font-bold text-red-500 hover:opacity-80 transition-opacity">Disconnect</button>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp API */}
                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary/45 transition-colors flex items-start gap-4 bg-slate-50/30 dark:bg-slate-900/10">
                          <div className="w-10 h-10 rounded bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                            <Phone className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">WhatsApp Business</h4>
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[9px] py-0.5 px-2.5 rounded-full uppercase tracking-wider">
                                Active
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">+91 (987) 654-3210</p>
                            <div className="flex items-center gap-3 mt-3">
                              <button onClick={() => toast.info('Webhook configuration updated')} className="text-[10px] font-bold text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors">Webhook Config</button>
                              <button onClick={() => toast.error('Connection protected')} className="text-[10px] font-bold text-red-500 hover:opacity-80 transition-opacity">Disconnect</button>
                            </div>
                          </div>
                        </div>

                        {/* Slack */}
                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary/45 transition-colors flex items-start gap-4 bg-slate-50/30 dark:bg-slate-900/10 opacity-75">
                          <div className="w-10 h-10 rounded bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">Slack Enterprise</h4>
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-none font-bold text-[9px] py-0.5 px-2.5 rounded-full uppercase tracking-wider">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">Re-authentication required</p>
                            <div className="mt-3">
                              <Button onClick={() => toast.success('Slack Enterprise reconnected')} size="sm" className="bg-primary hover:opacity-90 text-white font-bold text-[10px] h-7 px-3 rounded-lg">
                                Reconnect
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Twilio SMS */}
                        <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary/45 transition-colors flex items-start gap-4 bg-slate-50/30 dark:bg-slate-900/10">
                          <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                            <Globe className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">Twilio SMS Gateway</h4>
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[9px] py-0.5 px-2.5 rounded-full uppercase tracking-wider">
                                Active
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">Credit Bal: $1,240.45</p>
                            <div className="flex items-center gap-3 mt-3">
                              <button onClick={() => toast.success('Payment portal active')} className="text-[10px] font-bold text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors">Add Credit</button>
                              <button onClick={() => toast.info('Redirecting to logs...')} className="text-[10px] font-bold text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors">Logs</button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>

                  {/* Global Templates Library */}
                  <Card className="border-slate-100 dark:border-slate-800 shadow-xs">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg font-bold">Global Enterprise Templates</CardTitle>
                          <CardDescription>Consolidated templates across all connected networks.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => toast.info('Template creator starting...')}>
                          Create Template
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
                              <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Template Name</th>
                              <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Channel</th>
                              <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Usage</th>
                              <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/5 transition-colors">
                              <td className="py-4 px-6">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Welcome Series - CRM Onboarding</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Updated 2 hours ago</div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 border-none font-bold py-0.5 px-2 rounded">
                                  Email
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-xs text-muted-foreground">4,204 sends</td>
                              <td className="py-4 px-6 text-right">
                                <Button onClick={() => toast.info('Template editor active')} variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                  Configure
                                </Button>
                              </td>
                            </tr>

                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/5 transition-colors">
                              <td className="py-4 px-6">
                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Overdue Invoice Warning</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Updated yesterday</div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex gap-1.5">
                                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 border-none font-bold py-0.5 px-2 rounded">
                                    SMS
                                  </Badge>
                                  <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-800 border-none font-bold py-0.5 px-2 rounded">
                                    WA
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-xs text-muted-foreground">842 sends</td>
                              <td className="py-4 px-6 text-right">
                                <Button onClick={() => toast.info('Template editor active')} variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                  Configure
                                </Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* AI Tone & Style secondary configurations (Right) */}
                <div className="space-y-6">
                  
                  {/* AI Brand voice config */}
                  <Card className="border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Palette className="h-5 w-5 text-indigo-500" />
                        AI Brand Voice & Persona
                      </CardTitle>
                      <CardDescription>Configure corporate messaging guidelines.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Organization Persona</Label>
                        <select className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs outline-none text-slate-900 dark:text-slate-100">
                          <option>Professional & Empathetic (Recommended)</option>
                          <option>Concise, Direct & Data-Driven</option>
                          <option>Energetic, Casual & Friendly</option>
                          <option>Formal, Executive & Authoritative</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <Label className="text-muted-foreground uppercase tracking-wider">Creativity Factor</Label>
                          <span className="text-primary">70%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative">
                          <div className="absolute left-0 top-0 h-full w-[70%] bg-primary rounded-full"></div>
                          <div className="absolute left-[70%] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white dark:bg-slate-900 border-2 border-primary rounded-full shadow-xs"></div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold block mb-1">Tone Constraints</Label>
                        <div className="flex items-center gap-2.5">
                          <input defaultChecked type="checkbox" id="noJargon" className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4" />
                          <label htmlFor="noJargon" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">Avoid industry jargon</label>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <input defaultChecked type="checkbox" id="solFirst" className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4" />
                          <label htmlFor="solFirst" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">Prioritize customer solutions first</label>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <input type="checkbox" id="addEmojis" className="rounded border-slate-350 text-primary focus:ring-primary w-4 h-4" />
                          <label htmlFor="addEmojis" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">Allow light emojis in drafts</label>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-150 dark:border-slate-800">
                        <Button 
                          onClick={() => toast.success('Brand voice simulator passed! Corporate communications validated.')} 
                          variant="outline" 
                          className="w-full text-xs font-bold text-primary border-primary/20 hover:bg-primary/5 h-9"
                        >
                          Test Brand Voice Simulator
                        </Button>
                      </div>

                    </CardContent>
                  </Card>

                  {/* Limits and safety alerts */}
                  <Card className="border-slate-100 dark:border-slate-800 bg-amber-500/10 p-5 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Omnichannel Integration Threshold</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">You are currently utilizing 4 of 5 available channels in your enterprise cluster.</p>
                        <button onClick={() => toast.info('Opening plan manager')} className="text-primary font-black text-[11px] mt-3 hover:underline flex items-center gap-1">
                          Upgrade Tier Plan &rarr;
                        </button>
                      </div>
                    </div>
                  </Card>

                </div>

              </div>
            </TabsContent>

            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice & Business Settings</CardTitle>
                  <CardDescription>Manage billing details, tax info, and invoice defaults</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        <Input value={businessSettings.businessName} onChange={e => setBusinessSettings({ ...businessSettings, businessName: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={businessSettings.email || ''} onChange={e => setBusinessSettings({ ...businessSettings, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Number</Label>
                        <Input value={businessSettings.phone || ''} onChange={e => setBusinessSettings({ ...businessSettings, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={businessSettings.address || ''} onChange={e => setBusinessSettings({ ...businessSettings, address: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>GST No</Label>
                        <Input value={businessSettings.gstNo || ''} onChange={e => setBusinessSettings({ ...businessSettings, gstNo: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>PAN</Label>
                        <Input value={businessSettings.pan || ''} onChange={e => setBusinessSettings({ ...businessSettings, pan: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>TAN</Label>
                        <Input value={businessSettings.tan || ''} onChange={e => setBusinessSettings({ ...businessSettings, tan: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Registration No</Label>
                        <Input value={businessSettings.registrationNo || ''} onChange={e => setBusinessSettings({ ...businessSettings, registrationNo: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Terms (Default)</Label>
                      <Input value={businessSettings.paymentTerms || ''} onChange={e => setBusinessSettings({ ...businessSettings, paymentTerms: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Terms & Conditions (Default)</Label>
                      <Input value={businessSettings.termsAndConditions || ''} onChange={e => setBusinessSettings({ ...businessSettings, termsAndConditions: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes for Invoices (Default)</Label>
                      <Input value={businessSettings.notes || ''} onChange={e => setBusinessSettings({ ...businessSettings, notes: e.target.value })} />
                    </div>

                    <Button onClick={handleSaveBusinessSettings} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Business Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="dynamic">
              <DynamicSchemaTab />
            </TabsContent>
          </>
        )}


        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password securely</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
              <div className="space-y-4 max-w-md">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password *</Label>
                  <FormControl>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...field}
                    placeholder="Enter your current password"
                  />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <FormControl>
                  <Input
                    id="newPassword"
                    type="password"
                    {...field}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                  <FormMessage className="text-xs" />
                </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                <FormItem className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                  <FormControl>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...field}
                    placeholder="Re-enter new password"
                  />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
                  )}
                />
                <Button onClick={() => void passwordForm.handleSubmit(handlePasswordChange, () => toast.error('Please fix the password form before submitting'))()} disabled={changingPassword}>
                  {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                  Change Password
                </Button>
              </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
