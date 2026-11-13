'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  HeartHandshake, Activity, Brain, PhoneCall, Syringe, Apple, Dumbbell,
  ClipboardList, Flame, Smile, Sparkles, Calendar, Clock, Plus, Search,
  Filter, Check, CheckCircle2, RefreshCw, SendHorizontal, ShieldCheck,
  Users, BarChart3, Inbox, AlertCircle, UserCheck, Trash2, Edit3, X,
  MapPin, CheckCircle, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken, getStoredUser } from '@/lib/client-session';

export const ICON_MAP: Record<string, any> = {
  Activity, Brain, HeartHandshake, PhoneCall, Syringe, Apple, Dumbbell,
  ClipboardList, Flame, Smile, Sparkles
};

export interface ServiceItem {
  category: string;
  name: string;
  description: string;
  slaHours: number;
  iconName: string;
}

export interface ProgramRecord {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  capacity: number;
  enrolledCount: number;
  status: string;
  scheduleDate: string;
}

export interface AppointmentRecord {
  id: string;
  userId: string;
  programId?: string;
  programTitle?: string;
  employeeName: string;
  employeeEmail?: string;
  category: string;
  appointmentDate: string;
  doctorCounselorName: string;
  notes: string;
  status: string;
  burnoutRiskScore: string;
  stressIndex: number;
  createdAt: string;
}

export interface SurveyRecord {
  id: string;
  userId: string;
  employeeName: string;
  department: string;
  designation: string;
  workLifeBalanceRating: number;
  workStressLevel: number;
  sleepQualityRating: number;
  feedbackComments: string | null;
  aiRecommendation: string;
  createdAt: string;
}

export interface RosterEmp {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

export default function EmployeeWellnessPage() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [programSubmitting, setProgramSubmitting] = useState(false);

  // RBAC & Identity State
  const [canApprove, setCanApprove] = useState(false);
  const [userRole, setUserRole] = useState('employee');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    designation: string;
  } | null>(null);

  // Dynamic API State
  const [catalog, setCatalog] = useState<ServiceItem[]>([]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [surveyAnalytics, setSurveyAnalytics] = useState({
    totalResponses: 0,
    avgWorkLifeBalance: 4.0,
    avgStressLevel: 2.0,
    avgSleepQuality: 4.0
  });
  const [roster, setRoster] = useState<RosterEmp[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalBooked: 0,
    completedCount: 0,
    scheduledCount: 0,
    lowRiskCount: 0,
    highRiskCount: 0,
    avgStressIndex: '20% (Low Stress Zone)',
    burnoutHealthIndex: '95% Optimal',
    activeProgramsCount: 0,
    eapHotlineActive: '24/7 Toll Free Active'
  });

  // Filters for Appointments
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State: Booking
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Health Checkups');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState(() => new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');

  // Modal State: Admin Program Create/Edit
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [progTitle, setProgTitle] = useState('');
  const [progCategory, setProgCategory] = useState('Health Checkups');
  const [progDescription, setProgDescription] = useState('');
  const [progLocation, setProgLocation] = useState('Corporate Health Suite (Building A)');
  const [progCapacity, setProgCapacity] = useState(100);
  const [progScheduleDate, setProgScheduleDate] = useState(() => new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [progStatus, setProgStatus] = useState('Active');

  // Modal State: Admin Appointment Review/Edit
  const [showEditApptModal, setShowEditApptModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<AppointmentRecord | null>(null);
  const [reviewDoctor, setReviewDoctor] = useState('');
  const [reviewStatus, setReviewStatus] = useState('Scheduled');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewBurnoutRisk, setReviewBurnoutRisk] = useState('Low');
  const [reviewStressIndex, setReviewStressIndex] = useState(20);

  // 1-Click Register Loading State per Program
  const [registeringProgId, setRegisteringProgId] = useState<string | null>(null);

  // Admin Participants Modal State
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedProgForParticipants, setSelectedProgForParticipants] = useState<ProgramRecord | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [programParticipants, setProgramParticipants] = useState<any[]>([]);

  // Pulse Survey Form State
  const [wlbRating, setWlbRating] = useState<number>(4);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [sleepRating, setSleepRating] = useState<number>(4);
  const [surveyComments, setSurveyComments] = useState('');
  const [aiSurveyRecommendation, setAiSurveyRecommendation] = useState<string | null>(null);

  // Fetch Live Data from Backend API
  const loadWellnessDataFromApi = async () => {
    try {
      const token = getStoredSessionToken();
      const storedUser = getStoredUser();

      // If stored user exists, populate local profile immediately
      if (storedUser) {
        const rawRole = String(storedUser.role || '').toLowerCase().replace(/[\s-]+/g, '_');
        const isAdminRole = ['admin', 'super_admin', 'owner', 'ceo', 'hr_manager', 'project_manager'].includes(rawRole);
        setCanApprove(isAdminRole);
        setUserRole(rawRole);
        if (storedUser.id) {
          setCurrentUserId(String(storedUser.id));
          if (!isAdminRole) setSelectedUserId(String(storedUser.id));
        }
        setCurrentUserProfile({
          id: storedUser.id ? String(storedUser.id) : '',
          name: `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim() || storedUser.name || storedUser.email || 'Employee',
          email: storedUser.email || '',
          role: rawRole,
          department: 'General',
          designation: rawRole.toUpperCase()
        });
      }

      const authHeader: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch main wellness data
      const res = await fetch('/api/employees/wellness', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        if (data.canApprove !== undefined) setCanApprove(data.canApprove);
        if (data.userRole) setUserRole(data.userRole);
        if (data.currentUserId) setCurrentUserId(data.currentUserId);
        if (data.currentUserProfile) {
          setCurrentUserProfile(data.currentUserProfile);
          // Auto-fill employee ID for booking if regular employee
          if (!data.canApprove) {
            setSelectedUserId(data.currentUserProfile.id);
          }
        }
        if (data.catalog) setCatalog(data.catalog);
        if (data.programs) setPrograms(data.programs);
        if (data.employeeRoster) {
          setRoster(data.employeeRoster);
          if (data.canApprove && !selectedUserId && data.employeeRoster.length > 0) {
            setSelectedUserId(data.employeeRoster[0].id);
          }
        }
        if (data.summaryStats) setSummaryStats(data.summaryStats);
        if (data.appointments) setAppointments(data.appointments);
      }

      // 2. Fetch pulse surveys
      const surveyRes = await fetch('/api/employees/wellness/survey', { headers: authHeader });
      if (surveyRes.ok) {
        const sData = await surveyRes.json();
        if (sData.surveys) setSurveys(sData.surveys);
        if (sData.analytics) setSurveyAnalytics(sData.analytics);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWellnessDataFromApi();
  }, []);

  // Open Booking Dialog (Presetting for self if employee)
  const openBookingModal = (category: string = 'Health Checkups', programId: string | null = null) => {
    setSelectedCategory(category);
    setSelectedProgramId(programId);
    setDoctorName('');
    setNotes('');
    const storedUser = getStoredUser();
    const fallbackId = currentUserProfile?.id || currentUserId || (storedUser?.id ? String(storedUser.id) : '');
    if (!canApprove && fallbackId) {
      setSelectedUserId(fallbackId);
    } else if (roster.length > 0 && !selectedUserId) {
      setSelectedUserId(roster[0].id);
    }
    setShowBookingModal(true);
  };

  // Submit Wellness Booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedUser = getStoredUser();
    const effectiveUserId = canApprove
      ? (selectedUserId || (roster.length > 0 ? roster[0].id : ''))
      : (currentUserProfile?.id || currentUserId || (storedUser?.id ? String(storedUser.id) : ''));

    if (!appointmentDate) {
      toast.error('Please specify Appointment Date');
      return;
    }

    setSubmitting(true);
    try {
      const token = getStoredSessionToken();
      const payload = {
        userId: effectiveUserId,
        programId: selectedProgramId,
        category: selectedCategory,
        appointmentDate,
        doctorCounselorName: canApprove ? (doctorName.trim() || 'Pending Admin Assignment') : 'Pending Admin Assignment',
        notes: notes.trim()
      };

      const res = await fetch('/api/employees/wellness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || resData.message || 'Failed to book appointment');

      toast.success(resData.message || 'Wellness appointment booked successfully!');
      setShowBookingModal(false);
      setSelectedProgramId(null);
      setNotes('');
      setDoctorName('');
      await loadWellnessDataFromApi();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error booking appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate User's Registered Program IDs
  const effectiveCurrentUserId = currentUserProfile?.id || currentUserId || (getStoredUser()?.id ? String(getStoredUser()?.id) : '');
  const myRegisteredProgramIds = new Set(
    appointments
      .filter(a => a.programId && a.status !== 'Cancelled' && a.userId === effectiveCurrentUserId)
      .map(a => a.programId)
  );

  // 1-Click Employee Self-Enrollment in Program
  const handleDirectProgramEnroll = async (program: ProgramRecord) => {
    const storedUser = getStoredUser();
    const targetUserId = currentUserProfile?.id || currentUserId || (storedUser?.id ? String(storedUser.id) : '');
    if (!targetUserId) {
      toast.error('User profile not identified. Please refresh.');
      return;
    }

    if (myRegisteredProgramIds.has(program.id)) {
      toast.info('You are already registered for this program.');
      return;
    }

    setRegisteringProgId(program.id);
    try {
      const token = getStoredSessionToken();
      const payload = {
        userId: targetUserId,
        programId: program.id,
        category: program.category,
        appointmentDate: program.scheduleDate || new Date().toISOString(),
        doctorCounselorName: 'Program Lead Coordinator',
        notes: `Enrolled in corporate program: ${program.title}`
      };

      const res = await fetch('/api/employees/wellness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (res.status === 409 || resData.alreadyRegistered) {
        toast.info(resData.error || 'You are already registered for this program.');
        await loadWellnessDataFromApi();
        return;
      }

      if (!res.ok) {
        throw new Error(resData.error || resData.message || 'Failed to register for program');
      }

      toast.success(`Successfully registered for "${program.title}"!`);
      await loadWellnessDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error registering for program');
    } finally {
      setRegisteringProgId(null);
    }
  };

  // Admin: Open Program Participants Modal
  const openParticipantsModal = async (prog: ProgramRecord) => {
    setSelectedProgForParticipants(prog);
    setShowParticipantsModal(true);
    setParticipantsLoading(true);
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/wellness/programs/participants?programId=${prog.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (res.ok) {
        const data = await res.json();
        setProgramParticipants(data.participants || []);
      }
    } catch (err) {
      console.error('Error fetching program participants:', err);
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Admin: Remove Participant from Program
  const handleRemoveParticipant = async (appointmentId: string, participantName: string) => {
    if (!confirm(`Are you sure you want to remove ${participantName} from this program?`)) return;

    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/wellness/programs/participants?appointmentId=${appointmentId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (res.ok) {
        toast.success(`${participantName} removed from program`);
        if (selectedProgForParticipants) {
          openParticipantsModal(selectedProgForParticipants);
        }
        await loadWellnessDataFromApi();
      } else {
        toast.error('Failed to remove participant');
      }
    } catch (err) {
      toast.error('Error removing participant');
    }
  };

  // Admin: Open Create / Edit Program Modal
  const openProgramModal = (prog?: ProgramRecord) => {
    if (prog) {
      setEditingProgramId(prog.id);
      setProgTitle(prog.title);
      setProgCategory(prog.category);
      setProgDescription(prog.description);
      setProgLocation(prog.location);
      setProgCapacity(prog.capacity);
      setProgScheduleDate(prog.scheduleDate ? prog.scheduleDate.slice(0, 10) : '');
      setProgStatus(prog.status);
    } else {
      setEditingProgramId(null);
      setProgTitle('');
      setProgCategory('Health Checkups');
      setProgDescription('');
      setProgLocation('Corporate Health Suite (Building A)');
      setProgCapacity(100);
      setProgScheduleDate(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
      setProgStatus('Active');
    }
    setShowProgramModal(true);
  };

  // Admin: Save Program (Create or Update)
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim() || !progDescription.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setProgramSubmitting(true);
    try {
      const token = getStoredSessionToken();
      const method = editingProgramId ? 'PATCH' : 'POST';
      const payload = {
        id: editingProgramId,
        title: progTitle.trim(),
        category: progCategory,
        description: progDescription.trim(),
        location: progLocation.trim(),
        capacity: Number(progCapacity),
        scheduleDate: progScheduleDate,
        status: progStatus
      };

      const res = await fetch('/api/employees/wellness/programs', {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Failed to save program');

      toast.success(resData.message || (editingProgramId ? 'Program updated' : 'Program created'));
      setShowProgramModal(false);
      await loadWellnessDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error saving program');
    } finally {
      setProgramSubmitting(false);
    }
  };

  // Admin: Delete Program
  const handleDeleteProgram = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/wellness/programs?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!res.ok) throw new Error('Failed to delete program');
      toast.success('Wellness program deleted successfully');
      await loadWellnessDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting program');
    }
  };

  // Admin / User: Update Appointment Status
  const handleUpdateApptStatus = async (id: string, newStatus: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/employees/wellness', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id, status: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Booking marked as ${newStatus}`);
      await loadWellnessDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    }
  };

  // Admin: Open Edit Appointment Modal
  const openEditApptModal = (appt: AppointmentRecord) => {
    setEditingAppt(appt);
    setReviewDoctor(appt.doctorCounselorName);
    setReviewStatus(appt.status);
    setReviewNotes(appt.notes || '');
    setReviewBurnoutRisk(appt.burnoutRiskScore || 'Low');
    setReviewStressIndex(appt.stressIndex || 20);
    setShowEditApptModal(true);
  };

  // Admin: Save Appointment Review
  const handleSaveApptReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;

    try {
      const token = getStoredSessionToken();
      const payload = {
        id: editingAppt.id,
        doctorCounselorName: reviewDoctor,
        status: reviewStatus,
        notes: reviewNotes,
        burnoutRiskScore: reviewBurnoutRisk,
        stressIndex: reviewStressIndex
      };

      const res = await fetch('/api/employees/wellness', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update appointment');
      toast.success('Clinical review saved successfully');
      setShowEditApptModal(false);
      await loadWellnessDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error saving review');
    }
  };

  // Cancel / Delete Appointment
  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees/wellness?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!res.ok) throw new Error('Failed to cancel appointment');
      toast.success('Appointment cancelled successfully');
      await loadWellnessDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error cancelling appointment');
    }
  };

  // Submit Wellness Pulse Survey
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSurveySubmitting(true);

    try {
      const token = getStoredSessionToken();
      const payload = {
        workLifeBalanceRating: wlbRating,
        workStressLevel: stressLevel,
        sleepQualityRating: sleepRating,
        feedbackComments: surveyComments.trim()
      };

      const res = await fetch('/api/employees/wellness/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Survey submission failed');

      toast.success(data.message || 'Pulse survey submitted successfully!');
      setAiSurveyRecommendation(data.aiRecommendation);
      setSurveyComments('');
      await loadWellnessDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting survey');
    } finally {
      setSurveySubmitting(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (canApprove && employeeFilter !== 'all' && a.userId !== employeeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmp = a.employeeName.toLowerCase().includes(q);
      const matchCat = a.category.toLowerCase().includes(q);
      const matchDoc = a.doctorCounselorName.toLowerCase().includes(q);
      if (!matchEmp && !matchCat && !matchDoc) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto p-6 animate-pulse">
        <div className="h-32 w-full bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        <div className="h-14 w-full bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="col-span-4 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0f172a] to-zinc-950 p-6 md:p-8 border border-zinc-800 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#f87941]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#f87941]/15 rounded-2xl border border-[#f87941]/30">
                <HeartHandshake className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                    Employee Wellness Operations
                  </h1>
                  <Badge className={`text-[10px] font-bold ${canApprove ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40'}`}>
                    {canApprove ? 'Admin Management Mode' : 'Employee Self-Service'}
                  </Badge>
                </div>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  11 Connected Modules: Checkups, Counselling, EAP, Vaccination, Challenges, Stress & Burnout Radar
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic DB Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Bookings & Slots</div>
              <div className="text-xl font-black text-white mt-0.5">{summaryStats.totalBooked}</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> {summaryStats.scheduledCount} Active
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Avg Stress Index</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{summaryStats.avgStressIndex.split(' ')[0]}</div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Live DB Calculated</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Team Health Index</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">{summaryStats.burnoutHealthIndex}</div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">Optimal Zone</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active Drives</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{summaryStats.activeProgramsCount}</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Corporate Programs</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">EAP Hotline</div>
              <div className="text-xl font-black text-purple-400 mt-0.5">24/7</div>
              <div className="text-[10px] text-purple-400/80 mt-0.5">1-800-WELLNESS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="catalog" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <HeartHandshake className="h-3.5 w-3.5" /> Services & Programs ({programs.length})
            </TabsTrigger>
            <TabsTrigger value="appointments" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Calendar className="h-3.5 w-3.5" /> {canApprove ? 'All Bookings & Slots' : 'My Bookings'} ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="burnout" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Flame className="h-3.5 w-3.5" /> Stress & Burnout Radar
            </TabsTrigger>
            <TabsTrigger value="survey" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <ClipboardList className="h-3.5 w-3.5" /> Pulse Surveys ({surveys.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2.5">
            {canApprove && (
              <Button
                onClick={() => openProgramModal()}
                variant="outline"
                className="font-bold text-xs h-9 px-3.5 rounded-xl border-[#f87941]/40 text-[#f87941] hover:bg-[#f87941]/10 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> New Program Drive
              </Button>
            )}

            <Button
              onClick={() => openBookingModal()}
              className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#f87941]/20"
            >
              <Plus className="h-3.5 w-3.5" /> Book Checkup / Counselling Slot
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: WELLNESS SERVICES & CORPORATE PROGRAMS (CONNECTED TO DB) */}
        {/* ========================================================================= */}
        <TabsContent value="catalog" className="space-y-8 m-0">

          {/* Active Corporate Programs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-[#f87941]" /> Live Corporate Wellness Programs & Health Drives
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {canApprove ? 'Manage company health drives, capacity limits, and schedules.' : 'Register and enroll with 1-click in active corporate health screenings.'}
                </p>
              </div>
              <Badge className="bg-[#f87941]/10 text-[#f87941] text-xs font-bold border-none">
                {programs.length} Scheduled Drives
              </Badge>
            </div>

            {programs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map(prog => (
                  <Card
                    key={prog.id}
                    className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-[#f87941]/10 text-[#f87941] text-[10px] font-bold border-none">
                          {prog.category}
                        </Badge>
                        <Badge className={`text-[10px] font-bold border-none ${
                          prog.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' :
                          prog.status === 'Upcoming' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {prog.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-black mt-2 leading-snug">{prog.title}</CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {prog.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pb-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                        <MapPin className="h-3.5 w-3.5 text-[#f87941]" />
                        <span>{prog.location}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                        <Calendar className="h-3.5 w-3.5 text-[#f87941]" />
                        <span>{prog.scheduleDate ? new Date(prog.scheduleDate).toLocaleDateString() : 'Continuous'}</span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>Capacity Roster</span>
                          <span className="font-mono">{prog.enrolledCount} / {prog.capacity} Enrolled</span>
                        </div>
                        <Progress value={Math.min(100, Math.round((prog.enrolledCount / (prog.capacity || 1)) * 100))} className="h-1.5" />
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                      {canApprove ? (
                        <div className="flex items-center gap-1.5 w-full justify-between">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openParticipantsModal(prog)}
                            className="h-8 px-2.5 text-xs font-bold text-[#f87941] border-[#f87941]/30 hover:bg-[#f87941]/10 rounded-xl flex items-center gap-1"
                          >
                            <Users className="h-3.5 w-3.5" />
                            Participants ({prog.enrolledCount})
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openProgramModal(prog)}
                              className="h-8 px-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-white rounded-xl"
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProgram(prog.id, prog.title)}
                              className="h-8 px-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        myRegisteredProgramIds.has(prog.id) ? (
                          <Button
                            size="sm"
                            disabled={true}
                            className="w-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold h-8 rounded-xl cursor-default flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            Registered
                          </Button>
                        ) : registeringProgId === prog.id ? (
                          <Button
                            size="sm"
                            disabled={true}
                            className="w-full bg-[#f87941]/70 text-white text-xs font-bold h-8 rounded-xl flex items-center justify-center gap-1.5 cursor-wait"
                          >
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            Registering...
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleDirectProgramEnroll(prog)}
                            disabled={prog.status !== 'Active' || prog.enrolledCount >= prog.capacity || !!registeringProgId}
                            className="w-full bg-[#f87941] hover:bg-[#e06634] text-white text-xs font-bold h-8 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {prog.status === 'Active' ? '1-Click Register' : 'Registration Closed'}
                          </Button>
                        )
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 p-8 text-center space-y-3">
                <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
                  No Corporate Programs Scheduled
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {canApprove
                    ? "Click 'New Program Drive' above to publish health screenings, vaccination clinics, or corporate fitness challenges."
                    : "No corporate programs are currently scheduled. You can book an individual checkup or counselling session below."}
                </p>
                {canApprove && (
                  <Button
                    onClick={() => openProgramModal()}
                    className="bg-[#f87941] hover:bg-[#e06634] text-white text-xs font-bold rounded-xl h-8 px-4 mx-auto"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Create First Program
                  </Button>
                )}
              </Card>
            )}
          </div>

          {/* 11 Supported Wellness Categories Catalog */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-black flex items-center gap-2">
                <HeartHandshake className="h-4.5 w-4.5 text-[#f87941]" /> 11 Corporate Wellness Offerings
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Click any module below to immediately book an appointment or tele-consultation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalog.map(s => {
                const IconComponent = ICON_MAP[s.iconName] || HeartHandshake;
                return (
                  <Card
                    key={s.name}
                    onClick={() => openBookingModal(s.category)}
                    className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-[#f87941]/50 cursor-pointer transition-all duration-200"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-[#f87941]/10 rounded-2xl text-[#f87941]">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-500 text-[10px] font-mono">
                          {s.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-black mt-2">{s.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 text-xs text-slate-500 font-medium leading-relaxed">
                      {s.description}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: MY BOOKINGS & CHECKUP SLOTS (FULL END-TO-END CRUD) */}
        {/* ========================================================================= */}
        <TabsContent value="appointments" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-[#f87941]" />
                  {canApprove ? 'Enterprise Wellness Bookings Ledger' : 'My Scheduled Wellness Appointments'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  {canApprove ? 'Review all employee bookings, update clinical outcomes, adjust burnout scores, and complete sessions.' : 'View your upcoming medical screenings, checkups, and counselling sessions.'}
                </CardDescription>
              </div>

              {/* Filters for Admin */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search doctor, notes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-8 text-xs pl-8 w-44 rounded-xl border-slate-200 dark:border-zinc-800"
                  />
                </div>

                {canApprove && (
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="h-8 text-xs w-44 rounded-xl border-slate-200 dark:border-zinc-800 font-semibold">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-56">
                      <SelectItem value="all">All Employees</SelectItem>
                      {roster.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs w-32 rounded-xl border-slate-200 dark:border-zinc-800 font-semibold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {filteredAppointments.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                      <th className="p-4 px-6">Employee</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Doctor / Counselor</th>
                      <th className="p-4">Appointment Date</th>
                      <th className="p-4">Burnout Risk</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {filteredAppointments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30">
                        <td className="p-4 px-6 font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                          {a.employeeName}
                        </td>
                        <td className="p-4">
                          <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold text-[9px]">
                            {a.category}
                          </Badge>
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-bold">
                          {a.doctorCounselorName &&
                           a.doctorCounselorName !== 'Pending Admin Assignment' &&
                           a.doctorCounselorName !== 'Pending Assignment' &&
                           a.doctorCounselorName !== 'Unassigned' &&
                           !a.doctorCounselorName.includes('Jenkins') ? (
                            <span>{a.doctorCounselorName}</span>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[9px]">
                              Pending Assignment
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-[11px]">
                          {a.appointmentDate ? a.appointmentDate.slice(0, 10) : 'TBD'}
                        </td>
                        <td className="p-4">
                          <Badge className={`border-none font-bold text-[9px] ${
                            a.burnoutRiskScore === 'Low' ? 'bg-emerald-500/10 text-emerald-600' :
                            a.burnoutRiskScore === 'Moderate' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {a.burnoutRiskScore} Risk
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={`border-none font-bold text-[9px] ${
                            a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' :
                            a.status === 'Cancelled' ? 'bg-slate-200 text-slate-500 dark:bg-zinc-800' : 'bg-blue-500/10 text-blue-600'
                          }`}>
                            {a.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            {canApprove ? (
                              <>
                                {a.status === 'Scheduled' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateApptStatus(a.id, 'Completed')}
                                    className="h-7 px-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                                  >
                                    <Check className="h-3 w-3 mr-1" /> Complete
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditApptModal(a)}
                                  className="h-7 px-2 text-[10px] font-bold rounded-lg"
                                >
                                  <Edit3 className="h-3 w-3 mr-1" /> Review
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteAppointment(a.id)}
                                  className="h-7 px-2 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              a.status === 'Scheduled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteAppointment(a.id)}
                                  className="h-7 px-2.5 text-[10px] font-bold text-rose-500 border-rose-200 hover:bg-rose-500/10 rounded-lg"
                                >
                                  Cancel Booking
                                </Button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No wellness appointments found</div>
                  <p className="text-xs text-slate-400">Book your first health checkup or counselling session using the button above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: BURNOUT & STRESS DETECTION RADAR */}
        {/* ========================================================================= */}
        <TabsContent value="burnout" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Flame className="h-4.5 w-4.5 text-emerald-500" /> Team Burnout Risk Index
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                <div className="text-slate-500">Live DB radar evaluating pulse surveys, stress indicators, and appointment risk tags.</div>
                <Progress value={parseInt(summaryStats.avgStressIndex) || 20} className="h-2" />
                <div className="text-[10px] text-emerald-500 font-mono">
                  {summaryStats.avgStressIndex} ({summaryStats.lowRiskCount} low-risk / {summaryStats.highRiskCount} alert)
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Smile className="h-4.5 w-4.5 text-purple-500" /> Work-Life Balance Score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Self-reported average rating across company surveys.</div>
                <div className="text-2xl font-mono font-black text-purple-500">
                  {surveyAnalytics.avgWorkLifeBalance} / 5.0
                </div>
                <div className="text-[10px] text-slate-400">Sleep Quality Avg: {surveyAnalytics.avgSleepQuality} / 5.0</div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <PhoneCall className="h-4.5 w-4.5 text-[#f87941]" /> EAP Confidential Helpline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">24/7 Professional confidential tele-counselling and family support.</div>
                <div className="text-sm font-mono font-black text-[#f87941]">1-800-WELLNESS-EAP</div>
                <div className="text-[10px] text-slate-400">Toll-free, 100% anonymous & secure</div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: WORK-LIFE PULSE SURVEY & LEDGER */}
        {/* ========================================================================= */}
        <TabsContent value="survey" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Pulse Survey Form */}
            <div className="lg:col-span-5">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <ClipboardList className="h-4.5 w-4.5 text-[#f87941]" /> Take Pulse Survey
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Submit anonymous work-life balance feedback & receive real-time AI guidance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-5">
                  <form onSubmit={handleSubmitSurvey} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        1. Work-Life Balance Rating (1 = Poor, 5 = Excellent)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setWlbRating(val)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${wlbRating === val ? 'bg-[#f87941] text-white shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600'}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        2. Work Stress Level (1 = Low Stress, 5 = Severe Stress)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setStressLevel(val)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${stressLevel === val ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600'}`}
                          >
                            L{val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        3. Sleep & Rest Quality (1 = Poor, 5 = Restful)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSleepRating(val)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${sleepRating === val ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600'}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Additional Comments / Feedback</label>
                      <Textarea
                        rows={3}
                        value={surveyComments}
                        onChange={e => setSurveyComments(e.target.value)}
                        placeholder="Share feedback regarding workload, ergonomics, or wellness needs..."
                        className="rounded-2xl text-xs p-3 border-slate-200 dark:border-zinc-800"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={surveySubmitting}
                      className="w-full bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-10 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-[#f87941]/20"
                    >
                      {surveySubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                      Submit Pulse Survey
                    </Button>
                  </form>

                  {aiSurveyRecommendation && (
                    <div className="p-4 rounded-2xl bg-slate-950 text-white border border-zinc-800 space-y-2 animate-fadeIn">
                      <div className="text-xs font-mono text-[#f87941] font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> AI Copilot Wellness Insight
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed font-sans">
                        {aiSurveyRecommendation}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Survey Submissions Ledger */}
            <div className="lg:col-span-7">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-[#f87941]" />
                    {canApprove ? 'Team Survey Responses Ledger' : 'My Past Pulse Surveys'}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    {canApprove ? 'Aggregated employee pulse responses and AI risk evaluations.' : 'Your submitted survey records and historical recommendations.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto max-h-[500px]">
                  {surveys.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {surveys.map(s => (
                        <div key={s.id} className="p-4 space-y-2 hover:bg-slate-50/60 dark:hover:bg-zinc-900/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{s.employeeName}</span>
                              <Badge className="bg-slate-100 dark:bg-zinc-800 text-[9px] font-normal">{s.department}</Badge>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <div>
                              <span className="text-slate-400 text-[10px] block">WLB</span>
                              <span className="text-[#f87941] font-bold">{s.workLifeBalanceRating}/5</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block">Stress</span>
                              <span className="text-rose-500 font-bold">Level {s.workStressLevel}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block">Sleep</span>
                              <span className="text-purple-500 font-bold">{s.sleepQualityRating}/5</span>
                            </div>
                          </div>

                          {s.feedbackComments && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-xl">
                              &ldquo;{s.feedbackComments}&rdquo;
                            </p>
                          )}

                          {s.aiRecommendation && (
                            <div className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
                              <Sparkles className="h-3 w-3 text-[#f87941] shrink-0 mt-0.5" />
                              <span>{s.aiRecommendation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      No pulse survey records submitted yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

      </Tabs>

      {/* ========================================================================= */}
      {/* DIALOG 1: BOOK WELLNESS CHECKUP / COUNSELLING (AUTO-FILL EMPLOYEE FOR REGULAR USERS) */}
      {/* ========================================================================= */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="rounded-3xl max-w-lg border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Book Wellness Checkup / Counselling</DialogTitle>
            <DialogDescription className="text-xs">
              Select wellness service category and appointment date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookAppointment} className="space-y-4 pt-2">

            {/* EMPLOYEE AUTO-FILL FIELD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employee Applicant</label>
              {canApprove ? (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {roster.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name} ({e.department})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                /* Non-admin / Employee View: 100% AUTO-FILLED & LOCKED */
                <div className="h-10 px-3 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    <span>{currentUserProfile?.name || 'Employee'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({currentUserProfile?.department || 'Staff'})</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 text-[9px] border-none font-bold">Auto-Filled (Self)</Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Wellness Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {catalog.map(c => (
                      <SelectItem key={c.name} value={c.category}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Appointment Date</label>
                <Input
                  type="date"
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                  className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                />
              </div>
            </div>

            {/* DOCTOR / CONSULTANT ASSIGNED FIELD (ADMIN ONLY EDITABLE) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Doctor / Consultant Assigned
              </label>
              {canApprove ? (
                <Input
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. A. Sharma (or leave blank for Pending Assignment)"
                  className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                />
              ) : (
                /* Non-editable for Employee: Doctor is assigned by Administrator upon confirmation */
                <div className="h-10 px-3 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#f87941]" />
                    <span>Pending Administrator Assignment</span>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 text-[9px] border-none font-bold">Assigned by Admin</Badge>
                </div>
              )}
              {!canApprove && (
                <p className="text-[10px] text-slate-400 font-normal">
                  Your medical doctor or counsellor will be assigned by the administrator upon appointment review.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Medical Preferences</label>
              <Textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Specify any dietary, lab test, or tele-health preferences..."
                className="rounded-2xl text-xs p-3 border-slate-200 dark:border-zinc-800"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowBookingModal(false)} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold text-xs rounded-xl"
              >
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: ADMIN CREATE / EDIT WELLNESS PROGRAM DRIVE */}
      {/* ========================================================================= */}
      {canApprove && (
        <Dialog open={showProgramModal} onOpenChange={setShowProgramModal}>
          <DialogContent className="rounded-3xl max-w-lg border-slate-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-base font-black">
                {editingProgramId ? 'Edit Wellness Program' : 'Create New Wellness Program / Drive'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure corporate health campaigns, registration capacities, and schedule dates.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProgram} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Program Title</label>
                <Input
                  value={progTitle}
                  onChange={e => setProgTitle(e.target.value)}
                  placeholder="e.g. Annual Executive Comprehensive Health Screening 2026"
                  className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <Select value={progCategory} onValueChange={setProgCategory}>
                    <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-56">
                      {catalog.map(c => (
                        <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                  <Select value={progStatus} onValueChange={setProgStatus}>
                    <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Schedule Date</label>
                  <Input
                    type="date"
                    value={progScheduleDate}
                    onChange={e => setProgScheduleDate(e.target.value)}
                    className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Capacity Limit</label>
                  <Input
                    type="number"
                    value={progCapacity}
                    onChange={e => setProgCapacity(Number(e.target.value))}
                    className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Location / Platform</label>
                <Input
                  value={progLocation}
                  onChange={e => setProgLocation(e.target.value)}
                  placeholder="e.g. Corporate Health Suite (Building A) / Tele-Health"
                  className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                <Textarea
                  rows={2}
                  value={progDescription}
                  onChange={e => setProgDescription(e.target.value)}
                  placeholder="Describe the medical coverage, diagnostic lab facilities, and requirements..."
                  className="rounded-2xl text-xs p-3 border-slate-200 dark:border-zinc-800"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowProgramModal(false)} className="rounded-xl text-xs font-bold">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={programSubmitting}
                  className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold text-xs rounded-xl"
                >
                  {programSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingProgramId ? 'Save Changes' : 'Publish Program'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 3: ADMIN CLINICAL REVIEW / EDIT APPOINTMENT */}
      {/* ========================================================================= */}
      {canApprove && (
        <Dialog open={showEditApptModal} onOpenChange={setShowEditApptModal}>
          <DialogContent className="rounded-3xl max-w-lg border-slate-200 dark:border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-base font-black">Clinical Review & Appointment Update</DialogTitle>
              <DialogDescription className="text-xs">
                Update status, doctor notes, and burnout risk metrics for {editingAppt?.employeeName}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveApptReview} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Appointment Status</label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Burnout Risk Evaluation</label>
                  <Select value={reviewBurnoutRisk} onValueChange={setReviewBurnoutRisk}>
                    <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Low">Low Risk</SelectItem>
                      <SelectItem value="Moderate">Moderate Risk</SelectItem>
                      <SelectItem value="High">High Risk</SelectItem>
                      <SelectItem value="Severe">Severe Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Doctor / Consultant Assigned</label>
                  <Input
                    value={reviewDoctor}
                    onChange={e => setReviewDoctor(e.target.value)}
                    className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Stress Index Score (0 - 100)</label>
                  <Input
                    type="number"
                    value={reviewStressIndex}
                    onChange={e => setReviewStressIndex(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Clinical Consultation Notes</label>
                <Textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Clinical diagnostic summary, prescriptions, or counselling follow-ups..."
                  className="rounded-2xl text-xs p-3 border-slate-200 dark:border-zinc-800"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowEditApptModal(false)} className="rounded-xl text-xs font-bold">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold text-xs rounded-xl"
                >
                  Save Clinical Review
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* DIALOG 4: ADMIN VIEW PROGRAM PARTICIPANTS ROSTER */}
      {/* ========================================================================= */}
      {canApprove && (
        <Dialog open={showParticipantsModal} onOpenChange={setShowParticipantsModal}>
          <DialogContent className="rounded-3xl max-w-3xl sm:max-w-3xl border-slate-200 dark:border-zinc-800">
            <DialogHeader className="pr-12 sm:pr-14">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#f87941]/10 rounded-2xl text-[#f87941] shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-black text-slate-900 dark:text-slate-100">
                      {selectedProgForParticipants?.title || 'Program Participants'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Live participant registration roster & verification.
                    </DialogDescription>
                  </div>
                </div>
                <Badge className="bg-[#f87941]/10 text-[#f87941] hover:bg-[#f87941]/15 text-xs font-mono font-bold border border-[#f87941]/20 px-3 py-1 rounded-xl self-start sm:self-auto shrink-0">
                  {programParticipants.filter(p => p.status !== 'Cancelled').length} / {selectedProgForParticipants?.capacity || 0} Registered
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900/60 px-3.5 py-2.5 rounded-2xl border border-slate-100 dark:border-zinc-800 font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-[#f87941]/10 flex items-center justify-center text-[#f87941]">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedProgForParticipants?.location || 'Main Office'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-[#f87941]/10 flex items-center justify-center text-[#f87941]">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedProgForParticipants?.scheduleDate ? new Date(selectedProgForParticipants.scheduleDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Continuous'}</span>
                </div>
              </div>

              {participantsLoading ? (
                <div className="p-8 text-center space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#f87941] mx-auto" />
                  <p className="text-xs text-slate-500">Loading participant roster...</p>
                </div>
              ) : programParticipants.length > 0 ? (
                <div className="overflow-x-auto max-h-80 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-50 dark:bg-zinc-900/80 uppercase text-[10px] text-slate-400 font-extrabold border-b border-slate-100 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4 whitespace-nowrap">Participant</th>
                        <th className="py-3 px-3 whitespace-nowrap">Department</th>
                        <th className="py-3 px-3 whitespace-nowrap">Registered On</th>
                        <th className="py-3 px-3 whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {programParticipants.map((p: any) => (
                        <tr key={p.appointmentId} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30">
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{p.email}</div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200 font-semibold text-[10px] px-2.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                              {p.department || 'General'}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <Badge className={`border font-bold text-[9px] px-2.5 py-0.5 rounded-lg ${
                              p.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                              p.status === 'Cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            }`}>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveParticipant(p.appointmentId, p.name)}
                              className="h-7 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                              title="Remove participant from roster"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Inbox className="h-8 w-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No participants registered yet
                  </div>
                  <p className="text-[11px] text-slate-400">Employees who 1-Click Register will appear here in real-time.</p>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-slate-100 dark:border-zinc-800/80 pt-3 flex sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowParticipantsModal(false)}
                className="rounded-xl text-xs font-bold px-5 border-slate-200 dark:border-zinc-800"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
