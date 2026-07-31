'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, Search, Building2, Mail, Phone, MapPin, 
  Edit, FolderKanban, MessageSquare, IndianRupee, 
  PieChart, TrendingUp, UploadCloud, FileText, Lock,
  RefreshCw, ArrowLeft, ArrowUpRight, ArrowDownRight,
  Globe, User, Briefcase, ShieldCheck, Target, CheckCircle2, Ticket, X, Calendar, Loader2
} from 'lucide-react';
import { InlineTableSkeleton, DetailedPageSkeleton } from '@/components/ui/dashboard-skeleton';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { ClientCommunicationPanel } from '@/components/clients/client-communication-panel';
import { useRouter } from 'next/navigation';
import { getDashboardType, type UserRole } from '@/lib/permissions';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getStoredSessionToken, getStoredUser } from '@/lib/client-session';
import { toast } from 'sonner';

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
  onboardingStep?: number;
  website?: string | null;
  businessType?: string | null;
  companySize?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  designation?: string | null;
  leadSource?: string | null;
  accountOwner?: string | null;
  interestedServices?: string | null;
  priority?: string | null;
  estimatedBudget?: string | null;
  expectedStartDate?: string | null;
  currency?: string | null;
  paymentTerms?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  logoUrl?: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  
  // Master-Detail selection states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'communication' | 'notes' | 'vault'>('overview');

  // Quick Actions modal states
  const [showOppModal, setShowOppModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // Quick Actions inputs
  const [oppAmount, setOppAmount] = useState('150000');
  const [oppDesc, setOppDesc] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDesc, setTaskDesc] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketPriority, setTicketPriority] = useState('Normal');
  const [ticketDesc, setTicketDesc] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('75000');
  const [quoteValidity, setQuoteValidity] = useState('15');
  
  // Google Calendar scheduling inputs
  const [meetingSubject, setMeetingSubject] = useState('');
  const [meetingDateStr, setMeetingDateStr] = useState('');
  const [meetingTimeStr, setMeetingTimeStr] = useState('10:00');
  const [meetingDurationStr, setMeetingDurationStr] = useState('30');
  const [meetingDescStr, setMeetingDescStr] = useState('');
  
  const [actionPending, setActionPending] = useState(false);

  const router = useRouter();
  const initializedRef = useRef(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch('/api/clients?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        const clientList = Array.isArray(result) ? result : (result.data ?? []);
        setClients(clientList);
        // Automatically select first client if none selected
        if (clientList.length > 0 && !selectedClient) {
          setSelectedClient(clientList[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClient]);

  const fetchClientDetails = async (clientId: number) => {
    setDetailsLoading(true);
    try {
      const token = localStorage.getItem('session_token');
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
        setSelectedClient(clientData);
        setNotesText(clientData.notes || '');
        // Pre-fill quick actions defaults
        setMeetingSubject(`Roundtable Alignment with ${clientData.companyName || clientData.contactPerson}`);
        setOppDesc(`Enterprise SOW opportunity for ${clientData.companyName || clientData.contactPerson}`);
        setTaskName(`Follow up with ${clientData.contactPerson} at ${clientData.companyName || 'Organization'}`);
        setTicketSubject(`Customer SLA Request: ${clientData.companyName || clientData.contactPerson}`);
      }
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData);
      }
      if (financeRes.ok) {
        const financeData = await financeRes.json();
        setFinance(financeData);
      }    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const onboardingSteps = [
    { step: 1, title: '1. Legal Contract', desc: 'MSA & NDA executed.' },
    { step: 2, title: '2. Provisioning', desc: 'CRM database environment setup.' },
    { step: 3, title: '3. KT Transfer', desc: 'Import catalogs & teams.' },
    { step: 4, title: '4. Global Launch', desc: 'Operations sign-off & kick-off.' }
  ];

  const handleUpdateOnboardingStep = async (step: number) => {
    if (!selectedClient) return;
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/clients?id=${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ onboardingStep: step })
      });
      if (response.ok) {
        await fetchClients();
        await fetchClientDetails(selectedClient.id);
      }
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    }
  };

  const handleDispatchAction = async (type: 'opportunity' | 'task' | 'ticket' | 'quotation') => {
    if (!selectedClient) return;
    setActionPending(true);
    const toastId = toast.loading(`Executing ${type} lifecycle action...`, { id: 'lifecycle-action' });
    try {
      const token = localStorage.getItem('session_token');
      const payload = {
        type,
        amount: type === 'opportunity' ? oppAmount : type === 'quotation' ? quoteAmount : undefined,
        name: type === 'task' ? taskName : type === 'ticket' ? ticketSubject : undefined,
        description: type === 'opportunity' ? oppDesc : type === 'task' ? taskDesc : type === 'ticket' ? ticketDesc : undefined,
        priority: type === 'task' ? taskPriority : type === 'ticket' ? ticketPriority : undefined,
        validityDays: type === 'quotation' ? quoteValidity : undefined
      };
      
      const res = await fetch(`/api/clients/${selectedClient.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || `Action ${type} succeeded!`, { id: 'lifecycle-action' });
        setShowOppModal(false);
        setShowTaskModal(false);
        setShowTicketModal(false);
        setShowQuoteModal(false);
        fetchClientDetails(selectedClient.id);
      } else {
        toast.error(data.message || `Action ${type} failed.`, { id: 'lifecycle-action' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Network failure executing action.', { id: 'lifecycle-action' });
    } finally {
      setActionPending(false);
    }
  };

  const handleClientMeetingSchedule = async () => {
    if (!selectedClient) return;
    if (!meetingDateStr || !meetingTimeStr) {
      toast.error('Please specify meeting date and time.');
      return;
    }
    setActionPending(true);
    const toastId = toast.loading('Scheduling Google Calendar roundtable...', { id: 'calendar-schedule' });
    try {
      const token = localStorage.getItem('session_token');
      const startDateTime = new Date(`${meetingDateStr}T${meetingTimeStr}:00`).toISOString();
      const res = await fetch('/api/crm/inbox/calendar-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          summary: meetingSubject,
          description: meetingDescStr,
          startDateTime,
          durationMinutes: Number(meetingDurationStr)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Roundtable scheduled.', { id: 'calendar-schedule' });
        setShowMeetingModal(false);
      } else {
        toast.error('Failed to schedule calendar roundtable.', { id: 'calendar-schedule' });
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error scheduling meeting.', { id: 'calendar-schedule' });
    } finally {
      setActionPending(false);
    }
  };

  const fetchClientDocuments = async (clientId: number) => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/clients/${clientId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching client documents:', error);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;

    // File validation
    const fileType = file.type;
    const fileSize = file.size;
    const fileName = file.name.toLowerCase();

    const isImage = fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'image/jpg' || 
                    fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png');
    const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');
    const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx');

    if (!isImage && !isPdf && !isDocx) {
      toast.error("Only PDF, DOCX, and images (JPG, JPEG, PNG) are accepted.");
      return;
    }

    if (isImage && fileSize > 1 * 1024 * 1024) {
      toast.error("Images cannot exceed 1MB in size.");
      return;
    }

    if ((isPdf || isDocx) && fileSize > 2 * 1024 * 1024) {
      toast.error("Documents cannot exceed 2MB in size.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);

    try {
      const token = localStorage.getItem('session_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'contract');
      formData.append('moduleName', 'clients');
      formData.append('entityType', 'contract');
      formData.append('entityId', String(selectedClient.id));
      formData.append('accessLevel', 'restricted');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        toast.success(`${file.name} uploaded to Secure Vault.`, { id: toastId });
        fetchClientDocuments(selectedClient.id);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to upload file.", { id: toastId });
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!selectedClient) return;
    const toastId = toast.loading(`Deleting ${fileName}...`);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success(`${fileName} deleted successfully.`, { id: toastId });
        fetchClientDocuments(selectedClient.id);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete file.", { id: toastId });
      }
    } catch (error) {
      console.error("File delete error:", error);
      toast.error("Failed to delete file.", { id: toastId });
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/clients?id=${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: notesText })
      });
      if (response.ok) {
        toast.success('Notes updated successfully');
        setIsEditingNotes(false);
        await fetchClients();
        await fetchClientDetails(selectedClient.id);
      } else {
        toast.error('Failed to update notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to update notes');
    }
  };

  useEffect(() => {
    if (selectedClient) {
      fetchClientDetails(selectedClient.id);
      fetchClientDocuments(selectedClient.id);
    }
  }, [selectedClient?.id]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const token = getStoredSessionToken();
    const user = getStoredUser();
    const role = user?.role as UserRole;
    
    if (!token || !role) {
      router.push('/login');
      return;
    }

    setAuthorized(true);
    fetchClients();
  }, [router, fetchClients]);

  if (!authorized) {
    return (
      <div className="space-y-6 p-1 max-w-[1600px] mx-auto text-foreground flex flex-col h-[calc(100vh-100px)] overflow-hidden animate-pulse">
        {/* Header Banner Skeleton */}
        <div className="shrink-0 rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 p-6 border border-slate-250 dark:border-slate-800 h-32 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-8 w-80 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
          </div>
          <div className="h-3 w-96 bg-slate-300 dark:bg-slate-700 rounded-lg mt-1"></div>
        </div>

        {/* Workspace Skeleton */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden mt-2 pb-2">
          {/* Left panel: Index list skeleton */}
          <div className="lg:col-span-1 border border-slate-150 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 w-36 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-850 h-9 rounded-xl"></div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-850 flex-1 overflow-y-auto p-4 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="pb-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
                  </div>
                  <div className="h-3 w-32 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                  <div className="flex justify-between mt-2">
                    <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                    <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Details view skeleton */}
          <div className="lg:col-span-2 border border-slate-150 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-2">
                <div className="h-6 w-64 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                <div className="h-3 w-40 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
              </div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
            </div>

            {/* Tabs selector placeholder */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              {[1, 2, 3, 4, 5].map(t => (
                <div key={t} className="h-8 w-28 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
              ))}
            </div>

            {/* Details details placeholder */}
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map(d => (
                <div key={d} className="space-y-2 border-b border-slate-50 dark:border-slate-850 pb-4">
                  <div className="h-3.5 w-32 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                  <div className="h-4.5 w-48 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredClients = clients.filter((client) => {
    const q = search.toLowerCase();
    return (
      client.companyName.toLowerCase().includes(q) ||
      client.contactPerson.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto text-foreground flex flex-col h-[calc(100vh-100px)] overflow-hidden">
      
      {/* Page Header */}
      <div className="shrink-0">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 text-white shadow-xl border border-primary/20">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-soft">Account Management Hub</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
                Client Directory
              </h2>
              <p className="text-sm text-primary-soft mt-1 max-w-xl">
                Maintain supplier contacts, draft legal consultation agreements, track SLA performance, and review ratings.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Button 
                variant="outline" 
                onClick={fetchClients}
                className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-9 border-white/15 shrink-0"
              >
                <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
              </Button>
              <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/95 text-white font-bold border-none shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main split dashboard workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden mt-2 pb-2">
        
        {/* Left column: Clients Index Directory */}
        <div className="lg:col-span-1 border border-border/80 rounded-2xl bg-card overflow-y-auto flex flex-col shadow-sm">
          <div className="p-4 border-b border-border/80 bg-accent/10 space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Client Index Directory</h3>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                className="pl-9 bg-card border-border text-xs rounded-xl h-9"
              />
            </div>
          </div>
          
          <div className="divide-y divide-border/60 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4"><InlineTableSkeleton rows={6} columns={1} /></div>
            ) : filteredClients.map((client) => (
              <div 
                key={client.id}
                onClick={() => {
                  setSelectedClient(client);
                  setIsEditingNotes(false);
                }}
                className={`p-4 transition-colors cursor-pointer text-xs ${
                  selectedClient?.id === client.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-accent/25'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="font-bold text-foreground text-sm line-clamp-1">{client.companyName}</span>
                  <StatusBadge status={client.status} />
                </div>
                <p className="text-muted-foreground leading-relaxed truncate">{client.email}</p>
                <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground font-semibold uppercase">
                  <span>{client.contactPerson}</span>
                  <span>{client.industry || 'General Sector'}</span>
                </div>
              </div>
            ))}
            {!loading && filteredClients.length === 0 && (
              <div className="text-center py-16 bg-card/30">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30 animate-pulse" />
                <h3 className="mt-4 text-sm font-semibold">No clients found</h3>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting search or add a client.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Tabbed Cockpit details */}
        <div className="lg:col-span-2 border border-border/80 rounded-2xl bg-card flex flex-col overflow-hidden shadow-sm">
          {selectedClient ? (
            <>
              {/* Profile Header */}
              <div className="p-6 border-b border-border bg-accent/10 flex justify-between items-center shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedClient.industry || 'General Sector'}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </div>
                  <h3 className="text-xl font-black text-foreground">{selectedClient.companyName}</h3>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">Primary Stakeholder: {selectedClient.contactPerson}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowEditDialog(true)}
                    className="border-border text-foreground text-[10px] font-bold h-8 flex items-center gap-1"
                    title="Edit Profile"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      router.push(`/dashboard/inbox/composer?email=${encodeURIComponent(selectedClient.email)}&name=${encodeURIComponent(selectedClient.contactPerson)}`);
                    }}
                    className="border-border text-foreground text-[10px] font-bold h-8 flex items-center gap-1"
                    title="Send Email Composer"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary" /> Email
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMeetingModal(true)}
                    className="border-border text-foreground text-[10px] font-bold h-8 flex items-center gap-1"
                    title="Schedule meeting roundtable"
                  >
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Roundtable
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowOppModal(true)}
                    className="border-border text-foreground text-[10px] font-bold h-8 flex items-center gap-1"
                    title="Convert to active opportunity pipeline"
                  >
                    <Target className="h-3.5 w-3.5 text-primary" /> Deal
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTaskModal(true)}
                    className="border-border text-foreground text-[10px] font-bold h-8 flex items-center gap-1"
                    title="Assign follow-up task"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Task
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTicketModal(true)}
                    className="border-border text-foreground text-[10px] font-bold h-8 flex items-center gap-1"
                    title="File client support ticket"
                  >
                    <Ticket className="h-3.5 w-3.5 text-primary" /> Ticket
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQuoteModal(true)}
                    className="border-border text-foreground text-[10px] font-bold h-8 flex items-center gap-1"
                    title="Generate client quotation"
                  >
                    <FileText className="h-3.5 w-3.5 text-primary" /> Quote
                  </Button>
                </div>
              </div>

              {/* Scrollable Cockpit Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {detailsLoading ? (
                  <DetailedPageSkeleton />
                ) : (
                  <>
                    {/* Onboarding Journey Stepper (High-Fidelity & Dynamic) */}
                    <Card className="bg-card/40 backdrop-blur-md border-border shadow-sm rounded-xl overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <span className="h-2 w-2 bg-primary rounded-full"></span>
                            Onboarding Journey
                          </CardTitle>
                          <span className="text-xs text-primary font-bold">
                            {selectedClient.onboardingStep ? (selectedClient.onboardingStep / 4) * 100 : 25}% Completed
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                          {onboardingSteps.map((s) => {
                            const isCompleted = selectedClient.onboardingStep ? s.step < selectedClient.onboardingStep : false;
                            const isActive = selectedClient.onboardingStep ? s.step === selectedClient.onboardingStep : s.step === 1;
                            const isPending = selectedClient.onboardingStep ? s.step > selectedClient.onboardingStep : s.step > 1;

                            return (
                              <div 
                                key={s.step} 
                                onClick={() => handleUpdateOnboardingStep(s.step)}
                                className={`flex items-start gap-4 cursor-pointer transition-all hover:scale-[1.02] ${isPending ? 'opacity-50' : 'opacity-100'}`}
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-lg transition-all ${
                                  isCompleted 
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                                    : isActive 
                                    ? 'bg-primary text-white shadow-primary/20 animate-pulse font-extrabold' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}>
                                  {isCompleted ? '✓' : s.step}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm ${isActive ? 'text-primary' : 'text-slate-950 dark:text-slate-50'}`}>
                                    {s.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                                    {s.desc}
                                  </p>
                                  {isActive && s.step === 2 && (
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 mt-2">
                                      <div className="bg-primary h-1 rounded-full w-[45%]"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Strategic Bento Metrics & Scorecard */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="lg:col-span-2 bg-gradient-to-br from-primary/[0.03] to-slate-500/[0.03] border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-bold">Strategic Account Health</CardTitle>
                            <Badge className="bg-emerald-50 text-emerald-700 border-none dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                              Excellent Cadence
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="bg-card/50 border border-border/40 rounded-xl p-3 flex flex-col justify-between h-28">
                            <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Health Rating</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">92%</span>
                              <span className="text-[10px] font-bold text-emerald-500">Optimal</span>
                            </div>
                            <div className="w-full bg-slate-250 dark:bg-slate-800 h-1 rounded-full">
                              <div className="bg-emerald-500 h-1 rounded-full w-[92%]"></div>
                            </div>
                          </div>

                          <div className="bg-card/50 border border-border/40 rounded-xl p-3 flex flex-col justify-between h-28">
                            <p className="text-[10px] font-semibold text-slate-450 uppercase tracking-wider">Project Velocity</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{projects.length}</span>
                              <span className="text-[10px] font-bold text-primary">Active Pipelines</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {projects.filter(p => p.status === 'in_progress').length} in progress, {projects.filter(p => p.status === 'completed').length} completed
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-card/40 border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-bold">Contact Directory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                              <Mail className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] text-muted-foreground font-semibold uppercase">Email</p>
                              <p className="text-xs font-semibold truncate">{selectedClient.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-500/10 rounded-lg">
                              <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] text-muted-foreground font-semibold uppercase">Direct Hotline</p>
                              <p className="text-xs font-semibold">{selectedClient.phone || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="p-1.5 bg-slate-500/10 rounded-lg mt-0.5">
                              <MapPin className="h-4 w-4 text-slate-650 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] text-muted-foreground font-semibold uppercase">Headquarters</p>
                              <p className="text-xs font-semibold line-clamp-1">{selectedClient.address || 'N/A'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Financial Hub */}
                    {finance && (
                      <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-gradient-to-br from-emerald-500/[0.04] via-emerald-500/[0.01] to-transparent border-emerald-500/20 shadow-xs rounded-xl">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Account LTV</p>
                              <h3 className="text-xl font-black mt-1 text-slate-900 dark:text-white">₹{finance.lifetimeValue?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-emerald-500/10">
                              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-500/[0.04] via-amber-500/[0.01] to-transparent border-amber-500/20 shadow-xs rounded-xl">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Outstanding Balance</p>
                              <h3 className="text-xl font-black mt-1 text-slate-900 dark:text-white">₹{finance.outstandingBalance?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-500/10">
                              <PieChart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-rose-500/[0.04] via-rose-500/[0.01] to-transparent border-rose-500/20 shadow-xs rounded-xl">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Overdue Remittances</p>
                              <h3 className="text-xl font-black mt-1 text-slate-900 dark:text-white">₹{finance.overdueBalance?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-2 rounded-xl bg-rose-500/10">
                              <IndianRupee className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Sub-tabs header */}
                    <div className="border-b border-border py-2 flex bg-accent/5 shrink-0">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                          activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Profile Overview
                      </button>
                      <button
                        onClick={() => setActiveTab('projects')}
                        className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                          activeTab === 'projects' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Active Pipelines ({projects.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('communication')}
                        className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                          activeTab === 'communication' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Communication Logs
                      </button>
                      <button
                        onClick={() => setActiveTab('notes')}
                        className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                          activeTab === 'notes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Internal Notes
                      </button>
                      <button
                        onClick={() => setActiveTab('vault')}
                        className={`pb-2 pt-1 text-xs font-bold border-b-2 transition-all ${
                          activeTab === 'vault' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Secure Vault
                      </button>
                    </div>

                    {/* Tab panels */}
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Company Profile Card */}
                        <Card className="border border-border/80 bg-card rounded-xl">
                          <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                              <Building2 className="h-4 w-4" /> Company Profile
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3.5 text-xs text-foreground">
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Website</span>
                              {selectedClient.website ? (
                                <a 
                                  href={selectedClient.website.startsWith('http') ? selectedClient.website : `https://${selectedClient.website}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-primary hover:underline font-bold flex items-center gap-1"
                                >
                                  {selectedClient.website} <Globe className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Not set</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Business Type</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.businessType || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Company Size</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.companySize || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Company Email</span>
                              {selectedClient.companyEmail ? (
                                <a href={`mailto:${selectedClient.companyEmail}`} className="text-primary hover:underline font-bold">
                                  {selectedClient.companyEmail}
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Not set</span>
                              )}
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Company Phone</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.companyPhone || 'N/A'}</span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Primary Contact Card */}
                        <Card className="border border-border/80 bg-card rounded-xl">
                          <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                              <User className="h-4 w-4" /> Primary Contact
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3.5 text-xs text-foreground">
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Stakeholder Name</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.contactPerson}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Designation</span>
                              <Badge className="bg-primary/10 text-primary font-bold hover:bg-primary/15 rounded-lg border-none text-[10px]">
                                {selectedClient.designation || 'Stakeholder'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Direct Email</span>
                              <a href={`mailto:${selectedClient.email}`} className="text-primary hover:underline font-bold">
                                {selectedClient.email}
                              </a>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Mobile Number</span>
                              {selectedClient.phone ? (
                                <a href={`tel:${selectedClient.phone}`} className="text-slate-800 dark:text-slate-200 hover:text-primary transition-colors font-bold">
                                  {selectedClient.phone}
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Not set</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Business Card */}
                        <Card className="border border-border/80 bg-card rounded-xl">
                          <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                              <Briefcase className="h-4 w-4" /> Business & CRM Settings
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3.5 text-xs text-foreground">
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Lead Source</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.leadSource || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Account Owner</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.accountOwner || 'Unassigned'}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Priority</span>
                              <Badge 
                                className={`font-extrabold uppercase border-none text-[9px] px-2 py-0.5 rounded-full ${
                                  selectedClient.priority === 'Critical' ? 'bg-rose-500/10 text-rose-600' :
                                  selectedClient.priority === 'High' ? 'bg-amber-500/10 text-amber-600' :
                                  selectedClient.priority === 'Low' ? 'bg-slate-100 text-slate-600' :
                                  'bg-blue-500/10 text-blue-600'
                                }`}
                              >
                                {selectedClient.priority || 'Medium'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Interested Services</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] block text-right">{selectedClient.interestedServices || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Estimated Budget</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.estimatedBudget || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Expected Launch</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {selectedClient.expectedStartDate ? new Date(selectedClient.expectedStartDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Operations & Billing Card */}
                        <Card className="border border-border/80 bg-card rounded-xl">
                          <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4" /> Operations & Billing
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3.5 text-xs text-foreground">
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Currency preference</span>
                              <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{selectedClient.currency || 'INR'}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Payment Terms</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClient.paymentTerms || 'Net 30'}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Account Status</span>
                              <Badge 
                                className={`font-extrabold uppercase border-none text-[9px] px-2 py-0.5 rounded-full ${
                                  selectedClient.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                                  selectedClient.status === 'prospect' ? 'bg-amber-500/10 text-amber-600' :
                                  'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {selectedClient.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                              <span className="text-muted-foreground font-semibold">Onboarding Stage</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {selectedClient.onboardingStep === 4 ? '4. Global Launch' :
                                 selectedClient.onboardingStep === 3 ? '3. KT Transfer' :
                                 selectedClient.onboardingStep === 2 ? '2. Provisioning' :
                                 '1. Legal Contract'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Address Card (Full width on grid) */}
                        <div className="md:col-span-2">
                          <Card className="border border-border/80 bg-card rounded-xl">
                            <CardHeader className="pb-3 border-b border-border/40">
                              <CardTitle className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" /> Corporate Headquarters
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-foreground">
                              <div>
                                <span className="text-muted-foreground font-semibold block mb-1">Street Address</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{selectedClient.address || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-semibold block mb-1">Location</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {selectedClient.city || 'N/A'}{selectedClient.state ? `, ${selectedClient.state}` : ''}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-semibold block mb-1">Country & Postal Code</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {selectedClient.country || 'N/A'}{selectedClient.postalCode ? ` - ${selectedClient.postalCode}` : ''}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Tab panels */}
                    {activeTab === 'projects' && (
                      <Card className="bg-card border border-border shadow-xs rounded-xl">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-bold">Client Project Registry</CardTitle>
                          <CardDescription className="text-xs">Visualizing operations pipeline and status metrics for this client</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {projects.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50/20 dark:bg-slate-900/20 border border-dashed border-border rounded-xl">
                              <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/60 animate-pulse" />
                              <h4 className="mt-3 text-sm font-bold">No projects registered yet</h4>
                              <p className="text-xs text-muted-foreground mt-1">Add client projects from the global dashboard planner.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {projects.map((project) => (
                                <Link
                                  key={project.id}
                                  href={`/dashboard/projects/${project.id}`}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/60 rounded-xl hover:border-primary/30 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all group"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-xs text-slate-900 dark:text-slate-50 group-hover:text-primary transition-colors">
                                        {project.name}
                                      </p>
                                      <Badge className="bg-slate-100 text-slate-600 text-[9px] font-bold py-0.2 px-2 border-none">
                                        {project.priority} priority
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                                      <span>Starts: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                                      <span>•</span>
                                      <span>Ends: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                    <Badge
                                      className={`shadow-xs px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border-none ${
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
                    )}

                    {activeTab === 'communication' && (
                      <ClientCommunicationPanel clientId={selectedClient.id} />
                    )}

                    {activeTab === 'notes' && (
                      <Card className="border-none bg-accent/15 p-5 rounded-xl">
                        <CardHeader className="px-0 pt-0 pb-3 flex flex-row items-center justify-between space-y-0">
                          <div>
                            <CardTitle className="text-sm font-bold">Account Manager Notes</CardTitle>
                            <CardDescription className="text-xs">Internal strategic notes and organizational preferences</CardDescription>
                          </div>
                          {!isEditingNotes && (
                            <Button 
                              variant="outline" 
                              size="xs" 
                              onClick={() => {
                                setNotesText(selectedClient.notes || '');
                                setIsEditingNotes(true);
                              }}
                              className="text-[10px] font-bold h-7 py-1 px-2 border-border text-foreground rounded-lg"
                            >
                              Edit Notes
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                          {isEditingNotes ? (
                            <div className="space-y-3">
                              <textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Enter account manager notes..."
                                className="w-full min-h-[120px] p-3 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 dark:text-slate-200"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="xs" 
                                  onClick={() => setIsEditingNotes(false)}
                                  className="text-xs py-1.5 px-3 border border-border"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="xs" 
                                  onClick={handleSaveNotes}
                                  className="text-xs bg-primary hover:bg-primary/95 text-white font-bold py-1.5 px-3 border-none shadow-xs rounded-lg"
                                >
                                  Save Notes
                                </Button>
                              </div>
                            </div>
                          ) : selectedClient.notes ? (
                            <div className="p-4 bg-card border border-border rounded-xl">
                              <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{selectedClient.notes}</p>
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-slate-50/20 dark:bg-slate-900/20 border border-dashed border-border rounded-xl">
                              <p className="text-xs text-muted-foreground italic">No internal logs or notes added yet.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {activeTab === 'vault' && (
                      <Card className="border-emerald-500/20 bg-gradient-to-b from-card to-emerald-500/[0.01] shadow-sm rounded-xl overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm font-bold">
                                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Secure Document Vault
                              </CardTitle>
                              <CardDescription className="text-xs">Private repository for legal MSAs, commercial SOWs, and NDAs.</CardDescription>
                            </div>
                            <div className="relative">
                              <input
                                type="file"
                                id="secure-vault-upload"
                                className="hidden"
                                onChange={handleUploadFile}
                                disabled={uploading}
                              />
                              <Button 
                                size="xs" 
                                onClick={() => document.getElementById('secure-vault-upload')?.click()}
                                disabled={uploading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 rounded-lg py-1.5 px-3 border-none"
                              >
                                <UploadCloud className="h-3.5 w-3.5" /> 
                                {uploading ? 'Uploading...' : 'Secure Upload'}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          {documents.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50/20 dark:bg-slate-900/20 border border-dashed border-border rounded-xl">
                              <FileText className="mx-auto h-10 w-10 text-muted-foreground/60 animate-pulse" />
                              <h4 className="mt-3 text-sm font-bold">No documents uploaded yet</h4>
                              <p className="text-xs text-muted-foreground mt-1">Upload bilateral legal contracts or NDAs to the secure vault.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-border font-bold text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50/40 dark:bg-slate-950/40">
                                    <th className="py-2.5 px-3">Document Name</th>
                                    <th className="py-2.5 px-3">Size</th>
                                    <th className="py-2.5 px-3">Format</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="text-slate-800 dark:text-slate-200">
                                  {documents.map((doc) => (
                                    <tr key={doc.id} className="border-b border-border/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                      <td className="py-3 px-3 flex items-center gap-2 font-bold min-w-0">
                                        <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                                        <a 
                                          href={`/api/upload?fileId=${doc.id}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="hover:underline text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs block"
                                        >
                                          {doc.original_filename}
                                        </a>
                                      </td>
                                      <td className="py-3 px-3 text-[11px] text-muted-foreground font-semibold">
                                        {formatBytes(doc.size_bytes)}
                                      </td>
                                      <td className="py-3 px-3 text-[11px] uppercase text-muted-foreground font-bold">
                                        {doc.format}
                                      </td>
                                      <td className="py-3 px-3 text-right flex justify-end gap-1.5">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          asChild
                                          className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-foreground"
                                        >
                                          <a href={`/api/upload?fileId=${doc.id}`} target="_blank" rel="noreferrer">
                                            <UploadCloud className="h-3.5 w-3.5 rotate-180" />
                                          </a>
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => handleDeleteFile(doc.id, doc.original_filename)}
                                          className="h-7 w-7 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-600"
                                        >
                                          <Lock className="h-3.5 w-3.5 text-rose-500" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground bg-accent/5 italic text-xs">
              <Building2 className="h-10 w-10 text-muted-foreground/30 animate-pulse mb-3" />
              <span>Select a client from the index directory to view full profiles.</span>
            </div>
          )}
        </div>

      </div>

      <ClientFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={(newClient) => {
          fetchClients();
          if (newClient) {
            setSelectedClient(newClient);
          }
        }}
      />

      {selectedClient && (
        <ClientFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={(updatedClient) => {
            fetchClients();
            if (updatedClient) {
              setSelectedClient(updatedClient);
            } else {
              fetchClientDetails(selectedClient.id);
            }
          }}
          client={selectedClient}
        />
      )}

      {/* Deal Opportunity Modal */}
      {showOppModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setShowOppModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg">
              <X className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Create Deal Opportunity
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Generate a new pipeline opportunity associated with {selectedClient.companyName}.</p>
            </div>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Value (INR)</label>
                <Input value={oppAmount} onChange={(e) => setOppAmount(e.target.value)} type="number" className="bg-accent border-border text-xs rounded-xl h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">SOW Overview & Requirements</label>
                <textarea value={oppDesc} onChange={(e) => setOppDesc(e.target.value)} className="w-full bg-accent border border-border text-xs rounded-xl p-3 h-20 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowOppModal(false)} className="text-xs font-semibold rounded-xl px-4">Cancel</Button>
              <Button onClick={() => handleDispatchAction('opportunity')} disabled={actionPending} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 border-none flex items-center gap-1.5">
                {actionPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create Opportunity
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showTaskModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setShowTaskModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg">
              <X className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Assign Follow-up Task
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Create a task in the pipeline index assigned to follow up on {selectedClient.companyName}.</p>
            </div>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Task Title</label>
                <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} className="bg-accent border-border text-xs rounded-xl h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Priority Level</label>
                <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="w-full bg-accent border border-border text-xs rounded-xl h-9 px-2 text-foreground font-semibold">
                  <option value="High">High / Urgent</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Description / Deliverables</label>
                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="w-full bg-accent border border-border text-xs rounded-xl p-3 h-20 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowTaskModal(false)} className="text-xs font-semibold rounded-xl px-4">Cancel</Button>
              <Button onClick={() => handleDispatchAction('task')} disabled={actionPending} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 border-none flex items-center gap-1.5">
                {actionPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Assign Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {showTicketModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setShowTicketModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg">
              <X className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" /> Open Customer Support Ticket
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">File an L1 support assistance ticket for {selectedClient.companyName}.</p>
            </div>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Ticket Subject</label>
                <Input value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} className="bg-accent border-border text-xs rounded-xl h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Severity Priority</label>
                <select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)} className="w-full bg-accent border border-border text-xs rounded-xl h-9 px-2 text-foreground font-semibold">
                  <option value="Urgent">Urgent / Critical</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Description of Issue</label>
                <textarea value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} className="w-full bg-accent border border-border text-xs rounded-xl p-3 h-20 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowTicketModal(false)} className="text-xs font-semibold rounded-xl px-4">Cancel</Button>
              <Button onClick={() => handleDispatchAction('ticket')} disabled={actionPending} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 border-none flex items-center gap-1.5">
                {actionPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} File Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar Roundtable Modal */}
      {showMeetingModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setShowMeetingModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg">
              <X className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Schedule Google Calendar roundtable
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sync followup roundtable alignment slots directly to client Google Calendars.</p>
            </div>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Meeting subject title</label>
                <Input value={meetingSubject} onChange={(e) => setMeetingSubject(e.target.value)} className="bg-accent border-border text-xs rounded-xl h-9" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Date</label>
                  <Input type="date" value={meetingDateStr} onChange={(e) => setMeetingDateStr(e.target.value)} className="bg-accent border-border text-xs rounded-xl h-9" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Time</label>
                  <Input type="time" value={meetingTimeStr} onChange={(e) => setMeetingTimeStr(e.target.value)} className="bg-accent border-border text-xs rounded-xl h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Duration</label>
                <select value={meetingDurationStr} onChange={(e) => setMeetingDurationStr(e.target.value)} className="w-full bg-accent border border-border text-xs rounded-xl h-9 px-2 text-foreground font-semibold">
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="120">2 Hours</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Description / Agenda</label>
                <textarea value={meetingDescStr} onChange={(e) => setMeetingDescStr(e.target.value)} placeholder="Outline conversation details or agenda..." className="w-full bg-accent border border-border text-xs rounded-xl p-3 h-16 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowMeetingModal(false)} className="text-xs font-semibold rounded-xl px-4">Cancel</Button>
              <Button onClick={handleClientMeetingSchedule} disabled={actionPending} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 border-none flex items-center gap-1.5">
                {actionPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Quotation Modal */}
      {showQuoteModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fadeIn duration-200">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl relative space-y-4">
            <button onClick={() => setShowQuoteModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 rounded-lg">
              <X className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Generate Client Quotation
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Generate a billing quotation draft proposal for {selectedClient.companyName}.</p>
            </div>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Quotation value (INR)</label>
                <Input value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} type="number" className="bg-accent border-border text-xs rounded-xl h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Validity Period (Days)</label>
                <select value={quoteValidity} onChange={(e) => setQuoteValidity(e.target.value)} className="w-full bg-accent border border-border text-xs rounded-xl h-9 px-2 text-foreground font-semibold">
                  <option value="7">7 Days</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowQuoteModal(false)} className="text-xs font-semibold rounded-xl px-4">Cancel</Button>
              <Button onClick={() => handleDispatchAction('quotation')} disabled={actionPending} className="bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl px-4 border-none flex items-center gap-1.5">
                {actionPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Generate Quotation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
