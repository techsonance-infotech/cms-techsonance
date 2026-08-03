'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  ScrollText, Plus, RefreshCw, Download, Search, Edit, Trash2, Loader2,
  AlertCircle, DollarSign, FileText, CheckCircle2, XCircle, Clock, Send,
  Eye, Building2, Mail, Phone, ArrowRight, Copy
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Status config ─── */
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  'Draft':                { color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800/40', icon: <FileText className="h-3 w-3" /> },
  'Pending Approval':     { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: <Clock className="h-3 w-3" /> },
  'Sent':                 { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: <Send className="h-3 w-3" /> },
  'Viewed':               { color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', icon: <Eye className="h-3 w-3" /> },
  'Accepted':             { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: <CheckCircle2 className="h-3 w-3" /> },
  'Rejected':             { color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', icon: <XCircle className="h-3 w-3" /> },
  'Expired':              { color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800/30', icon: <Clock className="h-3 w-3" /> },
  'Converted to Project': { color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', icon: <ArrowRight className="h-3 w-3" /> },
  'Converted to Invoice': { color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', icon: <DollarSign className="h-3 w-3" /> },
};
const getStatusCfg = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG['Draft'];
const ALL_STATUSES = Object.keys(STATUS_CONFIG);

function formatCurrency(val: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
}

/* ─── Skeleton ─── */
function QuotationsSkeleton() {
  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-pulse">
      <div className="rounded-2xl bg-slate-100 dark:bg-[#37383E] h-36 p-6 md:p-8 border border-slate-200 dark:border-zinc-800"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <Card key={i} className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#37383E] h-28 p-5"><div className="h-6 w-16 bg-slate-200 dark:bg-zinc-800 rounded mt-8"></div></Card>)}
      </div>
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] h-96"></Card>
    </div>
  );
}

/* ─── Line item type ─── */
interface LineItem { description: string; quantity: number; unit: string; unit_price: number; }

export default function QuotationsPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [nextNumber, setNextNumber] = useState('');
  const [settingsCfg, setSettingsCfg] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDialog, setShowDialog] = useState(false);
  const [editQuotation, setEditQuotation] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [fNumber, setFNumber] = useState('');
  const [fSubject, setFSubject] = useState('');
  const [fClientId, setFClientId] = useState('');
  const [fInquiryId, setFInquiryId] = useState('');
  const [fContactName, setFContactName] = useState('');
  const [fContactEmail, setFContactEmail] = useState('');
  const [fContactPhone, setFContactPhone] = useState('');
  const [fStatus, setFStatus] = useState('Draft');
  const [fCurrency, setFCurrency] = useState('INR');
  const [fDiscountType, setFDiscountType] = useState('percentage');
  const [fDiscountValue, setFDiscountValue] = useState('0');
  const [fTaxRate, setFTaxRate] = useState('18');
  const [fValidityDays, setFValidityDays] = useState('30');
  const [fPaymentTerms, setFPaymentTerms] = useState('');
  const [fDeliveryTimeline, setFDeliveryTimeline] = useState('');
  const [fTerms, setFTerms] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fItems, setFItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit: 'Unit', unit_price: 0 }]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFNumber(nextNumber);
    setFSubject(''); setFClientId(''); setFInquiryId('');
    setFContactName(''); setFContactEmail(''); setFContactPhone('');
    setFStatus('Draft'); setFCurrency('INR');
    setFDiscountType('percentage'); setFDiscountValue('0');
    setFTaxRate(String(settingsCfg.defaultTaxRate || 18));
    setFValidityDays('30');
    setFPaymentTerms(settingsCfg.defaultPaymentTerms || '');
    setFDeliveryTimeline(''); setFTerms(settingsCfg.defaultTerms || ''); setFNotes('');
    setFItems([{ description: '', quantity: 1, unit: 'Unit', unit_price: 0 }]);
    setEditQuotation(null); setFormErrors({});
  };

  const fetchQuotations = useCallback(async (isInitial = false) => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/quotations', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setQuotations(json.quotations || []);
        setClients(json.clients || []);
        setInquiries(json.inquiries || []);
        setNextNumber(json.nextNumber || '');
        setSettingsCfg(json.settings || {});
        if (!isInitial) toast.success('Quotations synced!');
      } else {
        toast.error('Failed to load quotations.');
      }
    } catch { toast.error('Network error.'); }
    finally { setLoading(false); setSyncing(false); }
  }, []);

  useEffect(() => { fetchQuotations(true); }, [fetchQuotations]);

  // Prefill form number when nextNumber changes
  useEffect(() => { if (!editQuotation && nextNumber) setFNumber(nextNumber); }, [nextNumber, editQuotation]);
  // Prefill defaults from settings
  useEffect(() => {
    if (!editQuotation) {
      setFTaxRate(String(settingsCfg.defaultTaxRate || 18));
      setFPaymentTerms(settingsCfg.defaultPaymentTerms || '');
      setFTerms(settingsCfg.defaultTerms || '');
    }
  }, [settingsCfg, editQuotation]);

  /* ─── Line item helpers ─── */
  const addItem = () => setFItems([...fItems, { description: '', quantity: 1, unit: 'Unit', unit_price: 0 }]);
  const removeItem = (idx: number) => { if (fItems.length > 1) setFItems(fItems.filter((_, i) => i !== idx)); };
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    const next = [...fItems];
    (next[idx] as any)[field] = value;
    setFItems(next);
  };

  /* ─── Computed totals ─── */
  const subtotal = fItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const discountAmt = fDiscountType === 'percentage' ? subtotal * (Number(fDiscountValue) || 0) / 100 : Number(fDiscountValue) || 0;
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = afterDiscount * (Number(fTaxRate) || 0) / 100;
  const grandTotal = afterDiscount + taxAmt;

  /* ─── Validate ─── */
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fNumber.trim()) errors.number = 'Quotation number is required.';
    if (!fSubject.trim()) errors.subject = 'Subject is required.';
    if (fContactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fContactEmail.trim())) errors.contactEmail = 'Invalid email format.';
    if (fItems.every(i => !i.description.trim())) errors.items = 'At least one line item is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('session_token');
      const validItems = fItems.filter(i => i.description.trim());
      const payload = {
        ...(editQuotation ? { id: editQuotation.id, version: editQuotation.version } : {}),
        quotation_number: fNumber.trim(),
        subject: fSubject.trim(),
        client_id: fClientId || null,
        inquiry_id: fInquiryId || null,
        contact_name: fContactName.trim(),
        contact_email: fContactEmail.trim(),
        contact_phone: fContactPhone.trim(),
        status: fStatus,
        currency: fCurrency,
        discount_type: fDiscountType,
        discount_value: Number(fDiscountValue) || 0,
        tax_rate: Number(fTaxRate) || 0,
        validity_days: Number(fValidityDays) || 30,
        payment_terms: fPaymentTerms.trim(),
        delivery_timeline: fDeliveryTimeline.trim(),
        terms_conditions: fTerms.trim(),
        notes: fNotes.trim(),
        items: validItems
      };
      const res = await fetch('/api/crm/quotations', {
        method: editQuotation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        toast.success(editQuotation ? 'Quotation updated!' : 'Quotation created!');
        resetForm(); setShowDialog(false); fetchQuotations(true);
      } else {
        toast.error(json?.error || 'Failed to save quotation.');
      }
    } catch { toast.error('Network error.'); }
    finally { setSaving(false); }
  };

  /* ─── Status update ─── */
  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/crm/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id, status, statusOnly: true })
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) { toast.success(`Status updated to "${status}"`); fetchQuotations(true); }
      else toast.error(json?.error || 'Failed to update status.');
    } catch { toast.error('Network error.'); }
  };

  /* ─── Delete ─── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/crm/quotations?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) { toast.success('Quotation deleted.'); fetchQuotations(true); }
      else toast.error(json?.error || 'Failed to delete.');
    } catch { toast.error('Network error.'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  /* ─── Open Edit ─── */
  const openEdit = (q: any) => {
    setEditQuotation(q);
    setFNumber(q.quotation_number || '');
    setFSubject(q.subject || '');
    setFClientId(q.client_id ? String(q.client_id) : '');
    setFInquiryId(q.inquiry_id ? String(q.inquiry_id) : '');
    setFContactName(q.contact_name || '');
    setFContactEmail(q.contact_email || '');
    setFContactPhone(q.contact_phone || '');
    setFStatus(q.status || 'Draft');
    setFCurrency(q.currency || 'INR');
    setFDiscountType(q.discount_type || 'percentage');
    setFDiscountValue(String(q.discount_value || 0));
    setFTaxRate(String(q.tax_rate || 0));
    setFValidityDays(String(q.validity_days || 30));
    setFPaymentTerms(q.payment_terms || '');
    setFDeliveryTimeline(q.delivery_timeline || '');
    setFTerms(q.terms_conditions || '');
    setFNotes(q.notes || '');
    if (q.quotation_items && q.quotation_items.length > 0) {
      setFItems(q.quotation_items.map((item: any) => ({
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'Unit',
        unit_price: Number(item.unit_price) || 0
      })));
    } else {
      setFItems([{ description: '', quantity: 1, unit: 'Unit', unit_price: 0 }]);
    }
    setFormErrors({});
    setShowDialog(true);
  };

  /* ─── Duplicate ─── */
  const duplicateQuotation = (q: any) => {
    openEdit(q);
    setEditQuotation(null);
    setFNumber(nextNumber);
    setFStatus('Draft');
    toast.info('Duplicated — edit and save as a new quotation.');
  };

  /* ─── CSV Export ─── */
  const handleExportCSV = () => {
    if (!quotations.length) { toast.error('No quotations to export.'); return; }
    const headers = ['Number', 'Subject', 'Client', 'Status', 'Subtotal', 'Tax', 'Total', 'Currency', 'Valid Until', 'Version'].join(',');
    const rows = quotations.map(q => [q.quotation_number, q.subject, q.client_name, q.status, q.subtotal, q.tax_amount, q.total, q.currency, q.valid_until, q.version].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
    const csv = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'quotations.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('Exported!');
  };

  if (loading) return <QuotationsSkeleton />;

  /* ─── Filter ─── */
  const filtered = quotations.filter(q => {
    const q2 = searchQuery.toLowerCase();
    const matchSearch = !q2 || q.quotation_number?.toLowerCase().includes(q2) || q.subject?.toLowerCase().includes(q2) || q.client_name?.toLowerCase().includes(q2) || q.contact_name?.toLowerCase().includes(q2);
    const matchStatus = statusFilter === 'All' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValue = quotations.reduce((s, q) => s + (Number(q.total) || 0), 0);
  const acceptedCount = quotations.filter(q => q.status === 'Accepted').length;
  const pendingCount = quotations.filter(q => ['Draft', 'Pending Approval', 'Sent', 'Viewed'].includes(q.status)).length;
  const acceptedValue = quotations.filter(q => q.status === 'Accepted').reduce((s, q) => s + (Number(q.total) || 0), 0);

  const FieldError = ({ error }: { error?: string }) => error ? <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-0.5"><AlertCircle className="h-3 w-3" /> {error}</p> : null;

  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-fadeIn">
      {/* ─── Header ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent flex items-center gap-2">
              <ScrollText className="h-8 w-8 text-white" /> Quotations
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">Create, manage, and track professional sales quotations with configurable templates, line items, taxes, and approval workflows.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchQuotations()} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync'}
            </Button>
            <Button size="sm" onClick={handleExportCSV} disabled={!quotations.length} className="bg-white hover:bg-white/95 text-primary font-bold shadow-lg disabled:opacity-50">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Quotations</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary"><ScrollText className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{quotations.length}</div>
            <span className="text-[10px] text-muted-foreground">{pendingCount} pending</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Value</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500"><DollarSign className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(totalValue)}</div>
            <span className="text-[10px] text-muted-foreground">Across all quotations</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Accepted</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500"><CheckCircle2 className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">{acceptedCount}</div>
            <span className="text-[10px] text-emerald-500 font-bold">{formatCurrency(acceptedValue)} won</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conversion</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-500"><ArrowRight className="h-5 w-5" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{quotations.length > 0 ? Math.round((acceptedCount / quotations.length) * 100) : 0}%</div>
            <span className="text-[10px] text-muted-foreground">Acceptance rate</span>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search + Filter + Add ─── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search quotations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 rounded-xl bg-white dark:bg-[#37383E] border-slate-200 dark:border-zinc-800 text-xs font-semibold" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs font-bold bg-white dark:bg-[#37383E] border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-foreground cursor-pointer">
            <option value="All">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <Dialog open={showDialog} onOpenChange={v => { setShowDialog(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Create Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary" /> {editQuotation ? 'Edit Quotation' : 'Create New Quotation'}</DialogTitle>
              <DialogDescription className="text-xs">{editQuotation ? 'Update the quotation details.' : 'Fill in all required fields and add line items.'}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4 text-xs">
              {/* Row 1: Number + Subject + Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Quotation # <span className="text-rose-500">*</span></Label>
                  <Input value={fNumber} onChange={e => { setFNumber(e.target.value); setFormErrors(p => ({ ...p, number: '' })); }} className={`text-xs rounded-xl ${formErrors.number ? 'border-rose-500' : ''}`} />
                  <FieldError error={formErrors.number} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Subject <span className="text-rose-500">*</span></Label>
                  <Input value={fSubject} onChange={e => { setFSubject(e.target.value); setFormErrors(p => ({ ...p, subject: '' })); }} placeholder="e.g. Website Redesign Proposal" className={`text-xs rounded-xl ${formErrors.subject ? 'border-rose-500' : ''}`} />
                  <FieldError error={formErrors.subject} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Status</Label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold">
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Client + Inquiry + Currency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Client</Label>
                  <select value={fClientId} onChange={e => setFClientId(e.target.value)} className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold">
                    <option value="">-- Select Client --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Linked Inquiry</Label>
                  <select value={fInquiryId} onChange={e => setFInquiryId(e.target.value)} className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold">
                    <option value="">-- None --</option>
                    {inquiries.map(i => <option key={i.id} value={i.id}>{i.alias_name || i.company_name || `Inquiry #${i.id}`}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Currency</Label>
                  <select value={fCurrency} onChange={e => setFCurrency(e.target.value)} className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold">
                    <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Contact Name</Label>
                  <Input value={fContactName} onChange={e => setFContactName(e.target.value)} placeholder="Contact person" className="text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Contact Email</Label>
                  <Input value={fContactEmail} onChange={e => { setFContactEmail(e.target.value); setFormErrors(p => ({ ...p, contactEmail: '' })); }} placeholder="email@company.com" type="email" className={`text-xs rounded-xl ${formErrors.contactEmail ? 'border-rose-500' : ''}`} />
                  <FieldError error={formErrors.contactEmail} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Contact Phone</Label>
                  <Input value={fContactPhone} onChange={e => setFContactPhone(e.target.value)} placeholder="+91 98765 43210" className="text-xs rounded-xl" />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold uppercase tracking-wider">Line Items <span className="text-rose-500">*</span></Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs rounded-lg font-bold h-7"><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
                </div>
                <FieldError error={formErrors.items} />
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                  <div className="grid grid-cols-12 gap-0 bg-slate-100 dark:bg-zinc-900/50 text-[10px] font-bold uppercase text-muted-foreground p-2.5 px-3">
                    <div className="col-span-5">Description</div><div className="col-span-2">Qty</div><div className="col-span-2">Unit</div><div className="col-span-2">Price</div><div className="col-span-1"></div>
                  </div>
                  {fItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-0 items-center p-2 px-3 border-t border-slate-100 dark:border-zinc-800">
                      <div className="col-span-5 pr-2"><Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Service / Product" className="text-xs rounded-lg h-8" /></div>
                      <div className="col-span-2 pr-2"><Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="text-xs rounded-lg h-8" min={0} /></div>
                      <div className="col-span-2 pr-2"><Input value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="text-xs rounded-lg h-8" /></div>
                      <div className="col-span-2 pr-2"><Input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} className="text-xs rounded-lg h-8" min={0} /></div>
                      <div className="col-span-1 flex justify-center">
                        {fItems.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="h-6 w-6 p-0"><Trash2 className="h-3 w-3 text-rose-500" /></Button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing: Discount + Tax + Validity */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Discount</Label>
                  <div className="flex gap-1">
                    <select value={fDiscountType} onChange={e => setFDiscountType(e.target.value)} className="bg-white dark:bg-[#1E1F22] border border-border text-[10px] rounded-lg p-1.5 font-bold w-16">
                      <option value="percentage">%</option><option value="fixed">₹</option>
                    </select>
                    <Input type="number" value={fDiscountValue} onChange={e => setFDiscountValue(e.target.value)} className="text-xs rounded-lg h-8 flex-1" min={0} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tax Rate (%)</Label>
                  <Input type="number" value={fTaxRate} onChange={e => setFTaxRate(e.target.value)} className="text-xs rounded-xl h-8" min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Validity (days)</Label>
                  <Input type="number" value={fValidityDays} onChange={e => setFValidityDays(e.target.value)} className="text-xs rounded-xl h-8" min={1} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Payment Terms</Label>
                  <Input value={fPaymentTerms} onChange={e => setFPaymentTerms(e.target.value)} placeholder="Net 15" className="text-xs rounded-xl h-8" />
                </div>
              </div>

              {/* Totals Summary */}
              <div className="rounded-xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800 p-4 space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground font-semibold">Subtotal</span><span className="font-bold">{formatCurrency(subtotal, fCurrency)}</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground font-semibold">Discount</span><span className="font-bold text-rose-600">-{formatCurrency(discountAmt, fCurrency)}</span></div>}
                {taxAmt > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground font-semibold">Tax ({fTaxRate}%)</span><span className="font-bold">{formatCurrency(taxAmt, fCurrency)}</span></div>}
                <div className="flex justify-between text-sm pt-1.5 border-t border-slate-200 dark:border-zinc-700"><span className="font-extrabold">Grand Total</span><span className="font-black text-primary">{formatCurrency(grandTotal, fCurrency)}</span></div>
              </div>

              {/* Delivery + Terms + Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Delivery Timeline</Label>
                  <Input value={fDeliveryTimeline} onChange={e => setFDeliveryTimeline(e.target.value)} placeholder="e.g. 4-6 weeks from acceptance" className="text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Internal Notes</Label>
                  <Input value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Internal notes (not visible to client)" className="text-xs rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Terms & Conditions</Label>
                <textarea value={fTerms} onChange={e => setFTerms(e.target.value)} rows={2} placeholder="Terms and conditions..." className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground resize-none font-semibold" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }} disabled={saving} className="rounded-xl text-xs font-bold">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold min-w-[130px]">
                {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</> : editQuotation ? 'Update Quotation' : 'Create Quotation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─── Quotations Table ─── */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
        <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
          <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Quotations Register</CardTitle>
          <CardDescription className="text-[10px]">
            {searchQuery || statusFilter !== 'All'
              ? `${filtered.length} quotation${filtered.length !== 1 ? 's' : ''} matching filters`
              : `${quotations.length} quotation${quotations.length !== 1 ? 's' : ''} total`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                <TableRow className="border-b border-slate-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider font-bold">
                  <TableHead className="p-3 px-6">Quotation #</TableHead>
                  <TableHead className="p-3">Subject</TableHead>
                  <TableHead className="p-3">Client</TableHead>
                  <TableHead className="p-3">Status</TableHead>
                  <TableHead className="p-3">Total</TableHead>
                  <TableHead className="p-3">Valid Until</TableHead>
                  <TableHead className="p-3">Ver</TableHead>
                  <TableHead className="p-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                          <ScrollText className="h-7 w-7 text-slate-400" />
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-zinc-300">{searchQuery || statusFilter !== 'All' ? 'No quotations match filters' : 'No quotations yet'}</p>
                        <p className="text-[10px] text-muted-foreground">{!searchQuery && statusFilter === 'All' ? 'Click "Create Quotation" to get started.' : 'Adjust your search or filter.'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((q, idx) => {
                    const cfg = getStatusCfg(q.status);
                    return (
                      <TableRow key={q.id || idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                        <TableCell className="p-3 px-6 text-xs font-black text-primary">{q.quotation_number}</TableCell>
                        <TableCell className="p-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 max-w-[200px] truncate">{q.subject}</TableCell>
                        <TableCell className="p-3 text-xs font-semibold">{q.client_name || '—'}</TableCell>
                        <TableCell className="p-3">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className={`text-[9px] font-bold ${cfg.color} ${cfg.bg} gap-1`}>{cfg.icon} {q.status}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-xs font-black">{formatCurrency(Number(q.total) || 0, q.currency)}</TableCell>
                        <TableCell className="p-3 text-[10px] font-semibold text-muted-foreground">{q.valid_until || '—'}</TableCell>
                        <TableCell className="p-3 text-xs font-bold text-center">v{q.version || 1}</TableCell>
                        <TableCell className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <select
                              className="text-[10px] font-bold bg-transparent border border-slate-200 dark:border-zinc-700 rounded-lg p-1 text-foreground cursor-pointer max-w-[90px]"
                              defaultValue=""
                              onChange={e => { if (e.target.value) updateStatus(q.id, e.target.value); e.target.value = ''; }}
                            >
                              <option value="" disabled>Status</option>
                              {ALL_STATUSES.filter(s => s !== q.status).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(q)} title="Edit" className="h-7 w-7 p-0 rounded-lg"><Edit className="h-3.5 w-3.5 text-slate-500" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => duplicateQuotation(q)} title="Duplicate" className="h-7 w-7 p-0 rounded-lg"><Copy className="h-3.5 w-3.5 text-blue-500" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(q)} title="Delete" className="h-7 w-7 p-0 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold">Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to permanently delete <strong>{deleteTarget?.quotation_number}</strong> — "{deleteTarget?.subject}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-xl text-xs font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold min-w-[100px]">
              {deleting ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
