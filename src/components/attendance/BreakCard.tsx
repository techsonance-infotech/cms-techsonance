import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Coffee, Loader2, Play, Square, Timer } from 'lucide-react';

interface BreakCardProps {
  employeeId: number | null;
  onBreakChange: () => void;
  todayRecord: any;
}

export default function BreakCard({ employeeId, onBreakChange, todayRecord }: BreakCardProps) {
  const [loading, setLoading] = useState(false);
  const [breakType, setBreakType] = useState('lunch');
  const [elapsed, setElapsed] = useState(0);

  const breaks = todayRecord?.metadata?.breaks || [];
  const lastBreakState = todayRecord?.metadata?.lastBreakState || 'paused';
  const totalBreakMinutes = todayRecord?.metadata?.totalBreakMinutes || 0;

  // Find the currently active break (where endTime is null)
  const activeBreak = breaks.find((b: any) => b.endTime === null);

  // Update active break timer live
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeBreak) {
      const start = new Date(activeBreak.startTime).getTime();
      setElapsed(Math.max(0, Math.floor((new Date().getTime() - start) / 1000)));

      timer = setInterval(() => {
        setElapsed(Math.max(0, Math.floor((new Date().getTime() - start) / 1000)));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [activeBreak]);

  const handleToggleBreak = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const action = activeBreak ? 'end' : 'start';
      const response = await fetch('/api/attendance/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          action,
          breakType: action === 'start' ? breakType : undefined
        }),
      });

      if (response.ok) {
        toast.success(action === 'start' ? `Started ${breakType} break` : 'Ended break session');
        onBreakChange();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatSecs = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const limitMinutes = 60; // Standard company lunch break
  const percentRemaining = Math.max(0, Math.min(100, ((limitMinutes - totalBreakMinutes) / limitMinutes) * 100));

  return (
    <Card className="border border-border bg-card/60 backdrop-blur-md shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Coffee className="h-5 w-5 text-[#f87941]" />
          Break & Lunch Compliance Tracker
        </CardTitle>
        <CardDescription className="text-xs">
          Start, pause, and track your active breaks relative to daily company policy limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="space-y-1.5 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Break Category</span>
            <Select
              value={breakType}
              onValueChange={setBreakType}
              disabled={!!activeBreak || !todayRecord || !!todayRecord?.timeOut}
            >
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-[#1E1F22] border-slate-200 dark:border-slate-800 w-full sm:w-44">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lunch" className="text-xs">Lunch Break</SelectItem>
                <SelectItem value="tea" className="text-xs">Short Tea Break</SelectItem>
                <SelectItem value="coffee" className="text-xs">Coffee Break</SelectItem>
                <SelectItem value="other" className="text-xs">Personal Break</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
            <div className="text-left font-mono">
              <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Break Timer</span>
              <span className="block text-lg font-bold text-slate-850 dark:text-slate-200">
                {activeBreak ? formatSecs(elapsed) : '00:00:00'}
              </span>
            </div>
            
            <Button
              disabled={loading || !todayRecord || !!todayRecord?.timeOut}
              onClick={handleToggleBreak}
              size="sm"
              className={`h-9 font-bold text-xs flex items-center gap-1.5 px-5 shadow-sm active:scale-95 transition-all ${
                activeBreak
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-[#f87941] hover:bg-[#e06634] text-white'
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : activeBreak ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" /> End Break
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Take Break
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Break Compliance Progress */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
            <span>Used Break: {totalBreakMinutes} mins</span>
            <span>Limit: {limitMinutes} mins</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-[#2B2D31] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                totalBreakMinutes > limitMinutes ? 'bg-rose-500' : 'bg-[#f87941]'
              }`}
              style={{ width: `${Math.min(100, (totalBreakMinutes / limitMinutes) * 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
