import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Clock, Loader2, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

interface PunchConsoleProps {
  employeeId: number | null;
  onPunchSuccess: () => void;
  todayRecord: any;
}

export default function PunchConsole({ employeeId, onPunchSuccess, todayRecord }: PunchConsoleProps) {
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  // Live ticking clock in IST (or browser locale)
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request browser geolocation on load
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGps({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation capture failed:', error.message);
        }
      );
    }
  }, []);

  // Calculate elapsed time (HH:MM:SS) for active check-in
  const getElapsedString = (checkInStr: string) => {
    const checkIn = new Date(checkInStr);
    const diffMs = Math.max(0, time.getTime() - checkIn.getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const resolveActiveEmployeeId = async (): Promise<number | null> => {
    if (employeeId) return employeeId;
    try {
      const token = getStoredSessionToken();
      const meRes = await fetch('/api/auth/me', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user?.employeeRecordId) {
          return Number(meData.user.employeeRecordId);
        }
      }
    } catch (err) {
      console.warn('Failed to self-resolve employee profile:', err);
    }
    return null;
  };

  const handleClockIn = async () => {
    const activeEmpId = await resolveActiveEmployeeId();
    if (!activeEmpId) {
      toast.error('Employee profile not loaded. Please refresh the page.');
      return;
    }
    setLoading(true);
    try {
      const token = getStoredSessionToken();
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: activeEmpId,
          date: time.toISOString().split('T')[0],
          timeIn: time.toISOString(),
          locationLatitude: gps?.lat || null,
          locationLongitude: gps?.lng || null,
          notes: 'Clocked In via Web Dashboard Console',
          idempotencyKey: crypto.randomUUID()
        }),
      });

      if (response.ok) {
        toast.success('Successfully Clocked In!');
        onPunchSuccess();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Clock In failed');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    const activeEmpId = await resolveActiveEmployeeId();
    if (!activeEmpId) {
      toast.error('Employee profile not loaded. Please refresh the page.');
      return;
    }
    setLoading(true);
    try {
      const token = getStoredSessionToken();
      const response = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          employeeId: activeEmpId,
          tagUid: null
        }),
      });

      if (response.ok) {
        toast.success('Successfully Clocked Out!');
        onPunchSuccess();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Clock Out failed');
      }
    } catch (err) {
      toast.error('Connection error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const hasCheckIn = !!todayRecord;
  const isClockedIn = hasCheckIn && !todayRecord.timeOut;

  return (
    <Card className="border border-border bg-card/60 backdrop-blur-md shadow-lg overflow-hidden relative group">
      {/* Background Gradient Accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-50 pointer-events-none" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-center md:justify-start gap-1">
              <Clock className="h-3.5 w-3.5 text-[#f87941]" /> Attendance Console (IST)
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {formattedTime}
            </h1>
            <p className="text-xs text-slate-500 font-semibold">{formattedDate}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto">
            {/* Conditional Status Display */}
            {isClockedIn ? (
              <div className="flex flex-col items-center sm:items-end justify-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Shift Timer</span>
                <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
                  {getElapsedString(todayRecord.timeIn)}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  In at {new Date(todayRecord.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ) : todayRecord?.timeOut ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                <div className="text-left">
                  <span className="block text-[10px] font-bold uppercase">Shift Completed</span>
                  <span className="block text-xs font-semibold">
                    Duration: {((todayRecord.duration || 0) / 60).toFixed(2)} hrs
                  </span>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            {!hasCheckIn ? (
              <Button
                disabled={loading}
                onClick={handleClockIn}
                className="w-full sm:w-44 h-12 text-sm font-bold bg-[#f87941] hover:bg-[#e06634] text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5" /> Clock In
                  </>
                )}
              </Button>
            ) : isClockedIn ? (
              <Button
                disabled={loading}
                onClick={handleClockOut}
                className="w-full sm:w-44 h-12 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <LogOut className="h-5 w-5" /> Clock Out
                  </>
                )}
              </Button>
            ) : (
              <Button
                disabled
                className="w-full sm:w-44 h-12 text-sm font-bold bg-slate-100 dark:bg-[#2B2D31] text-slate-400 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800"
              >
                <CheckCircle2 className="h-5 w-5" /> Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
