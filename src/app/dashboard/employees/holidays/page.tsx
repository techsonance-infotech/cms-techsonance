'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Calendar, CheckCircle2, Plus, Sparkles, AlertCircle, Trash2, Library, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

export default function HolidayCalendarPage() {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Calendar Form
  const [calName, setCalName] = useState('');
  const [calDesc, setCalDesc] = useState('');
  const [calYear, setCalYear] = useState('2026');

  // New Holiday Form
  const [selectedCalId, setSelectedCalId] = useState<number | null>(null);
  const [holName, setHolName] = useState('');
  const [holDate, setHolDate] = useState('');
  const [holOptional, setHolOptional] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();

      const calendarsRes = await fetch('/api/holidays/calendars', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const calendarsData = await calendarsRes.json();
      setCalendars(calendarsData);

      if (calendarsData.length > 0) {
        setSelectedCalId(calendarsData[0].id);
        fetchHolidays(calendarsData[0].id);
      }
    } catch {
      toast.error('Failed to load holiday configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async (calendarId: number) => {
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/holidays?calendarId=${calendarId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHolidays(data);
    } catch {
      toast.error('Failed to load holidays');
    }
  };

  const createCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calName || !calYear) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/holidays/calendars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: calName,
          description: calDesc,
          year: Number(calYear)
        })
      });
      if (res.ok) {
        toast.success('Holiday calendar created successfully');
        setCalName('');
        setCalDesc('');
        fetchData();
      } else {
        toast.error('Failed to create calendar');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  const addHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holName || !holDate || !selectedCalId) return;
    try {
      const token = getStoredSessionToken();
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          calendarId: selectedCalId,
          name: holName,
          holidayDate: holDate,
          isOptional: holOptional
        })
      });
      if (res.ok) {
        toast.success('Holiday added to calendar');
        setHolName('');
        setHolDate('');
        setHolOptional(false);
        fetchHolidays(selectedCalId);
      } else {
        toast.error('Failed to add holiday');
      }
    } catch {
      toast.error('Connection error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#f87941] to-[#f87941]/70 bg-clip-text text-transparent">Holiday Calendar</h1>
          <p className="text-muted-foreground">Setup annual company calendars, define national events, and configure optional holidays.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#f87941]/10 text-[#f87941] hover:bg-[#f87941]/20 px-3 py-1 text-sm border-none">
            <Calendar className="h-4 w-4 mr-1.5" />
            Year 2026 Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendars Builder */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Library className="h-5 w-5 text-[#f87941]" />
                Holiday Calendars
              </CardTitle>
              <CardDescription>Setup multiple calendars per branch</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <form onSubmit={createCalendar} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="cal-name">Calendar Name</Label>
                  <Input
                    id="cal-name"
                    placeholder="e.g. India Office Calendar"
                    value={calName}
                    onChange={e => setCalName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cal-desc">Description</Label>
                  <Input
                    id="cal-desc"
                    placeholder="Calendar details"
                    value={calDesc}
                    onChange={e => setCalDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cal-year">Calendar Year</Label>
                  <Input
                    id="cal-year"
                    type="number"
                    value={calYear}
                    onChange={e => setCalYear(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#f87941]/90 text-white">
                  Add Calendar
                </Button>
              </form>

              <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-2">
                <Label className="text-slate-500">Active Calendars</Label>
                {calendars.map((cal) => (
                  <div
                    key={cal.id}
                    onClick={() => {
                      setSelectedCalId(cal.id);
                      fetchHolidays(cal.id);
                    }}
                    className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                      selectedCalId === cal.id
                        ? 'border-[#f87941] bg-[#f87941]/5'
                        : 'border-slate-100 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <p className="font-semibold">{cal.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cal.year} Calendar — {cal.description || 'No description'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedCalId && (
            <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/30">
                <CardTitle className="text-lg">Add Holiday Event</CardTitle>
                <CardDescription>Append holiday details to calendar</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={addHoliday} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="hol-name">Holiday Title</Label>
                    <Input
                      id="hol-name"
                      placeholder="e.g. Independence Day"
                      value={holName}
                      onChange={e => setHolName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hol-date">Event Date</Label>
                    <Input
                      id="hol-date"
                      type="date"
                      value={holDate}
                      onChange={e => setHolDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="hol-opt"
                      type="checkbox"
                      className="h-4 w-4 text-[#f87941] focus:ring-[#f87941] border-slate-300 rounded"
                      checked={holOptional}
                      onChange={e => setHolOptional(e.target.checked)}
                    />
                    <Label htmlFor="hol-opt" className="text-sm font-medium">Optional / Restricted Holiday</Label>
                  </div>
                  <Button type="submit" className="w-full bg-[#f87941] hover:bg-[#f87941]/90 text-white">
                    Add Event
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Holidays List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#f87941]" />
                Holiday Events List
              </CardTitle>
              <CardDescription>View annual schedule of office holidays</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {holidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex justify-between items-center p-4 rounded-xl border border-slate-100 dark:border-zinc-800"
                  >
                    <div>
                      <p className="font-semibold text-sm">{h.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Date: {h.holiday_date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`capitalize font-semibold border-none ${
                          h.is_optional
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {h.is_optional ? 'Optional' : 'Public'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {holidays.length === 0 && (
                  <div className="text-center p-6 text-muted-foreground text-sm">
                    No holiday events added to calendar yet. Add events above to populate.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
