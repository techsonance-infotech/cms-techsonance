'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Users, 
  Kanban, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Sparkles, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Brain,
  Loader2,
  Briefcase
} from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

const PIPELINE_STAGES = ['Applied', 'Phone Screen', 'Technical', 'Executive', 'Offer', 'Preboarding'];

export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'directory' ? 'directory' : 'pipeline';
  
  const [activeTab, setActiveTab] = useState<'pipeline' | 'directory'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Detail Dialog state
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Add Candidate Dialog state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [talentPool, setTalentPool] = useState('Engineering');
  const [source, setSource] = useState('LinkedIn');
  const [skills, setSkills] = useState('');
  const [targetJobId, setTargetJobId] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      const [candRes, appRes, reqRes] = await Promise.all([
        fetch('/api/recruitment/candidates', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/recruitment/applications', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/recruitment/requisitions', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (candRes.ok && appRes.ok && reqRes.ok) {
        const candsJson = await candRes.json();
        const appsJson = await appRes.json();
        const reqsJson = await reqRes.json();

        setCandidates(candsJson.data || []);
        setApplications(appsJson.data || []);
        setRequisitions(reqsJson.data || []);
        if (reqsJson.data?.length > 0 && !targetJobId) {
          setTargetJobId(reqsJson.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load candidate pipeline records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdvanceStage = async (appId: string, nextStage: string) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/recruitment/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          applicationId: appId,
          currentStage: nextStage,
          notes: `Stage advanced to ${nextStage} on ${new Date().toLocaleDateString()}`
        })
      });

      if (res.ok) {
        toast.success(`Candidate advanced to ${nextStage}!`);
        fetchData();
        if (detailOpen) setDetailOpen(false);
      } else {
        toast.error('Failed to update stage.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating candidate stage.');
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error('First name, last name, and email are required.');
      return;
    }

    try {
      setSubmitting(true);
      const token = getStoredSessionToken();

      // 1. Create candidate
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
          talentPool,
          source,
          resumeUrl: resumeUrl || 'https://example.com/resumes/candidate_doc.pdf',
          skills: skills ? skills.split(',').map(s => s.trim()) : [],
          screeningScore: 86,
          status: 'Applied'
        })
      });

      if (!candRes.ok) {
        const err = await candRes.json().catch(() => null);
        throw new Error(err?.message || 'Failed to create candidate profile.');
      }

      const candData = await candRes.json();
      const candidateId = candData.data?.id;

      // 2. Create application if job selected
      if (candidateId && targetJobId) {
        await fetch('/api/recruitment/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            jobRequisitionId: targetJobId,
            candidateId,
            currentStage: 'Applied',
            resumeSummary: `Added via recruiter dashboard. Skills: ${skills}`,
            matchScore: 85
          })
        });
      }

      toast.success('Candidate profile registered successfully.');
      setAddModalOpen(false);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSkills('');
      setResumeUrl('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error creating candidate.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCandidates = candidates.filter(cand => {
    const q = searchQuery.toLowerCase();
    const fullName = `${cand.first_name || ''} ${cand.last_name || ''}`.toLowerCase();
    const matchesQ = fullName.includes(q) || cand.email?.toLowerCase().includes(q) || cand.talent_pool?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || cand.status === statusFilter;
    return matchesQ && matchesStatus;
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
        title="Candidate Management"
        description="Track applicant progression pipelines, review resumes, evaluate AI match scores, and coordinate hiring stages."
        actions={[
          <div key="view-toggle" className="flex items-center rounded-lg border border-border bg-card p-0.5">
            <Button
              size="sm"
              variant={activeTab === 'pipeline' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('pipeline')}
              className={`text-xs font-bold h-8 flex items-center gap-1.5 ${activeTab === 'pipeline' ? 'bg-primary text-white' : 'text-foreground hover:bg-accent'}`}
            >
              <Kanban className="h-3.5 w-3.5" /> Pipeline Board
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'directory' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('directory')}
              className={`text-xs font-bold h-8 flex items-center gap-1.5 ${activeTab === 'directory' ? 'bg-primary text-white' : 'text-foreground hover:bg-accent'}`}
            >
              <Users className="h-3.5 w-3.5" /> Directory Table
            </Button>
          </div>,
          <Button 
            key="add" 
            onClick={() => setAddModalOpen(true)}
            className="bg-primary hover:bg-primary/95 text-white font-bold border-none h-9 text-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Candidate
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment', href: '/dashboard/recruitment' }, { label: 'Candidates' }]}
      />

      {/* Pipeline Kanban View */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-h-[600px] overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage, sIdx) => {
            const stageApps = applications.filter(a => (a.current_stage || 'Applied') === stage);
            const nextStage = PIPELINE_STAGES[sIdx + 1];

            return (
              <div key={stage} className="flex flex-col rounded-xl bg-card border border-border/60 shadow-2xs">
                {/* Column Header */}
                <div className="p-3 border-b border-border flex items-center justify-between bg-accent/20 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-xs font-bold text-foreground">{stage}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold h-5 px-1.5">
                    {stageApps.length}
                  </Badge>
                </div>

                {/* Candidate Cards Column */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[750px]">
                  {stageApps.map((app) => {
                    const candidate = app.candidate_profiles || {};
                    const requisition = app.job_requisitions || {};
                    const score = app.match_score || candidate.screening_score || 80;

                    return (
                      <Card 
                        key={app.id} 
                        className="p-3 border border-border/80 hover:border-primary/60 transition-all cursor-pointer shadow-xs bg-background/80 hover:bg-background"
                        onClick={() => { setSelectedApp(app); setDetailOpen(true); }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-black truncate text-foreground">
                            {candidate.first_name || 'Candidate'} {candidate.last_name || ''}
                          </h4>
                          <Badge className={`text-[9px] font-black border-none px-1 py-0 ${
                            score >= 85 ? 'bg-emerald-500/10 text-emerald-500' :
                            score >= 70 ? 'bg-amber-500/10 text-amber-500' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {score}% Match
                          </Badge>
                        </div>

                        <div className="text-[11px] text-primary font-semibold truncate flex items-center gap-1 mb-2">
                          <Briefcase className="h-3 w-3" />
                          {requisition.title || candidate.talent_pool || 'Software Engineer'}
                        </div>

                        <div className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mb-2">
                          {app.resume_summary || candidate.ai_recommendation || 'Evaluated for alignment with department skillsets.'}
                        </div>

                        <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="capitalize">{candidate.source || 'Career Portal'}</span>
                          {nextStage && (
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdvanceStage(app.id, nextStage);
                              }}
                              className="text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/10 h-6 px-1.5 flex items-center gap-0.5"
                            >
                              Advance <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}

                  {stageApps.length === 0 && (
                    <div className="py-12 text-center text-[11px] text-muted-foreground italic opacity-60">
                      No candidates in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Directory Table View */}
      {activeTab === 'directory' && (
        <Card className="border border-border/60 bg-card shadow-xs">
          <CardHeader className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold">Candidate Talent Directory</CardTitle>
              <CardDescription className="text-xs">Browse all registered candidate profiles and screening evaluations.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 bg-background"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs h-8 px-2.5 border rounded-md bg-background text-foreground border-input"
              >
                <option value="All">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Screening">Screening</option>
                <option value="Offered">Offered</option>
                <option value="Hired">Hired</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold bg-muted/40">
                  <th className="p-3">#</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Talent Pool</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Screening Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Resume</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((cand, idx) => (
                  <tr key={cand.id} className="border-b hover:bg-accent/30 border-border">
                    <td className="p-3 text-muted-foreground font-semibold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">{cand.first_name} {cand.last_name}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                        {Array.isArray(cand.skills) ? cand.skills.join(', ') : cand.skills || 'General Tech'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                        <Mail className="h-3 w-3 text-muted-foreground" /> {cand.email}
                      </div>
                      {cand.phone && (
                        <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground mt-0.5">
                          <Phone className="h-3 w-3" /> {cand.phone}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="font-bold text-[10px]">
                        {cand.talent_pool || 'Engineering'}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{cand.source || 'Career Portal'}</td>
                    <td className="p-3">
                      <Badge className={`text-[10px] font-bold border-none ${
                        (cand.screening_score || 0) >= 85 ? 'bg-emerald-500/10 text-emerald-500' :
                        (cand.screening_score || 0) >= 70 ? 'bg-amber-500/10 text-amber-500' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {cand.screening_score || 75}% Score
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-extrabold uppercase">
                        {cand.status || 'Applied'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {cand.resume_url ? (
                        <a 
                          href={cand.resume_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-primary hover:underline flex items-center gap-1 font-bold text-[11px]"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-[10px] italic">Not attached</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Candidate Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          {selectedApp && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-primary border-primary/30 text-[10px] font-bold">
                    {selectedApp.current_stage}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    Match: {selectedApp.match_score || 85}%
                  </span>
                </div>
                <DialogTitle className="text-lg font-black text-foreground">
                  {selectedApp.candidate_profiles?.first_name} {selectedApp.candidate_profiles?.last_name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Applied for {selectedApp.job_requisitions?.title || 'Position'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-accent/40 rounded-xl space-y-1.5 border border-border">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Brain className="h-3.5 w-3.5 text-primary" /> AI Screening Assessment
                  </div>
                  <p className="text-xs leading-relaxed text-foreground">
                    {selectedApp.resume_summary || selectedApp.candidate_profiles?.ai_recommendation || 'Candidate exhibits solid cross-functional experience and aligns with standard team requirements.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold">Contact Email: </span>
                  <span className="font-mono text-foreground">{selectedApp.candidate_profiles?.email}</span>
                </div>

                {selectedApp.candidate_profiles?.phone && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold">Phone: </span>
                    <span className="font-mono text-foreground">{selectedApp.candidate_profiles?.phone}</span>
                  </div>
                )}

                {selectedApp.candidate_profiles?.skills && (
                  <div>
                    <span className="text-muted-foreground font-semibold block mb-1">Identified Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(selectedApp.candidate_profiles.skills) 
                        ? selectedApp.candidate_profiles.skills 
                        : [selectedApp.candidate_profiles.skills]
                      ).map((s: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] font-semibold">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)} className="text-xs">
                  Close
                </Button>
                {PIPELINE_STAGES.indexOf(selectedApp.current_stage) < PIPELINE_STAGES.length - 1 && (
                  <Button 
                    size="sm"
                    onClick={() => handleAdvanceStage(selectedApp.id, PIPELINE_STAGES[PIPELINE_STAGES.indexOf(selectedApp.current_stage) + 1])}
                    className="bg-primary hover:bg-primary/95 text-white font-bold text-xs"
                  >
                    Advance to {PIPELINE_STAGES[PIPELINE_STAGES.indexOf(selectedApp.current_stage) + 1]}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Candidate Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Register New Candidate
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a candidate profile into the recruitment CRM and candidate pipeline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCandidate} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">First Name *</label>
                <Input required value={firstName} onChange={e => setFirstName(e.target.value)} className="text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Last Name *</label>
                <Input required value={lastName} onChange={e => setLastName(e.target.value)} className="text-xs h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address *</label>
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="text-xs h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Talent Pool</label>
                <select value={talentPool} onChange={e => setTalentPool(e.target.value)} className="text-xs h-9 px-2 border rounded-md bg-background w-full">
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Source</label>
                <select value={source} onChange={e => setSource(e.target.value)} className="text-xs h-9 px-2 border rounded-md bg-background w-full">
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Referral">Referral</option>
                  <option value="Career Portal">Career Portal</option>
                  <option value="Campus">Campus</option>
                  <option value="Agency">Agency</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Assign to Requisition</label>
              <select value={targetJobId} onChange={e => setTargetJobId(e.target.value)} className="text-xs h-9 px-2 border rounded-md bg-background w-full">
                {requisitions.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.department})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Skills (comma separated)</label>
              <Input placeholder="React, Next.js, Node.js" value={skills} onChange={e => setSkills(e.target.value)} className="text-xs h-9" />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                {submitting ? 'Registering...' : 'Save Candidate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
