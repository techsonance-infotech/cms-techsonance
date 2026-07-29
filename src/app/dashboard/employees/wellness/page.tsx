'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  HeartHandshake, Activity, Brain, PhoneCall, Syringe, Apple, Dumbbell,
  ClipboardList, Flame, Smile, Sparkles, Calendar, Clock, Plus, Search,
  Filter, Check, CheckCircle2, RefreshCw, SendHorizontal, Star, ShieldCheck,
  Award, Users, BarChart3, Inbox, AlertCircle, Bot, Zap, ChevronRight, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

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
  employeeName: string;
  category: string;
  appointmentDate: string;
  doctorCounselorName: string;
  notes: string;
  status: string;
  burnoutRiskScore: string;
  stressIndex: number;
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

  // RBAC State
  const [canApprove, setCanApprove] = useState(false);
  const [userRole, setUserRole] = useState('developer');

  // Dynamic API State
  const [catalog, setCatalog] = useState<ServiceItem[]>([]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [roster, setRoster] = useState<RosterEmp[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalBooked: 0,
    lowRiskCount: 0,
    highRiskCount: 0,
    avgStressIndex: '24% (Low Stress Zone)',
    burnoutHealthIndex: '94% Optimal',
    eapHotlineActive: '24/7 Toll Free Active'
  });

  // Modal & Form State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Health Checkups');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('Dr. Sarah Jenkins (Lead Wellness Consultant)');
  const [notes, setNotes] = useState('');

  // Pulse Survey Form State
  const [wlbRating, setWlbRating] = useState<number>(4);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [sleepRating, setSleepRating] = useState<number>(4);
  const [surveyComments, setSurveyComments] = useState('');
  const [aiSurveyRecommendation, setAiSurveyRecommendation] = useState<string | null>(null);

  // Fetch 100% Dynamic Data from Backend API
  const loadWellnessDataFromApi = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/employees/wellness', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.canApprove !== undefined) setCanApprove(data.canApprove);
        if (data.userRole) setUserRole(data.userRole);
        if (data.catalog) setCatalog(data.catalog);
        if (data.programs) setPrograms(data.programs);
        if (data.employeeRoster) {
          setRoster(data.employeeRoster);
          if (data.currentUserId) {
            setSelectedUserId(data.currentUserId);
          } else if (data.employeeRoster.length > 0 && !selectedUserId) {
            setSelectedUserId(data.employeeRoster[0].id);
          }
        }
        if (data.summaryStats) setSummaryStats(data.summaryStats);
        if (data.appointments) setAppointments(data.appointments);
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

  // Submit Wellness Booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !appointmentDate) {
      toast.error('Please specify Employee and Appointment Date');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const payload = {
        userId: selectedUserId,
        category: selectedCategory,
        appointmentDate,
        doctorCounselorName: doctorName,
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
      if (!res.ok) throw new Error(resData.error || 'Failed to book appointment');

      toast.success(resData.message || 'Wellness appointment booked successfully!');
      setShowBookingModal(false);
      setNotes('');
      await loadWellnessDataFromApi();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error booking appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Wellness Pulse Survey
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSurveySubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
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

      toast.success(data.message || 'Pulse survey submitted!');
      setAiSurveyRecommendation(data.aiRecommendation);
      await loadWellnessDataFromApi();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting survey');
    } finally {
      setSurveySubmitting(false);
    }
  };

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
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#f87941]/10 blur-3xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#f87941]/15 rounded-2xl border border-[#f87941]/30">
                <HeartHandshake className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Employee Wellness Operations
                </h1>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  11 Wellness Modules: Health Checkups, Counselling, EAP, Vaccination, Fitness Challenges, Stress & Burnout Detection
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Bookings & Slots</div>
              <div className="text-xl font-black text-white mt-0.5">{summaryStats.totalBooked}</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> Scheduled
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Avg Stress Index</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{summaryStats.avgStressIndex}</div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Optimal Balance</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Health Index</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">{summaryStats.burnoutHealthIndex}</div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">Low Burnout Risk</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">EAP Hotline</div>
              <div className="text-xl font-black text-purple-400 mt-0.5">24/7 Toll Free</div>
              <div className="text-[10px] text-purple-400/80 mt-0.5">Confidential Support</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">AI Copilot Tips</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">Live Active</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Ergonomic Advice</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="catalog" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <HeartHandshake className="h-3.5 w-3.5" /> Wellness Services & Campaigns ({catalog.length})
            </TabsTrigger>
            <TabsTrigger value="appointments" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Calendar className="h-3.5 w-3.5" /> My Bookings & Checkup Slots ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="burnout" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Flame className="h-3.5 w-3.5" /> Stress & Burnout Detection Monitor
            </TabsTrigger>
            <TabsTrigger value="survey" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <ClipboardList className="h-3.5 w-3.5" /> Work-Life Pulse Survey
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setShowBookingModal(true)}
            className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#f87941]/20"
          >
            <Plus className="h-3.5 w-3.5" /> Book Checkup / Counselling Slot
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: WELLNESS SERVICES & CAMPAIGN CATALOG */}
        {/* ========================================================================= */}
        <TabsContent value="catalog" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog.map(s => {
              const IconComponent = ICON_MAP[s.iconName] || HeartHandshake;
              return (
                <Card
                  key={s.name}
                  onClick={() => {
                    setSelectedCategory(s.category);
                    setShowBookingModal(true);
                  }}
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
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: MY BOOKINGS & CHECKUP SLOTS */}
        {/* ========================================================================= */}
        <TabsContent value="appointments" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-[#f87941]" /> Scheduled Wellness Appointments & Health Screenings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {appointments.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                      <th className="p-4 px-6">Employee</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Doctor / Counselor</th>
                      <th className="p-4">Appointment Date</th>
                      <th className="p-4">Burnout Risk</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                    {appointments.map(a => (
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
                          {a.doctorCounselorName}
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-[11px]">
                          {a.appointmentDate.slice(0, 10)}
                        </td>
                        <td className="p-4">
                          <Badge className={`border-none font-bold text-[9px] ${
                            a.burnoutRiskScore === 'Low' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {a.burnoutRiskScore} Risk
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-blue-500/10 text-blue-600 border-none font-bold text-[9px]">
                            {a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No wellness appointments booked yet</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: BURNOUT & STRESS DETECTION MONITOR */}
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
                <div className="text-slate-500">AI workload radar evaluating overtime hours, leave usage, and response cadence.</div>
                <Progress value={24} className="h-2" />
                <div className="text-[10px] text-emerald-500 font-mono">24% Low Fatigue (Optimal Team Health)</div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Smile className="h-4.5 w-4.5 text-purple-500" /> Stress Monitoring Score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Self-reported & pulse biometric stress level averages.</div>
                <div className="text-xl font-mono font-black text-purple-500">22% Stress Index</div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <PhoneCall className="h-4.5 w-4.5 text-[#f87941]" /> EAP Confidential Helpline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">24/7 Professional confidential phone counselling hotline.</div>
                <div className="text-sm font-mono font-black text-[#f87941]">1-800-WELLNESS-EAP</div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: WORK-LIFE PULSE SURVEY */}
        {/* ========================================================================= */}
        <TabsContent value="survey" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-[#f87941]" /> Work-Life Balance & Wellness Pulse Survey
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <form onSubmit={handleSubmitSurvey} className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    1. Work-Life Balance Rating (1 = Poor, 5 = Excellent)
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setWlbRating(val)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${wlbRating === val ? 'bg-[#f87941] text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600'}`}
                      >
                        {val} Rating
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    2. Work Stress Level (1 = Low Stress, 5 = Severe Stress)
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStressLevel(val)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${stressLevel === val ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600'}`}
                      >
                        Level {val}
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
                    className="rounded-2xl text-xs p-3"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={surveySubmitting}
                  className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-11 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-[#f87941]/20"
                >
                  {surveySubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                  Submit Pulse Survey
                </Button>
              </form>

              {aiSurveyRecommendation && (
                <div className="p-5 rounded-3xl bg-slate-950 text-white border border-zinc-800 space-y-2 animate-fadeIn max-w-xl">
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
        </TabsContent>

      </Tabs>

      {/* Book Wellness Checkup Modal Dialog */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="rounded-3xl max-w-lg border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Book Wellness Checkup / Counselling</DialogTitle>
            <DialogDescription className="text-xs">
              Select wellness service category and appointment date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookAppointment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employee Applicant</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={!canApprove}>
                <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {roster.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.department})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Doctor / Consultant Assigned</label>
              <Input
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
              />
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

    </div>
  );
}
