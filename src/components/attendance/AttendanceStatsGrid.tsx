import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Clock, DollarSign, Percent, TrendingUp } from 'lucide-react';

interface AttendanceStatsGridProps {
  attendance: any[];
}

export default function AttendanceStatsGrid({ attendance }: AttendanceStatsGridProps) {
  // 1. Compute stats
  const totalDays = attendance.length;
  const presentDays = attendance.filter((r) => r.status === 'present').length;
  const lateDays = attendance.filter((r) => r.status === 'late').length;
  const halfDays = attendance.filter((r) => r.status === 'half_day').length;
  const absentDays = attendance.filter((r) => r.status === 'absent').length;
  const leaveDays = attendance.filter((r) => r.status === 'leave').length;
  const wfhDays = attendance.filter((r) => r.status === 'wfh' || r.status === 'remote').length;

  // Attendance rate = (present + late + wfh + half_day*0.5) / totalDays * 100
  const attendanceRate = totalDays > 0
    ? Math.round(((presentDays + lateDays + wfhDays + halfDays * 0.5) / totalDays) * 100)
    : 100;

  // Avg working hours
  const completedPunches = attendance.filter((r) => r.duration && r.duration > 0);
  const avgDurationMins = completedPunches.length > 0
    ? completedPunches.reduce((acc, r) => acc + Number(r.duration || 0), 0) / completedPunches.length
    : 0;
  const avgHours = Number((avgDurationMins / 60).toFixed(2));

  // Overtime minutes
  const totalOtMinutes = attendance.reduce((acc, r) => {
    const ot = r.metadata?.overtimeMinutes || 0;
    return acc + Number(ot);
  }, 0);
  const otHours = Number((totalOtMinutes / 60).toFixed(1));

  // Punctuality Score (Punctuality index starts at 100%, drops by 5% for each late check-in)
  const punctualityScore = Math.max(0, 100 - lateDays * 5);

  // Projected LOP deductions (assume 1 day salary loss per absent, 0.5 per half day)
  const projectedLopDays = absentDays + halfDays * 0.5;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {/* Attendance Rate */}
      <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-[#f87941] flex items-center justify-center shrink-0 border border-orange-100/50 dark:border-orange-900/30">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Attendance Rate</span>
            <span className="block text-lg font-bold text-slate-850 dark:text-white font-mono">{attendanceRate}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Avg Hours */}
      <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-900/30">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Avg Work Hours</span>
            <span className="block text-lg font-bold text-slate-850 dark:text-white font-mono">{avgHours} hrs</span>
          </div>
        </CardContent>
      </Card>

      {/* Overtime Accrued */}
      <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-900/30">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Overtime hours</span>
            <span className="block text-lg font-bold text-slate-850 dark:text-white font-mono">{otHours} hrs</span>
          </div>
        </CardContent>
      </Card>

      {/* Punctuality Score */}
      <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50 dark:border-amber-900/30">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Punctuality Score</span>
            <span className="block text-lg font-bold text-slate-850 dark:text-white font-mono">{punctualityScore}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Projected Payroll LOP Deductions */}
      <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/50 dark:border-rose-900/30">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Projected LOP Days</span>
            <span className="block text-lg font-bold text-slate-850 dark:text-white font-mono">{projectedLopDays} days</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
