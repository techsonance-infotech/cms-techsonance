// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Sparkles, 
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Mail,
  Phone,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface TrainerSession {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  time: string;
  studio: string;
  status: 'confirmed' | 'pending';
}

interface ExpiringMember {
  id: string;
  name: string;
  email: string;
  plan: string;
  expiryDate: string;
  engagement: number; // 1-5 scale
  status: 'at_risk' | 'stable';
}

export default function GymMembershipAnalytics() {
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

  const trainerSessions: TrainerSession[] = [
    { id: 'S1', name: 'Alex Rivera', avatar: 'AR', specialty: 'HIIT Specialist', time: '10:00 - 11:30', studio: 'Studio A', status: 'confirmed' },
    { id: 'S2', name: 'Jordan Smith', avatar: 'JS', specialty: 'Yoga & Mobility', time: '12:00 - 13:00', studio: 'Zen Room', status: 'confirmed' },
    { id: 'S3', name: 'Marcus Chen', avatar: 'MC', specialty: 'Strength Coach', time: '15:00 - 17:00', studio: 'Floor 2', status: 'pending' },
  ];

  const expiringMembers: ExpiringMember[] = [
    { id: 'M101', name: 'Sarah Connor', email: 'sarah.c@email.com', plan: 'Premium Annual', expiryDate: 'Oct 24, 2023', engagement: 3, status: 'at_risk' },
    { id: 'M102', name: 'John Wick', email: 'john.w@email.com', plan: 'Monthly Basic', expiryDate: 'Oct 22, 2023', engagement: 1, status: 'at_risk' },
    { id: 'M103', name: 'James Bond', email: 'bond.007@email.com', plan: 'Premium Annual', expiryDate: 'Nov 02, 2023', engagement: 5, status: 'stable' },
    { id: 'M104', name: 'Ellen Ripley', email: 'ripley.e@email.com', plan: 'Quarterly Pass', expiryDate: 'Oct 28, 2023', engagement: 4, status: 'stable' },
  ];

  const handleRenewalLink = (name: string) => {
    toast.success(`Renewal link dispatched to ${name}'s verified contact dossier!`);
  };

  const handleCallMember = (name: string) => {
    toast.success(`Call scheduled with ${name}. Account manager alerted.`);
  };

  const filteredMembers = expiringMembers.filter(member => {
    if (selectedPlan !== 'all' && member.plan !== selectedPlan) return false;
    return member.name.toLowerCase().includes(memberSearch.toLowerCase()) || member.email.toLowerCase().includes(memberSearch.toLowerCase());
  });

  // Heatmap hourly data: Monday to Sunday across 6 blocks
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['06:00 AM', '09:00 AM', '12:00 PM', '03:00 PM', '06:00 PM', '09:00 PM'];
  
  // Sector densities mapping: [hourIndex][dayIndex] 0-3 density scale
  const densityMatrix = [
    [2, 2, 1, 2, 2, 3, 2], // 06:00 AM
    [3, 3, 2, 3, 2, 3, 3], // 09:00 AM
    [1, 2, 1, 2, 1, 2, 2], // 12:00 PM
    [2, 3, 2, 3, 2, 1, 1], // 03:00 PM
    [3, 3, 3, 3, 3, 1, 1], // 06:00 PM
    [2, 2, 1, 2, 2, 1, 1], // 09:00 PM
  ];

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#111827] to-[#1f2937] p-6 text-white shadow-xl border border-gray-800">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-200">Wellness Analytics Desk</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent">
              Gym Membership & Analytics
            </h2>
            <p className="text-sm text-zinc-300 mt-1 max-w-xl">
              Real-time membership conversion indexes, dynamic weekly gym occupancy heatmaps, and retention diagnostics.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700" onClick={() => toast.info("Re-compiling general attendance metrics...")}>
              <Clock className="mr-1.5 h-4 w-4 text-violet-400" /> Refresh telemetry
            </Button>
            <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500 border-none shadow-sm">
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Export Retention CSV
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Active Members */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <Users className="text-violet-500/10 h-16 w-16 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">1,248</span>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5"><TrendingUp className="h-3 w-3 inline" /> +4.2%</span>
            </div>
            <Progress value={78} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[11px] text-muted-foreground mt-2">78% of overall cohort space capacity</p>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <DollarSign className="text-emerald-500/10 h-16 w-16 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Recurring Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">$54,200</span>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5"><TrendingUp className="h-3 w-3 inline" /> +12.5%</span>
            </div>
            <Progress value={90} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[11px] text-muted-foreground mt-2">Targeted Run-rate yield: $58,000</p>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <TrendingDown className="text-rose-500/10 h-16 w-16 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Churn Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600">2.4%</span>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5"><TrendingDown className="h-3 w-3 inline" /> -0.8%</span>
            </div>
            <Progress value={24} className="h-1.5 mt-4 bg-slate-100 dark:bg-slate-800" />
            <p className="text-[11px] text-muted-foreground mt-2">Benchmarked low against 3.5% avg</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Heatmap & Trainer Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Attendance Heatmap (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <CardTitle>Weekly Attendance Heatmap</CardTitle>
                  <CardDescription>Hour-by-day density indicators mapping gym load factors</CardDescription>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Low</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-zinc-800" />
                    <div className="w-3 h-3 rounded-sm bg-violet-200 dark:bg-violet-950/30" />
                    <div className="w-3 h-3 rounded-sm bg-violet-400 dark:bg-violet-700/60" />
                    <div className="w-3 h-3 rounded-sm bg-violet-600 dark:bg-violet-600" />
                  </div>
                  <span className="text-muted-foreground font-bold">Peak</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[650px] grid grid-cols-8 gap-3 text-center">
                {/* Hour offset spacer */}
                <div className="col-span-1 pt-8 text-xs font-bold text-muted-foreground text-left">Time Block</div>
                {days.map(day => (
                  <div key={day} className="col-span-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-2">{day}</div>
                ))}

                {/* Rows mapping hour indices */}
                {hours.map((hour, hourIdx) => (
                  <React.Fragment key={hour}>
                    {/* Hour indicator column */}
                    <div className="col-span-1 flex items-center text-xs text-muted-foreground font-semibold py-2 text-left">{hour}</div>
                    
                    {/* Day density square columns */}
                    {days.map((_, dayIdx) => {
                      const density = densityMatrix[hourIdx][dayIdx];
                      return (
                        <div
                          key={dayIdx}
                          title={`Peak Load Level: ${density === 3 ? 'Critical' : density === 2 ? 'High' : 'Normal'}`}
                          className={`col-span-1 h-9 rounded-lg transition-all duration-300 hover:scale-105 ${
                            density === 3 ? 'bg-violet-600 text-white shadow-sm' :
                            density === 2 ? 'bg-violet-400/60 dark:bg-violet-700/40 text-violet-700 dark:text-violet-300' :
                            density === 1 ? 'bg-violet-200/40 dark:bg-violet-950/20 text-violet-500' :
                            'bg-slate-100 dark:bg-zinc-800/40 text-muted-foreground'
                          }`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trainer Schedule (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>Trainer Roster Assignments</CardTitle>
                <CardDescription>Scheduled Studio sessions</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 overflow-y-auto max-h-[350px]">
              {trainerSessions.map(session => (
                <div key={session.id} className="p-3 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-600 text-xs">
                      {session.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{session.name}</p>
                      <p className="text-[11px] text-muted-foreground">{session.specialty}</p>
                      <p className="text-[10px] text-zinc-500 font-bold mt-0.5">{session.studio}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">{session.time}</span>
                    <div className="mt-1">
                      <Badge variant={session.status === 'confirmed' ? 'default' : 'outline'} className="text-[9px] uppercase px-1.5 h-4">
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              <Button size="xs" variant="outline" className="w-full text-xs h-9 border-dashed border-2 hover:border-violet-500 hover:text-violet-600 transition-colors" onClick={() => toast.info("Trainer allocation modal active")}>
                + Assign New Studio Session
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Expiring Memberships Ledger (Full Width) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Expiring Policy Ledgers & Risk Registry</CardTitle>
              <CardDescription>Members ending in the next 7 days</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
              <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-none">
                14 Members at Risk
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                <th className="p-3">Member</th>
                <th className="p-3">Plan Type</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Engagement Telemetry</th>
                <th className="p-3">Risk Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="p-3">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{member.name}</p>
                    <p className="text-[11px] text-muted-foreground">{member.email}</p>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-[10px]">{member.plan}</Badge>
                  </td>
                  <td className="p-3 text-xs font-semibold">{member.expiryDate}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(idx => (
                        <div
                          key={idx}
                          className={`w-1 h-3 rounded-full ${
                            idx <= member.engagement
                              ? member.engagement <= 2
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={`text-[10px] uppercase font-bold ${
                      member.status === 'at_risk' ? 'bg-rose-500/10 text-rose-600 border-rose-200' : 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                    }`} variant="outline">
                      {member.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="xs" variant="outline" className="text-[10px] h-7 px-2.5" onClick={() => handleCallMember(member.name)}>
                        Call Member
                      </Button>
                      <Button size="xs" className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] h-7 px-2.5" onClick={() => handleRenewalLink(member.name)}>
                        Send Renewal Link
                      </Button>
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
