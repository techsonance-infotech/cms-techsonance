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
  FileImage
} from 'lucide-react';
import { ProfileSkeleton } from '@/components/ui/dashboard-skeleton';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/ui/page-header';
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
}

export default function ProfilePage() {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      });
    } catch (error) {
      console.error('Error fetching dynamic profile:', error);
      setError('An unexpected error occurred while loading your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Validate File Format (PNG, JPG, JPEG)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid format! Please upload a PNG, JPG, or JPEG file.');
      return;
    }

    // 2. Validate File Size (Maximum 500 KB)
    const maxSizeBytes = 500 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File size exceeds limit! Maximum size allowed is 500 KB. (Your file is ${Math.round(file.size / 1024)} KB)`);
      return;
    }

    // 3. Initiate Upload to Supabase Storage
    setUploading(true);
    const token = localStorage.getItem('session_token');
    const toastId = toast.loading('Uploading your new profile picture...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'avatar');

      // POST to our unified file uploader
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to upload profile picture file');
      }

      const uploadResult = await uploadRes.json();
      const storageUrl = uploadResult.data?.url;

      if (!storageUrl) {
        throw new Error('Upload response did not return a valid file storage path');
      }

      // 4. Update the avatar URL inside the user's registry database record
      const updateRes = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: storageUrl }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.error || 'Failed to save updated avatar reference to your profile');
      }

      // 5. Update local state dynamically to show the new picture instantly
      setEmployee((prev) => prev ? { ...prev, avatarUrl: storageUrl } : null);
      
      toast.success('Profile picture updated successfully!', { id: toastId });
    } catch (uploadError) {
      console.error('Profile image upload failed:', uploadError);
      toast.error(uploadError instanceof Error ? uploadError.message : 'Failed to update profile picture', { id: toastId });
    } finally {
      setUploading(false);
      // Reset input value to allow uploading the same file name if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
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
              {/* Dynamic Avatar with Hover Upload Effect */}
              <div className="relative group mb-4">
                <div 
                  onClick={handleAvatarClick}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20 text-3xl font-bold font-display shadow-md cursor-pointer overflow-hidden relative transition-all duration-300 hover:ring-4 hover:ring-primary/20"
                >
                  {employee.avatarUrl ? (
                    <img 
                      src={employee.avatarUrl} 
                      alt={`${employee.firstName}'s Avatar`}
                      className="h-full w-full object-cover" 
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                  
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5 text-white mb-1" />
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-white">Upload</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Micro spinner if uploading */}
                {uploading && (
                  <span className="absolute -bottom-1 -right-1 p-1 bg-primary text-primary-foreground rounded-full border border-background shadow-md">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </span>
                )}
              </div>

              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/jpg" 
                className="hidden" 
                disabled={uploading}
              />

              <h3 className="text-lg font-bold text-foreground">{employee.firstName} {employee.lastName}</h3>
              <p className="text-xs text-muted-foreground font-medium capitalize mt-1">{employee.position}</p>
              <p className="text-[10px] text-primary/80 font-mono mt-0.5">{employee.department} Dept.</p>

              <div className="mt-4 flex flex-col gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAvatarClick} 
                  disabled={uploading}
                  className="rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 h-8 hover:bg-primary/5 hover:text-primary transition-colors border-dashed"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  {employee.avatarUrl ? 'Change Profile Picture' : 'Upload Profile Picture'}
                </Button>
                <p className="text-[9px] text-muted-foreground">Supports PNG, JPG (Max 500 KB)</p>
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
                Contact Directory Information
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
            </CardContent>
          </Card>

          {/* Card 2: Workspace & Compensation Details */}
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
                  <IndianRupee className="h-3 w-3 text-muted-foreground/80" /> Base Monthly Salary
                </Label>
                <p className="text-sm font-mono font-bold text-foreground">
                  {employee.salary ? `₹${employee.salary.toLocaleString('en-IN')}` : 'Confidential / Under review'}
                </p>
              </div>

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
        </div>
      </div>
    </div>
  );
}