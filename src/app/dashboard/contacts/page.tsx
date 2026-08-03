'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Contact, Users, Search, Plus, RefreshCw, Download, Mail, Phone, Linkedin,
  Twitter, Star, Building2, Edit, Trash2, Loader2, AlertCircle, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Loading Skeleton ─── */
function ContactsSkeleton() {
  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-pulse">
      <div className="rounded-2xl bg-slate-100 dark:bg-[#37383E] h-36 flex flex-col justify-between p-6 md:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-3">
          <div className="h-6 w-60 bg-slate-200 dark:bg-zinc-800/80 rounded-lg"></div>
          <div className="h-3.5 w-96 bg-slate-200 dark:bg-zinc-800/80 rounded-lg"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#37383E] h-28 p-5">
            <div className="flex justify-between">
              <div className="h-3.5 w-20 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-6 w-12 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-9 w-9 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 bg-slate-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-2.5 w-24 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              </div>
              <div className="h-3 w-32 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-24 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ─── Form Validation Types ─── */
interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export default function ContactsPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editContact, setEditContact] = useState<any>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formTwitter, setFormTwitter] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formIsPrimary, setFormIsPrimary] = useState(false);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setFormName('');
    setFormDesignation('');
    setFormDepartment('');
    setFormEmail('');
    setFormPhone('');
    setFormLinkedin('');
    setFormTwitter('');
    setFormNotes('');
    setFormClientId('');
    setFormIsPrimary(false);
    setEditContact(null);
    setFormErrors({});
  };

  const fetchContacts = useCallback(async (isInitial = false) => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/contacts', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setContacts(json.contacts || []);
        setClients(json.clients || []);
        if (!isInitial) toast.success('Contacts synced successfully!');
      } else {
        const errJson = await res.json().catch(() => null);
        toast.error(errJson?.error || 'Failed to load contacts.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while fetching contacts.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(true);
  }, [fetchContacts]);

  /* ─── Form Validation ─── */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Name — required
    if (!formName.trim()) {
      errors.name = 'Full name is required.';
    } else if (formName.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    // Email — optional but must be valid format if provided
    if (formEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formEmail.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    // Phone — optional but basic format check if provided
    if (formPhone.trim()) {
      const stripped = formPhone.replace(/[\s\-\(\)\+]/g, '');
      if (stripped.length < 7 || !/^\d+$/.test(stripped)) {
        errors.phone = 'Please enter a valid phone number.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ─── Save (Create / Update) ─── */
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('session_token');
      const payload = {
        ...(editContact ? { id: editContact.id } : {}),
        name: formName.trim(),
        designation: formDesignation.trim(),
        department: formDepartment.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        social_linkedin: formLinkedin.trim(),
        social_twitter: formTwitter.trim(),
        notes: formNotes.trim(),
        client_id: formClientId || null,
        is_primary: formIsPrimary
      };

      const res = await fetch('/api/crm/contacts', {
        method: editContact ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        toast.success(editContact ? 'Contact updated successfully!' : 'Contact created successfully!');
        resetForm();
        setShowAddDialog(false);
        fetchContacts(true);
      } else {
        toast.error(json?.error || 'Failed to save contact. Please check your inputs.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while saving contact.');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Delete with confirmation ─── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/crm/contacts?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        toast.success(`Contact "${deleteTarget.name}" deleted.`);
        fetchContacts(true);
      } else {
        toast.error(json?.error || 'Failed to delete contact.');
      }
    } catch (err) {
      toast.error('Network error while deleting contact.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ─── Open Edit dialog ─── */
  const openEdit = (contact: any) => {
    setEditContact(contact);
    setFormName(contact.name || '');
    setFormDesignation(contact.designation || '');
    setFormDepartment(contact.department || '');
    setFormEmail(contact.email || '');
    setFormPhone(contact.phone || '');
    setFormLinkedin(contact.social_linkedin || '');
    setFormTwitter(contact.social_twitter || '');
    setFormNotes(contact.notes || '');
    setFormClientId(contact.client_id ? String(contact.client_id) : '');
    setFormIsPrimary(!!contact.is_primary);
    setFormErrors({});
    setShowAddDialog(true);
  };

  /* ─── CSV Export ─── */
  const handleExportCSV = () => {
    if (!contacts.length) {
      toast.error('No contacts to export.');
      return;
    }
    const headers = ['Name', 'Designation', 'Department', 'Email', 'Phone', 'Company', 'Primary'].join(',');
    const rows = contacts.map(c =>
      [c.name, c.designation, c.department, c.email, c.phone, c.client_name, c.is_primary ? 'Yes' : 'No']
        .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'crm_contacts_directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Contacts exported!');
  };

  /* ─── Loading State ─── */
  if (loading) {
    return <ContactsSkeleton />;
  }

  /* ─── Filtered + Computed Stats ─── */
  const filtered = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    return !q
      || c.name?.toLowerCase().includes(q)
      || c.email?.toLowerCase().includes(q)
      || c.client_name?.toLowerCase().includes(q)
      || c.designation?.toLowerCase().includes(q)
      || c.department?.toLowerCase().includes(q)
      || c.phone?.includes(q);
  });

  const totalContacts = contacts.length;
  const primaryCount = contacts.filter(c => c.is_primary).length;
  const linkedAccountCount = new Set(contacts.filter(c => c.client_id).map(c => c.client_id)).size;
  const withEmailCount = contacts.filter(c => c.email).length;

  /* ─── Inline Validation Error Component ─── */
  const FieldError = ({ error }: { error?: string }) => {
    if (!error) return null;
    return (
      <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-0.5">
        <AlertCircle className="h-3 w-3" /> {error}
      </p>
    );
  };

  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-fadeIn">
      {/* ─── Premium Header Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent flex items-center gap-2">
              <Contact className="h-8 w-8 text-white" />
              CRM Contacts Directory
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">
              Centralized 360° business contacts repository. Manage contacts, designations, communication profiles, and relationship timelines across all client accounts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchContacts()} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Contacts'}
            </Button>
            <Button size="sm" onClick={handleExportCSV} disabled={!contacts.length} className="bg-white hover:bg-white/95 text-primary font-bold shadow-lg disabled:opacity-50">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Dynamic KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Contacts</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{totalContacts}</div>
            <span className="text-[10px] text-muted-foreground">{totalContacts === 1 ? '1 contact across accounts' : `${totalContacts} contacts across accounts`}</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Contacts</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
              <Star className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{primaryCount}</div>
            <span className="text-[10px] text-emerald-500 font-bold">{primaryCount === 0 ? 'No primary contacts set' : `${primaryCount} key decision maker${primaryCount !== 1 ? 's' : ''}`}</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Linked Accounts</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
              <Building2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{linkedAccountCount}</div>
            <span className="text-[10px] text-muted-foreground">{linkedAccountCount === 0 ? 'No linked client accounts' : `${linkedAccountCount} client account${linkedAccountCount !== 1 ? 's' : ''} linked`}</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">With Email</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500">
              <Mail className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{withEmailCount}</div>
            <span className="text-[10px] text-purple-500 font-bold">{withEmailCount === 0 ? 'No email addresses on file' : `${withEmailCount} reachable via email`}</span>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search + Add Contact Action Bar ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, company, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-white dark:bg-[#37383E] border-slate-200 dark:border-zinc-800 text-xs font-semibold"
          />
        </div>

        {/* Add / Edit Contact Dialog */}
        <Dialog open={showAddDialog} onOpenChange={(v) => { setShowAddDialog(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                {editContact ? 'Edit Contact' : 'Add New Contact'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editContact ? 'Update the contact profile details below.' : 'Fill in all required fields to create a new contact.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-xs">
              {/* Full Name — required */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Full Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={e => { setFormName(e.target.value); if (formErrors.name) setFormErrors(p => ({ ...p, name: undefined })); }}
                  placeholder="Enter full name"
                  className={`text-xs rounded-xl ${formErrors.name ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                <FieldError error={formErrors.name} />
              </div>

              {/* Designation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Designation</Label>
                <Input value={formDesignation} onChange={e => setFormDesignation(e.target.value)} placeholder="Enter designation" className="text-xs rounded-xl" />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Department</Label>
                <Input value={formDepartment} onChange={e => setFormDepartment(e.target.value)} placeholder="Enter department" className="text-xs rounded-xl" />
              </div>

              {/* Email — optional with validation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Email</Label>
                <Input
                  value={formEmail}
                  onChange={e => { setFormEmail(e.target.value); if (formErrors.email) setFormErrors(p => ({ ...p, email: undefined })); }}
                  placeholder="Enter email address"
                  type="email"
                  className={`text-xs rounded-xl ${formErrors.email ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                <FieldError error={formErrors.email} />
              </div>

              {/* Phone — optional with validation */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Phone</Label>
                <Input
                  value={formPhone}
                  onChange={e => { setFormPhone(e.target.value); if (formErrors.phone) setFormErrors(p => ({ ...p, phone: undefined })); }}
                  placeholder="Enter phone number"
                  className={`text-xs rounded-xl ${formErrors.phone ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                <FieldError error={formErrors.phone} />
              </div>

              {/* Linked Account */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Linked Account</Label>
                <select
                  value={formClientId}
                  onChange={e => setFormClientId(e.target.value)}
                  className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.company_name || c.name}</option>
                  ))}
                </select>
              </div>

              {/* LinkedIn */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">LinkedIn</Label>
                <Input value={formLinkedin} onChange={e => setFormLinkedin(e.target.value)} placeholder="linkedin.com/in/..." className="text-xs rounded-xl" />
              </div>

              {/* Twitter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Twitter / X</Label>
                <Input value={formTwitter} onChange={e => setFormTwitter(e.target.value)} placeholder="twitter.com/..." className="text-xs rounded-xl" />
              </div>

              {/* Notes */}
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold">Notes</Label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Key contact notes, relationship context, special instructions..."
                  rows={2}
                  className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground resize-none font-semibold"
                />
              </div>

              {/* Primary Checkbox */}
              <div className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="isPrimary" checked={formIsPrimary} onChange={e => setFormIsPrimary(e.target.checked)} className="rounded" />
                <Label htmlFor="isPrimary" className="text-xs font-bold cursor-pointer">Mark as Primary Contact</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }} disabled={saving} className="rounded-xl text-xs font-bold">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold min-w-[120px]">
                {saving ? (
                  <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</>
                ) : (
                  editContact ? 'Update Contact' : 'Save Contact'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─── Contacts Table ─── */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
        <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
          <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Business Contacts Directory</CardTitle>
          <CardDescription className="text-[10px]">
            {searchQuery
              ? `${filtered.length} contact${filtered.length !== 1 ? 's' : ''} matching "${searchQuery}"`
              : `${totalContacts} contact${totalContacts !== 1 ? 's' : ''} in directory`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                <TableRow className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  <TableHead className="p-3 px-6 text-slate-650 dark:text-zinc-400">Contact</TableHead>
                  <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Designation</TableHead>
                  <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Company</TableHead>
                  <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Email</TableHead>
                  <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Phone</TableHead>
                  <TableHead className="p-3 text-slate-650 dark:text-zinc-400">Social</TableHead>
                  <TableHead className="p-3 text-right text-slate-650 dark:text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                          <Users className="h-7 w-7 text-slate-400 dark:text-zinc-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">
                            {searchQuery ? 'No contacts match your search' : 'No contacts yet'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {searchQuery
                              ? 'Try a different search term or clear the search field.'
                              : 'Click "Add Contact" to create your first business contact.'}
                          </p>
                        </div>
                        {!searchQuery && (
                          <Button size="sm" onClick={() => setShowAddDialog(true)} className="mt-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Your First Contact
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c: any, idx: number) => (
                    <TableRow key={c.id || idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850 transition-colors">
                      <TableCell className="p-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                            {c.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                              <span className="truncate max-w-[160px]">{c.name}</span>
                              {c.is_primary && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                            </span>
                            {c.department && (
                              <span className="text-[10px] text-muted-foreground block truncate max-w-[160px]">{c.department}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 text-xs font-semibold text-slate-600 dark:text-zinc-300">{c.designation || '—'}</TableCell>
                      <TableCell className="p-3 text-xs font-bold text-slate-700 dark:text-zinc-200">{c.client_name || '—'}</TableCell>
                      <TableCell className="p-3 text-xs">
                        {c.email ? (
                          <a href={`mailto:${c.email}`} className="text-primary hover:underline font-semibold flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" /> <span className="truncate max-w-[180px]">{c.email}</span>
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="p-3 text-xs font-semibold text-slate-500">
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                            <Phone className="h-3 w-3 shrink-0" /> {c.phone}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          {c.social_linkedin && (
                            <a href={c.social_linkedin.startsWith('http') ? c.social_linkedin : `https://${c.social_linkedin}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors" title="LinkedIn">
                              <Linkedin className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {c.social_twitter && (
                            <a href={c.social_twitter.startsWith('http') ? c.social_twitter : `https://${c.social_twitter}`} target="_blank" rel="noreferrer" className="text-sky-500 hover:text-sky-600 transition-colors" title="Twitter / X">
                              <Twitter className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {!c.social_linkedin && !c.social_twitter && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title="Edit contact" className="h-7 w-7 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">
                            <Edit className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(c)} title="Delete contact" className="h-7 w-7 p-0 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20">
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
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

      {/* ─── Delete Confirmation Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold">Delete Contact</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>?
              This action cannot be undone and all associated data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl text-xs font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold min-w-[100px]">
              {deleting ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Deleting...</> : 'Delete Contact'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
