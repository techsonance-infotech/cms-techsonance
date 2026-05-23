'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Calendar, 
  Activity, 
  ArrowUpRight, 
  Sparkles, 
  AlertCircle, 
  TrendingDown, 
  Settings, 
  ArrowDownRight,
  ClipboardList,
  GraduationCap,
  Shield,
  HelpCircle,
  Briefcase,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface SystemActivity {
  id: string;
  module: string;
  actor: string;
  role: string;
  action: string;
  status: 'success' | 'warn' | 'info';
  time: string;
}

export default function GlobalExecutiveDashboard() {
  const [activeSegment, setActiveSegment] = useState<'all' | 'crm' | 'erp' | 'edu'>('all');

  const activities: SystemActivity[] = [
    { id: 'ACT-084', module: 'CRM Inbox', actor: 'Sarah Chen', role: 'Business Dev', action: 'Drafted AI Reply for enterprise lead conversion', status: 'success', time: '4 mins ago' },
    { id: 'ACT-085', module: 'Construction BOQ', actor: 'Marcus Chen', role: 'Project Manager', action: 'Approved BOQ revision v2.4 (Site B)', status: 'success', time: '12 mins ago' },
    { id: 'ACT-086', module: 'Academic Curriculum', actor: 'Dr. Rivera', role: 'Curriculum Director', action: 'Curriculum template enrollment updated', status: 'info', time: '28 mins ago' },
    { id: 'ACT-087', module: 'Safety Reorder', actor: 'Security Bot', role: 'Automated Agent', action: 'Triggered safety order alert for Mat-002', status: 'warn', time: '1 hour ago' },
    { id: 'ACT-088', module: 'Security Command', actor: 'Admin', role: 'Super Admin', action: 'Modified global IP whitelist parameters', status: 'success', time: '2 hours ago' },
    { id: 'ACT-089', module: 'Finance Ledgers', actor: 'Jordan Smith', role: 'Finance Executive', action: 'Reconciled Q3 transactional balances', status: 'success', time: '3 hours ago' },
  ];

  const filteredActivities = activities.filter(act => {
    if (activeSegment === 'crm' && !['CRM Inbox', 'AI Email Composer'].includes(act.module)) return false;
    if (activeSegment === 'erp' && !['Construction BOQ', 'Safety Reorder', 'Finance Ledgers'].includes(act.module)) return false;
    if (activeSegment === 'edu' && !['Academic Curriculum'].includes(act.module)) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      {/* C-Suite Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#311042] p-6 text-white shadow-xl border border-blue-900/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-pink-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Global Executive Cockpit</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
              Welcome back, Admin
            </h2>
            <p className="text-sm text-blue-200 mt-1 max-w-xl">
              Cross-vertical tenant metrics, forecasting yield runs, and operational status dashboards.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-blue-700 bg-blue-800 text-white hover:bg-blue-700" onClick={() => toast.success("AI operations analysis triggered!")}>
              <Sparkles className="mr-1.5 h-4 w-4 text-pink-400" /> Run AI Assessment
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none shadow-sm hover:brightness-110">
              <Bell className="mr-1 h-4 w-4" /> Global Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Cross-Vertical Bento Widgets */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* CRM Deal Pipeline */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Deal Pipeline</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$8,642,900</div>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">+12.4%</span>
              <span className="text-[10px] text-muted-foreground">vs target</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Opportunity Forecast at 88% yield</p>
          </CardContent>
        </Card>

        {/* Global Attendance Rate */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Student load</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14,805</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs font-bold text-emerald-500">92.4% occupancy</span>
              <span className="text-[10px] text-muted-foreground">in active cohorts</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Academic Curriculum fully active</p>
          </CardContent>
        </Card>

        {/* Safety Reorder inventory */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Construction BOQ Volume</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹24,804,000</div>
            <Progress value={85} className="h-1.5 mt-3 bg-slate-100 dark:bg-slate-800" />
            <p className="text-xs text-muted-foreground mt-2">85% milestones fully released</p>
          </CardContent>
        </Card>

        {/* Security Command */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Security Command Alerts</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Shield className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">0</div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs font-semibold text-emerald-600">IP Audit Clean</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Firewall & features 100% stable</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Executive bento breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* AI Predictive Analytics & Future Yields (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="flex-1">
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-500 animate-pulse" />
                    AI Predictive Operations Insight Engine
                  </CardTitle>
                  <CardDescription>Forward predictive yield runs and cross-tenant capacity allocation alerts</CardDescription>
                </div>
                <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-400 font-bold border-none">
                  Cycle Yield: +18.4%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  <p className="text-xs font-bold text-pink-600">CRM Conversion Pipeline</p>
                  <p className="text-lg font-black mt-1">94% Target Met</p>
                  <Progress value={94} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" />
                  <p className="text-[10px] text-muted-foreground mt-2">AI projects $1.4M pipeline close in 30 days</p>
                </div>

                <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  <p className="text-xs font-bold text-indigo-600">Facility Occupancy Peak</p>
                  <p className="text-lg font-black mt-1">17:00 - 19:00 Load</p>
                  <Progress value={78} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" />
                  <p className="text-[10px] text-muted-foreground mt-2">Alert: Gym gym analytics indicates peak fill rate risk</p>
                </div>

                <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  <p className="text-xs font-bold text-emerald-600">Reimbursement Compliance</p>
                  <p className="text-lg font-black mt-1">0 Audits Flagged</p>
                  <Progress value={100} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" />
                  <p className="text-[10px] text-muted-foreground mt-2">100% compliance rate on batch audits</p>
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl dark:border-indigo-950 dark:bg-indigo-950/20 flex gap-3">
                <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Recommended Executive Operations Adjustment</h4>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
                    Shift technician coverage schedules towards Downtown Hub Sector A to mitigate peak SLAs delays as indicated by the Field Service Command logs. This adjustment is projected to raise Q3 First-Time Fix rates to a perfect 96.5%.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Global Multi-Module Activity logs (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <CardTitle>System Activity</CardTitle>
                  <CardDescription>Live operations feeds</CardDescription>
                </div>
                <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs">
                  <button className={`px-2 py-0.5 font-semibold rounded-md transition-colors ${activeSegment === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setActiveSegment('all')}>All</button>
                  <button className={`px-2 py-0.5 font-semibold rounded-md transition-colors ${activeSegment === 'crm' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setActiveSegment('crm')}>CRM</button>
                  <button className={`px-2 py-0.5 font-semibold rounded-md transition-colors ${activeSegment === 'erp' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setActiveSegment('erp')}>ERP</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[380px] space-y-4">
              {filteredActivities.map(act => (
                <div key={act.id} className="p-3 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px] px-2 py-0">
                      {act.module}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{act.time}</span>
                  </div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{act.action}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                    <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[8px] text-slate-700">
                      {act.actor.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{act.actor} ({act.role})</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
