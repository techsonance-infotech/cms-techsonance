'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { PageHeaderSkeleton, StatsSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Clock, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Star, 
  Search, 
  Users, 
  Video, 
  FileText, 
  Sparkles, 
  Filter, 
  Award,
  ChevronRight,
  Loader2,
  Briefcase
} from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

export default function InterviewWorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Schedule Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [interviewType, setInterviewType] = useState('Coding');

  // Feedback Modal State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [newStatus, setNewStatus] = useState('Completed');

  const fetchInterviewsData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      const [intRes, appRes] = await Promise.all([
        fetch('/api/recruitment/interviews', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/recruitment/applications', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (intRes.ok) {
        const json = await intRes.json();
        setInterviews(json.data || []);
      }
      if (appRes.ok) {
        const appJson = await appRes.json();
        setApplications(appJson.data || []);
        if (appJson.data?.length > 0 && !selectedAppId) {
          setSelectedAppId(appJson.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load interview records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewsData();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !scheduledDate) {
      toast.error('Please select an applicant and date.');
      return;
    }

    try {
      setScheduling(true);
      const token = getStoredSessionToken();
      const combinedDateTime = new Date(`${scheduledDate}T${scheduledTime || '10:00'}:00`).toISOString();

      const res = await fetch('/api/recruitment/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId: selectedAppId,
          scheduledAt: combinedDateTime,
          interviewType,
          status: 'Scheduled',
          feedbackScore: 0,
          feedbackNotes: ''
        })
      });

      if (res.ok) {
        toast.success('Interview scheduled successfully.');
        setScheduleModalOpen(false);
        fetchInterviewsData();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.message || 'Failed to schedule interview.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error scheduling interview.');
    } finally {
      setScheduling(false);
    }
  };

  const openFeedbackDialog = (interview: any) => {
    setSelectedInterview(interview);
    setFeedbackScore(interview.feedback_score || 5);
    setFeedbackNotes(interview.feedback_notes || '');
    setNewStatus(interview.status === 'Completed' ? 'Completed' : 'Completed');
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    try {
      setSubmittingFeedback(true);
      const token = getStoredSessionToken();

      const res = await fetch('/api/recruitment/interviews', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          interviewId: selectedInterview.id,
          status: newStatus,
          feedbackScore,
          feedbackNotes
        })
      });

      if (res.ok) {
        toast.success('Interview scorecard and feedback saved.');
        setFeedbackModalOpen(false);
        fetchInterviewsData();
      } else {
        toast.error('Failed to update interview feedback.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredInterviews = interviews.filter(item => {
    const candName = `${item.job_applications?.candidate_profiles?.first_name || ''} ${item.job_applications?.candidate_profiles?.last_name || ''}`.toLowerCase();
    const roleTitle = (item.job_applications?.job_requisitions?.title || '').toLowerCase();
    const matchesSearch = candName.includes(searchQuery.toLowerCase()) || roleTitle.includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || item.interview_type === typeFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const scheduledCount = interviews.filter(i => i.status === 'Scheduled').length;
  const completedCount = interviews.filter(i => i.status === 'Completed').length;
  const avgScore = interviews.filter(i => i.feedback_score > 0).length > 0
    ? (interviews.filter(i => i.feedback_score > 0).reduce((a, b) => a + b.feedback_score, 0) / interviews.filter(i => i.feedback_score > 0).length).toFixed(1)
    : '4.8';

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1">
      {/* Header */}
      <PageHeader
        title="Interview Management"
        description="Schedule candidate evaluation rounds, manage technical assessments, and submit structured evaluation scorecards."
        actions={[
          <Button 
            key="dashboard" 
            variant="outline" 
            onClick={() => router.push('/dashboard/recruitment')}
            className="border-border text-foreground font-bold hover:bg-accent"
          >
            Cockpit
          </Button>,
          <Button 
            key="schedule" 
            onClick={() => setScheduleModalOpen(true)}
            className="bg-primary hover:bg-primary/95 text-white font-bold border-none text-xs h-9 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Schedule Interview
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment', href: '/dashboard/recruitment' }, { label: 'Interviews' }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Upcoming Scheduled</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{scheduledCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Completed Rounds</p>
              <p className="text-2xl font-black text-emerald-500 mt-0.5">{completedCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Avg Candidate Score</p>
              <p className="text-2xl font-black text-amber-500 mt-0.5">{avgScore} / 5.0</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Active Applications</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{applications.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border border-border/60 bg-card p-4 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search candidate or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9 bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs h-9 px-3 border rounded-md bg-background text-foreground border-input"
            >
              <option value="All">All Types</option>
              <option value="Coding">Coding</option>
              <option value="System Design">System Design</option>
              <option value="Screen">Screen</option>
              <option value="CulturalFit">Cultural Fit</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-9 px-3 border rounded-md bg-background text-foreground border-input"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Interviews Table / Cards */}
      <Card className="border border-border/60 bg-card shadow-xs">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-slate-400 font-bold bg-muted/40">
                <th className="p-3">#</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Position</th>
                <th className="p-3">Interview Round</th>
                <th className="p-3">Scheduled Date & Time</th>
                <th className="p-3">Scorecard</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.map((item, idx) => {
                const cand = item.job_applications?.candidate_profiles || {};
                const req = item.job_applications?.job_requisitions || {};
                const dateObj = new Date(item.scheduled_at);

                return (
                  <tr key={item.id} className="border-b hover:bg-accent/30 border-border">
                    <td className="p-3 text-muted-foreground font-semibold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">
                        {cand.first_name || 'Candidate'} {cand.last_name || ''}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{cand.email || 'N/A'}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{req.title || 'General Engineering'}</div>
                      <div className="text-[10px] text-muted-foreground">{req.department || 'Tech'}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[10px]">
                        {item.interview_type}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {dateObj.toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3">
                      {item.feedback_score > 0 ? (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${s < item.feedback_score ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-zinc-700'}`}
                            />
                          ))}
                          <span className="text-[10px] font-bold text-foreground ml-1">{item.feedback_score}.0</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[10px] italic">Pending Scorecard</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge className={`text-[9px] font-extrabold uppercase border-none ${
                        item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        item.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => openFeedbackDialog(item)}
                        className="text-[11px] font-bold text-foreground hover:bg-accent"
                      >
                        {item.status === 'Completed' ? 'View/Edit Notes' : 'Submit Scorecard'}
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {filteredInterviews.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground italic">
                    No interview rounds found matching criteria. Click &quot;Schedule Interview&quot; to arrange one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Schedule Interview Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Schedule Evaluation Round
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign an applicant to a technical, system design, or cultural fit interview.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Select Candidate Application *</label>
              <select
                required
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                className="w-full text-xs h-9 px-2 border rounded-md bg-background text-foreground border-input"
              >
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.candidate_profiles?.first_name} {app.candidate_profiles?.last_name} — {app.job_requisitions?.title || 'Engineer'} ({app.current_stage})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Date *</label>
                <Input
                  required
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Time *</label>
                <Input
                  required
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Interview Type</label>
              <select
                value={interviewType}
                onChange={e => setInterviewType(e.target.value)}
                className="w-full text-xs h-9 px-2 border rounded-md bg-background text-foreground border-input"
              >
                <option value="Coding">Coding / Technical Round</option>
                <option value="System Design">System Design & Architecture</option>
                <option value="Screen">Initial Phone Screen</option>
                <option value="CulturalFit">Cultural Fit & Leadership</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setScheduleModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={scheduling} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                {scheduling ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Calendar className="h-4 w-4 mr-1.5" />}
                {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submit Feedback Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Interview Scorecard & Feedback
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record interview evaluation score and recommendation notes.
            </DialogDescription>
          </DialogHeader>

          {selectedInterview && (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-2">
              <div className="p-3 bg-accent/30 rounded-xl border border-border text-xs">
                <div className="font-bold text-foreground">
                  {selectedInterview.job_applications?.candidate_profiles?.first_name} {selectedInterview.job_applications?.candidate_profiles?.last_name}
                </div>
                <div className="text-muted-foreground text-[11px]">
                  {selectedInterview.interview_type} for {selectedInterview.job_applications?.job_requisitions?.title}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase block">
                  Evaluation Rating: {feedbackScore} / 5 Stars
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackScore(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= feedbackScore ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-zinc-700'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Interview Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full text-xs h-9 px-2 border rounded-md bg-background text-foreground border-input"
                >
                  <option value="Completed">Completed (Passed / Evaluated)</option>
                  <option value="Scheduled">Scheduled (Awaiting Session)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Detailed Evaluation Notes</label>
                <Textarea
                  rows={4}
                  placeholder="Summarize candidate technical capabilities, design decisions, and recommendation..."
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setFeedbackModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingFeedback} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                  {submittingFeedback ? 'Saving...' : 'Save Evaluation'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
