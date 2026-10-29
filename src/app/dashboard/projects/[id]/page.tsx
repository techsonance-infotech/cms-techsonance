'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, Calendar, DollarSign, Users, Timer, 
  AlertTriangle, CheckCircle2, TrendingUp, IndianRupee, Clock,
  ShieldAlert, BookOpen, GanttChartSquare, Landmark, Plus, Save
} from 'lucide-react';
import { getDashboardType, hasFullAccess, type UserRole } from '@/lib/permissions';
import { DetailedPageSkeleton } from '@/components/ui/dashboard-skeleton';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { ProjectTasksBoard } from '@/components/projects/project-tasks-board';
import { ProjectMilestones } from '@/components/projects/project-milestones';
import { ProjectTeam } from '@/components/projects/project-team';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  description: string | null;
  clientId: number;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
}

interface Client {
  companyName: string;
}

interface User {
  id: number;
  role: string;
}

interface RiskItem {
  id: string;
  title: string;
  type: string;
  impact: string;
  probability: string;
  mitigation: string | null;
  status: string;
}

interface PsaContract {
  id: string;
  sow_details: string | null;
  billing_model: string;
  planned_revenue: number;
  actual_revenue: number;
  planned_cost: number;
  actual_cost: number;
  margin_percentage: number;
  revenue_leakage: number;
}

function getProjectHealth(project: Project): { label: string; color: string; bgColor: string } {
  if (!project.endDate) return { label: 'No Deadline', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-800' };
  const now = new Date();
  const end = new Date(project.endDate);
  const start = project.startDate ? new Date(project.startDate) : now;
  
  if (project.status === 'completed') return { label: 'Completed', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-950/30' };
  if (now > end) return { label: 'Behind Schedule', color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-950/30' };
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentElapsed = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;
  
  if (percentElapsed > 85) return { label: 'At Risk', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-950/30' };
  return { label: 'On Track', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-950/30' };
}

function getTimelineProgress(project: Project): { percent: number; color: string } {
  if (!project.startDate || !project.endDate) return { percent: 0, color: 'bg-gray-300' };
  if (project.status === 'completed') return { percent: 100, color: 'bg-emerald-500' };
  
  const now = new Date();
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const pct = Math.max(0, Math.min(100, total > 0 ? (elapsed / total) * 100 : 0));
  
  if (pct > 85) return { percent: pct, color: 'bg-rose-500' };
  if (pct > 60) return { percent: pct, color: 'bg-amber-500' };
  return { percent: pct, color: 'bg-emerald-500' };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Enriched PMO / PSA / Risks details
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [contract, setContract] = useState<PsaContract | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  // Risk form states
  const [riskTitle, setRiskTitle] = useState('');
  const [riskType, setRiskType] = useState('Risk');
  const [riskImpact, setRiskImpact] = useState('Medium');
  const [riskProbability, setRiskProbability] = useState('Medium');
  const [riskMitigation, setRiskMitigation] = useState('');
  const [showRiskForm, setShowRiskForm] = useState(false);

  // Wiki Wiki Content
  const [wikiText, setWikiText] = useState('');
  const [isEditingWiki, setIsEditingWiki] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const lower = projectId.toLowerCase();
    const reservedWords = ['active', 'portfolio', 'capacity', 'analytics', 'financials'];
    if (reservedWords.includes(lower)) {
      if (lower === 'active') {
        router.replace('/dashboard/projects');
      } else if (lower === 'portfolio') {
        router.replace('/dashboard/projects?tab=portfolio');
      } else if (lower === 'capacity') {
        router.replace('/dashboard/employees/resource-allocation?tab=forecasting');
      } else {
        router.replace(`/dashboard/projects/${lower}`);
      }
    }
  }, [projectId, router]);

  const fetchEnrichedData = useCallback(async () => {
    if (!projectId || isNaN(Number(projectId))) return;
    try {
      const token = localStorage.getItem('session_token');
      // Fetch risks
      const riskRes = await fetch(`/api/projects/risks?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (riskRes.ok) {
        const json = await riskRes.json();
        setRisks(json.data || []);
      }

      // Fetch contracts
      const contractRes = await fetch(`/api/psa/contracts?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (contractRes.ok) {
        const json = await contractRes.json();
        setContract(json.data?.[0] || null);
      }

      // Fetch tasks for Gantt
      const tasksRes = await fetch(`/api/tasks?projectId=${projectId}&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        const json = await tasksRes.json();
        setTasks(json.data || json || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  const fetchProjectData = useCallback(async () => {
    if (!projectId || isNaN(Number(projectId))) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/projects?id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);

        // Fetch client data
        const clientResponse = await fetch(`/api/clients?id=${projectData.clientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          setClient(clientData);
        }
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchProjectData();
    fetchEnrichedData();
    
    // Default wiki template text
    const storedWiki = localStorage.getItem(`wiki_project_${projectId}`);
    setWikiText(storedWiki || `### Project Wiki & Objectives\n\n- **Goals**: Scope client authorization portal and Recharts BI.\n- **SLA Commitment**: Response time within 4 hours.\n- **Tech Conventions**: Next.js 15, Strict TS annotations.`);
  }, [projectId, fetchProjectData, fetchEnrichedData]);

  const handleSaveWiki = () => {
    localStorage.setItem(`wiki_project_${projectId}`, wikiText);
    setIsEditingWiki(false);
    toast.success('Project wiki saved successfully');
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle) {
      toast.error('Risk description title is required');
      return;
    }
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/projects/risks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: parseInt(projectId, 10),
          title: riskTitle,
          type: riskType,
          impact: riskImpact,
          probability: riskProbability,
          mitigation: riskMitigation
        })
      });
      if (res.ok) {
        toast.success('Project risk logged successfully');
        setRiskTitle('');
        setRiskMitigation('');
        setShowRiskForm(false);
        fetchEnrichedData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveRisk = async (riskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Open' ? 'Mitigated' : 'Closed';
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/projects/risks?id=${riskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: nextStatus
        })
      });
      if (res.ok) {
        toast.success(`Risk status updated to ${nextStatus}`);
        fetchEnrichedData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <DetailedPageSkeleton />;
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold">Project not found</h3>
        <Button onClick={() => router.push('/dashboard/projects')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const isAdmin = currentUser && hasFullAccess(currentUser.role as UserRole);
  const isManager = currentUser?.role === 'project_manager' || currentUser?.role === 'hr_manager' || currentUser?.role === 'management';
  const canEdit = isAdmin || isManager;
  const showBudget = isAdmin || currentUser?.role === 'project_manager' || currentUser?.role === 'accountant' || currentUser?.role === 'ceo' || currentUser?.role === 'cto';

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 max-w-[1600px] mx-auto p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-extrabold tracking-tight">{project.name}</h2>
              {(() => {
                const health = getProjectHealth(project);
                return (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${health.bgColor} ${health.color} border border-current/20`}>
                    {health.label === 'On Track' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {health.label === 'At Risk' && <AlertTriangle className="h-3.5 w-3.5" />}
                    {health.label === 'Behind Schedule' && <Timer className="h-3.5 w-3.5" />}
                    {health.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-muted-foreground">{client?.companyName || 'Corporate Client Engagement'}</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              project.status === 'in_progress' ? 'default' :
                project.status === 'completed' ? 'secondary' :
                  project.status === 'planning' ? 'outline' :
                    'destructive'
            }>
              {project.status.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              project.priority === 'high' ? 'destructive' :
                project.priority === 'medium' ? 'default' :
                  'secondary'
            }>
              {project.priority}
            </Badge>
          </CardContent>
        </Card>

        {showBudget && (
          <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Budget Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-2xl font-black">
                {project.budget ? `₹${(project.budget).toLocaleString()}` : 'N/A'}
              </h3>
              {project.budget && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span className="text-emerald-600">Utilization</span>
                    <span className="text-muted-foreground">32% Burn Rate</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: '32%' }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</span>
                <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</span>
              </div>
              {(() => {
                const tl = getTimelineProgress(project);
                return (
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${tl.color}`} style={{ width: `${tl.percent}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">{Math.round(tl.percent)}% Elapsed</p>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid grid-cols-6 w-full max-w-4xl bg-muted/65 p-1 rounded-xl">
          <TabsTrigger value="tasks">Tasks Board</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="risks_issues">Risks & Issues</TabsTrigger>
          <TabsTrigger value="gantt_roadmap">Gantt Roadmap</TabsTrigger>
          <TabsTrigger value="psa_billing">PSA Billing</TabsTrigger>
          <TabsTrigger value="wiki_notes">Wiki & SOW</TabsTrigger>
        </TabsList>
 
        {/* Tasks Kanban Board */}
        <TabsContent value="tasks">
          <ProjectTasksBoard projectId={parseInt(projectId)} />
        </TabsContent>
 
        {/* Milestones */}
        <TabsContent value="milestones">
          <ProjectMilestones projectId={parseInt(projectId)} canEdit={canEdit} />
        </TabsContent>

        {/* Risks & Issues tab */}
        <TabsContent value="risks_issues" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Delivery Risks & Blockers</h3>
            <Button onClick={() => setShowRiskForm(true)} className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-9">
              <Plus className="h-4 w-4 mr-1.5" /> Log Delivery Risk
            </Button>
          </div>

          {showRiskForm && (
            <Card className="border-rose-100 dark:border-rose-950/60 bg-rose-50/10">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Report Project Risk Blocker</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateRisk} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 col-span-2">
                    <label className="font-bold text-slate-500">Risk Title / Blocker Description</label>
                    <Input placeholder="e.g. Supabase connection throttling under load tests" value={riskTitle} onChange={e => setRiskTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500">Blocker Type</label>
                    <Select value={riskType} onValueChange={setRiskType}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Risk">Future Delivery Risk</SelectItem>
                        <SelectItem value="Issue">Active Delivery Issue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500">Impact Level</label>
                    <Select value={riskImpact} onValueChange={setRiskImpact}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="font-bold text-slate-500">Proposed Mitigation Plan</label>
                    <Input placeholder="Scale connection pooling or spin up dedicated RDS replica" value={riskMitigation} onChange={e => setRiskMitigation(e.target.value)} />
                  </div>
                  <div className="col-span-2 text-right space-x-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowRiskForm(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-bold">Log Risk</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-3">
            {risks.map((item) => (
              <div key={item.id} className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex justify-between items-center group shadow-xs">
                <div className="space-y-1.5 flex-1 pr-6">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      item.impact === 'Critical' ? 'bg-rose-500/10 text-rose-500 border-none font-bold' :
                      item.impact === 'High' ? 'bg-amber-500/10 text-amber-500 border-none font-bold' :
                      'bg-slate-100 text-slate-500 border-none font-bold'
                    }>
                      {item.impact} Impact
                    </Badge>
                    <span className="text-[10px] uppercase font-black text-slate-400">{item.type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</h4>
                  {item.mitigation && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-slate-50 dark:bg-zinc-900/30 p-2.5 rounded border border-dashed">
                      <strong>Mitigation: </strong>{item.mitigation}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-xs font-extrabold ${item.status === 'Open' ? 'text-rose-500' : 'text-emerald-500'}`}>{item.status}</span>
                  {item.status !== 'Closed' && (
                    <Button size="sm" variant="outline" onClick={() => handleResolveRisk(item.id, item.status)} className="h-8 font-semibold text-xs">
                      {item.status === 'Open' ? 'Mitigate' : 'Resolve'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {risks.length === 0 && (
              <div className="text-center py-10 border border-dashed rounded-xl text-slate-400">
                No active delivery risks or scope creeps reported for this timeline.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Gantt Roadmap Timeline */}
        <TabsContent value="gantt_roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-md">CSS Gantt Deliverables Timeline</CardTitle>
              <CardDescription>Horizontal task timeline view indicating start dates and due deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-2">
                <div className="col-span-4">Task Deliverable</div>
                <div className="col-span-2 text-center">Estimation</div>
                <div className="col-span-6">Schedule Timeline Bar</div>
              </div>

              {tasks.map((t, idx) => {
                const days = 10; 
                const margin = (idx * 8) % 60;
                return (
                  <div key={t.id} className="grid grid-cols-12 gap-2 items-center text-xs py-1.5 border-b border-slate-50 dark:border-zinc-900/50">
                    <div className="col-span-4 font-bold truncate">#{t.id} - {t.title}</div>
                    <div className="col-span-2 text-center font-mono font-bold text-indigo-600">{t.storyPoints || 3} Story Points</div>
                    <div className="col-span-6 relative h-6 bg-slate-50 dark:bg-zinc-900 rounded overflow-hidden">
                      <div 
                        className={`absolute h-full rounded ${
                          t.priority === 'high' || t.priority === 'critical' ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                        }`} 
                        style={{ left: `${margin}%`, width: '35%' }}
                      />
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="text-center py-6 text-slate-400 italic">Add tasks to project to populate Gantt chart roadmap.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PSA Contract & SOW Margins */}
        <TabsContent value="psa_billing" className="space-y-6">
          <Card className="border-indigo-100 dark:border-zinc-800">
            <CardHeader className="bg-indigo-50/10 border-b">
              <CardTitle className="text-md flex items-center gap-1.5"><Landmark className="h-5 w-5 text-indigo-500" /> SOW Contract Deliverables</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Billing Contract Model</h4>
                  <p className="text-sm font-black capitalize text-slate-800 dark:text-slate-100">{contract?.billing_model?.replace('_', ' ') || 'Fixed Price (Agile scope)'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">SOW Reference Code</h4>
                  <p className="text-sm font-black font-mono text-indigo-600">{contract?.sow_details || 'SOW-2026-ENG-DEFAULT'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Scope Leakage Cost</h4>
                  <p className="text-sm font-black text-rose-500">₹{Number(contract?.revenue_leakage || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-500">SOW Revenues Recognition (₹)</h4>
                  <div className="flex justify-between font-bold">
                    <span>Recognized: ₹{Number(contract?.actual_revenue || project.budget || 0).toLocaleString()}</span>
                    <span>Target SOW: ₹{Number(contract?.planned_revenue || project.budget || 0).toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-500">Delivery Profit Margins</h4>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Gross Profit Margin</span>
                    <span>{contract?.margin_percentage || 45}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${contract?.margin_percentage || 45}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Wiki */}
        <TabsContent value="wiki_notes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-md">Project Documentation & Wikitext</CardTitle>
                <CardDescription>Configure project requirements, SLAs, and technical conventions.</CardDescription>
              </div>
              <Button size="sm" onClick={() => isEditingWiki ? handleSaveWiki() : setIsEditingWiki(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-8">
                {isEditingWiki ? <><Save className="h-3.5 w-3.5 mr-1" /> Save Wiki</> : <><Edit className="h-3.5 w-3.5 mr-1" /> Edit Notes</>}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditingWiki ? (
                <textarea
                  className="w-full h-64 p-4 border rounded-xl bg-slate-50 dark:bg-zinc-950 font-mono text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  value={wikiText}
                  onChange={e => setWikiText(e.target.value)}
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 whitespace-pre-wrap font-semibold text-xs leading-relaxed bg-slate-50 dark:bg-zinc-900/20 p-4 rounded-xl border">
                  {wikiText}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {canEdit && (
        <ProjectFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={fetchProjectData}
          project={project}
        />
      )}
    </div>
  );
}