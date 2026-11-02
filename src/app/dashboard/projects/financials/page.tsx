'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Layers,
  ArrowUpRight,
  FolderKanban,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PsaContract {
  id: string;
  project_id: number;
  sow_details?: string | null;
  billing_model: string;
  planned_revenue: number;
  actual_revenue: number;
  planned_cost: number;
  actual_cost: number;
  margin_percentage: number;
  revenue_leakage: number;
  created_at: string;
  project?: {
    id: number;
    name: string;
    budget?: number;
    status: string;
  };
}

interface ProjectOption {
  id: number;
  name: string;
  budget?: number;
  status: string;
}

export default function ProjectFinancialsPage() {
  const [contracts, setContracts] = useState<PsaContract[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [billingModel, setBillingModel] = useState<string>('fixed_cost');
  const [plannedRevenue, setPlannedRevenue] = useState<string>('');
  const [actualRevenue, setActualRevenue] = useState<string>('');
  const [plannedCost, setPlannedCost] = useState<string>('');
  const [actualCost, setActualCost] = useState<string>('');
  const [sowDetails, setSowDetails] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchFinancialData = useCallback(async () => {
    try {
      setSyncing(true);
      const token = typeof window !== 'undefined' 
        ? (sessionStorage.getItem('session_token') || localStorage.getItem('session_token')) 
        : null;
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [contractsRes, projectsRes] = await Promise.all([
        fetch('/api/psa/contracts', { headers, credentials: 'include' }),
        fetch('/api/projects?limit=100', { headers, credentials: 'include' }),
      ]);

      if (contractsRes.ok) {
        const cJson = await contractsRes.json();
        setContracts(cJson.data || []);
      }

      if (projectsRes.ok) {
        const pJson = await projectsRes.json();
        const pList = Array.isArray(pJson) ? pJson : (pJson.data ?? []);
        setProjects(pList.map((p: any) => ({
          id: p.id,
          name: p.name,
          budget: p.budget,
          status: p.status
        })));
      }
    } catch (err) {
      console.error('Error fetching financial allocations:', err);
      toast.error('Failed to load financial ledger from database.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const handleOpenDialog = (existing?: PsaContract) => {
    if (existing) {
      setSelectedProjectId(String(existing.project_id));
      setBillingModel(existing.billing_model || 'fixed_cost');
      setPlannedRevenue(String(existing.planned_revenue || 0));
      setActualRevenue(String(existing.actual_revenue || 0));
      setPlannedCost(String(existing.planned_cost || 0));
      setActualCost(String(existing.actual_cost || 0));
      setSowDetails(existing.sow_details || '');
    } else {
      setSelectedProjectId('');
      setBillingModel('fixed_cost');
      setPlannedRevenue('');
      setActualRevenue('');
      setPlannedCost('');
      setActualCost('');
      setSowDetails('');
    }
    setIsDialogOpen(true);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('session_token');
      const pRev = Number(plannedRevenue) || 0;
      const aRev = Number(actualRevenue) || 0;
      const pCost = Number(plannedCost) || 0;
      const aCost = Number(actualCost) || 0;
      const margin = aRev > 0 ? Math.round(((aRev - aCost) / aRev) * 100) : 0;

      const payload = {
        projectId: Number(selectedProjectId),
        billingModel,
        plannedRevenue: pRev,
        actualRevenue: aRev,
        plannedCost: pCost,
        actualCost: aCost,
        marginPercentage: margin,
        revenueLeakage: Math.max(0, pRev - aRev),
        sowDetails: sowDetails.trim() || null
      };

      const res = await fetch('/api/psa/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Project financial allocation saved to database!');
        setIsDialogOpen(false);
        fetchFinancialData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to save financial allocation');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving financial ledger.');
    } finally {
      setSaving(false);
    }
  };

  const filteredContracts = contracts.filter(c => {
    const projName = c.project?.name || projects.find(p => p.id === c.project_id)?.name || '';
    return projName.toLowerCase().includes(search.toLowerCase()) || 
           c.billing_model.toLowerCase().includes(search.toLowerCase()) ||
           (c.sow_details && c.sow_details.toLowerCase().includes(search.toLowerCase()));
  });

  const totalAllocation = contracts.reduce((sum, c) => sum + (Number(c.planned_revenue) || 0), 0);
  const totalSpent = contracts.reduce((sum, c) => sum + (Number(c.actual_cost) || 0), 0);
  const totalActualRevenue = contracts.reduce((sum, c) => sum + (Number(c.actual_revenue) || 0), 0);
  const totalBalance = totalAllocation - totalSpent;
  const burnRate = totalAllocation > 0 ? Math.round((totalSpent / totalAllocation) * 100) : 0;

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#022c22] p-6 text-white shadow-xl border border-emerald-950/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-teal-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Financial Allocations & PSA Ledger</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent flex items-center gap-2">
              <FileSpreadsheet className="h-7 w-7 text-emerald-400" />
              Project Financials & Budget Tracking
            </h2>
            <p className="text-sm text-emerald-200 mt-1 max-w-xl">
              Live Supabase PSA ledger monitoring planned revenue, settled cost burn-rates, and contract profit margins across portfolio projects.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-emerald-800 bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-50" 
              onClick={fetchFinancialData}
              disabled={syncing}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? 'animate-spin' : ''} text-emerald-400`} /> 
              {syncing ? 'Syncing...' : 'Sync Supabase Ledger'}
            </Button>
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-sm font-bold" 
              onClick={() => handleOpenDialog()}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Allocation
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Bento Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Planned Revenue */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-emerald-500 bg-white dark:bg-[#37383E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Planned Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{totalAllocation.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Across {contracts.length} active project contract{contracts.length === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        {/* Settled Expenses / Cost */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-rose-500 bg-white dark:bg-[#37383E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actual Settled Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
              ₹{totalSpent.toLocaleString()}
            </div>
            <Progress value={Math.min(100, burnRate)} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[10px] text-muted-foreground mt-2">{burnRate}% burn rate against planned budget</p>
          </CardContent>
        </Card>

        {/* Net Remaining Balance */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-indigo-500 bg-white dark:bg-[#37383E]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Margin Buffer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              ₹{totalBalance.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Recognized Revenue: ₹{totalActualRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Allocations Matrix Table */}
      <Card className="bg-white dark:bg-[#37383E] border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3 border-b dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold">Project Allocation Ledger</CardTitle>
              <CardDescription className="text-xs">Direct PSA agreements and cost tracking synced with database</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by project or billing model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-4 p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                <th className="p-3 px-6">Project Name</th>
                <th className="p-3">Billing Model</th>
                <th className="p-3">Planned Revenue</th>
                <th className="p-3">Actual Revenue</th>
                <th className="p-3">Actual Cost</th>
                <th className="p-3">Margin %</th>
                <th className="p-3">Revenue Leakage</th>
                <th className="p-3 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading database ledger...
                  </td>
                </tr>
              ) : filteredContracts.length > 0 ? (
                filteredContracts.map(c => {
                  const projName = c.project?.name || projects.find(p => p.id === c.project_id)?.name || `Project #${c.project_id}`;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                      <td className="p-3 px-6">
                        <p className="font-bold text-slate-800 dark:text-zinc-100 text-xs">{projName}</p>
                        {c.sow_details && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-xs">{c.sow_details}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {c.billing_model?.replace(/_/g, ' ') || 'Fixed Cost'}
                        </Badge>
                      </td>
                      <td className="p-3 font-bold text-xs text-slate-700 dark:text-zinc-200">
                        ₹{(Number(c.planned_revenue) || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        ₹{(Number(c.actual_revenue) || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-xs text-rose-500">
                        ₹{(Number(c.actual_cost) || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-xs font-bold">
                        <span className={Number(c.margin_percentage) >= 20 ? 'text-emerald-600' : 'text-amber-500'}>
                          {c.margin_percentage || 0}%
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {Number(c.revenue_leakage) > 0 ? (
                          <span className="text-rose-500 font-semibold">₹{Number(c.revenue_leakage).toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-500 font-semibold">₹0</span>
                        )}
                      </td>
                      <td className="p-3 text-right pr-6">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs text-primary hover:text-primary-focus" 
                          onClick={() => handleOpenDialog(c)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FolderKanban className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No PSA contracts or financial allocations recorded yet.</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">Click &quot;Add Allocation&quot; to assign budget metrics to an existing project.</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-4 text-xs font-bold" 
                      onClick={() => handleOpenDialog()}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Create First Allocation
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit Allocation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Configure Project Financial Allocation</DialogTitle>
            <DialogDescription className="text-xs">
              Map revenue, cost parameters, and billing models to your project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveContract} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Select Project *</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                      {p.name} {p.budget ? `(Budget: ₹${Number(p.budget).toLocaleString()})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Billing Model</Label>
              <Select value={billingModel} onValueChange={setBillingModel}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select billing model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_cost" className="text-xs">Fixed Cost</SelectItem>
                  <SelectItem value="time_and_materials" className="text-xs">Time & Materials</SelectItem>
                  <SelectItem value="retainer" className="text-xs">Retainer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Planned Revenue (₹)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={plannedRevenue}
                  onChange={(e) => setPlannedRevenue(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Actual Revenue (₹)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={actualRevenue}
                  onChange={(e) => setActualRevenue(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Planned Cost (₹)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={plannedCost}
                  onChange={(e) => setPlannedCost(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Actual Cost (₹)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">SOW / Contract Notes</Label>
              <Input 
                placeholder="Scope of work or milestone notes..."
                value={sowDetails}
                onChange={(e) => setSowDetails(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary-focus font-bold text-white" disabled={saving}>
                {saving ? 'Saving...' : 'Save Allocation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
