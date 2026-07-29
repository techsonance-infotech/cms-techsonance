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
import { clientStatusOptions } from '@/lib/forms/schemas';
import { Loader2, Building2, User, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/* ─── Enhanced client form schema with proper error messages ─── */
const phonePattern = /^\+?[\d\s\-()+]+$/;

const clientFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name cannot exceed 200 characters'),
  contactPerson: z
    .string()
    .trim()
    .min(2, 'Contact person name must be at least 2 characters')
    .max(200, 'Name cannot exceed 200 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .max(255, 'Email address is too long'),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => !v || phonePattern.test(v),
      'Enter a valid phone number (digits, +, -, spaces, parentheses only)'
    )
    .refine(
      (v) => !v || v.replace(/\D/g, '').length >= 7,
      'Phone number must have at least 7 digits'
    )
    .refine(
      (v) => !v || v.replace(/\D/g, '').length <= 15,
      'Phone number must not exceed 15 digits'
    ),
  address: z
    .string()
    .trim()
    .max(500, 'Address cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  status: z.enum(clientStatusOptions, {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .or(z.literal('')),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  client?: any;
}

const industryOptions = [
  'Technology', 'Healthcare', 'Finance & Banking', 'Education',
  'E-Commerce', 'Manufacturing', 'Real Estate', 'Media & Entertainment',
  'Logistics & Supply Chain', 'Government', 'Non-Profit',
  'Consulting', 'Retail', 'Hospitality', 'Other',
] as const;

const statusConfig = [
  { value: 'active',   label: 'Active',   dot: 'bg-emerald-500' },
  { value: 'prospect', label: 'Prospect', dot: 'bg-amber-500'   },
  { value: 'inactive', label: 'Inactive', dot: 'bg-gray-400'    },
];

export function ClientFormDialog({ open, onOpenChange, onSuccess, client }: ClientFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: '', contactPerson: '', email: '',
      phone: '', address: '', industry: '', status: 'active', notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        client
          ? {
              companyName:   client.companyName   || '',
              contactPerson: client.contactPerson || '',
              email:         client.email         || '',
              phone:         client.phone         || '',
              address:       client.address       || '',
              industry:      client.industry      || '',
              status:        client.status        || 'active',
              notes:         client.notes         || '',
            }
          : { companyName: '', contactPerson: '', email: '', phone: '', address: '', industry: '', status: 'active', notes: '' }
      );
    }
  }, [client, open, form]);

  const handleSubmit = async (values: ClientFormValues) => {
    // Clear any previous root-level error before each attempt
    form.clearErrors('root');
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const url    = client ? `/api/clients?id=${client.id}` : '/api/clients';
      const method = client ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          companyName:   values.companyName.trim(),
          contactPerson: values.contactPerson.trim(),
          email:         values.email.trim().toLowerCase(),
          phone:         values.phone?.trim()    || null,
          address:       values.address?.trim()  || null,
          industry:      values.industry?.trim() || null,
          status:        values.status,
          notes:         values.notes?.trim()    || null,
        }),
      });

      if (response.ok) {
        // Only use toast for the success notification — keeps UX consistent
        toast.success(client ? 'Client updated successfully' : 'Client added successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        const error  = await response.json();
        const message: string = error.message || error.error || 'Failed to save client';
        // Map specific field conflicts directly to the offending field
        if (message.toLowerCase().includes('email')) {
          form.setError('email', { message });
        } else if (message.toLowerCase().includes('phone')) {
          form.setError('phone', { message });
        } else {
          // Generic server error — show as form-level banner, NOT a toast
          form.setError('root', { message });
        }
      }
    } catch {
      // Network / unexpected error — show inside the form so modal stays focused
      form.setError('root', { message: 'An unexpected error occurred. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <DialogHeader className="pb-5 border-b border-border/40">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            {client ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {client
              ? "Update the client's profile and contact information."
              : 'Fill in the details below to onboard a new client into the system.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-7 pt-2">

            {/* ── Section 1: Company Identity ── */}
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" /> Company Identity
              </p>
              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="companyName" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">
                      Company Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="companyName" placeholder="e.g. Acme Corporation Pvt. Ltd." className="pl-9 h-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="industry" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">Industry</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industryOptions.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ── Section 2: Contact Details ── */}
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Contact Details
              </p>

              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">
                      Contact Person <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="contactPerson" placeholder="e.g. Rahul Sharma" className="pl-9 h-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                      Email Address <span className="text-destructive">*</span>
                      <span className="text-[10px] font-normal text-amber-500 dark:text-amber-400">(must be unique)</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="contact@company.com" className="pl-9 h-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-5">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                      Phone Number
                      <span className="text-[10px] font-normal text-amber-500 dark:text-amber-400">(must be unique)</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="phone" type="tel" placeholder="+91 98765 43210" className="pl-9 h-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold">
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusConfig.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* ── Section 3: Additional Information ── */}
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Additional Information
              </p>

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold">Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="address" placeholder="123 Business Park, Surat, Gujarat - 395007" className="pl-9 h-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-semibold">Internal Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      id="notes"
                      {...field}
                      rows={3}
                      placeholder="Key account details, preferred communication style, billing contacts, etc."
                      className="resize-none text-sm"
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage className="text-xs" />
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {(field.value?.length ?? 0)}/2000
                    </span>
                  </div>
                </FormItem>
              )} />
            </div>

            {/* ── Root-level error banner (server / network errors) ── */}
            {form.formState.errors.root && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{form.formState.errors.root.message}</span>
              </div>
            )}

            {/* ── Footer ── */}
            <DialogFooter className="pt-4 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/95 text-white min-w-[140px]"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  client ? 'Update Client' : 'Add Client'
                )}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
