'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DetailedPageSkeleton } from '@/components/ui/dashboard-skeleton';
import { EditEmployeeDialog } from '@/components/team/edit-employee-dialog';
import { AssignProjectsDialog } from '@/components/team/assign-projects-dialog';
import { EmployeeDocuments } from '@/components/team/employee-documents';
import { hasFullAccess, type UserRole } from '@/lib/permissions';
import { 
  ArrowLeft, Edit, Calendar, Award, Trash2, Plus, Briefcase, X, 
  User, Shield, Laptop, Landmark, ClipboardList, Clock, FileText, 
  Lock, Eye, EyeOff, Sparkles, MessageSquare, AlertCircle, Trash,
  BookOpen, History, MapPin, Mail, Phone, Heart
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

interface Employee {
  id: number;
  userId: number;
  employeeId: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  dateOfBirth: string | null;
  status: string;
  gender?: string | null;
  maritalStatus?: string | null;
  bloodGroup?: string | null;
  nationality?: string | null;
  personalIdNumber?: string | null;
  probationPeriod?: number | null;
  confirmationDate?: string | null;
  workLocation?: string | null;
  workShift?: string | null;
  noticePeriod?: number | null;
  currency?: string;
  ctc?: number | null;
  salary?: number | null;
  hourlyRate?: number | null;
  pfNumber?: string | null;
  uanNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  managerId?: number | null;
  workMode?: string | null;
  officeEmail?: string | null;
  accountExpiryDate?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactAddress?: string | null;
  skills?: any;
  employmentType?: string;
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

interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  assignedAt: string;
}

interface Project {
  id: number;
  name: string;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [activeTab, setActiveTab] = useState('overview');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignProjectDialogOpen, setAssignProjectDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Tabbed Data States
  const [assignedProjects, setAssignedProjects] = useState<Array<ProjectMember & { projectName?: string }>>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Reveal toggles
  const [revealSalary, setRevealSalary] = useState(false);

  // Inline forms states
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState('Intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState('Technical');

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newAssetType, setNewAssetType] = useState('Laptop');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');

  const [showAddTraining, setShowAddTraining] = useState(false);
  const [newTrainingName, setNewTrainingName] = useState('');
  const [newTrainingType, setNewTrainingType] = useState('Technical');
  const [newTrainingStatus, setNewTrainingStatus] = useState('in_progress');

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState('general');

  useEffect(() => {
    fetchCurrentUser();
    fetchEmployeeData();
  }, [employeeId]);

  const fetchCurrentUser = async () => {
    try {
      const token = getStoredSessionToken();
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const token = getStoredSessionToken();
      const response = await fetch(`/api/employees?id=${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const empData = await response.json();
        setEmployee(empData);

        const userResponse = await fetch(`/api/users?id=${empData.userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
          fetchAssignedProjects(userData.id);
        }

        // Fetch attendance, leaves, timeline
        fetchTabContent('attendance');
        fetchTabContent('leaves');
        fetchTabContent('assets');
        fetchTabContent('skills');
        fetchTabContent('notes');
        fetchTabContent('training');
        fetchTabContent('timeline');
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabContent = async (type: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/${employeeId}/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const arrayData = Array.isArray(data) ? data : data.data || [];
        if (type === 'attendance') setAttendance(arrayData);
        if (type === 'leaves') setLeaves(arrayData);
        if (type === 'assets') setAssets(arrayData);
        if (type === 'skills') setSkills(arrayData);
        if (type === 'notes') setNotes(arrayData);
        if (type === 'training') setTraining(arrayData);
        if (type === 'timeline') setTimeline(arrayData);
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
    }
  };

  const fetchAssignedProjects = async (userId: number) => {
    try {
      const token = getStoredSessionToken();
      const [membersRes, projectsRes] = await Promise.all([
        fetch(`/api/project-members?userId=${userId}&limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/projects?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (membersRes.ok && projectsRes.ok) {
        const members = await membersRes.json();
        const projects = await projectsRes.json();
        
        const membersWithNames = members.map((member: ProjectMember) => {
          const project = projects.find((p: Project) => p.id === member.projectId);
          return { ...member, projectName: project?.name || 'Unknown Project' };
        });
        setAssignedProjects(membersWithNames);
      }
    } catch (error) {
      console.error('Error fetching assigned projects:', error);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/${employeeId}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          skillName: newSkillName,
          proficiencyLevel: newSkillProficiency,
          category: newSkillCategory
        })
      });
      if (res.ok) {
        toast.success('Skill added');
        setNewSkillName('');
        setShowAddSkill(false);
        fetchTabContent('skills');
        fetchTabContent('timeline');
      }
    } catch {
      toast.error('Failed to add skill');
    }
  };

  const handleRemoveSkill = async (id: number) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/${employeeId}/skills?skillId=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Skill removed');
        fetchTabContent('skills');
      }
    } catch {
      toast.error('Failed to delete skill');
    }
  };

  const handleAddAsset = async () => {
    if (!newAssetName.trim()) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/${employeeId}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assetType: newAssetType,
          assetName: newAssetName,
          serialNumber: newAssetSerial || null,
          status: 'issued',
          issuedDate: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        toast.success('Asset issued successfully');
        setNewAssetName('');
        setNewAssetSerial('');
        setShowAddAsset(false);
        fetchTabContent('assets');
        fetchTabContent('timeline');
      }
    } catch {
      toast.error('Failed to issue asset');
    }
  };

  const handleAddTraining = async () => {
    if (!newTrainingName.trim()) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/${employeeId}/training`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseName: newTrainingName,
          trainingType: newTrainingType,
          status: newTrainingStatus,
          startDate: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        toast.success('Training logged');
        setNewTrainingName('');
        setShowAddTraining(false);
        fetchTabContent('training');
        fetchTabContent('timeline');
      }
    } catch {
      toast.error('Failed to log training');
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/${employeeId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newNoteTitle || null,
          content: newNoteContent,
          noteType: newNoteType,
          isPrivate: true
        })
      });
      if (res.ok) {
        toast.success('Manager note recorded');
        setNewNoteTitle('');
        setNewNoteContent('');
        setShowAddNote(false);
        fetchTabContent('notes');
        fetchTabContent('timeline');
      }
    } catch {
      toast.error('Failed to save note');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employee) return;
    try {
      const token = getStoredSessionToken();
      const response = await fetch(`/api/employees?id=${employee.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Employee record removed successfully!');
        router.push('/dashboard/employees');
      }
    } catch {
      toast.error('Failed to delete employee');
    }
  };

  if (loading) return <DetailedPageSkeleton />;
  if (!employee || !user) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold">Employee not found</h3>
        <Button onClick={() => router.push('/dashboard/employees')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workforce Dashboard
        </Button>
      </div>
    );
  }

  const isAdmin = currentUser && hasFullAccess(currentUser.role as UserRole);

  const tabsList = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Details', icon: Heart },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'skills', label: 'Skills & Certs', icon: Award },
    { id: 'training', label: 'Training', icon: BookOpen },
    { id: 'assets', label: 'Assets Issued', icon: Laptop },
    { id: 'reviews', label: 'Reviews & Goals', icon: ClipboardList },
    { id: 'payroll', label: 'Compensation', icon: Landmark },
    { id: 'timeline', label: 'Timeline & Logs', icon: History },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notes', label: 'HR Notes', icon: MessageSquare, adminOnly: true },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leaves', icon: Calendar },
  ];

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc] space-y-6">
      {/* Profile Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-5 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/employees/directory')} className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {user.firstName} {user.lastName}
              </h1>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                {employee.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-[#b1b1b1] mt-0.5">
              {employee.designation} • {employee.department} • ID: {employee.employeeId}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setEditDialogOpen(true)} className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2">
              <Edit className="h-4 w-4" /> Edit Profile
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="font-semibold flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Delete Profile
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 h-fit lg:sticky lg:top-4">
          <CardContent className="p-2 space-y-1">
            {tabsList
              .filter(t => !t.adminOnly || isAdmin)
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#f87941]/10 text-[#f87941]' 
                        : 'text-slate-600 dark:text-[#b1b1b1] hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
          </CardContent>
        </Card>

        {/* Tab content panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Info and Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <CardHeader><CardTitle className="text-sm font-bold">Contact Details</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-3"><Mail className="h-4.5 w-4.5 text-slate-400" /> <span>{user.email}</span></div>
                    {user.phone && <div className="flex items-center gap-3"><Phone className="h-4.5 w-4.5 text-slate-400" /> <span>{user.phone}</span></div>}
                    {employee.officeEmail && <div className="flex items-center gap-3"><Briefcase className="h-4.5 w-4.5 text-slate-400" /> <span>{employee.officeEmail}</span></div>}
                    {employee.workLocation && <div className="flex items-center gap-3"><MapPin className="h-4.5 w-4.5 text-slate-400" /> <span>{employee.workLocation}</span></div>}
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  <CardHeader><CardTitle className="text-sm font-bold">Key Milestones</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date of Joining:</span>
                      <span className="font-semibold">{new Date(employee.dateOfJoining).toLocaleDateString()}</span>
                    </div>
                    {employee.confirmationDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Confirmation Date:</span>
                        <span className="font-semibold">{new Date(employee.confirmationDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {employee.workMode && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Work Mode:</span>
                        <Badge variant="secondary" className="capitalize">{employee.workMode}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Assigned Projects */}
              <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold">Assigned Projects</CardTitle>
                    <CardDescription>Current project engagements.</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button size="sm" onClick={() => setAssignProjectDialogOpen(true)} className="bg-[#f87941] text-white hover:bg-[#e06634]">
                      <Plus className="h-4 w-4 mr-1" /> Assign Project
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {assignedProjects.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No projects assigned yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {assignedProjects.map(proj => (
                        <div key={proj.id} className="flex items-center justify-between p-3 border rounded-xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20">
                          <div>
                            <p className="text-sm font-bold">{proj.projectName}</p>
                            <span className="text-xs text-slate-500">Role: {proj.role} • Assigned on {new Date(proj.assignedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader><CardTitle className="text-base font-bold">Personal Profile Details</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                  <div><p className="text-xs text-slate-500">Blood Group</p><p className="font-semibold mt-0.5">{employee.bloodGroup || 'Not provided'}</p></div>
                  <div><p className="text-xs text-slate-500">Marital Status</p><p className="font-semibold mt-0.5 capitalize">{employee.maritalStatus || 'Not provided'}</p></div>
                  <div><p className="text-xs text-slate-500">Nationality</p><p className="font-semibold mt-0.5">{employee.nationality || 'Not provided'}</p></div>
                  <div><p className="text-xs text-slate-500">Date of Birth</p><p className="font-semibold mt-0.5">{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not provided'}</p></div>
                  <div><p className="text-xs text-slate-500">Gender</p><p className="font-semibold mt-0.5 capitalize">{employee.gender || 'Not provided'}</p></div>
                  <div><p className="text-xs text-slate-500">Personal ID (Aadhaar/PAN)</p><p className="font-semibold mt-0.5">{employee.personalIdNumber || 'Not provided'}</p></div>
                </div>

                <div className="border-t border-[#e6e4e6]/10 dark:border-[#2f3035]/10 pt-4">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Heart className="h-4.5 w-4.5 text-rose-500" /> Emergency Contact
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <div><p className="text-xs text-slate-500">Contact Name</p><p className="font-semibold mt-0.5">{employee.emergencyContactName || 'N/A'}</p></div>
                    <div><p className="text-xs text-slate-500">Relationship</p><p className="font-semibold mt-0.5">{employee.emergencyContactRelationship || 'N/A'}</p></div>
                    <div><p className="text-xs text-slate-500">Phone</p><p className="font-semibold mt-0.5">{employee.emergencyContactPhone || 'N/A'}</p></div>
                    <div className="col-span-2"><p className="text-xs text-slate-500">Address</p><p className="font-semibold mt-0.5">{employee.emergencyContactAddress || 'N/A'}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: EMPLOYMENT */}
          {activeTab === 'employment' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader><CardTitle className="text-base font-bold">Employment Parameters</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div><p className="text-xs text-slate-500">Designation</p><p className="font-semibold mt-0.5">{employee.designation}</p></div>
                <div><p className="text-xs text-slate-500">Department</p><p className="font-semibold mt-0.5">{employee.department}</p></div>
                <div><p className="text-xs text-slate-500">Work Mode</p><p className="font-semibold mt-0.5 capitalize">{employee.workMode || 'office'}</p></div>
                <div><p className="text-xs text-slate-500">Work Shift</p><p className="font-semibold mt-0.5 capitalize">{employee.workShift || 'General'}</p></div>
                <div><p className="text-xs text-slate-500">Probation Period</p><p className="font-semibold mt-0.5">{employee.probationPeriod ? `${employee.probationPeriod} months` : 'None'}</p></div>
                <div><p className="text-xs text-slate-500">Notice Period</p><p className="font-semibold mt-0.5">{employee.noticePeriod ? `${employee.noticePeriod} days` : 'None'}</p></div>
                <div><p className="text-xs text-slate-500">Office Email</p><p className="font-semibold mt-0.5">{employee.officeEmail || 'N/A'}</p></div>
                <div><p className="text-xs text-slate-500">Account Expiry</p><p className="font-semibold mt-0.5">{employee.accountExpiryDate ? new Date(employee.accountExpiryDate).toLocaleDateString() : 'Never'}</p></div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: SKILLS & CERTIFICATIONS */}
          {activeTab === 'skills' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Skills Inventory</CardTitle>
                  <CardDescription>Verified skill proficiency matrix.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddSkill(!showAddSkill)} className="bg-[#f87941] text-white hover:bg-[#e06634]">
                  {showAddSkill ? 'Cancel' : 'Add Skill'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {showAddSkill && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Skill Name</Label>
                        <Input placeholder="e.g. React.js" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
                      </div>
                      <div>
                        <Label>Proficiency</Label>
                        <select value={newSkillProficiency} onChange={(e) => setNewSkillProficiency(e.target.value)} className="w-full h-9 rounded-md border bg-transparent text-sm px-2">
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <select value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value)} className="w-full h-9 rounded-md border bg-transparent text-sm px-2">
                          <option value="Technical">Technical</option>
                          <option value="Soft Skills">Soft Skills</option>
                          <option value="Domain">Domain Knowledge</option>
                        </select>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleAddSkill} className="bg-[#f87941] text-white">Save Skill</Button>
                  </div>
                )}

                {skills.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No skills recorded.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skills.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 border rounded-xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20">
                        <div>
                          <p className="text-sm font-bold">{s.skillName}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px]">{s.category}</Badge>
                            <Badge variant="outline" className="text-[10px]">{s.proficiencyLevel}</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveSkill(s.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 5: TRAINING */}
          {activeTab === 'training' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Training & Courses</CardTitle>
                  <CardDescription>Academic and professional certifications logged.</CardDescription>
                </div>
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowAddTraining(!showAddTraining)} className="bg-[#f87941] text-white hover:bg-[#e06634]">
                    {showAddTraining ? 'Cancel' : 'Log Training'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {showAddTraining && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Course Name</Label>
                        <Input placeholder="e.g. AWS Cloud Practitioner" value={newTrainingName} onChange={(e) => setNewTrainingName(e.target.value)} />
                      </div>
                      <div>
                        <Label>Training Type</Label>
                        <select value={newTrainingType} onChange={(e) => setNewTrainingType(e.target.value)} className="w-full h-9 rounded-md border bg-transparent text-sm px-2">
                          <option value="Technical">Technical</option>
                          <option value="Compliance">Compliance</option>
                          <option value="Leadership">Leadership</option>
                        </select>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <select value={newTrainingStatus} onChange={(e) => setNewTrainingStatus(e.target.value)} className="w-full h-9 rounded-md border bg-transparent text-sm px-2">
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <Button size="sm" onClick={handleAddTraining} className="bg-[#f87941] text-white">Save Record</Button>
                  </div>
                )}

                {training.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No training programs recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {training.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3.5 border rounded-xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20">
                        <div>
                          <p className="text-sm font-bold">{t.courseName}</p>
                          <span className="text-xs text-slate-500">{t.trainingType} • Started: {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>{t.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 6: ASSETS */}
          {activeTab === 'assets' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Hardware & Assets Issued</CardTitle>
                  <CardDescription>Enterprise equipment logged under this employee.</CardDescription>
                </div>
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowAddAsset(!showAddAsset)} className="bg-[#f87941] text-white hover:bg-[#e06634]">
                    {showAddAsset ? 'Cancel' : 'Issue Asset'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {showAddAsset && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Asset Type</Label>
                        <select value={newAssetType} onChange={(e) => setNewAssetType(e.target.value)} className="w-full h-9 rounded-md border bg-transparent text-sm px-2">
                          <option value="Laptop">Laptop</option>
                          <option value="Monitor">Monitor</option>
                          <option value="Mobile">Mobile Phone</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>
                      <div>
                        <Label>Asset Name / Model</Label>
                        <Input placeholder="e.g. MacBook Pro M3" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} />
                      </div>
                      <div>
                        <Label>Serial Number</Label>
                        <Input placeholder="e.g. C02X123456" value={newAssetSerial} onChange={(e) => setNewAssetSerial(e.target.value)} />
                      </div>
                    </div>
                    <Button size="sm" onClick={handleAddAsset} className="bg-[#f87941] text-white">Issue Equipment</Button>
                  </div>
                )}

                {assets.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No assets issued to this employee.</p>
                ) : (
                  <div className="space-y-3">
                    {assets.map(asset => (
                      <div key={asset.id} className="flex items-center justify-between p-3.5 border rounded-xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20">
                        <div>
                          <p className="text-sm font-bold">{asset.assetName}</p>
                          <span className="text-xs text-slate-500">S/N: {asset.serialNumber || 'N/A'} • Issued: {new Date(asset.issuedDate).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="outline" className="capitalize text-emerald-600 border-emerald-500/20 bg-emerald-500/5">
                          {asset.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 7: PERFORMANCE & REVIEWS */}
          {activeTab === 'reviews' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader><CardTitle className="text-base font-bold">Appraisals & Performance Ratings</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Award className="h-10 w-10 text-[#f87941] mb-3" />
                <h4 className="font-bold">No Active Performance Cycles</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">Review ratings and peer appraisal scores will sync once performance cycle schedules are configured.</p>
              </CardContent>
            </Card>
          )}

          {/* TAB 8: PAYROLL & COMPENSATION */}
          {activeTab === 'payroll' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Compensation Profile</CardTitle>
                  <CardDescription>Protected financial details & accounts.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setRevealSalary(!revealSalary)} className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                  {revealSalary ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
                  {revealSalary ? 'Hide Financials' : 'Reveal Info'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl">
                    <span className="text-xs text-slate-500">Gross Salary (CTC)</span>
                    <p className="text-lg font-extrabold mt-1">
                      {revealSalary && employee.ctc ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(employee.ctc) : '••••••'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl">
                    <span className="text-xs text-slate-500">Hourly Bill Rate</span>
                    <p className="text-lg font-extrabold mt-1">
                      {revealSalary && employee.hourlyRate ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(employee.hourlyRate) : '••••••'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl">
                    <span className="text-xs text-slate-500">Base Wage (Monthly)</span>
                    <p className="text-lg font-extrabold mt-1">
                      {revealSalary && employee.salary ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(employee.salary) : '••••••'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#e6e4e6]/10 dark:border-[#2f3035]/10 pt-4">
                  <h4 className="text-sm font-bold mb-3">Statutory Accounts & Banking</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <div><p className="text-xs text-slate-500">PF Account Number</p><p className="font-semibold mt-0.5">{revealSalary && employee.pfNumber ? employee.pfNumber : '••••••••••••'}</p></div>
                    <div><p className="text-xs text-slate-500">UAN Number</p><p className="font-semibold mt-0.5">{revealSalary && employee.uanNumber ? employee.uanNumber : '••••••••••••'}</p></div>
                    <div><p className="text-xs text-slate-500">Bank Name</p><p className="font-semibold mt-0.5">{revealSalary && employee.bankName ? employee.bankName : '••••••••••••'}</p></div>
                    <div><p className="text-xs text-slate-500">Account Number</p><p className="font-semibold mt-0.5">{revealSalary && employee.bankAccountNumber ? employee.bankAccountNumber : '••••••••••••••••'}</p></div>
                    <div><p className="text-xs text-slate-500">IFSC Routing Code</p><p className="font-semibold mt-0.5">{revealSalary && employee.ifscCode ? employee.ifscCode : '•••••••••••'}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 9: TIMELINE & LOGS */}
          {activeTab === 'timeline' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader><CardTitle className="text-base font-bold">Lifecycle Timeline</CardTitle></CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No timeline events recorded.</p>
                ) : (
                  <div className="relative border-l-2 border-[#e6e4e6]/30 dark:border-[#2f3035]/30 ml-4 pl-6 space-y-6">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-9 top-1 w-5 h-5 rounded-full bg-[#f87941] border-4 border-white dark:border-[#1E1F22]" />
                        <div>
                          <p className="text-sm font-bold">{event.eventTitle}</p>
                          {event.eventDescription && <p className="text-xs text-slate-500 mt-0.5">{event.eventDescription}</p>}
                          <span className="text-[10px] text-slate-400 block mt-1">{new Date(event.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 10: DOCUMENTS */}
          {activeTab === 'documents' && (
            <EmployeeDocuments employeeId={Number(employeeId)} isAdmin={Boolean(isAdmin)} />
          )}

          {/* TAB 11: NOTES */}
          {activeTab === 'notes' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">HR Confidential Notes</CardTitle>
                  <CardDescription>Private manager ratings, comments and operational records.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setShowAddNote(!showAddNote)} className="bg-[#f87941] text-white hover:bg-[#e06634]">
                  {showAddNote ? 'Cancel' : 'New Note'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {showAddNote && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-2xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Note Subject</Label>
                        <Input placeholder="e.g. Standard Review Notes" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} />
                      </div>
                      <div>
                        <Label>Note Category</Label>
                        <select value={newNoteType} onChange={(e) => setNewNoteType(e.target.value)} className="w-full h-9 rounded-md border bg-transparent text-sm px-2">
                          <option value="general">General</option>
                          <option value="performance">Performance</option>
                          <option value="disciplinary">Disciplinary</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>Content</Label>
                      <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} className="w-full h-24 p-2 rounded-md border bg-transparent text-sm" placeholder="Write confidential notes..." />
                    </div>
                    <Button size="sm" onClick={handleAddNote} className="bg-[#f87941] text-white">Save Note</Button>
                  </div>
                )}

                {notes.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No confidential notes found.</p>
                ) : (
                  <div className="space-y-4">
                    {notes.map(note => (
                      <div key={note.id} className="p-4 border rounded-xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm">{note.title || 'Operational Note'}</h4>
                          <Badge variant="secondary" className="capitalize text-[10px]">{note.noteType}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{note.content}</p>
                        <span className="text-[10px] text-slate-400 block pt-1">Recorded on {new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 12: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader><CardTitle className="text-base font-bold">Attendance Record (Recent)</CardTitle></CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No recent attendance records found.</p>
                ) : (
                  <div className="space-y-3">
                    {attendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20">
                        <div>
                          <p className="text-sm font-semibold">{new Date(record.date).toLocaleDateString()}</p>
                          <span className="text-xs text-slate-500">{record.checkIn || '--:--'} checkin / {record.checkOut || '--:--'} checkout</span>
                        </div>
                        <Badge variant={record.status === 'present' ? 'default' : 'outline'}>{record.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* TAB 13: LEAVES */}
          {activeTab === 'leaves' && (
            <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <CardHeader><CardTitle className="text-base font-bold">Leave Summaries & Requests</CardTitle></CardHeader>
              <CardContent>
                {leaves.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No leave requests logged.</p>
                ) : (
                  <div className="space-y-3">
                    {leaves.map((leave) => (
                      <div key={leave.id} className="p-4 border rounded-xl border-[#e6e4e6]/20 dark:border-[#2f3035]/20 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge variant="outline" className="capitalize text-[10px]">{leave.leaveType}</Badge>
                            <p className="text-sm font-bold mt-1">{leave.reason}</p>
                          </div>
                          <Badge variant={leave.status === 'approved' ? 'default' : 'secondary'}>{leave.status}</Badge>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {isAdmin && (
        <>
          <EditEmployeeDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={fetchEmployeeData}
            employee={employee as any}
            user={user}
          />
          <AssignProjectsDialog
            open={assignProjectDialogOpen}
            onOpenChange={setAssignProjectDialogOpen}
            onSuccess={() => fetchAssignedProjects(user.id)}
            userId={user.id}
            userName={`${user.firstName} ${user.lastName}`}
          />
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent className="bg-white dark:bg-[#1E1F22] border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-900 dark:text-[#fdfcfc]">Delete Employee Profile</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 dark:text-[#b1b1b1]">
                  Are you absolutely sure? This will remove "{user.firstName} {user.lastName}" and all associated databases assets, documents, skills, and logs. This is irreversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteEmployee} className="bg-red-600 hover:bg-red-700 text-white">
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}