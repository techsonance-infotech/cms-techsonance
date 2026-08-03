'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Sliders, Clock, CheckCircle2, Sparkles, Filter, Download,
  RefreshCw, BarChart3, PieChart as PieChartIcon, ShieldCheck, ScrollText, Play, Layers
} from 'lucide-react';
import { toast } from 'sonner';

function ReportsSkeleton() {
  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-pulse">
      {/* Banner Skeleton */}
      <div className="rounded-2xl bg-slate-100 dark:bg-[#37383E] h-36 flex flex-col justify-between p-6 md:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-3">
          <div className="h-6 w-60 bg-slate-200 dark:bg-zinc-800/80 rounded-lg"></div>
          <div className="h-3.5 w-96 bg-slate-200 dark:bg-zinc-800/80 rounded-lg"></div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] p-6 h-60"></Card>
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] p-6 h-60"></Card>
      </div>
    </div>
  );
}

export default function CustomReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dataModule, setDataModule] = useState('employees');
  const [chartType, setChartType] = useState('bar');
  const [generatedReportName, setGeneratedReportName] = useState('Q3 Corporate Staffing Summary');
  const [syncing, setSyncing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('session_token');
      const url = `/api/custom-reports`;
      const res = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        toast.success('Custom Reports synced successfully!');
      } else {
        toast.error('Failed to load custom reports.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching custom reports.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = (reportName: string, moduleName: string) => {
    toast.success(`Exporting ${reportName} in CSV format...`);
    let exportData: any[] = [];
    if (moduleName.includes('HR') || moduleName.includes('employees')) {
      exportData = [
        { Parameter: 'Total Database Profile Count', Value: data?.modules?.employees || 14 },
        { Parameter: 'Active Workspace Capacity', Value: '100% Calibrated' }
      ];
    } else if (moduleName.includes('Projects') || moduleName.includes('projects')) {
      exportData = [
        { Parameter: 'Active Projects Allocation', Value: data?.modules?.projects || 3 },
        { Parameter: 'Total Backlog Sprints Items', Value: data?.modules?.tasks || 12 }
      ];
    } else {
      exportData = [
        { Parameter: 'Outstanding Invoices Total', Value: data?.modules?.invoices || 2 },
        { Parameter: 'Pending SLAs Tickets Queue', Value: data?.modules?.tickets || 4 }
      ];
    }

    const headers = Object.keys(exportData[0]).join(',');
    const rows = exportData.map(row => 
      Object.values(row).map(val => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Custom Report generated successfully!');
  };

  if (loading || !data) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-6 p-1 max-w-[1700px] mx-auto animate-fadeIn">
      {/* Premium Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 to-zinc-900 p-6 md:p-8 border border-primary/20 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-white/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-soft to-primary-light bg-clip-text text-transparent flex items-center gap-2">
              <ScrollText className="h-8 w-8 text-white" />
              Cross-Module Custom Reports Engine
            </h1>
            <p className="text-white/80 text-xs max-w-2xl">
              Build, parameterize, compile, and schedule enterprise reports combining data from HR, Attendance, CRM, Finance, and Projects.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={syncing} className="border-white/20 text-white hover:bg-white/10 bg-transparent disabled:opacity-50">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing BI...' : 'Refresh Modules'}
            </Button>
          </div>
        </div>
      </div>

      {/* Cross-Module Database Row Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
        {[
          { name: 'Employees', count: data.modules.employees },
          { name: 'Projects', count: data.modules.projects },
          { name: 'Tasks', count: data.modules.tasks },
          { name: 'Invoices', count: data.modules.invoices },
          { name: 'Helpdesk Tickets', count: data.modules.tickets },
          { name: 'Compliance Audits', count: data.modules.compliance }
        ].map((item, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-[#37383E] p-4 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">{item.name}</span>
            <div className="text-xl font-black text-slate-800 dark:text-white">{item.count} rows</div>
          </Card>
        ))}
      </div>

      {/* Visual Report Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Builder controls */}
        <div className="lg:col-span-8">
          <Card className="shadow-sm border-slate-100 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-[#37383E]">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Visual Drag-and-Drop Report Designer</CardTitle>
              <CardDescription>Construct custom reports and query calculations without writing code.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-550">Source Data Module</label>
                  <select
                    value={dataModule}
                    onChange={e => setDataModule(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold"
                  >
                    <option value="employees">Employee Master Profile</option>
                    <option value="projects">Projects & Delivery Milestones</option>
                    <option value="invoices">Invoices & Billing Ledger</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-550">Visual Chart Layout</label>
                  <select
                    value={chartType}
                    onChange={e => setChartType(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-bold"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Graph</option>
                    <option value="pivot">Data Table Pivot Grid</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-550">Output Filename</label>
                  <input
                    type="text"
                    value={generatedReportName}
                    onChange={e => setGeneratedReportName(e.target.value)}
                    className="w-full bg-white dark:bg-[#1E1F22] border border-border text-xs rounded-xl p-2.5 text-slate-800 dark:text-zinc-200 font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => handleExportCSV(generatedReportName, dataModule)} className="border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300">
                  <Download className="mr-2 h-4 w-4" /> Export CSV Report
                </Button>
                <Button size="sm" onClick={() => toast.success(`Layout matching updated to: ${chartType}`)} className="bg-primary hover:bg-primary/95 text-white font-bold">
                  Update Preview Grid
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved corporate reports queue */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E] h-full flex flex-col">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b rounded-t-2xl">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-primary" /> Reports Queue templates
              </CardTitle>
              <CardDescription>Instantly execute and download parameterized report structures.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
              {data.reportsQueue.map((r: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/30 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">{r.name}</span>
                    <Badge className="bg-indigo-500/10 text-indigo-500 border-none font-bold text-[8px] uppercase">{r.module}</Badge>
                  </div>
                  <Button size="sm" onClick={() => handleExportCSV(r.name, r.module)} className="bg-primary hover:bg-primary/95 text-white h-7 text-[10px] px-2.5 rounded-lg">
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
