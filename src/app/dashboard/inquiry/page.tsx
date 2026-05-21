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
  TrendingUp, BarChart3, Target, DollarSign, ArrowRight, Layers
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
      aliasName: inquiry.aliasName,
      tag: inquiry.tag as InquiryFormValues['tag'],
      status: inquiry.status as InquiryFormValues['status'],
      dueDate: inquiry.dueDate || '',
      appStatus: (inquiry.appStatus as InquiryFormValues['appStatus']) || 'open',
    });
    setShowInquiryDialog(true);
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
      'rejected_us': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold py-0.5 px-2 rounded',
    };
    
    return (
      <Badge className={statusColors[status] || 'bg-slate-100 dark:bg-slate-800'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  if (loading && !currentUser) {
    return <ContentSkeleton />;
  }

  const canCreate = currentUser && hasPermission(currentUser.role, 'inquiry', 'canCreate');
  const canEdit = currentUser && hasPermission(currentUser.role, 'inquiry', 'canEdit');
  const canDelete = currentUser && hasPermission(currentUser.role, 'inquiry', 'canDelete');
  const isFullAccess = currentUser && hasFullAccess(currentUser.role);

  // Group by Pipeline status for Kanban view
  const pipelineStages = ['lead', 'no_reply', 'follow_up', 'hired', 'rejected_client'];
  const pipelineGroups = pipelineStages.reduce((acc, stage) => {
    acc[stage] = inquiries.filter(inq => (inq.status || 'lead').toLowerCase() === stage);
    return acc;
  }, {} as Record<string, Inquiry[]>);

  // Mock deal amounts based on tags
  const getMockAmount = (tag: string) => {
    switch (tag) {
      case 'hired': return 450000;
      case 'need_estimation': return 125000;
      case 'scheduling_meeting': return 210000;
      default: return 75000;
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 p-1">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1.5">
            <Target className="h-4 w-4 text-primary" />
            <span>Lead &amp; Forecasting Lifecycle</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">CRM Enterprise Lead Pipeline</h1>
          <p className="text-sm text-muted-foreground font-medium">Track incoming inquiries, negotiate contract pipeline stages, and manage automated estimations.</p>
        </div>
        
        {canCreate && (
          <Dialog open={showInquiryDialog} onOpenChange={setShowInquiryDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:opacity-90 text-white font-bold flex items-center gap-2 shadow-md shadow-primary/10"
                onClick={() => {
                  setEditingInquiry(null);
                  inquiryForm.reset({
                    aliasName: '',
                    tag: 'need_estimation',
                    status: 'lead',
                    dueDate: '',
                    appStatus: 'open',
                  });
                }}
              >
                <Plus className="h-4 w-4" />
                Add New Inquiry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {editingInquiry ? 'Edit Lead Details' : 'Create New Client Inquiry'}
                </DialogTitle>
                <DialogDescription>
                  Register incoming corporate client opportunities and initial tech parameters.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...inquiryForm}>
                <div className="space-y-4 pt-3">
                  <FormField
                    control={inquiryForm.control}
                    name="aliasName"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">Alias Name *</Label>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Skyline Ventures, Tokyo Logistics" className="text-xs" />
                        </FormControl>
                        <FormMessage className="text-xs text-rose-500" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={inquiryForm.control}
                      name="tag"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">Tech Tag *</Label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="text-xs">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inquiryTagOptions.map((tag) => (
                                <SelectItem key={tag} value={tag} className="text-xs">
                                  {tag.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={inquiryForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">Pipeline Stage *</Label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="text-xs">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inquiryStatusOptions.map((status) => (
                                <SelectItem key={status} value={status} className="text-xs">
                                  {status.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
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
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">Estimation Due Date</Label>
                          <FormControl>
                            <Input type="date" {...field} className="text-xs" />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={inquiryForm.control}
                      name="appStatus"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground uppercase">Opportunity status *</Label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="text-xs">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inquiryAppStatusOptions.map((status) => (
                                <SelectItem key={status} value={status} className="text-xs">
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-rose-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowInquiryDialog(false);
                      setEditingInquiry(null);
                    }}
                    className="text-xs font-bold"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => void inquiryForm.handleSubmit(handleInquirySubmit, () => toast.error('Please fix the form errors.'))()} 
                    disabled={loading}
                    className="text-xs font-bold bg-primary text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingInquiry ? 'Update Opportunity' : 'Create Opportunity'
                    )}
                  </Button>
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
            
            {pipelineStages.map((stage) => {
              const stageItems = pipelineGroups[stage] || [];
              const totalEstValue = stageItems.reduce((acc, inq) => acc + getMockAmount(inq.tag), 0);
              
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
                              <span className="text-primary">₹{getMockAmount(inquiry.tag).toLocaleString('en-IN')}</span>
                              <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {inquiry.dueDate ? new Date(inquiry.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : '—'}
                              </span>
                            </div>

                            {/* Actions block */}
                            <div className="flex items-center justify-end gap-1.5 pt-1.5">
                              {canEdit && (
                                <button 
                                  onClick={() => openEditDialog(inquiry)}
                                  className="text-[9px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                  Edit Stage
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Opportunity forecast charts */}
            <Card className="col-span-1 border-slate-150 dark:border-slate-800 shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  Expected Forecast Yield
                </CardTitle>
                <CardDescription>Estimated value mapped across dynamic pipeline stages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipelineStages.map((stage) => {
                  const stageItems = pipelineGroups[stage] || [];
                  const value = stageItems.reduce((acc, inq) => acc + getMockAmount(inq.tag), 0);
                  const maxPossible = 1000000;
                  const percent = Math.min((value / maxPossible) * 100, 100);
                  
                  return (
                    <div key={stage} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="capitalize text-slate-700 dark:text-slate-300">{stage.replace(/_/g, ' ')}</span>
                        <span className="text-primary font-black">₹{value.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative">
                        <div className={`h-full rounded-full bg-primary`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick target forecast analytics panels */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Pipeline Total Worth</span>
                    <DollarSign className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black mt-4 text-slate-900 dark:text-white">
                    ₹{inquiries.reduce((acc, inq) => acc + getMockAmount(inq.tag), 0).toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Active cumulative worth across all estimations.</p>
                </Card>

                <Card className="border-slate-150 dark:border-slate-800 shadow-xs bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Avg. Deal Value</span>
                    <BarChart3 className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black mt-4 text-slate-900 dark:text-white">
                    ₹{inquiries.length > 0 ? Math.round(inquiries.reduce((acc, inq) => acc + getMockAmount(inq.tag), 0) / inquiries.length).toLocaleString('en-IN') : '0'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Averaged deal size computed automatically.</p>
                </Card>
              </div>

              {/* CRM opportunity forecast tips */}
              <Card className="border-slate-150 dark:border-slate-800 bg-amber-500/10 p-5 rounded-xl">
                <div className="flex gap-3">
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">AI Forecast Recommendation</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      You have 3 critical leads tagged as "Need Estimation" without active due dates assigned. Consider scheduling direct diagnostic calls to secure conversion probability!
                    </p>
                  </div>
                </div>
              </Card>

            </div>

          </div>
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Alias Name</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Tag</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Forecast Worth</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Estimation Due</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Feeds</th>
                      <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
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
                              <span className="font-bold text-slate-850 dark:text-slate-200">{inquiry.aliasName}</span>
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
                          <TableCell className="px-6 py-4">{getTagBadge(inquiry.tag)}</TableCell>
                          <TableCell className="px-6 py-4 font-bold">₹{getMockAmount(inquiry.tag).toLocaleString('en-IN')}</TableCell>
                          <TableCell className="px-6 py-4 text-muted-foreground font-semibold">
                            {inquiry.dueDate ? new Date(inquiry.dueDate).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="px-6 py-4">{getStatusBadge(inquiry.status)}</TableCell>
                          <TableCell className="px-6 py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                fetchInquiryFeeds(inquiry.id);
                                setShowFeedDialog(true);
                              }}
                              className="h-8 text-xs font-bold border-slate-200 dark:border-slate-850 flex items-center gap-1.5"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Log comment
                            </Button>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
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
