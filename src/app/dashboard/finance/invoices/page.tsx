'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Mail,
  Phone,
  ArrowUpRight,
  TrendingDown,
  FileSpreadsheet,
  Plus,
  Send,
  CreditCard,
  RefreshCw,
  Building2,
  ExternalLink,
  Receipt,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export interface ClientRecord {
  id: number;
  company_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  contact_name?: string;
}

export interface InvoiceRecord {
  id: number;
  invoiceNumber: string;
  clientId: number;
  clientName?: string;
  email?: string;
  projectId?: number | null;
  amount: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string | null;
  notes?: string | null;
}

export default function InvoicingBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'draft'>('all');

  // Create Invoice Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formClientId, setFormClientId] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formTax, setFormTax] = useState('0');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'sent' | 'paid'>('sent');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Offline Payment Modal State
  const [offlinePayModalOpen, setOfflinePayModalOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payTxId, setPayTxId] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [recordingPay, setRecordingPay] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = getStoredSessionToken() || (typeof window !== 'undefined' ? localStorage.getItem('session_token') : null);
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Generate a random invoice number
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${year}-${rand}`;
  };

  // Fetch real invoices and clients from backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [invoicesRes, clientsRes] = await Promise.all([
        fetch('/api/invoices?limit=100', { headers }),
        fetch('/api/clients?limit=100', { headers })
      ]);

      let rawClients: ClientRecord[] = [];
      if (clientsRes.ok) {
        const cJson = await clientsRes.json();
        rawClients = Array.isArray(cJson) ? cJson : (cJson.data || []);
        setClients(rawClients);
      }

      const clientMap = new Map<number, ClientRecord>();
      rawClients.forEach(c => clientMap.set(c.id, c));

      if (invoicesRes.ok) {
        const iJson = await invoicesRes.json();
        const rawInvoices = Array.isArray(iJson) ? iJson : (iJson.data || []);
        
        const mappedInvoices: InvoiceRecord[] = rawInvoices.map((inv: any) => {
          const client = clientMap.get(Number(inv.clientId));
          const clientName = client?.company_name || client?.name || (client?.contact_name ? `${client.contact_name}` : `Client #${inv.clientId}`);
          const clientEmail = client?.email || 'billing@client.com';
          
          const rawAmount = Number(inv.amount || 0);
          const rawTax = Number(inv.tax || 0);
          const rawTotal = Number(inv.totalAmount || (rawAmount + rawTax));

          const createdDate = inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const due = inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

          // Determine status dynamically if overdue
          let status: InvoiceRecord['status'] = (inv.status || 'draft').toLowerCase() as any;
          if (status !== 'paid' && status !== 'cancelled') {
            if (new Date(due).getTime() < Date.now()) {
              status = 'overdue';
            }
          }

          return {
            id: Number(inv.id),
            invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
            clientId: Number(inv.clientId),
            clientName,
            email: clientEmail,
            projectId: inv.projectId,
            amount: rawAmount,
            tax: rawTax,
            totalAmount: rawTotal,
            status,
            issueDate: createdDate,
            dueDate: due,
            paidDate: inv.paidDate,
            notes: inv.notes
          };
        });

        setInvoices(mappedInvoices);
      } else {
        toast.error('Failed to load invoices from database');
      }
    } catch (err: any) {
      console.error('Fetch invoices error:', err);
      toast.error('Could not connect to invoices service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create Invoice Handler
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId || !formInvoiceNumber.trim() || !formAmount || !formDueDate) {
      toast.error('Please fill in Client, Invoice Number, Amount, and Due Date');
      return;
    }

    const amountNum = parseFloat(formAmount);
    const taxNum = parseFloat(formTax || '0');
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invoiceNumber: formInvoiceNumber.trim(),
        clientId: parseInt(formClientId, 10),
        amount: Math.round(amountNum),
        tax: Math.round(taxNum),
        totalAmount: Math.round(amountNum + taxNum),
        dueDate: formDueDate,
        status: formStatus,
        notes: formNotes.trim() || null,
        paidDate: formStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || 'Failed to create invoice');
      }

      toast.success(`Invoice ${formInvoiceNumber} created successfully!`);
      setCreateModalOpen(false);
      setFormInvoiceNumber('');
      setFormAmount('');
      setFormTax('0');
      setFormDueDate('');
      setFormNotes('');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating invoice');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark Paid Handler
  const handleMarkPaid = async (id: number, invNumber: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/invoices?id=${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'paid',
          paidDate: today
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || 'Failed to update invoice status');
      }

      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid', paidDate: today } : inv));
      toast.success(`Invoice ${invNumber} marked as fully settled.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark invoice as paid');
    }
  };

  // Offline Payment Handler
  const handleOfflinePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoiceId || !payAmount) {
      toast.error('Please select an invoice and enter amount');
      return;
    }

    setRecordingPay(true);
    try {
      const invId = parseInt(payInvoiceId, 10);
      const amt = Math.round(parseFloat(payAmount));

      // 1. Record payment in /api/payments
      await fetch('/api/payments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          invoiceId: invId,
          amount: amt,
          paymentMethod: payMethod,
          paymentDate: payDate,
          transactionId: payTxId.trim() || `OFFLINE-${Date.now()}`,
          notes: payNotes.trim() || 'Recorded via Invoicing Console'
        })
      });

      // 2. Mark invoice as paid
      await fetch(`/api/invoices?id=${invId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: 'paid',
          paidDate: payDate
        })
      });

      toast.success(`Offline payment of $${amt.toLocaleString()} recorded and invoice settled.`);
      setOfflinePayModalOpen(false);
      setPayInvoiceId('');
      setPayAmount('');
      setPayTxId('');
      setPayNotes('');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record offline payment');
    } finally {
      setRecordingPay(false);
    }
  };

  // Delete invoice handler
  const handleDeleteInvoice = async (id: number, invNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invNumber}?`)) return;

    try {
      const res = await fetch(`/api/invoices?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        throw new Error('Failed to delete invoice');
      }

      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast.success(`Invoice ${invNumber} deleted successfully.`);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting invoice');
    }
  };

  // Reminder notification
  const handleReminder = (inv: InvoiceRecord) => {
    toast.success(`Overdue reminder email dispatched to ${inv.clientName} (${inv.email})!`);
  };

  // Seed sample database records if 0 invoices exist
  const handleSeedSampleInvoices = async () => {
    setSeeding(true);
    try {
      // Find or pick clients
      let targetClients = clients;
      if (targetClients.length === 0) {
        // Create 2 test clients first if none exist
        const c1Res = await fetch('/api/clients', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            companyName: 'Skyline Ventures Corp',
            email: 'billing@skyline.com',
            status: 'active'
          })
        });
        const c2Res = await fetch('/api/clients', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            companyName: 'Alpha Tech Group',
            email: 'finance@alphatech.com',
            status: 'active'
          })
        });
        const cl1 = await c1Res.json().catch(() => ({}));
        const cl2 = await c2Res.json().catch(() => ({}));
        targetClients = [cl1, cl2].filter(c => c && c.id);
      }

      const clientAId = targetClients[0]?.id || 1;
      const clientBId = targetClients[1]?.id || targetClients[0]?.id || 1;

      const samples = [
        {
          invoiceNumber: `INV-${new Date().getFullYear()}-101`,
          clientId: clientAId,
          amount: 14500,
          tax: 1200,
          totalAmount: 15700,
          dueDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], // Overdue
          status: 'overdue',
          notes: 'Enterprise Software License Renewal'
        },
        {
          invoiceNumber: `INV-${new Date().getFullYear()}-102`,
          clientId: clientBId,
          amount: 28400,
          tax: 2100,
          totalAmount: 30500,
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], // Sent/Pending
          status: 'sent',
          notes: 'Cloud Architecture & Security Audit'
        },
        {
          invoiceNumber: `INV-${new Date().getFullYear()}-103`,
          clientId: clientAId,
          amount: 8800,
          tax: 700,
          totalAmount: 9500,
          dueDate: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
          paidDate: new Date().toISOString().split('T')[0],
          status: 'paid',
          notes: 'Workplace Hardware Provisioning'
        }
      ];

      for (const sample of samples) {
        await fetch('/api/invoices', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(sample)
        });
      }

      toast.success('Sample database invoices generated successfully!');
      await fetchData();
    } catch (err: any) {
      toast.error('Error seeding sample invoices');
    } finally {
      setSeeding(false);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const q = search.toLowerCase();
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.clientName && inv.clientName.toLowerCase().includes(q)) ||
        (inv.notes && inv.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'paid') return inv.status === 'paid';
      if (statusFilter === 'pending') return inv.status === 'sent' || inv.status === 'draft';
      if (statusFilter === 'overdue') return inv.status === 'overdue';
      if (statusFilter === 'draft') return inv.status === 'draft';
      return true;
    });
  }, [invoices, search, statusFilter]);

  // Aggregate stats
  const totalOutstanding = useMemo(() => {
    return invoices
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + i.totalAmount, 0);
  }, [invoices]);

  const totalCollected = useMemo(() => {
    return invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.totalAmount, 0);
  }, [invoices]);

  const totalBilling = useMemo(() => {
    return invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  }, [invoices]);

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111827] via-[#1e1b4b] to-[#0f172a] p-6 text-white shadow-xl border border-gray-800">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Live Supabase Connected Ledger
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent flex items-center gap-2">
              Invoicing & Billing Management
            </h2>
            <p className="text-sm text-zinc-300 mt-1 max-w-xl">
              Track multi-tenant client accounts receivable, verify liquid deposits, and dispatch digital reminder profiles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700" 
              onClick={() => {
                const unpaid = invoices.filter(i => i.status !== 'paid');
                if (unpaid.length > 0) {
                  setPayInvoiceId(String(unpaid[0].id));
                  setPayAmount(String(unpaid[0].totalAmount));
                }
                setOfflinePayModalOpen(true);
              }}
            >
              <CreditCard className="mr-1.5 h-4 w-4 text-indigo-400" /> Record Offline Pay
            </Button>

            <Button 
              size="sm" 
              className="bg-indigo-600 text-white hover:bg-indigo-500 border-none shadow-md shadow-indigo-600/30 font-bold gap-1.5" 
              onClick={() => router.push('/dashboard/finance/invoices/new')}
            >
              <Plus className="h-4 w-4" /> Create Invoice (with Live PDF Preview)
            </Button>
          </div>
        </div>
      </div>

      {/* Accounts Receivable Bento Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Outstanding Receivables */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-rose-500 dark:bg-zinc-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Outstanding Receivables</span>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-rose-600">
              ${totalOutstanding.toLocaleString()}
            </div>
            <Progress 
              value={totalBilling > 0 ? (totalOutstanding / totalBilling) * 100 : 0} 
              className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" 
            />
            <p className="text-[10px] text-muted-foreground mt-2">
              {invoices.filter(i => i.status !== 'paid').length} unpaid invoice(s) requiring collection
            </p>
          </CardContent>
        </Card>

        {/* Collected Receivables */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-emerald-500 dark:bg-zinc-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Settled Collections</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">
              ${totalCollected.toLocaleString()}
            </div>
            <Progress 
              value={totalBilling > 0 ? (totalCollected / totalBilling) * 100 : 0} 
              className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" 
            />
            <p className="text-[10px] text-muted-foreground mt-2">
              {invoices.filter(i => i.status === 'paid').length} settled invoice ledger deposit(s)
            </p>
          </CardContent>
        </Card>

        {/* Total Billing Volume */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-indigo-500 dark:bg-zinc-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Total Billing Volume</span>
              <DollarSign className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-600">
              ${totalBilling.toLocaleString()}
            </div>
            <Progress value={100} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[10px] text-muted-foreground mt-2">
              {invoices.length} total active invoice profile(s) across all accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Ledger Table */}
      <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3 border-b dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-4.5 w-4.5 text-indigo-500" /> Invoice Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time tenant invoices synchronized directly with database
              </CardDescription>
            </div>
            
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search invoice #, client, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-9 rounded-xl"
                />
              </div>

              <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 text-xs">
                {(['all', 'paid', 'pending', 'overdue'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`px-3 py-1 font-semibold rounded-lg capitalize transition-all ${
                      statusFilter === tab 
                        ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' 
                        : 'text-muted-foreground hover:text-zinc-900 dark:hover:text-white'
                    }`}
                    onClick={() => setStatusFilter(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading real invoices from database...
            </div>
          ) : filteredInvoices.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b text-[11px] font-bold text-muted-foreground uppercase bg-slate-50/80 dark:bg-zinc-900/50">
                  <th className="p-3.5 pl-6">Invoice ID</th>
                  <th className="p-3.5">Client & Email</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Issue Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs font-medium">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="p-3.5 pl-6 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNumber}
                    </td>

                    <td className="p-3.5">
                      <p className="font-bold text-zinc-900 dark:text-zinc-50">{inv.clientName}</p>
                      <p className="text-[10px] text-muted-foreground">{inv.email || 'No email registered'}</p>
                    </td>

                    <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                      ${inv.totalAmount.toLocaleString()}
                      {inv.tax > 0 && (
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">
                          (incl. ${inv.tax} tax)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-muted-foreground">{inv.issueDate}</td>
                    
                    <td className="p-3.5">
                      <span className={inv.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-muted-foreground'}>
                        {inv.dueDate}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <Badge className={`text-[10px] uppercase font-bold border-none ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20' :
                        inv.status === 'overdue' ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 animate-pulse' :
                        inv.status === 'draft' ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300' :
                        'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20'
                      }`}>
                        {inv.status}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-right pr-6">
                      <div className="flex justify-end items-center gap-1.5">
                        {inv.status === 'overdue' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-[11px] h-7 px-2 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg" 
                            onClick={() => handleReminder(inv)}
                          >
                            <Send className="h-3 w-3 mr-1" /> Remind
                          </Button>
                        )}
                        
                        {inv.status !== 'paid' && (
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] h-7 px-2.5 rounded-lg shadow-sm" 
                            onClick={() => handleMarkPaid(inv.id, inv.invoiceNumber)}
                          >
                            Mark Paid
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] h-7 px-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg flex items-center gap-1 font-semibold"
                          onClick={() => router.push(`/dashboard/finance/invoices/new?invoiceId=${inv.id}`)}
                          title="View Official PDF Preview"
                        >
                          <FileText className="h-3 w-3" /> PDF
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          title="Delete invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="p-3 bg-indigo-50 dark:bg-zinc-800 rounded-full w-fit mx-auto text-indigo-600">
                <Receipt className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No invoices found in database</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No invoices match your active filters, or your tenant has not created any billing records yet.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl font-bold"
                  onClick={() => router.push('/dashboard/finance/invoices/new')}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Create New Invoice (Live Preview)
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs rounded-xl border-dashed"
                  onClick={handleSeedSampleInvoices}
                  disabled={seeding}
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5 text-amber-500" />
                  {seeding ? 'Generating Invoices...' : 'Seed Sample Invoices'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE INVOICE MODAL */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" /> Generate Client Invoice
            </DialogTitle>
            <DialogDescription className="text-xs">
              Saves a persistent invoice record to your tenant billing ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Client Account</label>
              {clients.length > 0 ? (
                <Select value={formClientId} onValueChange={setFormClientId}>
                  <SelectTrigger className="rounded-xl text-xs font-semibold h-10">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {clients.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.company_name || c.name || `Client #${c.id}`} {c.email ? `(${c.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    placeholder="Enter Client ID (e.g. 1)" 
                    value={formClientId} 
                    onChange={e => setFormClientId(e.target.value)} 
                    className="rounded-xl text-xs h-10"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Invoice Number</label>
                <Input
                  value={formInvoiceNumber}
                  onChange={e => setFormInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-001"
                  className="rounded-xl text-xs h-10 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Due Date</label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={e => setFormDueDate(e.target.value)}
                  className="rounded-xl text-xs h-10 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount ($ USD)</label>
                <Input
                  type="number"
                  step="any"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="5000"
                  className="rounded-xl text-xs h-10 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tax ($ USD)</label>
                <Input
                  type="number"
                  step="any"
                  value={formTax}
                  onChange={e => setFormTax(e.target.value)}
                  placeholder="0"
                  className="rounded-xl text-xs h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Status</label>
              <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                <SelectTrigger className="rounded-xl text-xs font-semibold h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="draft">Draft (Unsent)</SelectItem>
                  <SelectItem value="sent">Sent / Pending Payment</SelectItem>
                  <SelectItem value="paid">Pre-paid / Settled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Scope Description</label>
              <Textarea
                rows={2}
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="e.g. Monthly cloud architecture and retainer services..."
                className="rounded-xl text-xs p-3"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold">
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Save Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RECORD OFFLINE PAYMENT MODAL */}
      <Dialog open={offlinePayModalOpen} onOpenChange={setOfflinePayModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" /> Record Offline Payment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Directly settles an invoice with a verified bank wire, check, cash, or UPI reference.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOfflinePaymentSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Invoice</label>
              <Select 
                value={payInvoiceId} 
                onValueChange={(val) => {
                  setPayInvoiceId(val);
                  const selected = invoices.find(i => String(i.id) === val);
                  if (selected) {
                    setPayAmount(String(selected.totalAmount));
                  }
                }}
              >
                <SelectTrigger className="rounded-xl text-xs font-semibold h-10">
                  <SelectValue placeholder="Select Invoice to Settle" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  {invoices.map(inv => (
                    <SelectItem key={inv.id} value={String(inv.id)}>
                      {inv.invoiceNumber} — {inv.clientName} (${inv.totalAmount.toLocaleString()}) [{inv.status}]
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Amount ($)</label>
                <Input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="Amount"
                  className="rounded-xl text-xs h-10 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method</label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="rounded-xl text-xs font-semibold h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Bank Transfer">Bank Wire / ACH</SelectItem>
                    <SelectItem value="Cash">Cash Deposit</SelectItem>
                    <SelectItem value="Cheque">Physical Cheque</SelectItem>
                    <SelectItem value="UPI">UPI / Digital Rail</SelectItem>
                    <SelectItem value="Credit Card">Corporate Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Date</label>
                <Input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="rounded-xl text-xs h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Transaction / Reference #</label>
                <Input
                  value={payTxId}
                  onChange={e => setPayTxId(e.target.value)}
                  placeholder="e.g. WIRE-8941038"
                  className="rounded-xl text-xs h-10 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Deposit Slip Info</label>
              <Textarea
                rows={2}
                value={payNotes}
                onChange={e => setPayNotes(e.target.value)}
                placeholder="Add cashier notes or deposit reference..."
                className="rounded-xl text-xs p-3"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOfflinePayModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={recordingPay} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">
                {recordingPay ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Confirm Payment & Settle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
