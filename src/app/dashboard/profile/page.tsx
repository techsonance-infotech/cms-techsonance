// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  Building2, 
  IdCard, 
  Activity, 
  ShieldCheck, 
  IndianRupee, 
  Nfc,
  Sparkles,
  BookOpen,
  Camera,
  Loader2,
  UploadCloud,
  FileImage,
  Shield,
  Heart,
  Landmark,
  ShieldAlert,
  Users
} from 'lucide-react';
import { ProfileSkeleton } from '@/components/ui/dashboard-skeleton';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
import { FileUploader } from '@/components/ui/file-uploader';
import { toast } from 'sonner';

interface EmployeeProfile {
  id: number;
  userId: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  department: string;
  joinDate: string;
  dateOfBirth: string | null;
  status: string;
  salary: number | null;
  skills: any;
  nfcCardId: string | null;
  avatarUrl: string | null;
  employmentType: string | null;
  hourlyRate: number | null;
  ctc: number | null;
  pfNumber: string | null;
  uanNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  ifscCode: string | null;
  managerId: string | null;
  maritalStatus: string | null;
  bloodGroup: string | null;
  nationality: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  emergencyContactAddress: string | null;
  gender: string | null;
  role: string;
}

export default function ProfilePage() {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAvatarUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('/api/')) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
      return token ? `${url}&token=${encodeURIComponent(token)}` : url;
    }
    return url;
  };

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  const fetchEmployeeProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        setError('Authentication session not found');
        return;
      }

      // 1. Fetch current user metadata (which already contains employee info resolved)
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        setError('Failed to load active user account info');
        return;
      }

      const userData = await userResponse.json();
      const user = userData.user;
      if (!user) {
        setError('Could not extract active profile from session');
        return;
      }

      // 2. Map all unified user & employee details dynamically
      setEmployee({
        id: user.employeeRecordId || user.id,
        userId: user.id,
        employeeId: user.employeeId || `USR-${String(user.id).padStart(4, '0')}`,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || null,
        position: user.designation || (user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'Staff Member'),
        department: user.department || 'Administration',
        joinDate: user.dateOfJoining || user.createdAt || new Date().toISOString(),
        dateOfBirth: user.dateOfBirth || null,
        status: user.status || 'active',
        salary: user.salary || null,
        skills: user.skills || [],
        nfcCardId: user.nfcCardId || null,
        avatarUrl: user.avatarUrl || null,
        employmentType: user.employmentType || null,
        hourlyRate: user.hourlyRate || null,
        ctc: user.ctc || null,
        pfNumber: user.pfNumber || null,
        uanNumber: user.uanNumber || null,
        bankName: user.bankName || null,
        bankAccountNumber: user.bankAccountNumber || null,
        ifscCode: user.ifscCode || null,
        managerId: user.managerId || null,
        maritalStatus: user.maritalStatus || null,
        bloodGroup: user.bloodGroup || null,
        nationality: user.nationality || null,
        panNumber: user.panNumber || null,
        aadhaarNumber: user.aadhaarNumber || null,
        emergencyContactName: user.emergencyContactName || null,
        emergencyContactRelationship: user.emergencyContactRelationship || null,
        emergencyContactPhone: user.emergencyContactPhone || null,
        emergencyContactAddress: user.emergencyContactAddress || null,
        gender: user.gender || null,
        role: user.role,
      });
    } catch (error) {
      console.error('Error fetching dynamic profile:', error);
      setError('An unexpected error occurred while loading your profile');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="My Profile" 
          description="View your personal and organization employment information" 
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-sm text-destructive font-semibold">{error || 'Unable to load profile data'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse skills safely & clean up database-specific internal tokens (e.g. '__gender:male')
  const rawSkills = employee.skills 
    ? (typeof employee.skills === 'string' ? JSON.parse(employee.skills) : employee.skills) 
    : [];
  
  const parsedSkills = Array.isArray(rawSkills) 
    ? rawSkills.filter((skill: string) => typeof skill === 'string' && !skill.startsWith('__'))
    : [];

  const userRole = String(employee.role).toLowerCase().replace(/[\s_-]+/g, '');
  const isEmployeeOrAbove = [
    'superadmin', 'admin', 'manager', 'employee', 'hr_executive', 'finance', 'project_manager', 'hr_manager', 'viewer'
  ].includes(userRole);

  const getInitials = () => {
    const first = employee.firstName?.[0]?.toUpperCase() || '?';
    const last = employee.lastName?.[0]?.toUpperCase() || '?';
    return `${first}${last}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Profile" 
        description="View your personal information, employment records, and upload profile photos" 
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card & Avatar Uploader */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="relative overflow-hidden border bg-gradient-to-br from-card to-accent/20">
            <div className="absolute top-0 right-0 p-4 opacity-15">
              <Nfc className="h-24 w-24 text-primary" />
            </div>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex gap-1 items-center py-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Profile
                </Badge>
                <StatusBadge status={employee.status} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center pb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center text-primary-foreground text-2xl font-bold font-mono">
                  {employee.avatarUrl ? (
                    <img 
                      src={getAvatarUrl(employee.avatarUrl)} 
                      alt={`${employee.firstName}'s Avatar`}
                      className="h-full w-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mt-3">{employee.firstName} {employee.lastName}</h3>
              <p className="text-xs text-muted-foreground font-medium capitalize mt-1">{employee.position}</p>
              <p className="text-[10px] text-primary/80 font-mono mt-0.5">{employee.department} Dept.</p>

              <div className="mt-4 w-full text-left">
                <FileUploader
                  kind="avatar"
                  moduleName="profile"
                  entityType="employee"
                  entityId={employee.id.toString()}
                  accessLevel="public"
                  enableCrop={true}
                  value={employee.avatarUrl || ''}
                  onChange={async (newUrl) => {
                    if (!newUrl) {
                      const token = localStorage.getItem('session_token');
                      const updateRes = await fetch('/api/auth/me', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ avatarUrl: null }),
                      });
                      if (updateRes.ok) {
                        setEmployee((prev) => prev ? { ...prev, avatarUrl: null } : null);
                        window.dispatchEvent(new Event('user-updated'));
                        toast.success('Profile picture removed successfully');
                      }
                      return;
                    }
                    
                    const token = localStorage.getItem('session_token');
                    const updateRes = await fetch('/api/auth/me', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({ avatarUrl: newUrl }),
                    });

                    if (!updateRes.ok) {
                      const errData = await updateRes.json();
                      toast.error(errData.error || 'Failed to save updated avatar reference');
                      return;
                    }

                    setEmployee((prev) => prev ? { ...prev, avatarUrl: newUrl } : null);
                    window.dispatchEvent(new Event('user-updated'));
                    toast.success('Profile picture updated successfully!');
                  }}
                />
              </div>

              <span className="w-full h-px bg-muted my-5" />

              <div className="w-full space-y-3.5 text-left">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <IdCard className="h-3.5 w-3.5" /> Registry ID
                  </span>
                  <span className="font-mono font-bold text-foreground">{employee.employeeId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Nfc className="h-3.5 w-3.5" /> NFC Card Badge
                  </span>
                  <span className="font-mono text-foreground font-semibold">{employee.nfcCardId || 'Not registered'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5" /> Join Date
                  </span>
                  <span className="font-medium text-foreground">
                    {new Date(employee.joinDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Skills List Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Professional Skills
              </CardTitle>
              <CardDescription>Verified workspace competencies</CardDescription>
            </CardHeader>
            <CardContent>
              {parsedSkills.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No skills documented in record</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {parsedSkills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] font-medium bg-muted/60 hover:bg-muted text-foreground py-0.5 px-2 rounded-md">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Personal & Payroll Sheets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Contact & Personal Information
              </CardTitle>
              <CardDescription>Personal details and active communication channels</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground/80" /> Email Address
                </Label>
                <p className="text-sm font-medium text-foreground">{employee.email}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground/80" /> Contact Phone
                </Label>
                <p className="text-sm font-medium text-foreground">{employee.phone || 'No phone number registered'}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-muted-foreground/80" /> Date of Birth
                </Label>
                <p className="text-sm font-medium text-foreground">
                  {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Not provided'}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-muted-foreground/80" /> Gender & Marital Status
                </Label>
                <p className="text-sm font-medium text-foreground capitalize">
                  {employee.gender || 'Not specified'} {employee.maritalStatus ? `(${employee.maritalStatus})` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Statutory & Identification Records */}
          {isEmployeeOrAbove && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Statutory & Identification Records
                </CardTitle>
                <CardDescription>Government-issued registry identifiers and demographics</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <IdCard className="h-3 w-3 text-muted-foreground/80" /> Aadhaar Card Number
                  </Label>
                  <p className="text-sm font-mono font-medium text-foreground">
                    {employee.aadhaarNumber ? `XXXX-XXXX-${employee.aadhaarNumber.replace(/\s+/g, '').slice(-4)}` : 'Not provided'}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <IdCard className="h-3 w-3 text-muted-foreground/80" /> PAN Card Number
                  </Label>
                  <p className="text-sm font-mono font-medium text-foreground">
                    {employee.panNumber ? `XXXXX${employee.panNumber.toUpperCase().trim().slice(-5, -1)}X` : 'Not provided'}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-muted-foreground/80" /> Blood Group
                  </Label>
                  <p className="text-sm font-medium text-foreground uppercase">{employee.bloodGroup || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-muted-foreground/80" /> Nationality
                  </Label>
                  <p className="text-sm font-medium text-foreground capitalize">{employee.nationality || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 3: Emergency Contact Details */}
          {isEmployeeOrAbove && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Emergency Contact Details
                </CardTitle>
                <CardDescription>Primary contacts to reach out to in case of urgency</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <UserIcon className="h-3 w-3 text-muted-foreground/80" /> Contact Name
                  </Label>
                  <p className="text-sm font-medium text-foreground">{employee.emergencyContactName || 'Not registered'}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <ShieldAlert className="h-3 w-3 text-muted-foreground/80" /> Relationship
                  </Label>
                  <p className="text-sm font-medium text-foreground capitalize">{employee.emergencyContactRelationship || 'Not registered'}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground/80" /> Contact Phone
                  </Label>
                  <p className="text-sm font-medium text-foreground">{employee.emergencyContactPhone || 'Not registered'}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3 text-muted-foreground/80" /> Home Address
                  </Label>
                  <p className="text-sm font-medium text-foreground">{employee.emergencyContactAddress || 'Not registered'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 4: Workspace & Compensation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Employment & Financial Records
              </CardTitle>
              <CardDescription>Official payroll, CTC, and positioning directory details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-muted-foreground/80" /> Active Department
                </Label>
                <p className="text-sm font-semibold text-foreground capitalize">{employee.department}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3 text-muted-foreground/80" /> Corporate Designation
                </Label>
                <p className="text-sm font-semibold text-foreground capitalize">{employee.position}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3 text-muted-foreground/80" /> Employment Type
                </Label>
                <p className="text-sm font-semibold text-foreground capitalize">{employee.employmentType || 'Full Time'}</p>
              </div>

              {isEmployeeOrAbove && (
                <>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                      <IndianRupee className="h-3 w-3 text-muted-foreground/80" /> Monthly Base Salary
                    </Label>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {employee.salary ? `₹${employee.salary.toLocaleString('en-IN')}` : 'Confidential / Under review'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                      <IndianRupee className="h-3 w-3 text-muted-foreground/80" /> Cost To Company (Annual CTC)
                    </Label>
                    <p className="text-sm font-mono font-semibold text-foreground">
                      {employee.ctc ? `₹${employee.ctc.toLocaleString('en-IN')}` : 'Confidential / Under review'}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-muted-foreground/80" /> Workspace Status
                </Label>
                <div className="mt-0.5">
                  <Badge variant={employee.status === 'active' ? 'default' : 'secondary'} className="text-[10px] font-medium capitalize">
                    {employee.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Direct Deposit Banking Details */}
          {isEmployeeOrAbove && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-primary" />
                  Direct Deposit Banking Details
                </CardTitle>
                <CardDescription>Salary disbursement registry accounts and statutory numbers</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Landmark className="h-3 w-3 text-muted-foreground/80" /> Bank Name
                  </Label>
                  <p className="text-sm font-medium text-foreground">{employee.bankName || 'Not registered'}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <IdCard className="h-3 w-3 text-muted-foreground/80" /> Account Number
                  </Label>
                  <p className="text-sm font-mono font-medium text-foreground">
                    {employee.bankAccountNumber ? `XXXXXX${employee.bankAccountNumber.trim().slice(-4)}` : 'Not registered'}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <IdCard className="h-3 w-3 text-muted-foreground/80" /> IFSC Code
                  </Label>
                  <p className="text-sm font-mono font-medium text-foreground uppercase">{employee.ifscCode || 'Not registered'}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <IdCard className="h-3 w-3 text-muted-foreground/80" /> Provident Fund (PF) Number
                  </Label>
                  <p className="text-sm font-mono font-medium text-foreground uppercase">{employee.pfNumber || 'Not registered'}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <IdCard className="h-3 w-3 text-muted-foreground/80" /> Universal Account Number (UAN)
                  </Label>
                  <p className="text-sm font-mono font-medium text-foreground uppercase">{employee.uanNumber || 'Not registered'}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
