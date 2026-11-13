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
  Star, 
  Users, 
  Search, 
  Sparkles, 
  Brain, 
  Briefcase, 
  Mail, 
  Phone, 
  ExternalLink, 
  Filter, 
  ArrowRight,
  Send,
  Loader2,
  BookmarkCheck,
  CheckCircle2,
  Code2
} from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

export default function TalentPoolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [targetRequisitionId, setTargetRequisitionId] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchPoolData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      const [candRes, reqRes] = await Promise.all([
        fetch('/api/recruitment/candidates', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/recruitment/requisitions', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (candRes.ok && reqRes.ok) {
        const candsJson = await candRes.json();
        const reqsJson = await reqRes.json();
        setCandidates(candsJson.data || []);
        setRequisitions(reqsJson.data || []);
        if (reqsJson.data?.length > 0 && !targetRequisitionId) {
          setTargetRequisitionId(reqsJson.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load talent pool candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoolData();
  }, []);

  const openInviteModal = (candidate: any) => {
    setSelectedCandidate(candidate);
    setInviteModalOpen(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !targetRequisitionId) {
      toast.error('Please choose a target requisition.');
      return;
    }

    try {
      setInviting(true);
      const token = getStoredSessionToken();

      const res = await fetch('/api/recruitment/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobRequisitionId: targetRequisitionId,
          candidateId: selectedCandidate.id,
          currentStage: 'Applied',
          resumeSummary: `Invited from Talent Pool (${selectedCandidate.talent_pool || 'General'}). Prior score: ${selectedCandidate.screening_score || 85}%`,
          matchScore: selectedCandidate.screening_score || 88,
          notes: `Invited by recruiter via Talent Pool CRM on ${new Date().toLocaleDateString()}`
        })
      });

      if (res.ok) {
        toast.success(`Candidate ${selectedCandidate.first_name} invited to requisition!`);
        setInviteModalOpen(false);
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.message || 'Failed to link candidate to requisition.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error inviting candidate.');
    } finally {
      setInviting(false);
    }
  };

  const pools = ['All', 'Engineering', 'Product', 'Operations', 'Quality Assurance', 'Sales', 'HR'];

  const filteredCandidates = candidates.filter(cand => {
    const q = searchQuery.toLowerCase();
    const fullName = `${cand.first_name || ''} ${cand.last_name || ''}`.toLowerCase();
    const skillsStr = Array.isArray(cand.skills) ? cand.skills.join(' ').toLowerCase() : (cand.skills || '').toLowerCase();
    
    const matchesQuery = fullName.includes(q) || cand.email?.toLowerCase().includes(q) || skillsStr.includes(q);
    const matchesPool = selectedPool === 'All' || (cand.talent_pool || 'Engineering') === selectedPool;
    const matchesSkill = !selectedSkill || skillsStr.includes(selectedSkill.toLowerCase());

    return matchesQuery && matchesPool && matchesSkill;
  });

  const highPotentialCount = candidates.filter(c => (c.screening_score || 0) >= 85).length;
  const popularSkills = ['React', 'Next.js', 'TypeScript', 'Docker', 'Kubernetes', 'Figma', 'Python'];

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
        title="Talent Pool & CRM"
        description="Search vetted candidate profiles, filter domain talent pools, and match passive candidates directly to active openings."
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
            key="pipeline" 
            onClick={() => router.push('/dashboard/recruitment/candidates')}
            className="bg-primary hover:bg-primary/95 text-white font-bold border-none text-xs h-9"
          >
            <Users className="mr-1.5 h-4 w-4" /> Candidate Pipeline
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment', href: '/dashboard/recruitment' }, { label: 'Talent Pool' }]}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Total Talent In Pool</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{candidates.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Star className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">High Potential (Score &gt;85%)</p>
              <p className="text-2xl font-black text-emerald-500 mt-0.5">{highPotentialCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Available Requisitions</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{requisitions.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Active Talent Domains</p>
              <p className="text-2xl font-black text-purple-500 mt-0.5">{pools.length - 1}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Code2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-border/60 bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search talent by name, email, or skill keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9 bg-background"
            />
          </div>

          {/* Domain Chips */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto items-center">
            {pools.map(pool => (
              <Button
                key={pool}
                size="sm"
                variant={selectedPool === pool ? 'default' : 'outline'}
                onClick={() => setSelectedPool(pool)}
                className={`text-xs h-8 font-semibold ${selectedPool === pool ? 'bg-primary text-white border-primary' : 'hover:bg-accent text-foreground'}`}
              >
                {pool}
              </Button>
            ))}
          </div>
        </div>

        {/* Popular Skills Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1">
            <Filter className="h-3 w-3" /> Quick Skill Filters:
          </span>
          {popularSkills.map(skill => (
            <Badge
              key={skill}
              variant={selectedSkill === skill ? 'default' : 'secondary'}
              onClick={() => setSelectedSkill(selectedSkill === skill ? '' : skill)}
              className="cursor-pointer text-[10px] font-semibold hover:bg-primary/20"
            >
              {skill}
            </Badge>
          ))}
          {selectedSkill && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setSelectedSkill('')}
              className="text-[10px] text-muted-foreground hover:text-foreground h-5"
            >
              Clear filter
            </Button>
          )}
        </div>
      </Card>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((cand) => {
          const score = cand.screening_score || 80;
          const skillsList = Array.isArray(cand.skills) ? cand.skills : (cand.skills ? String(cand.skills).split(',') : []);

          return (
            <Card key={cand.id} className="border border-border/60 bg-card hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[10px]">
                    {cand.talent_pool || 'Engineering'}
                  </Badge>
                  <Badge className={`text-[10px] font-black border-none px-2 py-0.5 ${
                    score >= 85 ? 'bg-emerald-500/10 text-emerald-500' :
                    score >= 70 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {score}% AI Rating
                  </Badge>
                </div>

                <CardTitle className="text-base font-black truncate text-foreground">
                  {cand.first_name} {cand.last_name}
                </CardTitle>
                <CardDescription className="text-xs space-y-1 mt-1">
                  <div className="flex items-center gap-1 font-mono text-[11px] text-foreground">
                    <Mail className="h-3 w-3 text-muted-foreground" /> {cand.email}
                  </div>
                  {cand.phone && (
                    <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <Phone className="h-2.5 w-2.5" /> {cand.phone}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                {/* AI Recommendation Snippet */}
                <div className="p-3 rounded-xl bg-accent/30 border border-border text-[11px] text-muted-foreground leading-relaxed">
                  <div className="flex items-center gap-1 font-bold text-foreground text-[10px] uppercase mb-1">
                    <Brain className="h-3 w-3 text-primary" /> Evaluation Summary
                  </div>
                  <p className="line-clamp-2">
                    {cand.ai_recommendation || 'Solid developer background. Proven skills in web development, API pipelines, and architecture.'}
                  </p>
                </div>

                {/* Skills tags */}
                {skillsList.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Key Tech Competencies</div>
                    <div className="flex flex-wrap gap-1">
                      {skillsList.slice(0, 5).map((skill: string, sIdx: number) => (
                        <Badge key={sIdx} variant="secondary" className="text-[9px] font-semibold">
                          {skill.trim()}
                        </Badge>
                      ))}
                      {skillsList.length > 5 && (
                        <Badge variant="outline" className="text-[9px]">+{skillsList.length - 5} more</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-semibold capitalize">
                    Source: {cand.source || 'Career Portal'}
                  </span>
                  <Button
                    size="xs"
                    onClick={() => openInviteModal(cand)}
                    className="bg-primary hover:bg-primary/95 text-white font-bold text-xs h-7 px-3 flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" /> Invite to Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredCandidates.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-border/50 rounded-2xl bg-card">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold">No candidates found in this talent pool</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your domain filter or skill criteria, or register new candidates in the directory.
            </p>
          </div>
        )}
      </div>

      {/* Invite to Requisition Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Invite Candidate to Requisition
            </DialogTitle>
            <DialogDescription className="text-xs">
              Link {selectedCandidate?.first_name} {selectedCandidate?.last_name} directly to an active job opening.
            </DialogDescription>
          </DialogHeader>

          {selectedCandidate && (
            <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2">
              <div className="p-3 bg-accent/30 rounded-xl border border-border text-xs">
                <div className="font-bold text-foreground">
                  {selectedCandidate.first_name} {selectedCandidate.last_name} ({selectedCandidate.email})
                </div>
                <div className="text-muted-foreground text-[11px] mt-0.5">
                  Talent Domain: {selectedCandidate.talent_pool || 'Engineering'} • Match Score: {selectedCandidate.screening_score || 85}%
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Target Job Requisition *</label>
                <select
                  required
                  value={targetRequisitionId}
                  onChange={e => setTargetRequisitionId(e.target.value)}
                  className="w-full text-xs h-9 px-2 border rounded-md bg-background text-foreground border-input"
                >
                  {requisitions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.title} — {r.department} ({r.location})
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                  {inviting ? 'Linking...' : 'Confirm Job Invitation'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
