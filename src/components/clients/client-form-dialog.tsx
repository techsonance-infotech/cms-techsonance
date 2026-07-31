// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, Building2, User, Mail, Phone, MapPin, 
  AlertCircle, Globe, Briefcase, Users, FileText, 
  IndianRupee, Calendar, ShieldCheck, DollarSign, UploadCloud, X
} from 'lucide-react';
import { toast } from 'sonner';

const clientStatusOptions = ['active', 'inactive', 'prospect'] as const;

const clientFormSchema = z.object({
  companyName: z.string().trim().min(1, 'Company Name is required').max(200),
  contactPerson: z.string().trim().min(1, 'Contact Person is required').max(200),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: z.string().trim().min(1, 'Mobile Number is required').max(30),
  website: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  industry: z.string().trim().min(1, 'Industry is required').max(100),
  businessType: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  companySize: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  companyEmail: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  companyPhone: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  designation: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  leadSource: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  accountOwner: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  interestedServices: z.string().trim().max(255).optional().nullable().or(z.literal('')),
  priority: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  estimatedBudget: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  expectedStartDate: z.string().trim().max(50).optional().nullable().or(z.literal('')),
  currency: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  paymentTerms: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  status: z.enum(clientStatusOptions).optional(),
  onboardingStep: z.number().int().min(1).max(4).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  city: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  state: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  country: z.string().trim().max(100).optional().nullable().or(z.literal('')),
  postalCode: z.string().trim().max(20).optional().nullable().or(z.literal('')),
  logoUrl: z.string().trim().max(500).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (client?: any) => void;
  client?: any;
}

export function ClientFormDialog({ open, onOpenChange, onSuccess, client }: ClientFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Manage files state local to this dialog
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: '', contactPerson: '', email: '', phone: '',
      website: '', industry: '', businessType: '', companySize: '',
      companyEmail: '', companyPhone: '', designation: '', leadSource: '',
      accountOwner: '', interestedServices: '', priority: 'Medium',
      estimatedBudget: '', expectedStartDate: '', currency: 'INR',
      paymentTerms: 'Net 30', status: 'active', onboardingStep: 1,
      address: '', city: '', state: '', country: '', postalCode: '',
      logoUrl: '', notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        form.reset({
          companyName: client.companyName || '',
          contactPerson: client.contactPerson || '',
          email: client.email || '',
          phone: client.phone || '',
          website: client.website || '',
          industry: client.industry || '',
          businessType: client.businessType || '',
          companySize: client.companySize || '',
          companyEmail: client.companyEmail || '',
          companyPhone: client.companyPhone || '',
          designation: client.designation || '',
          leadSource: client.leadSource || '',
          accountOwner: client.accountOwner || '',
          interestedServices: client.interestedServices || '',
          priority: client.priority || 'Medium',
          estimatedBudget: client.estimatedBudget || '',
          expectedStartDate: client.expectedStartDate || '',
          currency: client.currency || 'INR',
          paymentTerms: client.paymentTerms || 'Net 30',
          status: client.status || 'active',
          onboardingStep: client.onboardingStep || 1,
          address: client.address || '',
          city: client.city || '',
          state: client.state || '',
          country: client.country || '',
          postalCode: client.postalCode || '',
          logoUrl: client.logoUrl || '',
          notes: client.notes || '',
        });
      } else {
        form.reset({
          companyName: '', contactPerson: '', email: '', phone: '',
          website: '', industry: '', businessType: '', companySize: '',
          companyEmail: '', companyPhone: '', designation: '', leadSource: '',
          accountOwner: '', interestedServices: '', priority: 'Medium',
          estimatedBudget: '', expectedStartDate: '', currency: 'INR',
          paymentTerms: 'Net 30', status: 'active', onboardingStep: 1,
          address: '', city: '', state: '', country: '', postalCode: '',
          logoUrl: '', notes: '',
        });
        setUploadedFiles([]);
        setUploadedFileIds([]);
      }
    }
  }, [client, open, form]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error('Logo cannot exceed 1MB in size.');
      return;
    }

    setUploadingLogo(true);
    const toastId = toast.loading('Uploading company logo...');
    try {
      const token = localStorage.getItem('session_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'logo');
      formData.append('moduleName', 'clients');
      formData.append('entityType', 'logo');
      formData.append('entityId', 'draft');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data ?? result;
        form.setValue('logoUrl', data.secureUrl || data.url);
        toast.success('Logo uploaded successfully', { id: toastId });
      } else {
        toast.error('Failed to upload logo', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Logo upload error', { id: toastId });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const mimeType = file.type;
    const fileNameLower = file.name.toLowerCase();

    const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/jpg' || 
                    fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png');
    const isPdf = mimeType === 'application/pdf' || fileNameLower.endsWith('.pdf');
    const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx');

    if (!isImage && !isPdf && !isDocx) {
      toast.error("Only PDF, DOCX, and images (JPG, JPEG, PNG) are accepted.");
      return;
    }

    if (isImage && file.size > 1 * 1024 * 1024) {
      toast.error("Image file size cannot exceed 1MB.");
      return;
    }

    if ((isPdf || isDocx) && file.size > 2 * 1024 * 1024) {
      toast.error("Document file size cannot exceed 2MB.");
      return;
    }

    setUploadingDoc(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const token = localStorage.getItem('session_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'contract');
      formData.append('moduleName', 'clients');
      formData.append('entityType', 'contract');
      formData.append('entityId', 'draft');

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data ?? result;
        setUploadedFiles((prev) => [...prev, data]);
        setUploadedFileIds((prev) => [...prev, data.id]);
        toast.success(`${file.name} uploaded successfully`, { id: toastId });
      } else {
        toast.error('Failed to upload document', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Document upload error', { id: toastId });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    setUploadedFileIds((prev) => prev.filter((fid) => fid !== id));
  };

  const executeSubmit = async (values: ClientFormValues, customStatus?: 'active' | 'prospect') => {
    form.clearErrors('root');
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const url = client ? `/api/clients?id=${client.id}` : '/api/clients';
      const method = client ? 'PUT' : 'POST';

      const payload = {
        ...values,
        uploadedFileIds,
      };
      if (customStatus) {
        payload.status = customStatus;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const saved = await response.json();
        toast.success(client ? 'Client updated successfully' : 'Client onboarded successfully');
        onSuccess(saved);
        onOpenChange(false);
      } else {
        const error = await response.json();
        const message = error.message || 'Failed to save client';
        const msgLower = message.toLowerCase();
        if (msgLower.includes('company name') || msgLower.includes('company_name')) {
          form.setError('companyName', { message });
        } else if (msgLower.includes('email')) {
          form.setError('email', { message });
        } else if (msgLower.includes('phone')) {
          form.setError('phone', { message });
        } else {
          form.setError('root', { message });
        }
      }
    } catch (err) {
      console.error(err);
      form.setError('root', { message: 'An unexpected connection error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1150px] max-w-[95vw] max-h-[90vh] overflow-hidden bg-card border-border text-foreground shadow-2xl rounded-2xl flex flex-col p-0">
        
        {/* Header banner */}
        <DialogHeader className="p-6 bg-accent/15 border-b border-border/80 shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-black text-foreground">
            <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            {client ? 'Edit Client Profile' : 'Add New Client'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 font-semibold uppercase tracking-wider">
            {client ? 'Modify active enterprise accounts and metadata' : 'Capture essential details to kickstart organization accounts'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => executeSubmit(v))} className="flex-1 overflow-y-auto p-6 space-y-8">
            {form.formState.errors.root && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{form.formState.errors.root.message}</span>
              </div>
            )}

            {/* 1. Company Information */}
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
                Company Information
              </p>
              
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Logo Box */}
                <div className="w-28 h-28 border border-border border-dashed rounded-xl bg-accent/5 flex flex-col items-center justify-center relative group shrink-0 overflow-hidden">
                  {form.watch('logoUrl') ? (
                    <>
                      <img src={form.watch('logoUrl')} alt="Logo" className="w-full h-full object-contain p-2" />
                      <button 
                        type="button" 
                        onClick={() => form.setValue('logoUrl', '')}
                        className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer p-2 text-center text-[10px] text-muted-foreground font-bold uppercase hover:text-foreground">
                      <UploadCloud className="h-6 w-6 text-muted-foreground/60 mb-1" />
                      <span>{uploadingLogo ? '...' : 'Upload Logo'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </label>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold">Company Name *</FormLabel>
                      <FormControl><Input placeholder="Acme Corporation" className="h-10" {...field} /></FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" /> Website
                      </FormLabel>
                      <FormControl><Input placeholder="https://acme.com" className="h-10" {...field} /></FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold">Industry *</FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select industry" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Technology & SaaS">Technology & SaaS</SelectItem>
                          <SelectItem value="Healthcare & Pharma">Healthcare & Pharma</SelectItem>
                          <SelectItem value="Finance & Banking">Finance & Banking</SelectItem>
                          <SelectItem value="E-commerce & Retail">E-commerce & Retail</SelectItem>
                          <SelectItem value="Education & EdTech">Education & EdTech</SelectItem>
                          <SelectItem value="Real Estate & Construction">Real Estate & Construction</SelectItem>
                          <SelectItem value="Logistics & Supply Chain">Logistics & Supply Chain</SelectItem>
                          <SelectItem value="Consulting & Business Services">Consulting & Business Services</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="businessType" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold">Business Type</FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Corporation">Corporation</SelectItem>
                          <SelectItem value="LLP">LLP</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Sole Proprietor">Sole Proprietorship</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="companySize" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Company Size
                      </FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select size" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 Employees</SelectItem>
                          <SelectItem value="11-50">11-50 Employees</SelectItem>
                          <SelectItem value="51-200">51-200 Employees</SelectItem>
                          <SelectItem value="201-500">201-500 Employees</SelectItem>
                          <SelectItem value="500+">500+ Employees</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="companyEmail" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> Company Email
                      </FormLabel>
                      <FormControl><Input type="email" placeholder="hello@acme.com" className="h-10" {...field} /></FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="companyPhone" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> Company Phone
                      </FormLabel>
                      <FormControl><Input placeholder="+91 (124) 456-7890" className="h-10" {...field} /></FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>

            {/* 2. Primary Contact */}
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
                Primary Contact Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Contact Person *
                    </FormLabel>
                    <FormControl><Input placeholder="John Doe" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> Designation
                    </FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select designation" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="CEO / Founder">CEO / Founder</SelectItem>
                        <SelectItem value="CTO / Head of Engineering">CTO / Head of Engineering</SelectItem>
                        <SelectItem value="VP of Procurement">VP of Procurement</SelectItem>
                        <SelectItem value="Director of Operations">Director of Operations</SelectItem>
                        <SelectItem value="Product Manager">Product Manager</SelectItem>
                        <SelectItem value="HR Manager">HR Manager</SelectItem>
                        <SelectItem value="General Counsel">General Counsel</SelectItem>
                        <SelectItem value="Account Director">Account Director</SelectItem>
                        <SelectItem value="Account Manager">Account Manager</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> Contact Email *
                    </FormLabel>
                    <FormControl><Input type="email" placeholder="john.doe@acme.com" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> Mobile Number *
                    </FormLabel>
                    <FormControl><Input placeholder="+91 98765 43210" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* 3. Business Information */}
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
                Business & Account Settings
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <FormField control={form.control} name="leadSource" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">Lead Source</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Website">Website Sign-up</SelectItem>
                        <SelectItem value="Referral">Client Referral</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn Outreach</SelectItem>
                        <SelectItem value="Cold Campaign">Cold Campaign</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="accountOwner" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Account Owner
                    </FormLabel>
                    <FormControl><Input placeholder="Jane Account Manager" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="interestedServices" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> Services Interested
                    </FormLabel>
                    <FormControl><Input placeholder="Custom ERP, Legal Consulting" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">Priority</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="estimatedBudget" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" /> Estimated Budget
                    </FormLabel>
                    <FormControl><Input placeholder="e.g. ₹5,00,000" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="expectedStartDate" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Expected Start Date
                    </FormLabel>
                    <FormControl><Input type="date" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* 4. Billing & Status */}
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
                Billing & Status
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> Currency
                    </FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">Payment Terms</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select terms" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">Client Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="h-10"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="onboardingStep" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Onboarding Stage
                    </FormLabel>
                    <Select 
                      value={field.value ? String(field.value) : '1'} 
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select stage" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="1">1. Legal Contract</SelectItem>
                        <SelectItem value="2">2. Provisioning</SelectItem>
                        <SelectItem value="3">3. KT Transfer</SelectItem>
                        <SelectItem value="4">4. Global Launch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* 5. Address */}
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
                Corporate Address
              </p>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                <div className="md:col-span-2">
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> Address
                      </FormLabel>
                      <FormControl><Input placeholder="123 Corporate Blvd Suite 400" className="h-10" {...field} /></FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">City</FormLabel>
                    <FormControl><Input placeholder="Gurugram" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">State</FormLabel>
                    <FormControl><Input placeholder="Haryana" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">Country</FormLabel>
                    <FormControl><Input placeholder="India" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="postalCode" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">Postal Code</FormLabel>
                    <FormControl><Input placeholder="122001" className="h-10" {...field} /></FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* 6. Documents Drag & Drop area */}
            {!client && (
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
                  Onboarding Documents
                </p>
                <div className="border border-dashed border-border rounded-xl p-6 bg-accent/5 hover:bg-accent/10 transition-colors text-center relative">
                  <input 
                    type="file" 
                    id="doc-creation-upload" 
                    className="hidden" 
                    onChange={handleDocumentUpload} 
                    disabled={uploadingDoc} 
                  />
                  <label htmlFor="doc-creation-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                    <UploadCloud className="h-8 w-8 text-primary/60 animate-bounce" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Drag & Drop documents here, or <span className="text-primary hover:underline">browse files</span></p>
                      <p className="text-[10px] text-muted-foreground mt-1">Upload GST, NDA, Proposals, or Profiles (PDF, DOCX, Images up to 2MB)</p>
                    </div>
                  </label>
                </div>

                {/* Uploaded files index */}
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="p-3 bg-card border border-border/80 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-bold truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground bg-accent/10 px-2 py-0.5 rounded-full">{file.format}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveFile(file.id)}
                            className="text-muted-foreground hover:text-rose-600 transition-colors p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 7. Internal Notes */}
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
                Internal Notes
              </p>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormControl>
                    <Textarea 
                      placeholder="Capture strategic goals, special SLA instructions, or billing arrangements for this account..." 
                      className="min-h-[100px] text-xs resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>
          </form>
        </Form>

        {/* Footer controls */}
        <DialogFooter className="p-6 bg-accent/15 border-t border-border/80 flex flex-row items-center justify-between shrink-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-border text-foreground hover:bg-accent/20 text-xs py-2 px-4 rounded-xl font-bold"
          >
            Cancel
          </Button>

          <div className="flex gap-2">
            {!client && (
              <Button 
                type="button" 
                variant="outline"
                disabled={loading}
                onClick={form.handleSubmit((v) => executeSubmit(v, 'prospect'))}
                className="border-primary/20 text-primary hover:bg-primary/5 text-xs py-2 px-4 rounded-xl font-bold bg-transparent"
              >
                Save Draft
              </Button>
            )}
            
            <Button 
              type="button"
              disabled={loading}
              onClick={form.handleSubmit((v) => executeSubmit(v, 'active'))}
              className="bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2 px-5 rounded-xl border-none shadow-sm flex items-center gap-1.5"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {client ? 'Save Client' : 'Create Client'}
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
