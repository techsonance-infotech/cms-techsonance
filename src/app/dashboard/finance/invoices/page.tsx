'use client';

import React, { useState } from 'react';
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
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface InvoiceRecord {
  id: string;
  clientName: string;
  email: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  category: 'Software Integration' | 'Consultancy' | 'Hardware Setup' | 'Maintenance';
  status: 'paid' | 'pending' | 'overdue';
}

export default function InvoicingBillingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([
    { id: 'INV-2026-001', clientName: 'Skyline Ventures', email: 'billing@skyline.com', amount: 12400, issueDate: '2026-05-01', dueDate: '2026-05-15', category: 'Software Integration', status: 'overdue' },
    { id: 'INV-2026-002', clientName: 'Alpha Tech Corp', email: 'finance@alphatech.com', amount: 24800, issueDate: '2026-05-02', dueDate: '2026-06-02', category: 'Consultancy', status: 'paid' },
    { id: 'INV-2026-003', clientName: 'Omega Logistics', email: 'ap@omega.com', amount: 8200, issueDate: '2026-05-08', dueDate: '2026-06-08', category: 'Hardware Setup', status: 'pending' },
    { id: 'INV-2026-004', clientName: 'Horizon Real Estate', email: 'horizon@ap.com', amount: 15200, issueDate: '2026-05-10', dueDate: '2026-05-24', category: 'Maintenance', status: 'paid' },
  ]);

  const handleReminder = (id: string, clientName: string) => {
    toast.success(`Overdue payment notification automatically dispatched to ${clientName}!`);
  };

  const handleMarkPaid = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
    toast.success(`Invoice ${id} marked as fully settled.`);
  };

  const handleOfflineTransaction = () => {
    toast.info("Opening offline transaction logging modal...");
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalBilling = invoices.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111827] to-[#1e1b4b] p-6 text-white shadow-xl border border-gray-800">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-violet-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Billing Intelligence Console</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent">
              Invoicing & Billing Management
            </h2>
            <p className="text-sm text-zinc-300 mt-1 max-w-xl">
              Track multi-tenant client accounts receivable, verify liquid deposits, and dispatch digital reminder profiles.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700" onClick={handleOfflineTransaction}>
              <CreditCard className="mr-1.5 h-4 w-4 text-indigo-400" /> Record Offline Pay
            </Button>
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 border-none shadow-sm" onClick={() => toast.success("New invoice generation interface active")}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Accounts Receivable Bento Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Outstanding Receivables */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">${totalOutstanding.toLocaleString()}</div>
            <Progress value={(totalOutstanding / totalBilling) * 100} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[10px] text-muted-foreground mt-2">Requires active collector attention</p>
          </CardContent>
        </Card>

        {/* Collected Receivables */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settled Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${totalCollected.toLocaleString()}</div>
            <Progress value={(totalCollected / totalBilling) * 100} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[10px] text-muted-foreground mt-2">100% verified ledger deposits</p>
          </CardContent>
        </Card>

        {/* Total Billing Volume */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Billing Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">${totalBilling.toLocaleString()}</div>
            <Progress value={100} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[10px] text-muted-foreground mt-2">All periods calculated yield run</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Ledger Table */}
      <Card>
        <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Invoice Ledger</CardTitle>
              <CardDescription>Search and disburse client invoice profiles</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
              <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs">
                <button className={`px-2 py-1 font-semibold rounded-md transition-colors ${statusFilter === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setStatusFilter('all')}>All</button>
                <button className={`px-2 py-1 font-semibold rounded-md transition-colors ${statusFilter === 'paid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setStatusFilter('paid')}>Paid</button>
                <button className={`px-2 py-1 font-semibold rounded-md transition-colors ${statusFilter === 'pending' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setStatusFilter('pending')}>Pending</button>
                <button className={`px-2 py-1 font-semibold rounded-md transition-colors ${statusFilter === 'overdue' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setStatusFilter('overdue')}>Overdue</button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                <th className="p-3">Invoice ID</th>
                <th className="p-3">Client</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="p-3 font-bold font-mono text-indigo-600">{inv.id}</td>
                  <td className="p-3">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{inv.clientName}</p>
                    <p className="text-[11px] text-muted-foreground">{inv.email}</p>
                  </td>
                  <td className="p-3 font-extrabold text-zinc-900 dark:text-zinc-50">${inv.amount.toLocaleString()}</td>
                  <td className="p-3 text-xs">{inv.issueDate}</td>
                  <td className="p-3 text-xs">{inv.dueDate}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-[10px]">{inv.category}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge className={`text-[10px] uppercase font-bold ${
                      inv.status === 'paid' ? 'bg-emerald-500 text-white' :
                      inv.status === 'overdue' ? 'bg-rose-500 text-white animate-pulse' :
                      'bg-amber-500 text-white'
                    }`}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      {inv.status === 'overdue' && (
                        <Button size="xs" variant="outline" className="text-[10px] h-7 px-2.5 border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => handleReminder(inv.id, inv.clientName)}>
                          <Send className="h-3 w-3 mr-1" /> Send Reminder
                        </Button>
                      )}
                      {inv.status !== 'paid' && (
                        <Button size="xs" className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] h-7 px-2.5" onClick={() => handleMarkPaid(inv.id)}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
