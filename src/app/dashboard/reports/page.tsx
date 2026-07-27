'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, LineChart, PieChart, TrendingUp, Download, 
  Sparkles, Bot, Filter, Sliders, CalendarDays, Search, 
  ArrowUpRight, AlertTriangle, Layers, FileSpreadsheet, Plus, HelpCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export default function ReportsBIPage() {
  const [activeTab, setActiveTab] = useState<'dashboards' | 'builder' | 'predictive'>('dashboards');
  const [loading, setLoading] = useState(false);

  // Custom Report Builder States
  const [dataModule, setDataModule] = useState('employees');
  const [chartType, setChartType] = useState('bar');
  const [selectedMetric, setSelectedMetric] = useState('headcount');
  const [generatedReportName, setGeneratedReportName] = useState('Q3 Active Staffing Summary');

  // Filter criteria
  const [deptFilter, setDeptFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Simulated reports list
  const reports = [
    { name: 'Monthly Workforce Cost Summary', module: 'Payroll', author: 'System Job', format: 'PDF, CSV' },
    { name: 'Onboarding Progression Matrix', module: 'HR Operations', author: 'HR Bot', format: 'Excel' },
    { name: 'Billable Utilization Audit', module: 'PSA & Projects', author: 'Delivery Head', format: 'CSV' },
    { name: 'Quarterly Attrition and Exit Review', module: 'Compliance', author: 'AI Insights', format: 'PDF' }
  ];

  const handleExport = (format: string) => {
    toast.success(`Exporting report in ${format} format...`);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-[#0f172a] to-zinc-950 p-6 border border-zinc-800 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-[#f87941]" />
              Enterprise BI & Analytics Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">Centralized executive dashboard for headcount demographics, resource utilization, and predictive forecasting.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-800 text-slate-300 bg-transparent text-xs h-9" onClick={() => handleExport('Excel')}>
              <Download className="h-4 w-4 mr-1.5" /> Export BI Matrix
            </Button>
            <Badge className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/30 px-3 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
              Live BI Materialized Views Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex gap-2 border-b pb-2.5 text-xs font-bold text-slate-500">
        {[
          { id: 'dashboards', label: 'Executive BI Dashboards', icon: Layers },
          { id: 'builder', label: 'No-Code Custom Report Builder', icon: Sliders },
          { id: 'predictive', label: 'AI Forecasting & What-If Simulations', icon: LineChart }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[#f87941]/15 text-[#f87941]' 
                  : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Main interactive layouts based on tabs */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* TAB 1: EXECUTIVE BI DASHBOARDS */}
          {activeTab === 'dashboards' && (
            <div className="space-y-6">
              
              {/* Demographics & Diversity summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-md border-slate-100 dark:border-zinc-800/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-extrabold uppercase">Gender Representation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Male Employees</span>
                      <span className="text-[#f87941] font-bold">58.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Female Employees</span>
                      <span className="text-pink-500 font-bold">40.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Others</span>
                      <span className="text-slate-400 font-bold">1.4%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-slate-100 dark:border-zinc-800/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-extrabold uppercase">Age Group Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">21 - 30 yrs (Gen Z/Y)</span>
                      <span className="text-violet-500 font-bold">46%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">31 - 40 yrs</span>
                      <span className="text-[#f87941] font-bold">38%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">40+ yrs</span>
                      <span className="text-slate-400 font-bold">16%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-slate-100 dark:border-zinc-800/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-slate-400 font-extrabold uppercase">Work Location Splits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Office (HQ Surat)</span>
                      <span className="text-emerald-500 font-bold">62%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Hybrid Model</span>
                      <span className="text-amber-500 font-bold">24%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-700 dark:text-slate-350">Remote Work</span>
                      <span className="text-blue-500 font-bold">14%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Materialized operational indicators lists */}
              <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
                <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center pb-4">
                  <div>
                    <CardTitle className="text-md">Saved Corporate Reports Queue</CardTitle>
                    <CardDescription>Click to instantly download parameterized snapshots.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/10 border-b">
                        <th className="p-3 px-6">Report Title</th>
                        <th className="p-3">Data Domain</th>
                        <th className="p-3">Generated By</th>
                        <th className="p-3">Formats</th>
                        <th className="p-3 text-right">Download Trigger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                          <td className="p-3 px-6 font-bold">{r.name}</td>
                          <td className="p-3"><Badge className="bg-indigo-500/10 text-indigo-500 border-none font-bold text-[9px]">{r.module}</Badge></td>
                          <td className="p-3 font-semibold text-slate-500">{r.author}</td>
                          <td className="p-3 font-mono text-slate-400">{r.format}</td>
                          <td className="p-3 text-right">
                            <Button size="sm" onClick={() => handleExport(r.format.split(',')[0])} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-7 text-[10px]">
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: NO-CODE REPORT BUILDER */}
          {activeTab === 'builder' && (
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md">Visual Drag-and-Drop Report Designer</CardTitle>
                <CardDescription>Construct parameterized query exports across modules without SQL development.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 text-xs font-semibold">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500">Source Data Module</label>
                    <Select value={dataModule} onValueChange={setDataModule}>
                      <SelectTrigger className="bg-white dark:bg-[#1E1F22] border-border h-9 text-xs">
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employees">Employee Master Profile</SelectItem>
                        <SelectItem value="payroll">Payroll & Compensation Logs</SelectItem>
                        <SelectItem value="projects">Resource Assignments</SelectItem>
                        <SelectItem value="leaves">Leaves & Vacation Requests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500">Layout Chart View</label>
                    <Select value={chartType} onValueChange={setChartType}>
                      <SelectTrigger className="bg-white dark:bg-[#1E1F22] border-border h-9 text-xs">
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Graph</SelectItem>
                        <SelectItem value="pie">Pie Chart Diagram</SelectItem>
                        <SelectItem value="pivot">Data Table Pivot Grid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-500">Report Title</label>
                    <Input
                      placeholder="e.g. Q3 Active Staffing Summary"
                      value={generatedReportName}
                      onChange={e => setGeneratedReportName(e.target.value)}
                      className="bg-white dark:bg-[#1E1F22] border-border h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-900/20 min-h-[220px]">
                  <div className="p-3.5 rounded-full bg-violet-500/10 text-violet-500 mb-3">
                    <PieChart className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{generatedReportName}</h4>
                  <p className="text-[10px] text-slate-400 mb-4">Configured using the visual query layout engine.</p>
                  <div className="flex gap-2">
                    <Button onClick={() => toast.success('Custom report blueprint saved successfully')} className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-9">
                      Save custom template
                    </Button>
                    <Button onClick={() => handleExport('Excel')} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold h-9">
                      Run & Download XLS
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: PREDICTIVE FORECASTING */}
          {activeTab === 'predictive' && (
            <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b">
                <CardTitle className="text-md flex items-center gap-2"><Bot className="h-5 w-5 text-orange-400" /> AI Workforce Predictive Intelligence</CardTitle>
                <CardDescription>Predict hiring budgets, skill shortages, and exit cycles.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 text-xs font-semibold">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                    <h5 className="font-bold text-[#f87941] uppercase tracking-wider text-[9px] mb-2">Hiring Demand Projection (Q4)</h5>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">+8.4 Full Time Hires</p>
                    <p className="text-[10px] text-slate-400 mt-1">Confidence rate: 94% (Based on product pipeline growth)</p>
                  </div>

                  <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/20 border-slate-100 dark:border-zinc-850">
                    <h5 className="font-bold text-rose-500 uppercase tracking-wider text-[9px] mb-2">Predicted Attrition Trigger</h5>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100">4.2% Risk Level</p>
                    <p className="text-[10px] text-slate-400 mt-1">Confidence rate: 88% (Based on leave-taking profiles)</p>
                  </div>
                </div>

                <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10 flex gap-3 items-start">
                  <AlertTriangle className="h-5 w-5 text-[#f87941] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h6 className="font-bold text-slate-800 dark:text-slate-200">Recommended Executive Action</h6>
                    <p className="text-slate-500 text-[10px] leading-relaxed">Launch retention packages for critical design specialists. Overutilization has reached critical capacity limits.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Side Column: Report Categories & AI Assistant advice */}
        <div className="col-span-12 lg:col-span-4 space-y-6 text-xs font-semibold">
          
          {/* Quick Filters */}
          <Card className="shadow-lg border-slate-100 dark:border-zinc-800/80">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-zinc-900/20 pb-4">
              <CardTitle className="text-md flex items-center gap-1.5"><Filter className="h-4.5 w-4.5 text-[#f87941]" /> Report Custom Filters</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-500">Department Filter</label>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="bg-white dark:bg-[#1E1F22] border-border h-9 text-xs">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="eng">Engineering</SelectItem>
                    <SelectItem value="design">Product Design</SelectItem>
                    <SelectItem value="hr">HR Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-500">Office Branch Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-white dark:bg-[#1E1F22] border-border h-9 text-xs">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="hq">HQ Surat Branch</SelectItem>
                    <SelectItem value="delhi">Delhi Satellite Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* AI BI Assistant Box */}
          <Card className="border-none shadow-xl relative overflow-hidden bg-slate-900 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f87941]/30 blur-3xl -mr-16 -mt-16 rounded-full"></div>
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-orange-400 animate-pulse" />
                <CardTitle className="text-md font-bold text-orange-400">AI Intelligence Auditor</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10 text-xs text-slate-300 font-medium">
              <p>Total payroll costs are trending **+4.2% MoM** due to recent variable bonuses paid in eSIM project cycles.</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm space-y-1">
                <div className="font-bold text-white text-[10px]">Parity Insight</div>
                <p className="text-[10px] text-slate-400">Pay gap parity across engineering cohorts is within a healthy 1.2% threshold.</p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
