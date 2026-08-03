'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Clock, Users, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, Filter,
  Download, RefreshCw, BarChart3, MapPin, Calendar, HelpCircle, Activity, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  Cell
} from 'recharts';

function AttendanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filters row skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-4 w-28 bg-slate-200 dark:bg-zinc-800 rounded"></div>
          <div className="h-9 w-36 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
          <div className="h-9 w-28 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
          <div className="h-9 w-32 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
        </div>
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white dark:bg-[#37383E]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="h-3.5 w-24 bg-slate-150 dark:bg-zinc-800 rounded"></div>
              <div className="h-9 w-9 bg-slate-150 dark:bg-zinc-800 rounded-xl"></div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-7 w-12 bg-slate-150 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-28 bg-slate-150 dark:bg-zinc-800 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Diagnostics Skeleton */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
        <CardHeader className="p-6 pb-2">
          <div className="h-5 w-48 bg-slate-150 dark:bg-zinc-800 rounded"></div>
          <div className="h-3 w-64 bg-slate-150 dark:bg-zinc-800 rounded mt-1.5"></div>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80 h-24 flex flex-col justify-between">
                <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded"></div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-2 bg-white dark:bg-[#37383E]">
          <CardHeader className="p-6 pb-2">
            <div className="h-4.5 w-44 bg-slate-150 dark:bg-zinc-800 rounded"></div>
            <div className="h-3 w-60 bg-slate-150 dark:bg-zinc-800 rounded mt-1.5"></div>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center h-80">
            <div className="h-full w-full bg-slate-100 dark:bg-zinc-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-slate-300 dark:text-zinc-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#37383E]">
          <CardHeader className="p-6 pb-2">
            <div className="h-4.5 w-32 bg-slate-150 dark:bg-zinc-800 rounded"></div>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-center h-80">
            <div className="h-full w-full bg-slate-100 dark:bg-zinc-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-slate-350 dark:text-zinc-700" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AttendanceAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/attendance/analytics?month=${selectedMonth}&year=${selectedYear}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        toast.error('Failed to load attendance analytics.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth, selectedYear]);

  const handleExportCSV = (exportData: any[], filename: string) => {
    if (!exportData || exportData.length === 0) {
      toast.error('No data available to export.');
      return;
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
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report downloaded successfully!');
  };

  if (loading || !data) {
    return <AttendanceSkeleton />;
  }

  // Brand color scheme: Primary (orange: #F87941)
  const COLORS = ['#F87941', '#F9B095', '#FFE7DC', '#37383E', '#B1B1B1', '#6B6C70'];

  return (
    <div className="space-y-6">
      {/* Filters & Export Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-555 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-4.5 w-4.5 text-slate-400 dark:text-zinc-500" />
              Reporting Period
            </span>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300">
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                <SelectItem key={idx} value={String(idx + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300">
              {['2025', '2026', '2027'].map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 bg-white dark:bg-transparent">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => handleExportCSV(data.employeeScores, 'employee_attendance_ledger.csv')} className="bg-primary hover:opacity-95 text-white font-bold shadow-lg">
            <Download className="mr-2 h-4 w-4" />
            Export Ledger
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Attendance Rate */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance Rate</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{data.attendanceRate}%</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">WFH Percentage: {data.wfhPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Avg Daily Hours */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Daily Hours</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{data.avgWorkHours} Hrs</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground">Calculated from log check-ins</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Policy Exceptions */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Policy Exceptions</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{data.exceptions.total}</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-amber-500 font-bold">{data.exceptions.geofenceViolations} Geofence / {data.exceptions.missingPunches} Punches</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Absenteeism Forecast */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forecasted Absenteeism</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{data.forecastedAbsenteeism}%</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-rose-500 font-bold">Next Month Probability</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Copilot insights panel */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Attendance Copilot Diagnostics
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Policy exception highlights, absenteeism hotspots, and geo-fencing warnings</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {data.insights.map((insight: string, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-900/80">
                <span className="text-primary font-bold text-xs uppercase mb-1 block">Diagnostic #{idx+1}</span>
                <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance trend chart */}
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm lg:col-span-2">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Daily Attendance & Late Checks Trend
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Tracking daily presence rate and late check-in counts</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dailyTrends} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark-stroke="#27272a" />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#71717a" label={{ value: 'Rate %', angle: -90, position: 'insideLeft', fill: '#71717a' }} fontSize={10} domain={[60, 100]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#71717a" label={{ value: 'Late Count', angle: 90, position: 'insideRight', fill: '#71717a' }} fontSize={10} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                  <Legend fontSize={10} />
                  <Line yAxisId="left" type="monotone" dataKey="attendanceRate" name="Attendance Rate %" stroke="#F87941" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="late" name="Late Check-ins" stroke="#B1B1B1" strokeWidth={2} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department-wise Compliance */}
        <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Department-wise Compliance
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">Policy adherence rate comparing various organizational teams</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentPerformance} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark-stroke="#27272a" horizontal={true} vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={9} />
                  <YAxis stroke="#71717a" fontSize={10} domain={[60, 100]} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="attendanceRate" name="Adherence %" fill="#F87941" radius={[4, 4, 0, 0]} barSize={26}>
                    {data.departmentPerformance.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exception Audit Register */}
      <Card className="rounded-2xl border-slate-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-500" />
            Critical Attendance Ledger & Score Registry
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">Employee compliance scorecards (lowest scores highlighted first)</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden shadow-inner bg-slate-50/50 dark:bg-transparent">
            <Table>
              <TableHeader className="bg-slate-100/60 dark:bg-zinc-900/50">
                <TableRow className="border-b border-slate-200 dark:border-zinc-800">
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs">Employee</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-center">Department</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-center">Presents</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-center">Lates</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-center">Absents</TableHead>
                  <TableHead className="text-slate-650 dark:text-zinc-400 font-bold text-xs text-right">Attendance Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.employeeScores.length === 0 ? (
                  <TableRow className="border-b border-slate-100 dark:border-zinc-800 hover:bg-transparent">
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8 text-xs">
                      No policy score data recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.employeeScores.map((row: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-100/10 dark:hover:bg-zinc-900/10">
                      <TableCell className="font-bold text-slate-800 dark:text-white flex items-center gap-2 py-3 text-xs">
                        <div className="w-6.5 h-6.5 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
                          {row.name.charAt(0)}
                        </div>
                        {row.name}
                      </TableCell>
                      <TableCell className="text-center text-slate-600 dark:text-zinc-300 text-xs font-semibold">{row.department}</TableCell>
                      <TableCell className="text-center font-bold text-slate-700 dark:text-zinc-300 text-xs">{row.presents}</TableCell>
                      <TableCell className="text-center font-bold text-amber-500 text-xs">{row.lates}</TableCell>
                      <TableCell className="text-center font-bold text-rose-500 text-xs">{row.absents}</TableCell>
                      <TableCell className="text-right py-3 text-xs">
                        <Badge className={`text-[10px] font-bold ${
                          row.score >= 90 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                          row.score >= 80 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400' :
                          'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-450'
                        }`} variant="outline">
                          {row.score} / 100
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
