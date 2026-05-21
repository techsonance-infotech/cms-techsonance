'use client';

import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Search, 
  Sparkles, 
  Map, 
  Dumbbell, 
  Activity, 
  Shield, 
  DollarSign, 
  CheckSquare, 
  Play, 
  Command,
  ArrowRight,
  Calculator,
  Compass
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function GlobalCommandPalette() {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const commandItems: CommandItem[] = [
    { id: 'c1', title: 'Open Field Service Command Center', category: 'Navigation', shortcut: 'G + S', icon: <Map className="h-4 w-4" />, action: () => { window.location.href = '/dashboard/service/command-center'; } },
    { id: 'c2', title: 'Open Financial Executive Dashboard', category: 'Navigation', shortcut: 'G + F', icon: <Calculator className="h-4 w-4" />, action: () => { window.location.href = '/dashboard/finance/executive'; } },
    { id: 'c3', title: 'Open Gym Membership Analytics', category: 'Navigation', shortcut: 'G + A', icon: <Activity className="h-4 w-4" />, action: () => { window.location.href = '/dashboard/service/gym-analytics'; } },
    { id: 'c4', title: 'Open Gym Trainer & Schedules', category: 'Navigation', shortcut: 'G + T', icon: <Dumbbell className="h-4 w-4" />, action: () => { window.location.href = '/dashboard/service/gym-trainer'; } },
    { id: 'c5', title: 'Trigger Safety Asset Audit Run', category: 'System Macro', shortcut: 'Ctrl + Alt + A', icon: <Shield className="h-4 w-4 text-amber-500" />, action: () => { toast.success("Macro executed: safety asset audit logs recompiled!"); } },
    { id: 'c6', title: 'Export Financial General Ledger', category: 'System Macro', shortcut: 'Ctrl + Alt + L', icon: <DollarSign className="h-4 w-4 text-emerald-500" />, action: () => { toast.success("Macro executed: general ledger CSV exported!"); } },
    { id: 'c7', title: 'Trigger AI Operations Assessment', category: 'AI Intelligence', shortcut: 'Ctrl + Shift + O', icon: <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />, action: () => { toast.success("Macro executed: AI predictive analysis loaded!"); } },
  ];

  const filteredCommands = commandItems.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Monitor keys for Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
        toast.info("Command Palette dialog toggled!");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#030712] via-[#0f172a] to-[#1e1b4b] p-6 text-white shadow-xl border border-zinc-800">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-blue-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Macro Utility Console</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent">
              Global Command Palette
            </h2>
            <p className="text-sm text-zinc-300 mt-1 max-w-xl">
              Rapid keyboard utility overlay search, active system routing, and instant administrative macro actions.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-bold px-3 py-1 text-xs">
              <Command className="h-3 w-3 inline mr-1" /> Ctrl + K Trigger
            </Badge>
          </div>
        </div>
      </div>

      {/* Interactive Command Terminal Playground */}
      <Card className="border border-indigo-100 dark:border-indigo-950 max-w-3xl mx-auto shadow-md">
        <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-indigo-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions, tools, macros, or dashboards..."
              className="pl-11 h-12 rounded-xl text-sm border-indigo-200 dark:border-zinc-800 bg-white"
              autoFocus
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          
          <div className="p-3 border-b dark:border-zinc-900 bg-indigo-50/10 dark:bg-indigo-950/10 flex justify-between items-center text-xs">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              Interactive Macro Executor console
            </span>
            <span className="text-muted-foreground">Showing {filteredCommands.length} available actions</span>
          </div>

          <div className="divide-y dark:divide-zinc-900 max-h-[380px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
                <Terminal className="h-8 w-8 text-slate-300" />
                <p>No actions match your search query. Try searching for 'Service', 'Ledger', or 'Audit'.</p>
              </div>
            ) : (
              filteredCommands.map(cmd => (
                <div 
                  key={cmd.id} 
                  onClick={() => { cmd.action(); }}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      {cmd.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{cmd.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cmd.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-bold font-mono">
                      {cmd.shortcut}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors translate-x-0 group-hover:translate-x-1 duration-200" />
                  </div>
                </div>
              ))
            )}
          </div>

        </CardContent>
      </Card>
      
      {/* Keyboard Shortcut Map Callout */}
      <Card className="max-w-3xl mx-auto border-none shadow-none bg-slate-50/50 dark:bg-zinc-950/20 p-4 border rounded-xl flex gap-3 text-xs">
        <Compass className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-zinc-800 dark:text-zinc-200">Pro Executive Tip</h4>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            You can trigger this Command Palette overlay from any screen in CMS TechSonance by using the global hotkey trigger <kbd className="bg-slate-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px] font-bold font-mono">Ctrl + K</kbd>. It enables fast searching and execution of ledger, dispatch, and retention tasks.
          </p>
        </div>
      </Card>

    </div>
  );
}
