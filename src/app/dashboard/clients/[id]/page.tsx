'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Building2, MapPin, Edit, FolderKanban, MessageSquare, IndianRupee, PieChart, TrendingUp, UploadCloud, FileText, Lock } from 'lucide-react';
import { DetailedPageSkeleton } from '@/components/ui/dashboard-skeleton';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { ClientCommunicationPanel } from '@/components/clients/client-communication-panel';
import Link from 'next/link';
import { getDashboardType, type UserRole } from '@/lib/permissions';

interface Client {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string | null;
  address: string | null;
  industry: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, [clientId]);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const authRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (authRes.ok) {
        const authData = await authRes.json();
        if (getDashboardType(authData.user.role as UserRole) !== 'admin') {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/dashboard');
        return;
      }

      const [clientRes, projectsRes, financeRes] = await Promise.all([
        fetch(`/api/clients?id=${clientId}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/projects?clientId=${clientId}&limit=100`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/clients/${clientId}/finance`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      } else if (clientRes.status === 401) {
        router.push('/login');
        return;
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      } else if (projectsRes.status === 401) {
        router.push('/login');
        return;
      }

      if (financeRes.ok) {
        const financeData = await financeRes.json();
        setFinance(financeData);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DetailedPageSkeleton />;
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold">Client not found</h3>
        <Button onClick={() => router.push('/dashboard/clients')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1 max-w-[1600px] mx-auto text-foreground">
      {/* Top Navigation & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 text-white shadow-xl border border-primary/20">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push('/dashboard/clients')}
              className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-9 w-9 border-white/15 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-soft">Enterprise Client</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
                {client.companyName}
              </h2>
              <p className="text-sm text-primary-soft mt-1.5 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-primary-soft" />
                <span>{client.contactPerson} • Primary Stakeholder</span>
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowEditDialog(true)}
            className="bg-primary hover:bg-primary/95 text-white font-bold flex items-center gap-2 rounded-lg py-2 px-4 shadow-sm border-none self-end sm:self-center"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Onboarding Journey Stepper (High-Fidelity) */}
      <Card className="bg-card/40 backdrop-blur-md border-slate-150 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full"></span>
              Onboarding Journey
            </CardTitle>
            <span className="text-xs text-primary font-bold">50% Completed</span>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1: Complete */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-emerald-500/20">
                ✓
              </div>
              <div>
                <p className="font-bold text-slate-950 dark:text-slate-50 text-sm">1. Legal Contract</p>
                <p className="text-xs text-muted-foreground mt-0.5">MSA & NDA executed.</p>
              </div>
            </div>

            {/* Step 2: Active */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-lg shadow-primary/20 animate-pulse">
                2
              </div>
              <div className="flex-1">
                <p className="font-bold text-primary text-sm">2. Workspace Provisioning</p>
                <p className="text-xs text-muted-foreground mt-0.5">CRM database environment setup...</p>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-2">
                  <div className="bg-primary h-1 rounded-full w-[45%]"></div>
                </div>
              </div>
            </div>

            {/* Step 3: Pending */}
            <div className="flex items-start gap-4 opacity-50">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">3. Knowledge Transfer</p>
                <p className="text-xs text-muted-foreground mt-0.5">Import catalogs, teams and scopes.</p>
              </div>
            </div>

            {/* Step 4: Pending */}
            <div className="flex items-start gap-4 opacity-50">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                4
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">4. Global Launch</p>
                <p className="text-xs text-muted-foreground mt-0.5">Operations sign-off & kick-off.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Bento Metrics & Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Client Health & Status Scorecard */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-primary/[0.03] to-slate-500/[0.03] border-slate-150 dark:border-slate-800 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold">Strategic Account Health</CardTitle>
              <Badge className="bg-emerald-50 text-emerald-700 border-none dark:bg-emerald-950/40 dark:text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Excellent Cadence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-card/50 border border-slate-100 dark:border-slate-900 rounded-xl p-4 flex flex-col justify-between h-32">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health Rating</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">92%</span>
                <span className="text-xs font-bold text-emerald-500">Optimal</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full">
                <div className="bg-emerald-500 h-1.5 rounded-full w-[92%]"></div>
              </div>
            </div>

            <div className="bg-card/50 border border-slate-100 dark:border-slate-900 rounded-xl p-4 flex flex-col justify-between h-32">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Velocity</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{projects.length}</span>
                <span className="text-xs font-bold text-primary">Active Pipelines</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {projects.filter(p => p.status === 'in_progress').length} in progress, {projects.filter(p => p.status === 'completed').length} completed
              </p>
            </div>

            <div className="bg-card/50 border border-slate-100 dark:border-slate-900 rounded-xl p-4 flex flex-col justify-between h-32">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Support Sentiment</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">A+</span>
                <span className="text-xs font-bold text-primary">Daily Syncs</span>
              </div>
              <p className="text-[11px] text-muted-foreground italic truncate">
                No unresolved escalations in logs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enterprise Contact & Directory details */}
        <Card className="bg-card/40 border-slate-150 dark:border-slate-800 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Contact Directory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Corporate Email</p>
                <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{client.email}</p>
              </div>
            </div>
            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Phone className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Direct Hotline</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{client.phone}</p>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-500/10 rounded-lg mt-0.5">
                  <MapPin className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Headquarters</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">{client.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Velocity Hub */}
      {finance && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-500/[0.04] via-emerald-500/[0.01] to-transparent border-emerald-500/20 shadow-xs rounded-xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Account Lifetime Value</p>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">₹{finance.lifetimeValue?.toLocaleString() || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Generated ledger contracts</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/[0.04] via-amber-500/[0.01] to-transparent border-amber-500/20 shadow-xs rounded-xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Outstanding Balance</p>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">₹{finance.outstandingBalance?.toLocaleString() || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Standard credit terms</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10">
                <PieChart className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500/[0.04] via-rose-500/[0.01] to-transparent border-rose-500/20 shadow-xs rounded-xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Overdue Remittances</p>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">₹{finance.overdueBalance?.toLocaleString() || 0}</h3>
                <p className="text-xs text-muted-foreground mt-1">Alert level: action required</p>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-500/10">
                <IndianRupee className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs Workspace */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="flex flex-wrap justify-start h-auto gap-1 bg-transparent border-b border-slate-200 dark:border-slate-800 rounded-none p-0 mb-6">
          <TabsTrigger 
            value="projects" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary shadow-none px-5 py-3 font-semibold text-sm transition-all"
          >
            <FolderKanban className="h-4 w-4 mr-2" />
            Active Pipelines
          </TabsTrigger>
          <TabsTrigger 
            value="communication" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary shadow-none px-5 py-3 font-semibold text-sm transition-all"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Communication Logs
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary shadow-none px-5 py-3 font-semibold text-sm transition-all"
          >
            <FileText className="h-4 w-4 mr-2" />
            Internal Notes
          </TabsTrigger>
          <TabsTrigger 
            value="vault" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary shadow-none px-5 py-3 font-semibold text-sm transition-all ml-auto"
          >
            <Lock className="h-4 w-4 mr-2 animate-pulse" />
            Secure Vault
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card className="bg-card/40 border-slate-150 dark:border-slate-800 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle>Enterprise Project Registry</CardTitle>
              <CardDescription>Visualizing operations pipeline and status metrics for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/20 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground/60 animate-pulse" />
                  <h4 className="mt-4 text-base font-bold">No projects registered yet</h4>
                  <p className="text-xs text-muted-foreground mt-1">Add client projects from the global dashboard planner.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-slate-150 dark:border-slate-800 rounded-xl hover:border-primary/30 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors">
                            {project.name}
                          </p>
                          <Badge className="bg-slate-100 text-slate-600 text-[10px] font-bold py-0.2 px-2 border-none">
                            {project.priority} priority
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>Starts: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                          <span>•</span>
                          <span>Ends: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 sm:mt-0">
                        <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-1.5 rounded-full ${
                              project.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: project.status === 'completed' ? '100%' : '45%' }}
                          />
                        </div>
                        <Badge
                          className={`shadow-xs px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border-none ${
                            project.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : project.status === 'in_progress'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication History Tab */}
        <TabsContent value="communication" className="space-y-6">
          <ClientCommunicationPanel clientId={parseInt(clientId)} />
        </TabsContent>

        {/* Internal Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card className="bg-card/40 border-slate-150 dark:border-slate-800 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle>Account Manager Notes</CardTitle>
              <CardDescription>Internal strategic notes and organizational preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {client.notes ? (
                <div className="p-5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-xl">
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{client.notes}</p>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50/20 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-sm text-muted-foreground italic">No internal logs or notes added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secure Document Vault Tab (High-Fidelity Contract Registry) */}
        <TabsContent value="vault" className="space-y-6">
          <Card className="border-emerald-500/20 bg-gradient-to-b from-card to-emerald-500/[0.01] shadow-md rounded-xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Secure Document Vault
                  </CardTitle>
                  <CardDescription>Private repository for legal MSAs, commercial SOWs, and NDAs.</CardDescription>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 rounded-lg py-2 px-3">
                  <UploadCloud className="h-4 w-4" />
                  Secure Upload
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* High Fidelity Table from agency_client_onboarding_contract_lifecycle */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400 bg-slate-50/40 dark:bg-slate-950/40">
                      <th className="py-3 px-4">Document Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-800 dark:text-slate-200">
                    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="py-4 px-4 flex items-center gap-2.5 font-bold">
                        <FileText className="h-5 w-5 text-rose-500 shrink-0" />
                        <span>MSA_v2.4_{client.companyName.replace(/\s+/g, '')}.pdf</span>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">Master Agreement</td>
                      <td className="py-4 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold border-none px-2 rounded-full uppercase tracking-wider">
                          Active
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">Dec 2026</td>
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary">
                          <UploadCloud className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                    
                    <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="py-4 px-4 flex items-center gap-2.5 font-bold">
                        <FileText className="h-5 w-5 text-rose-500 shrink-0" />
                        <span>SOW_Scope_Design_Phase1.pdf</span>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">Statement of Work</td>
                      <td className="py-4 px-4">
                        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-bold border-none px-2 rounded-full uppercase tracking-wider">
                          Review
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">Jul 2026</td>
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary">
                          <UploadCloud className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="py-4 px-4 flex items-center gap-2.5 font-bold">
                        <FileText className="h-5 w-5 text-rose-500 shrink-0" />
                        <span>NDA_Executed_Bilateral.pdf</span>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">Non Disclosure</td>
                      <td className="py-4 px-4">
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold border-none px-2 rounded-full uppercase tracking-wider">
                          Active
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">Indefinite</td>
                      <td className="py-4 px-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-primary">
                          <UploadCloud className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={fetchClientData}
        client={client}
      />
    </div>
  );
}