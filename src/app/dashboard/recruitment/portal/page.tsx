'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Briefcase, 
  MapPin, 
  Building2, 
  Search, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  DollarSign, 
  Layers,
  GraduationCap,
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

export default function CareerPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [education, setEducation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [skills, setSkills] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      const res = await fetch('/api/recruitment/requisitions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRequisitions(json.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load career portal requisitions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const openApplyDialog = (job: any) => {
    setSelectedJob(job);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setResumeUrl('');
    setEducation('');
    setLinkedin('');
    setSkills(job.requirements || '');
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !selectedJob) {
      toast.error('Please fill in your first name, last name, and email.');
      return;
    }

    try {
      setApplying(true);
      const token = getStoredSessionToken();

      // 1. Create or upsert candidate profile
      const candRes = await fetch('/api/recruitment/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          resumeUrl: resumeUrl || 'https://storage.example.com/resumes/default_resume.pdf',
          skills: skills ? skills.split(',').map(s => s.trim()) : [],
          source: 'Career Portal',
          talentPool: selectedJob.department || 'Engineering',
          screeningScore: 85,
          status: 'Applied'
        })
      });

      if (!candRes.ok) {
        const err = await candRes.json().catch(() => null);
        throw new Error(err?.message || 'Failed to register candidate profile.');
      }

      const candData = await candRes.json();
      const candidateId = candData.data?.id;

      // 2. Create linked Job Application
      if (candidateId) {
        const appRes = await fetch('/api/recruitment/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            jobRequisitionId: selectedJob.id,
            candidateId,
            currentStage: 'Applied',
            resumeSummary: `Applied for ${selectedJob.title}. Candidate: ${firstName} ${lastName}`,
            matchScore: 88,
            notes: `Submitted via Career Portal on ${new Date().toLocaleDateString()}`
          })
        });

        if (!appRes.ok) {
          console.warn('Application linking warning');
        }
      }

      toast.success(`Application submitted for ${selectedJob.title}!`);
      setApplyModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error submitting application.');
    } finally {
      setApplying(false);
    }
  };

  const departments = ['All', ...Array.from(new Set(requisitions.map(r => r.department).filter(Boolean)))];

  const filteredJobs = requisitions.filter(job => {
    const matchesQuery = 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = selectedDept === 'All' || job.department === selectedDept;
    return matchesQuery && matchesDept;
  });

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1">
      {/* Header */}
      <PageHeader
        title="Career Portal"
        description="Explore active job vacancies, submit direct job applications, and share opportunities with top talent."
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
            key="jobs" 
            onClick={() => router.push('/dashboard/recruitment/jobs')}
            className="bg-primary hover:bg-primary/95 text-white font-bold border-none"
          >
            <Briefcase className="mr-2 h-4 w-4" /> Manage Openings
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment', href: '/dashboard/recruitment' }, { label: 'Career Portal' }]}
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 p-8 border border-border/40 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-3 py-1 font-bold">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 animate-pulse" /> TechSonance Talent Hub
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Build the Future With Us. Discover Your Next Role.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            We are actively expanding our engineering, product, QA, and operations teams. Explore all active requisitions below or apply directly.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Competitive CTC</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Flexible Shifts</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Health & Wellness Perks</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/50 bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, department, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background h-10 text-xs"
            />
          </div>

          {/* Department Chips */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            {departments.map((dept) => (
              <Button
                key={dept}
                size="sm"
                variant={selectedDept === dept ? 'default' : 'outline'}
                onClick={() => setSelectedDept(dept)}
                className={`text-xs h-8 font-semibold ${
                  selectedDept === dept ? 'bg-primary text-white border-primary' : 'hover:bg-accent text-foreground'
                }`}
              >
                {dept}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Open Requisitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <Card 
            key={job.id} 
            className="border border-border/60 bg-card hover:border-primary/50 transition-all hover:shadow-md flex flex-col justify-between"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/30 text-[10px] font-bold">
                  {job.department}
                </Badge>
                <Badge className={`px-2 py-0.5 rounded-full border-none text-[9px] font-extrabold uppercase ${
                  job.status === 'Open'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-zinc-800'
                }`}>
                  {job.status}
                </Badge>
              </div>

              <CardTitle className="text-lg font-black tracking-tight">{job.title}</CardTitle>
              <CardDescription className="text-xs flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {job.location}</span>
                <span>•</span>
                <span>{job.employment_type || 'Full-time'}</span>
                <span>•</span>
                <span className="text-primary font-bold">{job.experience_level || 'Mid'} Level</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {job.description || 'Join our high-performing team and work on critical technology offerings and applications.'}
              </p>

              {job.requirements && (
                <div className="text-[11px] p-2.5 rounded-lg bg-accent/40 text-muted-foreground line-clamp-2">
                  <span className="font-semibold text-foreground">Skills: </span>
                  {job.requirements}
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Compensation Range</div>
                  <div className="text-xs font-bold text-foreground">
                    ₹{Number(job.salary_range_min || 0).toLocaleString()} - ₹{Number(job.salary_range_max || 0).toLocaleString()} <span className="text-[10px] text-muted-foreground">/yr</span>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  onClick={() => openApplyDialog(job)}
                  className="bg-primary hover:bg-primary/95 text-white font-bold text-xs h-8 px-4 flex items-center gap-1.5 shadow-sm"
                >
                  Apply Now <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold">No active positions matching your search</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your department filter or search terms, or create a new job requisition.
            </p>
            <Button 
              onClick={() => { setSearchQuery(''); setSelectedDept('All'); }} 
              variant="outline" 
              className="mt-4 text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Send className="h-5 w-5 text-primary" /> Apply for {selectedJob?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Submit candidate profile details for {selectedJob?.department} in {selectedJob?.location}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplySubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">First Name *</label>
                <Input
                  required
                  placeholder="e.g. Rahul"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Last Name *</label>
                <Input
                  required
                  placeholder="e.g. Verma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address *</label>
                <Input
                  required
                  type="email"
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Highest Education / Degree</label>
              <Input
                placeholder="e.g. B.Tech Computer Science, NIT Surat"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">LinkedIn / Portfolio URL</label>
              <Input
                placeholder="https://linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Resume Document URL</label>
              <Input
                placeholder="https://example.com/resumes/my_resume.pdf"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Key Skills (comma separated)</label>
              <Input
                placeholder="React, TypeScript, Node.js, Tailwind"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setApplyModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={applying} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                {applying ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                {applying ? 'Submitting Application...' : 'Submit Job Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
