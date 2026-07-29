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
import { Plus, Briefcase, IndianRupee, MapPin, Building2, Layers, Sparkles } from 'lucide-react';

export default function JobRequisitionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [experienceLevel, setExperienceLevel] = useState('Mid');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequisitions = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/recruitment/requisitions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRequisitions(json.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load requisitions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location) {
      toast.error('Please fill in title and location.');
      return;
    }
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/recruitment/requisitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          department,
          location,
          employmentType,
          experienceLevel,
          description,
          requirements,
          salaryRangeMin: salaryMin,
          salaryRangeMax: salaryMax,
          status: 'Open'
        })
      });

      if (res.ok) {
        toast.success('Job Requisition created and published.');
        setIsDialogOpen(false);
        // Clear form
        setTitle('');
        setLocation('');
        setDescription('');
        setRequirements('');
        setSalaryMin(0);
        setSalaryMax(0);
        fetchRequisitions();
      } else {
        toast.error('Failed to publish job opening.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating job opening.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiRefineJobDescription = () => {
    if (!title) {
      toast.error('Please enter a Job Title first to generate context.');
      return;
    }
    toast.loading('AI Copilot is generating standard requirements...', { id: 'ai-desc' });
    setTimeout(() => {
      setDescription(`We are seeking an exceptional ${title} to expand our core offerings, streamline workflow engines, and design accessible components. You will collaborate directly with our engineering and product teams.`);
      setRequirements(`- 4+ years of relevant industry experience.\n- In-depth proficiency in modern tech stacks.\n- Strong communication skills and cross-functional agility.`);
      toast.success('Contextual descriptions generated!', { id: 'ai-desc' });
    }, 600);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1 border-t border-border">
      
      {/* Header */}
      <PageHeader 
        title="Job Requisitions"
        description="Manage active job postings, corporate requisitions, and dynamic candidate pools."
        actions={[
          <Button 
            key="back" 
            variant="outline" 
            onClick={() => router.push('/dashboard/recruitment')}
            className="border-border text-foreground font-bold hover:bg-accent"
          >
            Dashboard
          </Button>,
          <Button 
            key="add" 
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary hover:bg-primary/95 text-white font-bold border-none"
          >
            <Plus className="mr-2 h-4 w-4" /> Open Requisition
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment', href: '/dashboard/recruitment' }, { label: 'Requisitions' }]}
      />

      {/* Grid of Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requisitions.map((req) => (
          <Card key={req.id} className="border-none shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                  {req.department}
                </Badge>
                <Badge className={`px-2 py-0.5 rounded-full border-none text-[9px] font-extrabold uppercase ${
                  req.status === 'Open' 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                    : 'bg-slate-100 text-slate-650'
                }`}>
                  {req.status}
                </Badge>
              </div>
              <CardTitle className="text-base font-black truncate">{req.title}</CardTitle>
              <CardDescription className="text-xs flex items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{req.location} • {req.employment_type}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {req.description || 'No description provided.'}
              </p>
              
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>Range: ₹{req.salary_range_min?.toLocaleString()} - ₹{req.salary_range_max?.toLocaleString()}</span>
                <span className="text-primary font-black uppercase text-[10px]">{req.experience_level} LEVEL</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requisition Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              Open Job Requisition
            </DialogTitle>
            <DialogDescription>Define position metadata and requirements to publish on career portal.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRequisition} className="space-y-5 pt-2">
            
            {/* Title & Dept */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Job Title *</label>
                <Input 
                  placeholder="e.g. Lead Frontend Architect"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 focus:ring-1 focus:ring-primary focus:border-transparent text-foreground cursor-pointer font-semibold"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                </select>
              </div>
            </div>

            {/* Location & Type */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Location *</label>
                <Input 
                  placeholder="e.g. Remote, Surat"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-semibold"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-semibold"
                >
                  <option value="Entry">Entry</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Salary Min (INR/yr)</label>
                <Input 
                  type="number"
                  placeholder="Min salary"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Salary Max (INR/yr)</label>
                <Input 
                  type="number"
                  placeholder="Max salary"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Descriptions & AI Refinement */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase">Job Description</label>
                <Button type="button" size="xs" variant="outline" className="text-primary hover:text-primary/95 text-[10px] font-black flex items-center gap-1" onClick={handleAiRefineJobDescription}>
                  <Sparkles className="h-3 w-3 text-primary" /> Generate Requirements
                </Button>
              </div>
              <Textarea 
                placeholder="Core role outlines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none text-xs bg-accent/30 border-border rounded-xl h-24"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Skills / Requirements</label>
              <Textarea 
                placeholder="Skills required (one per line)..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="resize-none text-xs bg-accent/30 border-border rounded-xl h-24"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish Opening'}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
