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
  GraduationCap, 
  Building2, 
  Calendar, 
  Users, 
  Plus, 
  CheckCircle2, 
  MapPin, 
  Search, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  School, 
  Award,
  ExternalLink,
  Loader2,
  Briefcase
} from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

export default function CampusHiringPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'drives' | 'students'>('drives');
  const [searchQuery, setSearchQuery] = useState('');

  // Register Student Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('SVNIT Surat');
  const [degree, setDegree] = useState('B.Tech Computer Engineering (2026)');
  const [targetJobId, setTargetJobId] = useState('');
  const [skills, setSkills] = useState('React, JavaScript, Python, DSA');

  // New Drive Modal
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [customDrives, setCustomDrives] = useState<any[]>([
    {
      id: 'drive-1',
      college: 'SVNIT (Sardar Vallabhbhai National Institute of Technology)',
      location: 'Surat, Gujarat',
      date: '2026-11-15',
      targetRoles: 'Software Developer Intern, QA Intern',
      status: 'Upcoming',
      registeredCount: 84,
      shortlistedCount: 16
    },
    {
      id: 'drive-2',
      college: 'DA-IICT (Dhirubhai Ambani Institute of ICT)',
      location: 'Gandhinagar, Gujarat',
      date: '2026-11-28',
      targetRoles: 'Junior Full Stack Engineer',
      status: 'Upcoming',
      registeredCount: 65,
      shortlistedCount: 12
    },
    {
      id: 'drive-3',
      college: 'Nirma University - Institute of Technology',
      location: 'Ahmedabad, Gujarat',
      date: '2026-10-18',
      targetRoles: 'Frontend Developer Intern',
      status: 'Completed',
      registeredCount: 110,
      shortlistedCount: 22
    }
  ]);
  const [newCollege, setNewCollege] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newRoles, setNewRoles] = useState('');

  const fetchCampusData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      const [candRes, reqRes, appRes] = await Promise.all([
        fetch('/api/recruitment/candidates', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/recruitment/requisitions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/recruitment/applications', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (candRes.ok && reqRes.ok && appRes.ok) {
        const candsJson = await candRes.json();
        const reqsJson = await reqRes.json();
        const appsJson = await appRes.json();

        setCandidates(candsJson.data || []);
        setRequisitions(reqsJson.data || []);
        setApplications(appsJson.data || []);

        if (reqsJson.data?.length > 0 && !targetJobId) {
          setTargetJobId(reqsJson.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load campus hiring records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampusData();
  }, []);

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast.error('First name, last name, and email are required.');
      return;
    }

    try {
      setRegistering(true);
      const token = getStoredSessionToken();

      // 1. Create candidate with source='Campus'
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
          talentPool: 'Engineering',
          source: 'Campus',
          resumeUrl: 'https://example.com/resumes/campus_student.pdf',
          skills: skills ? skills.split(',').map(s => s.trim()) : [],
          screeningScore: 88,
          status: 'Applied'
        })
      });

      if (!candRes.ok) {
        const err = await candRes.json().catch(() => null);
        throw new Error(err?.message || 'Failed to register campus candidate.');
      }

      const candData = await candRes.json();
      const candidateId = candData.data?.id;

      // 2. Link to target job requisition
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
            resumeSummary: `Campus hire from ${collegeName}. Degree: ${degree}`,
            matchScore: 88,
            notes: `Registered from Campus Placement drive at ${collegeName} on ${new Date().toLocaleDateString()}`
          })
        });
      }

      toast.success(`Student ${firstName} ${lastName} enrolled from ${collegeName}!`);
      setRegisterModalOpen(false);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      fetchCampusData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error registering student.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCreateDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollege || !newDate) {
      toast.error('College name and date are required.');
      return;
    }

    const driveObj = {
      id: `drive-${Date.now()}`,
      college: newCollege,
      location: newLocation || 'Gujarat, India',
      date: newDate,
      targetRoles: newRoles || 'Junior Software Engineer',
      status: 'Upcoming',
      registeredCount: 0,
      shortlistedCount: 0
    };

    setCustomDrives([driveObj, ...customDrives]);
    toast.success(`Campus drive for ${newCollege} created!`);
    setDriveModalOpen(false);
    setNewCollege('');
    setNewLocation('');
    setNewDate('');
    setNewRoles('');
  };

  const campusCandidates = candidates.filter(c => c.source === 'Campus');
  const filteredCandidates = (activeTab === 'students' ? (campusCandidates.length > 0 ? campusCandidates : candidates) : candidates).filter(cand => {
    const q = searchQuery.toLowerCase();
    const name = `${cand.first_name || ''} ${cand.last_name || ''}`.toLowerCase();
    return name.includes(q) || cand.email?.toLowerCase().includes(q) || cand.source?.toLowerCase().includes(q);
  });

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
        title="Campus Hiring & University Drives"
        description="Coordinate university placement drives, manage college candidate pipelines, and administer early-career talent programs."
        actions={[
          <div key="view-toggle" className="flex items-center rounded-lg border border-border bg-card p-0.5">
            <Button
              size="sm"
              variant={activeTab === 'drives' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('drives')}
              className={`text-xs font-bold h-8 flex items-center gap-1.5 ${activeTab === 'drives' ? 'bg-primary text-white' : 'text-foreground hover:bg-accent'}`}
            >
              <School className="h-3.5 w-3.5" /> University Drives ({customDrives.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'students' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('students')}
              className={`text-xs font-bold h-8 flex items-center gap-1.5 ${activeTab === 'students' ? 'bg-primary text-white' : 'text-foreground hover:bg-accent'}`}
            >
              <GraduationCap className="h-3.5 w-3.5" /> Campus Applicants ({campusCandidates.length})
            </Button>
          </div>,
          <Button 
            key="register" 
            onClick={() => setRegisterModalOpen(true)}
            className="bg-primary hover:bg-primary/95 text-white font-bold border-none text-xs h-9 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Register Campus Student
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment', href: '/dashboard/recruitment' }, { label: 'Campus Hiring' }]}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Campus Drives Organized</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{customDrives.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <School className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Campus Applicants Enrolled</p>
              <p className="text-2xl font-black text-emerald-500 mt-0.5">
                {campusCandidates.length > 0 ? campusCandidates.length : candidates.length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Total Students Evaluated</p>
              <p className="text-2xl font-black text-blue-500 mt-0.5">
                {customDrives.reduce((a, b) => a + (b.registeredCount || 0), 0) + campusCandidates.length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-bold">Junior Roles Available</p>
              <p className="text-2xl font-black text-purple-500 mt-0.5">{requisitions.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Award className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* University Drives View */}
      {activeTab === 'drives' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-foreground">Active Campus Placement Drives</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDriveModalOpen(true)}
              className="text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Campus Drive
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customDrives.map((drive) => (
              <Card key={drive.id} className="border border-border/60 bg-card hover:border-primary/50 transition-all flex flex-col justify-between shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-primary border-primary/30 font-bold text-[10px]">
                      Campus Drive
                    </Badge>
                    <Badge className={`text-[9px] font-extrabold uppercase border-none ${
                      drive.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {drive.status}
                    </Badge>
                  </div>

                  <CardTitle className="text-base font-black text-foreground">
                    {drive.college}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {drive.location}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="p-3 bg-accent/30 rounded-xl space-y-2 border border-border text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Drive Date:</span>
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {drive.date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Target Openings:</span>
                      <span className="font-semibold text-foreground truncate max-w-[180px]">{drive.targetRoles}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-muted/40 border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Registered</div>
                      <div className="text-base font-black text-foreground mt-0.5">{drive.registeredCount}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-500">
                      <div className="text-[10px] uppercase font-bold">Shortlisted</div>
                      <div className="text-base font-black mt-0.5">{drive.shortlistedCount}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Drive ID: #{drive.id}</span>
                    <Button
                      size="xs"
                      onClick={() => {
                        setCollegeName(drive.college);
                        setRegisterModalOpen(true);
                      }}
                      className="bg-primary hover:bg-primary/95 text-white font-bold text-xs h-7 px-3 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Enroll Student
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Campus Students Table */}
      {activeTab === 'students' && (
        <Card className="border border-border/60 bg-card shadow-xs">
          <CardHeader className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <CardTitle className="text-base font-bold">Campus Applicants Directory</CardTitle>
              <CardDescription className="text-xs">
                Students registered via college placement partnerships and campus drives.
              </CardDescription>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 bg-background"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold bg-muted/40">
                  <th className="p-3">#</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Source Channel</th>
                  <th className="p-3">Screening Score</th>
                  <th className="p-3">Hiring Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((cand, idx) => (
                  <tr key={cand.id} className="border-b hover:bg-accent/30 border-border">
                    <td className="p-3 text-muted-foreground font-semibold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-foreground">{cand.first_name} {cand.last_name}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                        {Array.isArray(cand.skills) ? cand.skills.join(', ') : cand.skills || 'DSA, Web Tech'}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-foreground">
                      <div>{cand.email}</div>
                      {cand.phone && <div className="text-[10px] text-muted-foreground">{cand.phone}</div>}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="font-bold text-[10px] border-primary/30 text-primary">
                        {cand.source || 'Campus'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[10px]">
                        {cand.screening_score || 85}% Score
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-extrabold uppercase">
                        {cand.status || 'Applied'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => router.push('/dashboard/recruitment/candidates')}
                        className="text-[10px] font-bold text-foreground hover:bg-accent"
                      >
                        Pipeline <ArrowRight className="h-2.5 w-2.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Register Campus Student Modal */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Register Campus Student
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enroll a university student into the campus hiring pipeline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterStudent} className="space-y-3 pt-2">
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
                <label className="text-xs font-bold text-muted-foreground uppercase">Student Email *</label>
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="text-xs h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">College / University</label>
              <Input value={collegeName} onChange={e => setCollegeName(e.target.value)} className="text-xs h-9" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Degree & Graduation Year</label>
              <Input value={degree} onChange={e => setDegree(e.target.value)} className="text-xs h-9" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Target Requisition</label>
              <select
                value={targetJobId}
                onChange={e => setTargetJobId(e.target.value)}
                className="w-full text-xs h-9 px-2 border rounded-md bg-background text-foreground border-input"
              >
                {requisitions.map(r => (
                  <option key={r.id} value={r.id}>{r.title} ({r.department})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Skills / Tech Stack</label>
              <Input value={skills} onChange={e => setSkills(e.target.value)} className="text-xs h-9" />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={registering} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                {registering ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <GraduationCap className="h-4 w-4 mr-1.5" />}
                {registering ? 'Enrolling...' : 'Enroll Campus Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Drive Modal */}
      <Dialog open={driveModalOpen} onOpenChange={setDriveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <School className="h-5 w-5 text-primary" /> Create University Drive
            </DialogTitle>
            <DialogDescription className="text-xs">
              Plan and schedule an on-campus placement partnership drive.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDrive} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">University / College *</label>
              <Input required placeholder="e.g. IIT Bombay, BITS Pilani" value={newCollege} onChange={e => setNewCollege(e.target.value)} className="text-xs h-9" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Campus Location</label>
              <Input placeholder="e.g. Mumbai, Maharashtra" value={newLocation} onChange={e => setNewLocation(e.target.value)} className="text-xs h-9" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Drive Date *</label>
              <Input required type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="text-xs h-9" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Target Positions</label>
              <Input placeholder="e.g. Graduate Trainee Engineer, Intern" value={newRoles} onChange={e => setNewRoles(e.target.value)} className="text-xs h-9" />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDriveModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                Save Campus Drive
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
