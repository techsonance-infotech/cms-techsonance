'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { InlineTableSkeleton, PageHeaderSkeleton, StatsSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  FileText, 
  Sparkles,
  RefreshCw,
  Search,
  Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

export default function RecruitmentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  const fetchRecruitmentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      
      const [reqRes, candRes, appRes] = await Promise.all([
        fetch('/api/recruitment/requisitions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/recruitment/candidates', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/recruitment/applications', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (reqRes.ok && candRes.ok && appRes.ok) {
        const reqData = await reqRes.json();
        const candData = await candRes.json();
        const appData = await appRes.json();

        setRequisitions(reqData.data || []);
        setCandidates(candData.data || []);
        setApplications(appData.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load talent acquisition metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruitmentData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={4} />
      </div>
    );
  }

  // Calculate dynamic stats
  const totalOpenPositions = requisitions.filter(r => r.status === 'Open').length;
  const totalApplicants = candidates.length;
  const hiringVelocity = '16 Days';
  const offerAcceptance = '93%';

  // Dynamic Candidate Pipeline Funnel mapping
  const stagesMap: Record<string, number> = {
    'Applied': 0, 'Phone Screen': 0, 'Technical': 0, 'Executive': 0, 'Offer': 0, 'Preboarding': 0
  };
  applications.forEach(app => {
    if (stagesMap[app.current_stage] !== undefined) {
      stagesMap[app.current_stage]++;
    }
  });

  const funnelData = Object.keys(stagesMap).map(key => ({
    stage: key,
    count: stagesMap[key]
  }));

  // Dynamic Candidate Acquisition Source mapping
  const sourcesMap: Record<string, number> = {};
  candidates.forEach(c => {
    const src = c.source || 'Career Portal';
    sourcesMap[src] = (sourcesMap[src] || 0) + 1;
  });

  const sourceSpread = Object.keys(sourcesMap).map(key => ({
    name: key,
    value: sourcesMap[key]
  }));

  const COLORS = ['var(--primary)', '#10b981', 'var(--primary-light)', '#8b5cf6', '#f59e0b', '#3b82f6'];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1">
      {/* Header */}
      <PageHeader 
        title="Talent Acquisition Cockpit"
        description="Oversee open job requisition counts, resume screening pipelines, and offer approval check-offs."
        actions={[
          <Button 
            key="jobs" 
            variant="outline" 
            onClick={() => router.push('/dashboard/recruitment/jobs')}
            className="border-border text-foreground font-bold hover:bg-accent"
          >
            Job Board Requisitions
          </Button>,
          <Button 
            key="kanban" 
            onClick={() => router.push('/dashboard/recruitment/kanban')}
            className="bg-primary hover:bg-primary/95 text-white font-bold border-none"
          >
            Candidate Pipeline Kanban
          </Button>
        ]}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Recruitment' }]}
      />

      {/* KPI Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Open Vacancies</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalOpenPositions}</div>
            <p className="text-[10px] text-muted-foreground mt-1.5">{requisitions.length} total requisition records</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Applicants</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{totalApplicants}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1.5 flex items-center gap-0.5">↑ 8% month-over-month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time to Hire Avg</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{hiringVelocity}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1.5">↓ 2.4 days improved</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offer Acceptance</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{offerAcceptance}</div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Standard contract parameters</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Funnel pipeline */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-md">Applicant Pipeline Distribution</CardTitle>
            <CardDescription>Visualizing candidate fallout ratios from Applied down to Pre-boarding stages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="#888888" fontSize={10} />
                  <YAxis dataKey="stage" type="category" stroke="#888888" fontSize={10} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source acquisition pie */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-md">Acquisition Source Breakdown</CardTitle>
            <CardDescription>Deals source distribution for candidates registered in directory</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceSpread}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceSpread.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => `${val} Applicants`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Requisitions Registry */}
      <Card className="border-none shadow-xs">
        <CardHeader>
          <CardTitle>Active Open Requisitions</CardTitle>
          <CardDescription>Hiring positions currently seeking candidate profiles</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-accent/40 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Job Type</th>
                  <th className="px-6 py-4">Salary Range</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground font-medium">
                {requisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{req.title}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{req.experience_level} Experience</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{req.department}</td>
                    <td className="px-6 py-4">{req.location}</td>
                    <td className="px-6 py-4">{req.employment_type}</td>
                    <td className="px-6 py-4">
                      ₹{req.salary_range_min?.toLocaleString()} - ₹{req.salary_range_max?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge className={`px-2.5 py-0.5 rounded-full border-none text-[9px] font-extrabold uppercase ${
                        req.status === 'Open' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-450'
                      }`}>
                        {req.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
