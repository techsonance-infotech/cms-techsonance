'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Building2, 
  Sparkles, 
  Search,
  Plus,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface BudgetAllocation {
  id: string;
  projectName: string;
  category: 'Software Licensing' | 'Server Resources' | 'Consulting Staff' | 'Hardware Lease';
  amount: number;
  frequency: 'Monthly Recurring' | 'One-time' | 'Annual';
  allocatedDate: string;
  spent: number;
}

export default function ProjectFinancialsPage() {
  const [search, setSearch] = useState('');

  const [allocations, setAllocations] = useState<BudgetAllocation[]>([
    { id: 'ALC-401', projectName: 'Skyline Ventures portal', category: 'Software Licensing', amount: 8400, frequency: 'Monthly Recurring', allocatedDate: '2026-05-01', spent: 6200 },
    { id: 'ALC-402', projectName: 'Alpha Enterprise ERP', category: 'Consulting Staff', amount: 35000, frequency: 'One-time', allocatedDate: '2026-05-02', spent: 28000 },
    { id: 'ALC-403', projectName: 'Omega Logistics API', category: 'Server Resources', amount: 12000, frequency: 'Monthly Recurring', allocatedDate: '2026-05-03', spent: 8900 },
    { id: 'ALC-404', projectName: 'Horizon Real Estate Cloud', category: 'Hardware Lease', amount: 15000, frequency: 'Annual', allocatedDate: '2026-05-10', spent: 5000 },
  ]);

  const handleSyncAllocations = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Synchronizing Q3 budget ledger with finance department nodes...',
        success: 'Financial ledgers synchronized and verified with Supabase ledger cache.',
        error: 'Failed to sync budget.',
      }
    );
  };

  const handleAddAllocation = () => {
    toast.success("Allocation wizard triggered. Map cost center options to active pipelines.");
  };

  const handleDeleteAllocation = (id: string) => {
    setAllocations(prev => prev.filter(alc => alc.id !== id));
    toast.success(`Allocation ledger item ${id} deleted.`);
  };

  const filteredAllocations = allocations.filter(alc => alc.projectName.toLowerCase().includes(search.toLowerCase()) || alc.category.toLowerCase().includes(search.toLowerCase()));

  const totalAllocation = allocations.reduce((sum, a) => sum + a.amount, 0);
  const totalSpent = allocations.reduce((sum, a) => sum + a.spent, 0);
  const totalBalance = totalAllocation - totalSpent;

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#022c22] p-6 text-white shadow-xl border border-emerald-950/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-teal-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Financial Allocations Suite</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
              Project Financials & Budget Tracking
            </h2>
            <p className="text-sm text-emerald-200 mt-1 max-w-xl">
              Monitor active Q3 milestone budgets, verify cost center burn-rates, and synchronise financial data with central billing structures.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-emerald-800 bg-emerald-950 text-white hover:bg-emerald-900" onClick={handleSyncAllocations}>
              <RefreshCw className="mr-1.5 h-4 w-4 animate-spin text-emerald-400" /> Sync Allocations
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-sm font-bold" onClick={handleAddAllocation}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Allocation
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Bento Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Total Allocated Q3 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Allocated Q3</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">${totalAllocation.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-2">Combined allocations across 4 active pipelines</p>
          </CardContent>
        </Card>

        {/* Total Spent so far */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settled Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">${totalSpent.toLocaleString()}</div>
            <Progress value={(totalSpent / totalAllocation) * 100} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[10px] text-muted-foreground mt-2">{Math.round((totalSpent / totalAllocation) * 100)}% burn rate of total budget</p>
          </CardContent>
        </Card>

        {/* Net Remaining Balance */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Remaining Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">${totalBalance.toLocaleString()}</div>
            <Progress value={(totalBalance / totalAllocation) * 100} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[10px] text-muted-foreground mt-2">Safe processing buffer remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Allocations Matrix Table */}
      <Card>
        <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Allocation Matrix</CardTitle>
              <CardDescription>Verify cost centers and dispatch ledger changes</CardDescription>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search allocation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                <th className="p-3">ID</th>
                <th className="p-3">Project / Pipeline</th>
                <th className="p-3">Cost Category</th>
                <th className="p-3">Allocated Amount</th>
                <th className="p-3">Expenses Settled</th>
                <th className="p-3">Balance Remaining</th>
                <th className="p-3">Frequency</th>
                <th className="p-3 text-right">Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredAllocations.map(alc => {
                const balance = alc.amount - alc.spent;
                return (
                  <tr key={alc.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="p-3 font-bold font-mono text-emerald-600">{alc.id}</td>
                    <td className="p-3">
                      <p className="font-bold text-zinc-900 dark:text-zinc-50">{alc.projectName}</p>
                      <p className="text-[10px] text-muted-foreground">Allocated {alc.allocatedDate}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-[10px]">{alc.category}</Badge>
                    </td>
                    <td className="p-3 font-bold">${alc.amount.toLocaleString()}</td>
                    <td className="p-3 text-rose-500 font-bold">${alc.spent.toLocaleString()}</td>
                    <td className="p-3 text-emerald-600 font-bold">${balance.toLocaleString()}</td>
                    <td className="p-3 text-xs">{alc.frequency}</td>
                    <td className="p-3 text-right">
                      <Button size="xs" variant="ghost" className="text-rose-500 hover:text-rose-600" onClick={() => handleDeleteAllocation(alc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
