'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Cpu, 
  Activity, 
  FileText, 
  RefreshCw, 
  TrendingUp, 
  Settings, 
  Sparkles,
  Search,
  ChevronRight,
  Maximize2,
  Minimize2,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface TenantRecord {
  id: string;
  name: string;
  industry: 'Real Estate' | 'Construction' | 'IT Services';
  status: 'active' | 'suspended' | 'maintenance';
  revenue: number;
  users: number;
  health: number;
}

export default function NexusEnterprisePage() {
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard');
  const [search, setSearch] = useState('');
  
  const [tenants, setTenants] = useState<TenantRecord[]>([
    { id: 'tnt-001', name: 'Skyline Ventures', industry: 'Real Estate', status: 'active', revenue: 148200, users: 84, health: 99 },
    { id: 'tnt-002', name: 'Alpha Tech Corp', industry: 'IT Services', status: 'active', revenue: 204900, users: 112, health: 98 },
    { id: 'tnt-003', name: 'Omega Logistics', industry: 'Construction', status: 'active', revenue: 98900, users: 45, health: 100 },
    { id: 'tnt-004', name: 'Global Retail Corp', industry: 'IT Services', status: 'maintenance', revenue: 0, users: 0, health: 76 },
  ]);

  const handleGenerateTenantReport = () => {
    toast.success("Flagship corporate multi-tenant report compiled and downloadable.");
  };

  const handleSyncTenant = (id: string, name: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Synchronizing schema tokens for ${name}...`,
        success: `Schema synchronized and verified with Nexus Main Cluster.`,
        error: 'Failed to sync schema.',
      }
    );
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.industry.toLowerCase().includes(search.toLowerCase()));

  // Adjust classes dynamically based on density select
  const densityPadding = 
    density === 'compact' ? 'py-1.5 px-3' : 
    density === 'comfortable' ? 'py-3.5 px-5' : 
    'py-2.5 px-4';

  const densityMargin = 
    density === 'compact' ? 'gap-2' : 
    density === 'comfortable' ? 'gap-6' : 
    'gap-4';

  return (
    <div className={`space-y-6 p-1 max-w-[1600px] mx-auto`}>
      
      {/* Brand Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4744e5] via-[#6161ff] to-[#1e1b4b] p-6 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-indigo-400/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Layers className="h-4 w-4 text-indigo-200 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">Nexus flagship corporate cockpit</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
              Nexus Enterprise Dashboard
            </h2>
            <p className="text-sm text-indigo-100 mt-1 max-w-xl">
              Standard Corporate Modern framework. Violet-blue brand tokens, density-toggle spacing grids, and multi-tenant performance clusters.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-indigo-400 bg-indigo-900/50 text-white hover:bg-indigo-800" onClick={handleGenerateTenantReport}>
              Generate Tenant Report
            </Button>
            <Button size="sm" className="bg-white hover:bg-indigo-50 text-[#4744e5] border-none shadow-sm font-bold" onClick={() => toast.success("Nexus Edge cluster synchronized.")}>
              Sync Clusters
            </Button>
          </div>
        </div>
      </div>

      {/* Flagship Controls panel */}
      <Card className="border border-indigo-100 dark:border-indigo-950">
        <CardHeader className="pb-3 border-b bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#4744e5] animate-spin" />
                Interface Spacing & Density Configuration
              </CardTitle>
            </div>
            
            {/* Spacing Density Toggles */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Density Mode:</span>
              <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs font-semibold">
                <button className={`px-3 py-1.5 rounded-md transition-colors ${density === 'compact' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setDensity('compact')}>Compact</button>
                <button className={`px-3 py-1.5 rounded-md transition-colors ${density === 'standard' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setDensity('standard')}>Standard</button>
                <button className={`px-3 py-1.5 rounded-md transition-colors ${density === 'comfortable' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setDensity('comfortable')}>Comfortable</button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Bento Stats */}
      <div className={`grid gap-6 md:grid-cols-4 ${densityMargin}`}>
        
        {/* Operations gross yield */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operations Gross Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-[#4744e5]">$452,000</div>
            <p className="text-[10px] text-muted-foreground mt-2">Combined multi-tenant monthly deposits</p>
          </CardContent>
        </Card>

        {/* Tenant Count */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">12 Tenants</div>
            <p className="text-[10px] text-muted-foreground mt-2">White-label partition frameworks active</p>
          </CardContent>
        </Card>

        {/* Nexus CPU Load */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nexus Cluster CPU</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-600">22%</div>
            <p className="text-[10px] text-muted-foreground mt-2">High processing capability reserve</p>
          </CardContent>
        </Card>

        {/* Global SLA */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Global Cluster Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-violet-600">99.98%</div>
            <p className="text-[10px] text-muted-foreground mt-2">No active degraded infrastructure nodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tenants Directory */}
      <Card>
        <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Tenants Active Directory</CardTitle>
              <CardDescription>Verify client license, database health and revenue metrics</CardDescription>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tenant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-xl border max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                  <th className="p-3">Tenant ID</th>
                  <th className="p-3">Tenant Name</th>
                  <th className="p-3">Industry Vertical</th>
                  <th className="p-3">Revenue Volume</th>
                  <th className="p-3">Cohort size</th>
                  <th className="p-3">Cluster Health</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filteredTenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className={`font-mono font-bold text-[#4744e5] ${densityPadding}`}>{tenant.id}</td>
                    <td className={`font-bold text-zinc-900 dark:text-zinc-50 ${densityPadding}`}>{tenant.name}</td>
                    <td className={densityPadding}>
                      <Badge variant="secondary" className="text-[10px]">{tenant.industry}</Badge>
                    </td>
                    <td className={`font-extrabold ${densityPadding}`}>${tenant.revenue.toLocaleString()}</td>
                    <td className={densityPadding}>{tenant.users} members</td>
                    <td className={densityPadding}>
                      <div className="flex items-center gap-2">
                        <Progress value={tenant.health} className="h-1.5 w-16 bg-slate-200 dark:bg-slate-800" />
                        <span className="font-semibold text-xs">{tenant.health}%</span>
                      </div>
                    </td>
                    <td className={densityPadding}>
                      <Badge className={`text-[9px] uppercase font-bold ${
                        tenant.status === 'active' ? 'bg-emerald-500 text-white' :
                        tenant.status === 'suspended' ? 'bg-rose-500 text-white' :
                        'bg-amber-500 text-white animate-pulse'
                      }`}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td className={`text-right ${densityPadding}`}>
                      <div className="flex justify-end gap-1.5">
                        <Button size="xs" variant="outline" className="h-7 text-xs" onClick={() => handleSyncTenant(tenant.id, tenant.name)}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Sync
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
