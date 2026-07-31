'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Star, StarOff, Loader2, MessageSquare, Plus, Trash2, 
  ChevronRight, Calendar, UserCheck, Sparkles, Filter, ListFilter,
  TrendingUp, BarChart3, Target, DollarSign, ArrowRight, Layers,
  Building2, Globe, MapPin, Briefcase, ShieldCheck, Mail, Phone, 
  UploadCloud, FileText, User, Users, Edit, RefreshCw
} from 'lucide-react';
import { ContentSkeleton } from '@/components/ui/dashboard-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  inquiryAppStatusOptions,
  inquiryFeedFormSchema,
  inquiryFormSchema,
  inquiryStatusOptions,
  inquiryTagOptions,
  type InquiryFeedFormValues,
  type InquiryFormValues,
} from '@/lib/forms/schemas';
import { hasPermission, hasFullAccess, UserRole } from '@/lib/permissions';

interface Inquiry {
  id: number;
  aliasName: string;
  tag: string;
  status: string;
  dueDate: string | null;
  appStatus: string | null;
  isFavourite: boolean;
  createdAt: string;
  companyName?: string | null;
  website?: string | null;
  industry?: string | null;
  companySize?: string | null;
  countryRegion?: string | null;
  contactPerson?: string | null;
  designation?: string | null;
  workEmail?: string | null;
  phoneNumber?: string | null;
  alternateEmail?: string | null;
  alternatePhone?: string | null;
  techTagRequirement?: string | null;
  inquirySource?: string | null;
  pipelineStage?: string | null;
  opportunityStatus?: string | null;
  estimationDueDate?: string | null;
  expectedStartDate?: string | null;
  projectOverviewRequirements?: string | null;
  budgetRange?: string | null;
  estimatedValue?: number | null;
  timeline?: string | null;
  priorityLevel?: string | null;
  probability?: string | null;
  accountOwner?: string | null;
  salesManager?: string | null;
  technicalLead?: string | null;
  preferredCommunication?: string | null;
  attachmentUrl?: string | null;
  internalNotes?: string | null;
}

interface InquiryFeed {
  id: number;
  inquiryId: number;
  commentedBy: number;
  technology: string | null;
  description: string;
  createdAt: string;
}

interface User {
  id: number;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export default function InquiryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Inquiry Feed
  const [selectedInquiry, setSelectedInquiry] = useState<number | null>(null);
  const [inquiryFeeds, setInquiryFeeds] = useState<InquiryFeed[]>([]);
  const [feedsLoading, setFeedsLoading] = useState(false);
  const [inquiryPage, setInquiryPage] = useState(0);
  const [feedPage, setFeedPage] = useState(0);
  const pageSize = 10;

  // Conversion & upload flags
  const [converting, setConverting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // AI forecast intelligence state
  const [aiAdvice, setAiAdvice] = useState<string>('Generating dynamic pipeline recommendations...');
  const [aiProvider, setAiProvider] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Add/Edit Inquiry
  const [showInquiryDialog, setShowInquiryDialog] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  
  const inquiryForm = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      aliasName: '',
      tag: 'need_estimation',
      status: 'lead',
      dueDate: '',
      appStatus: 'open',
      companyName: '',
      website: '',
      industry: '',
      companySize: '',
      countryRegion: '',
      contactPerson: '',
      designation: '',
      workEmail: '',
      phoneNumber: '',
      alternateEmail: '',
      alternatePhone: '',
      techTagRequirement: '',
      inquirySource: '',
      pipelineStage: 'lead',
      opportunityStatus: 'Open',
      estimationDueDate: '',
      expectedStartDate: '',
      projectOverviewRequirements: '',
      budgetRange: '',
      estimatedValue: '',
      timeline: '',
      priorityLevel: 'Medium',
      probability: '',
      accountOwner: '',
      salesManager: '',
      technicalLead: '',
      preferredCommunication: 'Email',
      attachmentUrl: '',
      internalNotes: '',
    },
  });

  // Add Inquiry Feed
  const [showFeedDialog, setShowFeedDialog] = useState(false);
  const feedForm = useForm<InquiryFeedFormValues>({
    resolver: zodResolver(inquiryFeedFormSchema),
    defaultValues: {
      technology: '',
      description: '',
    },
  });

  // Delete dialogs
  const [deletingInquiry, setDeletingInquiry] = useState<Inquiry | null>(null);
  const [deletingFeed, setDeletingFeed] = useState<InquiryFeed | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchInquiries();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('session_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch {
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecastIntelligence = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/inquiries/forecast-intelligence', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAiAdvice(data.data.advice);
        setAiProvider(data.data.provider);
      } else {
        setAiAdvice('Failed to compile live pipeline analysis. Ensure AI keys are configured.');
      }
    } catch {
      setAiAdvice('Connection error loading AI opportunity forecasting recommendations.');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      let url = '/api/inquiries?limit=100';
      
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedTag !== 'all') url += `&tag=${selectedTag}`;
      if (selectedStatus !== 'all') url += `&status=${selectedStatus}`;
      if (filterType !== 'all') url += `&appStatus=${filterType}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInquiries(Array.isArray(data) ? data : data.data ?? []);
        setInquiryPage(0); // Reset to first page
        fetchForecastIntelligence();
      }
    } catch {
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleInquirySubmit = async (values: InquiryFormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      
      const url = editingInquiry 
        ? `/api/inquiries?id=${editingInquiry.id}`
        : '/api/inquiries';
      
      const method = editingInquiry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          dueDate: values.dueDate || null,
        }),
      });

      if (response.ok) {
        toast.success(editingInquiry ? 'Inquiry updated successfully!' : 'Inquiry created successfully!');
        setShowInquiryDialog(false);
        setEditingInquiry(null);
        inquiryForm.reset({
          aliasName: '',
          tag: 'need_estimation',
          status: 'lead',
          dueDate: '',
          appStatus: 'open',
        });
        fetchInquiries();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save inquiry');
      }
    } catch {
      toast.error('An error occurred while saving inquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInquiry = async () => {
    if (!deletingInquiry) return;
    
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/inquiries?id=${deletingInquiry.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Inquiry deleted successfully!');
        fetchInquiries();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete inquiry');
      }
    } catch {
      toast.error('An error occurred while deleting inquiry');
    } finally {
      setDeletingInquiry(null);
    }
  };

  const toggleFavourite = async (inquiry: Inquiry) => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/inquiries?id=${inquiry.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavourite: !inquiry.isFavourite }),
      });

      if (response.ok) {
        toast.success(inquiry.isFavourite ? 'Removed from favourites' : 'Added to favourites');
        fetchInquiries();
      }
    } catch {
      toast.error('Failed to update favourite status');
    }
  };

  const fetchInquiryFeeds = async (inquiryId: number) => {
    setFeedsLoading(true);
    setSelectedInquiry(inquiryId);
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/inquiry-feeds?inquiryId=${inquiryId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInquiryFeeds(Array.isArray(data) ? data : data.data ?? []);
        setFeedPage(0); // Reset to first page
      }
    } catch {
      toast.error('Failed to load inquiry feeds');
    } finally {
      setFeedsLoading(false);
    }
  };

  const handleFeedSubmit = async (values: InquiryFeedFormValues) => {
    if (!selectedInquiry) {
      toast.error('Please select an inquiry first');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      
      const response = await fetch('/api/inquiry-feeds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inquiryId: selectedInquiry,
          technology: values.technology || null,
          description: values.description.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Feed added successfully!');
        setShowFeedDialog(false);
        feedForm.reset({ technology: '', description: '' });
        fetchInquiryFeeds(selectedInquiry);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add feed');
      }
    } catch {
      toast.error('An error occurred while adding feed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeed = async () => {
    if (!deletingFeed) return;
    
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`/api/inquiry-feeds?id=${deletingFeed.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Feed deleted successfully!');
        if (selectedInquiry) {
          fetchInquiryFeeds(selectedInquiry);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete feed');
      }
    } catch {
      toast.error('An error occurred while deleting feed');
    } finally {
      setDeletingFeed(null);
    }
  };

  const openEditDialog = (inquiry: Inquiry) => {
    setEditingInquiry(inquiry);
    inquiryForm.reset({
      aliasName: inquiry.aliasName || '',
      tag: inquiry.tag || 'need_estimation',
      status: inquiry.status || 'lead',
      dueDate: inquiry.dueDate || '',
      appStatus: inquiry.appStatus || 'open',
      companyName: inquiry.companyName || '',
      website: inquiry.website || '',
      industry: inquiry.industry || '',
      companySize: inquiry.companySize || '',
      countryRegion: inquiry.countryRegion || '',
      contactPerson: inquiry.contactPerson || '',
      designation: inquiry.designation || '',
      workEmail: inquiry.workEmail || '',
      phoneNumber: inquiry.phoneNumber || '',
      alternateEmail: inquiry.alternateEmail || '',
      alternatePhone: inquiry.alternatePhone || '',
      techTagRequirement: inquiry.techTagRequirement || '',
      inquirySource: inquiry.inquirySource || '',
      pipelineStage: inquiry.pipelineStage || 'lead',
      opportunityStatus: inquiry.opportunityStatus || 'Open',
      estimationDueDate: inquiry.estimationDueDate || '',
      expectedStartDate: inquiry.expectedStartDate || '',
      projectOverviewRequirements: inquiry.projectOverviewRequirements || '',
      budgetRange: inquiry.budgetRange || '',
      estimatedValue: inquiry.estimatedValue !== undefined && inquiry.estimatedValue !== null ? String(inquiry.estimatedValue) : '',
      timeline: inquiry.timeline || '',
      priorityLevel: inquiry.priorityLevel || 'Medium',
      probability: inquiry.probability || '',
      accountOwner: inquiry.accountOwner || '',
      salesManager: inquiry.salesManager || '',
      technicalLead: inquiry.technicalLead || '',
      preferredCommunication: inquiry.preferredCommunication || 'Email',
      attachmentUrl: inquiry.attachmentUrl || '',
      internalNotes: inquiry.internalNotes || '',
    });
    setShowInquiryDialog(true);
  };

  const handleConvertToClient = async (inquiryId: number) => {
    setConverting(true);
    try {
      const response = await fetch(`/api/inquiries/convert?inquiryId=${inquiryId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        }
      });
      
      if (response.ok) {
        toast.success('Opportunity converted to Active Client successfully!');
        fetchInquiries();
        router.push('/dashboard/clients');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to convert opportunity');
      }
    } catch (err) {
      toast.error('An error occurred during conversion process');
    } finally {
      setConverting(false);
    }
  };

  const handleAttachmentUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'contract');
      formData.append('moduleName', 'clients');
      formData.append('entityType', 'attachment');
      formData.append('entityId', 'draft');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const secureUrl = Array.isArray(data) ? data[0].secureUrl : (data.secureUrl || data.url);
        inquiryForm.setValue('attachmentUrl', secureUrl);
        toast.success('Attachment uploaded successfully!');
      } else {
        toast.error('Failed to upload attachment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload connection error');
    } finally {
      setUploading(false);
    }
  };

  const getTagBadge = (tag: string) => {
    const tagColors: Record<string, string> = {
      'need_estimation': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-bold py-0.5 px-2 rounded',
      'rough_estimation': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none font-bold py-0.5 px-2 rounded',
      'scheduling_meeting': 'bg-green-500/10 text-green-600 dark:text-green-400 border-none font-bold py-0.5 px-2 rounded',
      'need_schedule_meeting': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-none font-bold py-0.5 px-2 rounded',
      'hired_someone_else': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold py-0.5 px-2 rounded',
      'hired': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold py-0.5 px-2 rounded',
    };
    
    return (
      <Badge className={tagColors[tag] || 'bg-slate-100 dark:bg-slate-800'}>
        {tag.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'lead': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-bold py-0.5 px-2 rounded',
      'no_reply': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-none font-bold py-0.5 px-2 rounded',
      'follow_up': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-none font-bold py-0.5 px-2 rounded',
      'hired': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold py-0.5 px-2 rounded',
      'rejected_client': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold py-0.5 px-2 rounded',
      'rejected_us': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none font-bold py-0.5 px-2 rounded',
      'invite_lead': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none font-bold py-0.5 px-2 rounded',
      'invite_hire': 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-none font-bold py-0.5 px-2 rounded',
      'not_good_client': 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-none font-bold py-0.5 px-2 rounded',
      'budget_low': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-bold py-0.5 px-2 rounded',
      'cant_work': 'bg-red-500/10 text-red-600 dark:text-red-400 border-none font-bold py-0.5 px-2 rounded',
      'hired_someone_else': 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-none font-bold py-0.5 px-2 rounded',
    };
    
    return (
      <Badge className={statusColors[status] || 'bg-slate-100 dark:bg-slate-800'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (loading && !currentUser) {
    return (
      <div className="space-y-6 text-slate-900 dark:text-slate-100 p-1 animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-950 p-6 border border-slate-250 dark:border-slate-800 h-32 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-8 w-80 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
          </div>
          <div className="h-3 w-96 bg-slate-300 dark:bg-slate-700 rounded-lg mt-1"></div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl h-12">
          <div className="flex gap-2">
            {[1, 2, 3].map(t => (
              <div key={t} className="h-8 w-32 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
            ))}
          </div>
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
        </div>

        {/* Visual Pipeline grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(col => (
            <div key={col} className="border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 min-h-[500px] flex flex-col space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                <div className="h-5 w-6 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
              </div>
              
              <div className="flex-1 space-y-3">
                {[1, 2].map(card => (
                  <div key={card} className="border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl space-y-3">
                    <div className="flex justify-between">
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-850 rounded-lg"></div>
                      <div className="h-4.5 w-4.5 bg-slate-200 dark:bg-slate-850 rounded-full"></div>
                    </div>
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                    <div className="h-2.5 w-20 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                    <div className="h-2 w-12 bg-slate-100 dark:bg-slate-850 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const canCreate = currentUser && hasPermission(currentUser.role, 'inquiry', 'canCreate');
  const canEdit = currentUser && hasPermission(currentUser.role, 'inquiry', 'canEdit');
  const canDelete = currentUser && hasPermission(currentUser.role, 'inquiry', 'canDelete');
  const isFullAccess = currentUser && hasFullAccess(currentUser.role);

  // Group by Pipeline status for Kanban view
  const pipelineStages = ['lead', 'no_reply', 'follow_up', 'hired', 'rejected_client', 'rejected_us'];
  const pipelineGroups = pipelineStages.reduce((acc, stage) => {
    acc[stage] = inquiries.filter(inq => (inq.status || 'lead').toLowerCase() === stage);
    return acc;
  }, {} as Record<string, Inquiry[]>);

  // Win rate computation for Forecast Analytics
  const totalClosed = inquiries.filter(inq => ['hired', 'rejected_client', 'rejected_us', 'hired_someone_else'].includes(inq.status)).length;
  const wonDeals = inquiries.filter(inq => inq.status === 'hired').length;
  const winRate = totalClosed > 0 ? Math.round((wonDeals / totalClosed) * 100) : 0;

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTag('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
    setFilterType('all');
    // Trigger a fresh fetch after clearing
    setTimeout(() => fetchInquiries(), 0);
  };


  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 p-1">
      
      {/* Page Header */}
      <div className="shrink-0">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 text-white shadow-xl border border-primary/20">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-soft">Lead &amp; Forecasting Lifecycle</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent">
                CRM Enterprise Lead Pipeline
              </h2>
              <p className="text-sm text-primary-soft mt-1 max-w-xl">
                Track incoming inquiries, negotiate contract pipeline stages, and manage automated estimations.
              </p>
            </div>
            
            <div className="flex gap-2 items-center">
              <Button 
                variant="outline" 
                onClick={fetchInquiries}
                className="bg-white/10 hover:bg-white/20 text-white rounded-lg h-9 border-white/15 shrink-0"
              >
                <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
              </Button>
              {canCreate && (
                <Button 
                  className="bg-primary hover:bg-primary/95 text-white font-bold border-none shadow-sm flex items-center gap-2 h-9 rounded-lg"
                  onClick={() => {
                    setEditingInquiry(null);
                    inquiryForm.reset({
                      aliasName: '',
                      tag: 'need_estimation',
                      status: 'lead',
                      dueDate: '',
                      appStatus: 'open',
                      companyName: '',
                      website: '',
                      industry: '',
                      companySize: '',
                      countryRegion: '',
                      contactPerson: '',
                      designation: '',
                      workEmail: '',
                      phoneNumber: '',
                      alternateEmail: '',
                      alternatePhone: '',
                      techTagRequirement: '',
                      inquirySource: '',
                      pipelineStage: 'lead',
                      opportunityStatus: 'Open',
                      estimationDueDate: '',
                      expectedStartDate: '',
                      projectOverviewRequirements: '',
                      budgetRange: '',
                      estimatedValue: '',
                      timeline: '',
                      priorityLevel: 'Medium',
                      probability: '',
                      accountOwner: '',
                      salesManager: '',
                      technicalLead: '',
                      preferredCommunication: 'Email',
                      attachmentUrl: '',
                      internalNotes: '',
                    });
                    setShowInquiryDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add Inquiry
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {canCreate &&
        <Dialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
          <DialogContent className="sm:max-w-[1150px] max-w-[95vw] max-h-[90vh] overflow-hidden bg-card border-border text-foreground shadow-2xl rounded-2xl flex flex-col p-0">
              <DialogHeader className="p-6 bg-accent/15 border-b border-border/80 shrink-0">
                <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {editingInquiry ? 'Edit Opportunity Inquiry' : 'Create New Client Inquiry'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-semibold">
                  Register incoming corporate client opportunities and initial tech parameters.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...inquiryForm}>
                <form 
                  onSubmit={inquiryForm.handleSubmit(handleInquirySubmit)} 
                  className="flex-1 overflow-y-auto p-6 space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* LEFT COLUMN: Basic Info & Inquiry Details */}
                    <div className="space-y-6">
                      
                      {/* BASIC INFORMATION SECTION */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Basic Information</h4>
                        </div>
                        
                        <FormField
                          control={inquiryForm.control}
                          name="aliasName"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <Label className="text-xs font-semibold">Alias Name *</Label>
                              <FormControl><Input placeholder="e.g. Skyline Ventures, Tokyo Logistics" className="h-10 text-xs" {...field} /></FormControl>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="companyName"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Company Name</Label>
                                <FormControl><Input placeholder="e.g. Skyline Ventures Pvt. Ltd." className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Website</Label>
                                <FormControl><Input placeholder="https://www.company.com" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="industry"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Industry</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="Technology & SaaS">Technology & SaaS</SelectItem>
                                    <SelectItem value="Healthcare & Pharma">Healthcare & Pharma</SelectItem>
                                    <SelectItem value="Finance & Banking">Finance & Banking</SelectItem>
                                    <SelectItem value="E-commerce & Retail">E-commerce & Retail</SelectItem>
                                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="companySize"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Company Size</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select size" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="1-10">1-10 employees</SelectItem>
                                    <SelectItem value="11-50">11-50 employees</SelectItem>
                                    <SelectItem value="51-200">51-200 employees</SelectItem>
                                    <SelectItem value="201-500">201-500 employees</SelectItem>
                                    <SelectItem value="500+">500+ employees</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="countryRegion"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Country / Region</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="India">India</SelectItem>
                                    <SelectItem value="United States">United States</SelectItem>
                                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                    <SelectItem value="Singapore">Singapore</SelectItem>
                                    <SelectItem value="Germany">Germany</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* INQUIRY DETAILS SECTION */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Inquiry Details</h4>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="techTagRequirement"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Tech Tag / Req *</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select tag" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="React Native">React Native</SelectItem>
                                    <SelectItem value="Next.js / React">Next.js / React</SelectItem>
                                    <SelectItem value="Node.js Backends">Node.js Backends</SelectItem>
                                    <SelectItem value="Fullstack SaaS">Fullstack SaaS</SelectItem>
                                    <SelectItem value="AI/ML Integration">AI/ML Integration</SelectItem>
                                    <SelectItem value="Other Services">Other Services</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="inquirySource"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Inquiry Source</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="LinkedIn Outreach">LinkedIn Outreach</SelectItem>
                                    <SelectItem value="Organic Search">Organic Search</SelectItem>
                                    <SelectItem value="Client Referral">Client Referral</SelectItem>
                                    <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                                    <SelectItem value="Clutch Profile">Clutch Profile</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="pipelineStage"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Pipeline Stage *</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select stage" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="lead">Lead</SelectItem>
                                    <SelectItem value="no_reply">No Reply</SelectItem>
                                    <SelectItem value="follow_up">Follow Up</SelectItem>
                                    <SelectItem value="hired">Hired / Closed Won</SelectItem>
                                    <SelectItem value="rejected_client">Rejected by Client</SelectItem>
                                    <SelectItem value="rejected_us">Rejected by Us</SelectItem>
                                    <SelectItem value="invite_lead">Invite Lead</SelectItem>
                                    <SelectItem value="invite_hire">Invite Hire</SelectItem>
                                    <SelectItem value="not_good_client">Not Good Client</SelectItem>
                                    <SelectItem value="budget_low">Budget Low</SelectItem>
                                    <SelectItem value="cant_work">Can&apos;t Work</SelectItem>
                                    <SelectItem value="hired_someone_else">Hired Someone Else</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="opportunityStatus"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Opportunity Status *</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Negotiating">Negotiating</SelectItem>
                                    <SelectItem value="Estimating">Estimating</SelectItem>
                                    <SelectItem value="Closed Won">Closed Won</SelectItem>
                                    <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="estimationDueDate"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Estimation Due Date</Label>
                                <FormControl><Input type="date" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="expectedStartDate"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Expected Start Date</Label>
                                <FormControl><Input type="date" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={inquiryForm.control}
                          name="projectOverviewRequirements"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <Label className="text-xs font-semibold">Project Overview / Requirements *</Label>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide a brief overview of the project, goals, and key requirements..." 
                                  className="min-h-[120px] text-xs resize-none" 
                                  maxLength={1000}
                                  {...field} 
                                />
                              </FormControl>
                              <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                                <span>Be as detailed as possible</span>
                                <span>{(field.value || '').length}/1000</span>
                              </div>
                              <FormMessage className="text-xs text-rose-500" />
                            </FormItem>
                          )}
                        />
                      </div>

                    </div>

                    {/* RIGHT COLUMN: Contact Info, Budget & Assignment */}
                    <div className="space-y-6">
                      
                      {/* CONTACT INFORMATION SECTION */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
                          <User className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Contact Information</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="contactPerson"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Contact Person *</Label>
                                <FormControl><Input placeholder="e.g. Rahul Sharma" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="designation"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Designation</Label>
                                <FormControl><Input placeholder="e.g. CEO, CTO, Founder" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="workEmail"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Work Email *</Label>
                                <FormControl><Input type="email" placeholder="name@company.com" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Phone Number *</Label>
                                <FormControl><Input placeholder="98765 43210" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="alternateEmail"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Alternate Email</Label>
                                <FormControl><Input type="email" placeholder="name@company.com" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="alternatePhone"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Alternate Phone</Label>
                                <FormControl><Input placeholder="98765 43210" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* ESTIMATION & BUDGET SECTION */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Estimation & Budget</h4>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="budgetRange"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Budget Range</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select range" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="1L - 3L">1L - 3L</SelectItem>
                                    <SelectItem value="3L - 5L">3L - 5L</SelectItem>
                                    <SelectItem value="5L - 10L">5L - 10L</SelectItem>
                                    <SelectItem value="10L+">10L+</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="estimatedValue"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Estimated Value (₹)</Label>
                                <FormControl><Input type="number" placeholder="e.g. 500000" className="h-10 text-xs" {...field} /></FormControl>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="timeline"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Timeline</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select timeline" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="1 Month">1 Month</SelectItem>
                                    <SelectItem value="2-3 Months">2-3 Months</SelectItem>
                                    <SelectItem value="3-6 Months">3-6 Months</SelectItem>
                                    <SelectItem value="6+ Months">6+ Months</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="priorityLevel"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Priority Level</Label>
                                <Select value={field.value || 'Medium'} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Medium" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="probability"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Probability (%)</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select probability" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="10%">10%</SelectItem>
                                    <SelectItem value="30%">30%</SelectItem>
                                    <SelectItem value="50%">50%</SelectItem>
                                    <SelectItem value="70%">70%</SelectItem>
                                    <SelectItem value="90%">90%</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* ASSIGNMENT SECTION */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
                          <Users className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Assignment</h4>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="accountOwner"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Account Owner *</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select owner" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="Connect Techsonance">Connect Techsonance</SelectItem>
                                    <SelectItem value="Sales Operations">Sales Operations</SelectItem>
                                    <SelectItem value="Admin User">Admin User</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="salesManager"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Sales Manager</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select manager" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="Connect Techsonance">Connect Techsonance</SelectItem>
                                    <SelectItem value="Sales Operations">Sales Operations</SelectItem>
                                    <SelectItem value="Admin User">Admin User</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={inquiryForm.control}
                            name="technicalLead"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <Label className="text-xs font-semibold">Technical Lead</Label>
                                <Select value={field.value || ''} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select lead" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="Connect Techsonance">Connect Techsonance</SelectItem>
                                    <SelectItem value="Engineering Manager">Engineering Manager</SelectItem>
                                    <SelectItem value="Technical Architect">Technical Architect</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs text-rose-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* BOTTOM ROW: Preferred Comms, Attachments, Internal Notes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-border/80">
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Additional Information</h4>
                      </div>

                      <FormField
                        control={inquiryForm.control}
                        name="preferredCommunication"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <Label className="text-xs font-semibold">Preferred Communication</Label>
                            <FormControl>
                              <div className="flex flex-wrap gap-2">
                                {['Email', 'Phone', 'WhatsApp', 'LinkedIn', 'Other'].map((method) => (
                                  <Button
                                    key={method}
                                    type="button"
                                    variant={field.value === method ? 'default' : 'outline'}
                                    onClick={() => field.onChange(method)}
                                    className="text-xs py-1 px-4 rounded-xl font-bold h-9 transition-all"
                                  >
                                    {method}
                                  </Button>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Attachment (Optional)</Label>
                        <div className="border-2 border-dashed border-border/80 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all flex flex-col items-center justify-center relative">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const selectedFile = e.target.files?.[0];
                              if (selectedFile) handleAttachmentUpload(selectedFile);
                            }}
                            disabled={uploading}
                          />
                          {uploading ? (
                            <>
                              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                              <p className="text-xs font-bold text-slate-700">Uploading to Secure Vault...</p>
                            </>
                          ) : inquiryForm.watch('attachmentUrl') ? (
                            <>
                              <FileText className="h-8 w-8 text-emerald-500 mb-2" />
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">File uploaded successfully!</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">{inquiryForm.watch('attachmentUrl')}</p>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-8 w-8 text-muted-foreground/60 mb-2 animate-bounce" />
                              <p className="text-xs font-bold text-slate-750">Drag & drop files here or <span className="text-primary hover:underline">click to browse</span></p>
                              <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, DOCX, PPT, XLS, ZIP (Max 10MB per file)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 border-b border-border/80 pb-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Internal Notes (Visible to your team only)</h4>
                      </div>

                      <FormField
                        control={inquiryForm.control}
                        name="internalNotes"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormControl>
                              <Textarea 
                                placeholder="Add any internal notes, context or next steps..." 
                                className="min-h-[140px] text-xs resize-none" 
                                maxLength={1000}
                                {...field} 
                              />
                            </FormControl>
                            <div className="flex justify-end text-[10px] text-muted-foreground mt-1">
                              <span>{(field.value || '').length}/1000</span>
                            </div>
                            <FormMessage className="text-xs text-rose-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </form>
              </Form>

              {/* Sticky Dialog Footer */}
              <DialogFooter className="p-6 bg-accent/15 border-t border-border/80 flex flex-row items-center justify-between shrink-0 font-sans">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowInquiryDialog(false);
                    setEditingInquiry(null);
                  }}
                  className="border-border text-foreground hover:bg-accent/20 text-xs py-2 px-4 rounded-xl font-bold"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  disabled={loading}
                  onClick={() => void inquiryForm.handleSubmit(handleInquirySubmit)()}
                  className="bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2 px-5 rounded-xl border-none shadow-sm flex items-center gap-1.5 font-sans"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingInquiry ? 'Update Opportunity' : 'Create Opportunity'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      }

      {/* CRM Visual Tabs Console */}
      <Tabs defaultValue="pipeline" className="space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
          <TabsList className="bg-transparent gap-1">
            <TabsTrigger value="pipeline" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              Visual Pipeline Stages
            </TabsTrigger>
            <TabsTrigger value="forecast" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              Forecast Analytics
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs font-bold px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">
              Inquiries Ledger
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button onClick={fetchInquiries} variant="outline" size="sm" className="h-8 text-xs font-bold">
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Tab 1: Kanban Pipeline stages */}
        <TabsContent value="pipeline">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
            
            {pipelineStages.map((stage) => {
              const stageItems = pipelineGroups[stage] || [];
              const totalEstValue = stageItems.reduce((acc, inq) => acc + (inq.estimatedValue !== null && inq.estimatedValue !== undefined ? Number(inq.estimatedValue) : 0), 0);
              
              return (
                <div key={stage} className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl min-h-[400px] flex flex-col">
                  
                  {/* Stage Title */}
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-xs font-extrabold text-slate-700 dark:text-slate-200">{stage.replace(/_/g, ' ')}</span>
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black h-4 w-4 p-0 flex items-center justify-center rounded-full">
                        {stageItems.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Stage Cards */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
                    {stageItems.length === 0 ? (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-850 rounded-xl p-4">
                        <p className="text-[10px] text-muted-foreground/60 italic text-center font-medium">Empty Stage</p>
                      </div>
                    ) : (
                      stageItems.map((inquiry) => (
                        <Card key={inquiry.id} className="border-slate-150 dark:border-slate-800 shadow-xs hover:border-primary/45 transition-colors cursor-pointer bg-white dark:bg-slate-900">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 truncate">{inquiry.aliasName}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-slate-400 hover:text-yellow-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavourite(inquiry);
                                }}
                              >
                                {inquiry.isFavourite ? (
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ) : (
                                  <StarOff className="h-3 w-3" />
                                )}
                              </Button>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {getTagBadge(inquiry.tag)}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold">
                              <span className="text-primary">₹{(inquiry.estimatedValue !== null && inquiry.estimatedValue !== undefined ? Number(inquiry.estimatedValue) : 0).toLocaleString('en-IN')}</span>
                              <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {inquiry.dueDate ? new Date(inquiry.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : '—'}
                              </span>
                            </div>

                            {/* Actions block */}
                            <div className="flex items-center justify-end gap-1.5 pt-1.5">
                              <button 
                                onClick={() => {
                                  fetchInquiryFeeds(inquiry.id);
                                  setShowFeedDialog(true);
                                }}
                                className="text-[9px] font-black text-primary hover:text-primary/80 transition-colors"
                              >
                                Feeds
                              </button>
                              {canEdit && (
                                <button 
                                  onClick={() => openEditDialog(inquiry)}
                                  className="text-[9px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                              {canDelete && (
                                <button 
                                  onClick={() => setDeletingInquiry(inquiry)}
                                  className="text-[9px] font-black text-rose-400 hover:text-rose-600 transition-colors"
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Stage Forecast Summary Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                    <span>Forecast stage:</span>
                    <span className="text-slate-800 dark:text-slate-100">₹{totalEstValue.toLocaleString('en-IN')}</span>
                  </div>

                </div>
              );
            })}

          </div>
        </TabsContent>

        {/* Tab 2: Forecast Pipeline Analytics */}
        <TabsContent value="forecast">
          {(() => {
            const totalPipelineWorth = inquiries.reduce((acc, inq) => acc + (inq.estimatedValue !== null && inq.estimatedValue !== undefined ? Number(inq.estimatedValue) : 0), 0);
            const avgDealValue = inquiries.length > 0 ? Math.round(totalPipelineWorth / inquiries.length) : 0;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Opportunity forecast charts */}
                <Card className="col-span-1 border-slate-150 dark:border-slate-800 shadow-xs bg-card">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-indigo-500" />
                      Expected Forecast Yield
                    </CardTitle>
                    <CardDescription>Estimated value mapped across dynamic pipeline stages.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pipelineStages.map((stage) => {
                      const stageItems = inquiries.filter(inq => (inq.status || 'lead').toLowerCase() === stage);
                      const value = stageItems.reduce((acc, inq) => acc + (inq.estimatedValue !== null && inq.estimatedValue !== undefined ? Number(inq.estimatedValue) : 0), 0);
                      const maxPossible = totalPipelineWorth > 0 ? totalPipelineWorth : 1000000;
                      const percent = Math.min((value / maxPossible) * 100, 100);
                      
                      return (
                        <div key={stage} className="space-y-1.5" id={`forecast-stage-${stage}`}>
                          <div className="flex justify-between text-xs font-bold">
                            <span className="capitalize text-slate-700 dark:text-slate-350">{stage.replace(/_/g, ' ')}</span>
                            <span className="text-primary font-black">₹{value.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Quick target forecast analytics panels */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Pipeline Worth</span>
                        <DollarSign className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <h3 className="text-2xl font-black mt-3 text-slate-900 dark:text-white">
                        ₹{totalPipelineWorth.toLocaleString('en-IN')}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">Active pipeline cumulative worth.</p>
                    </Card>

                    <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Avg. Deal Value</span>
                        <BarChart3 className="h-4.5 w-4.5 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-black mt-3 text-slate-900 dark:text-white">
                        ₹{avgDealValue.toLocaleString('en-IN')}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">Computed across all estimations.</p>
                    </Card>

                    <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/10 p-5">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Win Rate</span>
                        <Target className="h-4.5 w-4.5 text-emerald-600" />
                      </div>
                      <h3 className="text-2xl font-black mt-3 text-emerald-600 dark:text-emerald-400">
                        {winRate}%
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">{wonDeals} won of {totalClosed} closed deals.</p>
                    </Card>

                    <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/10 p-5">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Active Leads</span>
                        <Layers className="h-4.5 w-4.5 text-indigo-600" />
                      </div>
                      <h3 className="text-2xl font-black mt-3 text-indigo-600 dark:text-indigo-400">
                        {inquiries.filter(inq => !['hired', 'rejected_client', 'rejected_us', 'hired_someone_else'].includes(inq.status)).length}
                      </h3>
                      <p className="text-[10px] text-muted-foreground mt-1">In-progress opportunity leads.</p>
                    </Card>
                  </div>

                  {/* CRM opportunity forecast tips */}
                  <Card className="border-slate-150 dark:border-slate-800 bg-amber-500/10 p-5 rounded-xl border-dashed">
                    <div className="flex gap-3">
                      <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">AI Forecast Recommendation</h4>
                          {aiProvider && (
                            <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-bold text-amber-800 bg-amber-250/20 border-none shrink-0">
                              {aiProvider}
                            </Badge>
                          )}
                        </div>
                        {aiLoading ? (
                          <div className="flex items-center gap-2 py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                            <span className="text-[11px] text-slate-550 font-bold">Synthesizing CRM analytics forecast data...</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line font-semibold">
                            {aiAdvice}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                </div>

              </div>
            );
          })()}
        </TabsContent>

        {/* Tab 3: Detailed Ledger & Inquiries Table */}
        <TabsContent value="table">
          <Card className="border-slate-150 dark:border-slate-800 shadow-xs">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                
                {/* Custom Filters toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search alias name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 text-xs h-8.5 rounded-lg"
                    />
                  </div>

                  <select 
                    value={selectedTag} 
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs py-1 px-3"
                  >
                    <option value="all">All Tags</option>
                    <option value="need_estimation">Need Estimation</option>
                    <option value="rough_estimation">Rough Estimation</option>
                    <option value="scheduling_meeting">Scheduling Meeting</option>
                    <option value="need_schedule_meeting">Need Schedule Meeting</option>
                    <option value="hired">Hired</option>
                    <option value="hired_someone_else">Hired Someone Else</option>
                  </select>

                  <select 
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs py-1 px-3"
                  >
                    <option value="all">All Statuses</option>
                    <option value="lead">Lead</option>
                    <option value="no_reply">No Reply</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="hired">Hired</option>
                    <option value="rejected_client">Rejected by Client</option>
                    <option value="rejected_us">Rejected by Us</option>
                    <option value="invite_lead">Invite Lead</option>
                    <option value="invite_hire">Invite Hire</option>
                    <option value="not_good_client">Not Good Client</option>
                    <option value="budget_low">Budget Low</option>
                    <option value="cant_work">Can't Work</option>
                    <option value="hired_someone_else">Hired Someone Else</option>
                  </select>

                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs h-8.5"
                  />

                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-xs h-8.5"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={fetchInquiries} className="bg-primary text-white text-xs font-bold h-8.5 px-4 rounded-lg">
                    Apply Filter
                  </Button>
                  <Button onClick={clearAllFilters} variant="outline" className="text-xs font-bold h-8.5 px-4 rounded-lg">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">ID</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Client / Alias</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Contact Person</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Tech Tag</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Estimated Value</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Due Date</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Pipeline Stage</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-right text-xs">Actions</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {inquiries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground/60 italic font-semibold">
                          No inquiries matching search constraints.
                        </TableCell>
                      </TableRow>
                    ) : (
                      inquiries.slice(inquiryPage * pageSize, (inquiryPage + 1) * pageSize).map((inquiry) => (
                        <TableRow key={inquiry.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/5 transition-colors">
                          <TableCell className="px-6 py-4 font-mono text-xs font-bold text-primary">#{inquiry.id}</TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{inquiry.aliasName}</span>
                                {inquiry.companyName && (
                                  <span className="text-[10px] text-muted-foreground font-semibold">{inquiry.companyName}</span>
                                )}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-slate-400 hover:text-yellow-500"
                                onClick={() => toggleFavourite(inquiry)}
                              >
                                {inquiry.isFavourite ? (
                                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                ) : (
                                  <StarOff className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-xs">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{inquiry.contactPerson || '—'}</span>
                              {inquiry.designation && (
                                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider mt-0.5">{inquiry.designation}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">{getTagBadge(inquiry.tag)}</TableCell>
                          <TableCell className="px-6 py-4 font-bold text-xs">
                            ₹{(inquiry.estimatedValue !== null && inquiry.estimatedValue !== undefined ? Number(inquiry.estimatedValue) : 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-muted-foreground font-semibold text-xs">
                            {inquiry.dueDate ? new Date(inquiry.dueDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="px-6 py-4">{getStatusBadge(inquiry.status)}</TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              {inquiry.status !== 'hired' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleConvertToClient(inquiry.id)}
                                  disabled={converting}
                                  className="h-8 text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/20 border-emerald-500/20 flex items-center gap-1 bg-transparent shrink-0"
                                >
                                  {converting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                                  Convert to Client
                                </Button>
                              )}
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(inquiry)}
                                  className="h-8 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                >
                                  Edit
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingInquiry(inquiry)}
                                  className="h-8 text-xs font-bold text-rose-500 hover:text-rose-600"
                                >
                                  Archive
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-muted-foreground">
                Showing {Math.min(inquiryPage * pageSize + 1, inquiries.length)}–{Math.min((inquiryPage + 1) * pageSize, inquiries.length)} of {inquiries.length} inquiries
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={inquiryPage === 0}
                  onClick={() => setInquiryPage(inquiryPage - 1)}
                  className="h-8 text-xs font-bold px-3"
                >
                  Previous
                </Button>
                <span className="text-xs font-black text-slate-600 dark:text-slate-300 min-w-[60px] text-center">
                  Page {inquiryPage + 1} / {Math.max(1, Math.ceil(inquiries.length / pageSize))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(inquiryPage + 1) * pageSize >= inquiries.length}
                  onClick={() => setInquiryPage(inquiryPage + 1)}
                  className="h-8 text-xs font-bold px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feed Dialog log comment */}
      <Dialog open={showFeedDialog} onOpenChange={setShowFeedDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Inquiry Coordination Feeds
            </DialogTitle>
            <DialogDescription>
              Read or add internal progress notes regarding current tech estimates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[250px] overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-800 pr-1">
            {feedsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : inquiryFeeds.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic text-center py-6 font-semibold">No coordination notes registered yet.</p>
            ) : (
              inquiryFeeds.map((feed) => (
                <div key={feed.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-start gap-4">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-850 dark:text-slate-200">System Log</span>
                      {feed.technology && <Badge variant="secondary" className="text-[9px] py-0 px-1 font-bold">{feed.technology}</Badge>}
                    </div>
                    <p className="text-slate-600 dark:text-slate-350">{feed.description}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-semibold">{new Date(feed.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>

          <Form {...feedForm}>
            <form onSubmit={feedForm.handleSubmit(handleFeedSubmit)} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Target Tech Parameter</Label>
                <Input {...feedForm.register('technology')} placeholder="e.g. React Native, PostgreSQL" className="text-xs h-8.5" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Coordination Note *</Label>
                <Textarea {...feedForm.register('description')} placeholder="Log a client requirement update..." className="text-xs resize-none" required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowFeedDialog(false)} className="text-xs font-bold">
                  Close
                </Button>
                <Button type="submit" className="bg-primary text-white text-xs font-bold">
                  Add Coordination Note
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete/Archive Alert dialog */}
      <AlertDialog open={!!deletingInquiry} onOpenChange={(open) => !open && setDeletingInquiry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently archive the client inquiry opportunity. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInquiry} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">
              Archive Opportunity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
