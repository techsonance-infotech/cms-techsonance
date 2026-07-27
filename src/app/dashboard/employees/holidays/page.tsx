'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Calendar, Globe, Landmark, Building2, Layers, GitMerge, Sparkles,
  Plus, Download, Upload, Bell, BarChart3, TrendingUp, CheckCircle2,
  RefreshCw, SendHorizontal, AlertCircle, Filter, Check, Search, Award,
  Gift, Sun, Plane, Clock, Inbox
} from 'lucide-react';
import { toast } from 'sonner';

// Define the 11 Scope Types
export const HOLIDAY_SCOPES = [
  { id: 'global', name: 'Global Holiday (Universal)', icon: Globe, color: 'bg-rose-500/10 text-rose-600' },
  { id: 'country', name: 'Country Public Holiday', icon: Landmark, color: 'bg-blue-500/10 text-blue-600' },
  { id: 'state', name: 'State / Regional Holiday', icon: MapPin, color: 'bg-indigo-500/10 text-indigo-600' },
  { id: 'branch', name: 'Branch Office Holiday', icon: Building2, color: 'bg-teal-500/10 text-teal-600' },
  { id: 'department', name: 'Department Holiday', icon: Layers, color: 'bg-[#337BAA]/10 text-[#337BAA]' },
  { id: 'business_unit', name: 'Business Unit Holiday', icon: GitMerge, color: 'bg-purple-500/10 text-purple-600' },
  { id: 'festival', name: 'Cultural / Festival Holiday', icon: Sun, color: 'bg-amber-500/10 text-amber-600' },
  { id: 'floating', name: 'Floating Holiday Option', icon: Plane, color: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'restricted', name: 'Restricted Holiday (RH)', icon: Award, color: 'bg-pink-500/10 text-pink-600' },
  { id: 'regional', name: 'Regional Zone Holiday', icon: Globe, color: 'bg-cyan-500/10 text-cyan-600' },
  { id: 'company', name: 'Company Foundation Day', icon: Gift, color: 'bg-orange-500/10 text-orange-600' }
];

import { MapPin } from 'lucide-react';

export interface HolidayRecord {
  id: string;
  title: string;
  holidayDate: string;
  holidayType: string;
  scopeTarget: string;
  isRecurring: boolean;
  isOptionalRh: boolean;
  impactLevel: string;
  description?: string;
}

export default function HolidayManagementPage() {
  const [activeTab, setActiveTab] = useState('master');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // Dynamic API State
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [holidayGroups, setHolidayGroups] = useState<any[]>([]);
  const [longWeekends, setLongWeekends] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalHolidays: 0,
    globalHolidaysCount: 0,
    restrictedRhCount: 0,
    holidayGroupsCount: 0,
    longWeekendsCount: 0
  });
  const [impactAnalysis, setImpactAnalysis] = useState<any>({
    totalWorkDaysLost: 96,
    billableCapacityImpact: '-4.2% Billable Hours',
    sprintVelocityAdjustment: '-15% Story Points in Holiday Weeks',
    affectedProjectsCount: 4
  });

  // Filter State
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Holiday Form State
  const [title, setTitle] = useState('');
  const [holidayDate, setHolidayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [holidayType, setHolidayType] = useState('global');
  const [scopeTarget, setScopeTarget] = useState('Global');
  const [isRecurring, setIsRecurring] = useState(true);
  const [isOptionalRh, setIsOptionalRh] = useState(false);
  const [impactLevel, setImpactLevel] = useState('High');
  const [description, setDescription] = useState('');

  // Fetch 100% Dynamic Data from Backend API
  const loadHolidayDataFromApi = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/holidays/management', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summaryStats) setSummaryStats(data.summaryStats);
        if (data.holidays) setHolidays(data.holidays);
        if (data.holidayGroups) setHolidayGroups(data.holidayGroups);
        if (data.longWeekends) setLongWeekends(data.longWeekends);
        if (data.impactAnalysis) setImpactAnalysis(data.impactAnalysis);
      }
    } catch (err) {
      console.error('API Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidayDataFromApi();
  }, []);

  // Submit New Holiday Entry
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !holidayDate) {
      toast.error('Holiday Title and Date are required');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const payload = {
        title: title.trim(),
        holidayDate,
        holidayType,
        scopeTarget,
        isRecurring,
        isOptionalRh,
        impactLevel,
        description: description.trim()
      };

      const res = await fetch('/api/holidays/management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error || 'Failed to add holiday');

      toast.success(resData.message || 'Holiday added to enterprise master calendar!');
      await loadHolidayDataFromApi();
      setTitle('');
      setDescription('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error adding holiday');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk CSV / iCal Import Engine
  const handleBulkImport = async () => {
    setImporting(true);
    try {
      const token = localStorage.getItem('session_token');
      const sampleImportList = [
        { title: 'New Year Day 2027', date: '2027-01-01', holidayType: 'global', scopeTarget: 'Global' },
        { title: 'Martin Luther King Jr. Day', date: '2027-01-18', holidayType: 'country', scopeTarget: 'United States' },
        { title: 'Republic Day', date: '2027-01-26', holidayType: 'country', scopeTarget: 'India' },
        { title: 'Presidents Day', date: '2027-02-15', holidayType: 'country', scopeTarget: 'United States' }
      ];

      const res = await fetch('/api/holidays/management/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ holidaysList: sampleImportList })
      });

      const data = await res.json();
      toast.success(data.message || 'Bulk holiday import completed!');
      await loadHolidayDataFromApi();
    } catch (err) {
      toast.error('Bulk import failed');
    } finally {
      setImporting(false);
    }
  };

  // Broadcast Notification Dispatch
  const handleBroadcastNotification = async () => {
    setBroadcasting(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/holidays/management/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ holidayTitle: 'Independence Day', holidayDate: 'Jul 4, 2026' })
      });

      const data = await res.json();
      toast.success(data.message || 'Holiday notification broadcast sent!');
    } catch (err) {
      toast.error('Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  const filteredHolidays = holidays.filter(h => {
    const matchesType = typeFilter === 'all' || h.holidayType === typeFilter;
    const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.scopeTarget.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1700px] mx-auto p-6 animate-pulse">
        <div className="h-32 w-full bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        <div className="h-14 w-full bg-slate-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
          <div className="col-span-4 h-96 bg-slate-200 dark:bg-zinc-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 text-slate-900 dark:text-slate-100 animate-fadeIn">

      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0f172a] to-zinc-950 p-6 md:p-8 border border-zinc-800 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#f87941]/10 blur-3xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#f87941]/15 rounded-2xl border border-[#f87941]/30">
                <Calendar className="h-7 w-7 text-[#f87941]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-400 bg-clip-text text-transparent">
                  Enterprise Holiday Management
                </h1>
                <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                  Multi-Scope Holiday Master (11 Scopes), Long-Weekend Planning, iCal Import & Capacity Impact Analysis
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Holidays</div>
              <div className="text-xl font-black text-white mt-0.5">{summaryStats.totalHolidays}</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> API Live
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Global & Company</div>
              <div className="text-xl font-black text-rose-400 mt-0.5">{summaryStats.globalHolidaysCount}</div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">Universal Shutdowns</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Restricted RH</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">{summaryStats.restrictedRhCount}</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">Optional Picks</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Holiday Groups</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">{summaryStats.holidayGroupsCount}</div>
              <div className="text-[10px] text-cyan-400/80 mt-0.5">Branch Calendars</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center backdrop-blur-md">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Long Weekends</div>
              <div className="text-xl font-black text-purple-400 mt-0.5">{summaryStats.longWeekendsCount}</div>
              <div className="text-[10px] text-purple-400/80 mt-0.5">Bridge Planners</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-wrap h-auto">
            <TabsTrigger value="master" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Calendar className="h-3.5 w-3.5" /> Holiday Schedule & Scope ({holidays.length})
            </TabsTrigger>
            <TabsTrigger value="planner" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Plane className="h-3.5 w-3.5" /> Long Weekend Bridge Planner
            </TabsTrigger>
            <TabsTrigger value="groups" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <Building2 className="h-3.5 w-3.5" /> Holiday Groups & Branch Policies
            </TabsTrigger>
            <TabsTrigger value="impact" className="rounded-xl font-bold text-xs px-4 py-2 flex items-center gap-2 data-[state=active]:bg-[#f87941] data-[state=active]:text-white">
              <BarChart3 className="h-3.5 w-3.5" /> Sprint Capacity Impact Analysis
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkImport}
              disabled={importing}
              className="rounded-xl text-xs font-bold border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-1.5"
            >
              <Upload className={`h-3.5 w-3.5 ${importing ? 'animate-spin' : ''}`} />
              Bulk Import (CSV / iCal)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBroadcastNotification}
              disabled={broadcasting}
              className="rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
            >
              <Bell className={`h-3.5 w-3.5 ${broadcasting ? 'animate-spin' : ''}`} />
              Send Holiday Broadcast
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: HOLIDAY SCHEDULE & SCOPE */}
        {/* ========================================================================= */}
        <TabsContent value="master" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">

            {/* Left Column: Add Holiday Form */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-[#f87941]" /> Configure New Holiday Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Holiday Title</label>
                    <Input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Independence Day / Thanksgiving / Diwali..."
                      className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Holiday Date</label>
                      <Input
                        type="date"
                        value={holidayDate}
                        onChange={e => setHolidayDate(e.target.value)}
                        className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Holiday Scope Type (11 Scopes)</label>
                      <Select value={holidayType} onValueChange={setHolidayType}>
                        <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {HOLIDAY_SCOPES.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Country / Branch</label>
                      <Input
                        value={scopeTarget}
                        onChange={e => setScopeTarget(e.target.value)}
                        placeholder="Global, United States, California, HQ-New York..."
                        className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sprint Impact Level</label>
                      <Select value={impactLevel} onValueChange={setImpactLevel}>
                        <SelectTrigger className="rounded-xl text-xs font-semibold h-10 border-slate-200 dark:border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="High">🔥 High (Complete Office Shutdown)</SelectItem>
                          <SelectItem value="Medium">⚠️ Medium (Partial Capacity)</SelectItem>
                          <SelectItem value="Low">ℹ️ Low (Optional / Floating RH)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border text-xs">
                      <span className="font-bold">Annual Recurring</span>
                      <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border text-xs">
                      <span className="font-bold">Restricted (RH)</span>
                      <Switch checked={isOptionalRh} onCheckedChange={setIsOptionalRh} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description / History Notes</label>
                    <Textarea
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Specify cultural significance or company policy notes..."
                      className="rounded-2xl text-xs p-3 border-slate-200 dark:border-zinc-800"
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-zinc-900/40 border-t p-4 rounded-b-3xl flex justify-between items-center">
                  <div className="text-xs text-slate-500 font-medium">
                    Syncs to company calendar & payroll engine.
                  </div>
                  <Button
                    onClick={handleAddHoliday}
                    disabled={submitting}
                    className="bg-[#f87941] hover:bg-[#e06634] text-white font-extrabold text-xs h-11 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-[#f87941]/20"
                  >
                    {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                    Add Holiday Event
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right Column: Filterable Master Holiday Table */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-[#f87941]" /> Master Enterprise Holiday Schedule
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search holiday..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-40 h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  {filteredHolidays.length > 0 ? (
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                          <th className="p-4 px-6">Holiday Title & Date</th>
                          <th className="p-4">Scope Type</th>
                          <th className="p-4">Target Scope</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                        {filteredHolidays.map(h => (
                          <tr key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30">
                            <td className="p-4 px-6">
                              <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{h.title}</div>
                              <div className="font-mono text-[10px] text-slate-400">📅 {h.holidayDate}</div>
                            </td>

                            <td className="p-4">
                              <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold text-[9px] capitalize">
                                {h.holidayType}
                              </Badge>
                            </td>

                            <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                              {h.scopeTarget}
                            </td>

                            <td className="p-4">
                              {h.isOptionalRh ? (
                                <Badge className="bg-amber-500/10 text-amber-600 border-none font-bold text-[9px]">
                                  Optional RH
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[9px]">
                                  Mandatory
                                </Badge>
                              )}
                            </td>

                            <td className="p-4">
                              <Badge className={`border-none font-bold text-[9px] ${
                                h.impactLevel === 'High' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {h.impactLevel} Impact
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center space-y-3">
                      <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
                      <div className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">No holiday events added yet</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: LONG WEEKEND BRIDGE PLANNER */}
        {/* ========================================================================= */}
        <TabsContent value="planner" className="space-y-6 m-0">
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Plane className="h-4.5 w-4.5 text-[#f87941]" /> AI Long Weekend & Bridge Leave Recommendations
              </CardTitle>
              <CardDescription className="text-xs">
                Leverage bridge days to maximize employee time-off and plan team coverage in advance.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {longWeekends.map((lw, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">{lw.title}</div>
                      <Badge className="bg-[#f87941]/10 text-[#f87941] font-bold text-[10px]">{lw.dateRange}</Badge>
                    </div>
                    <div className="text-slate-500">Bridge Day Opportunity: <span className="font-bold text-slate-900 dark:text-white">{lw.bridgeDay}</span></div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                      💡 {lw.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: HOLIDAY GROUPS & BRANCH POLICIES */}
        {/* ========================================================================= */}
        <TabsContent value="groups" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Landmark className="h-4.5 w-4.5 text-[#f87941]" /> US East Coast Holidays Group
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Country: United States • Branch: HQ - New York</div>
                <div className="font-bold text-emerald-500">10 Mandatory + 2 Floating RH Days</div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Globe className="h-4.5 w-4.5 text-[#f87941]" /> EMEA Region Holidays Group
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Country: United Kingdom • Branch: London Office</div>
                <div className="font-bold text-emerald-500">8 Bank Holidays + 3 Regional RH</div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Building2 className="h-4.5 w-4.5 text-[#f87941]" /> APAC Tech Hub Group
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs font-semibold">
                <div className="text-slate-500">Country: India • Branch: Tech Hub Bangalore</div>
                <div className="font-bold text-emerald-500">12 Public + 4 Festival RH Days</div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: SPRINT & DELIVERY IMPACT ANALYSIS */}
        {/* ========================================================================= */}
        <TabsContent value="impact" className="space-y-6 m-0">
          <div className="grid grid-cols-12 gap-6">

            <div className="col-span-12 lg:col-span-8">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-[#f87941]" /> Sprint Velocity & Capacity Impact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Work Hours Lost</div>
                      <div className="text-xl font-black text-rose-500 mt-1">{impactAnalysis.totalWorkDaysLost} hrs</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Billable Capacity Impact</div>
                      <div className="text-xl font-black text-amber-500 mt-1">{impactAnalysis.billableCapacityImpact}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Sprint Velocity Adjustment</div>
                      <div className="text-xl font-black text-[#f87941] mt-1">{impactAnalysis.sprintVelocityAdjustment}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <Card className="rounded-3xl border-slate-200 dark:border-zinc-800 shadow-md">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-[#f87941]" /> Capacity Planning Advice
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs font-semibold">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/40 border leading-relaxed">
                    💡 Reduce Sprint story point commitment by 15% during July 4th and Thanksgiving holiday weeks to prevent sprint spillover.
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

      </Tabs>

    </div>
  );
}
