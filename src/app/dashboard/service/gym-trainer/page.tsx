// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Star, 
  Calendar, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Info,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Trainer {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  students: number;
  capacity: number;
  performance: 'excellent' | 'good' | 'nominal';
}

interface MasterClass {
  id: string;
  title: string;
  trainer: string;
  day: string;
  time: string;
  capacity: string;
  status: 'active' | 'full';
  studio: string;
}

interface AssetInventory {
  id: string;
  name: string;
  quantity: number;
  minThreshold: number;
  status: 'ok' | 'critical';
}

export default function GymTrainerClassControl() {
  const [trainers, setTrainers] = useState<Trainer[]>([
    { id: 'TR-1', name: 'Alex Rivera', specialty: 'HIIT & Endurance Training', rating: 4.9, students: 48, capacity: 50, performance: 'excellent' },
    { id: 'TR-2', name: 'Jordan Smith', specialty: 'Yoga Flow & Recovery', rating: 4.8, students: 32, capacity: 40, performance: 'excellent' },
    { id: 'TR-3', name: 'Marcus Chen', specialty: 'Hypertrophy & Powerlifting', rating: 4.9, students: 28, capacity: 30, performance: 'excellent' },
    { id: 'TR-4', name: 'Sarah Connor', specialty: 'Cardio Kickboxing', rating: 4.6, students: 18, capacity: 25, performance: 'good' },
  ]);

  const [classes, setClasses] = useState<MasterClass[]>([
    { id: 'CL-01', title: 'Power HIIT Fusion', trainer: 'Alex Rivera', day: 'Monday', time: '08:00 - 09:30', capacity: '48/50', status: 'active', studio: 'Studio A' },
    { id: 'CL-02', title: 'Deep Vinyasa Yoga', trainer: 'Jordan Smith', day: 'Tuesday', time: '10:00 - 11:30', capacity: '32/40', status: 'active', studio: 'Zen Room' },
    { id: 'CL-03', title: 'Barbell Strength Lift', trainer: 'Marcus Chen', day: 'Wednesday', time: '14:00 - 16:00', capacity: '28/30', status: 'active', studio: 'Weight Deck' },
    { id: 'CL-04', title: 'Advanced Endurance Cycle', trainer: 'Alex Rivera', day: 'Thursday', time: '17:30 - 19:00', capacity: '50/50', status: 'full', studio: 'Studio B' },
    { id: 'CL-05', title: 'Combat Cardio Core', trainer: 'Sarah Connor', day: 'Friday', time: '09:00 - 10:30', capacity: '18/25', status: 'active', studio: 'Studio A' },
  ]);

  const [assets, setAssets] = useState<AssetInventory[]>([
    { id: 'AST-901', name: 'Resistance Safety Bands (Heavy)', quantity: 8, minThreshold: 15, status: 'critical' },
    { id: 'AST-902', name: 'Premium Studio Foam Mats', quantity: 42, minThreshold: 30, status: 'ok' },
    { id: 'AST-903', name: 'Cast Iron Kettlebells (16kg)', quantity: 6, minThreshold: 10, status: 'critical' },
    { id: 'AST-904', name: 'Anti-slip Chalk Grips (Tubs)', quantity: 24, minThreshold: 12, status: 'ok' },
  ]);

  const handleBookingToggle = (classId: string, status: string) => {
    if (status === 'full') {
      toast.warning("Class capacity is fully occupied. Waitlist trigger sent!");
      return;
    }
    toast.success(`Booking seat confirmed for class ${classId}!`);
  };

  const handleReorderAsset = (assetName: string) => {
    toast.success(`Procurement PO automatically issued for ${assetName}! Safety stock replenishing.`);
    setAssets(prev => prev.map(a => a.name === assetName ? { ...a, quantity: a.minThreshold + 10, status: 'ok' } : a));
  };

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#030712] to-[#111827] p-6 text-white shadow-xl border border-zinc-800">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-violet-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Instructor Capacity Control</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent">
              Trainer & Class Control Hub
            </h2>
            <p className="text-sm text-zinc-300 mt-1 max-w-xl">
              Instructor leaderboard performance tracking, weekly Master Class calendars, and critical mat inventory monitors.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700" onClick={() => toast.info("Compiling instructor payroll profiles...")}>
              <Users className="mr-1.5 h-4 w-4 text-indigo-400" /> Trainer Directory
            </Button>
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 border-none shadow-sm" onClick={() => toast.info("Creating new master class block...")}>
              + Add Class Block
            </Button>
          </div>
        </div>
      </div>

      {/* Roster & Inventory Alert grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Trainer Leaderboard & Analytics (7 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Instructor Performance Leaderboard</CardTitle>
              <CardDescription>Metrics based on active capacity, review indices, and retention ratios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trainers.map(tr => (
                <div key={tr.id} className="p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 text-xs">
                      {tr.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{tr.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{tr.specialty}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="font-bold">{tr.rating.toFixed(1)} Rating</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Capacity progress */}
                  <div className="flex-1 max-w-xs space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Cohort Capacity Load</span>
                      <span>{tr.students}/{tr.capacity} students</span>
                    </div>
                    <Progress value={(tr.students / tr.capacity) * 100} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                  </div>

                  <div className="text-right">
                    <Badge variant={tr.performance === 'excellent' ? 'default' : 'secondary'} className="text-[9px] uppercase px-2 h-5 font-bold">
                      {tr.performance}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">Instructor Active</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Mat & Physical Asset Safety Threshold Alert (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="flex flex-col h-full border-l-4 border-l-amber-500">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
                    Asset Inventory Safety Stock
                  </CardTitle>
                  <CardDescription>Monitored mat & kettlebell levels</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 overflow-y-auto max-h-[350px]">
              {assets.map(asset => (
                <div key={asset.id} className="p-3 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Threshold minimum: {asset.minThreshold} units</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <Badge className={`text-[9px] uppercase font-bold ${
                      asset.status === 'critical' ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-white'
                    }`}>
                      {asset.quantity} left
                    </Badge>
                    {asset.status === 'critical' && (
                      <Button size="xs" className="h-6 text-[9px] bg-amber-600 hover:bg-amber-500 text-white px-2 rounded" onClick={() => handleReorderAsset(asset.name)}>
                        Reorder Stock
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Master Class Weekly Schedules (Full Width) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Master Class Booking Telemetry</CardTitle>
              <CardDescription>Active studio schedule list and occupancy fill meters</CardDescription>
            </div>
            <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-none">
              98.2% Class fill index
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                <th className="p-3">Class Block</th>
                <th className="p-3">Assigned Trainer</th>
                <th className="p-3">Session Time</th>
                <th className="p-3">Studio Location</th>
                <th className="p-3">Capacity Loading</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {classes.map(cl => (
                <tr key={cl.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="p-3">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{cl.title}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">{cl.id}</span>
                  </td>
                  <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-50">{cl.trainer}</td>
                  <td className="p-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> {cl.day}, {cl.time}
                    </span>
                  </td>
                  <td className="p-3 text-xs font-semibold">{cl.studio}</td>
                  <td className="p-3 font-bold text-zinc-700 dark:text-zinc-300">{cl.capacity}</td>
                  <td className="p-3">
                    <Badge className={`text-[10px] uppercase font-bold ${
                      cl.status === 'full' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white animate-pulse'
                    }`}>
                      {cl.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button size="xs" variant={cl.status === 'full' ? 'secondary' : 'default'} className="text-[10px] h-7 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => handleBookingToggle(cl.id, cl.status)}>
                      {cl.status === 'full' ? 'Waitlist' : 'Book Seat'}
                    </Button>
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
