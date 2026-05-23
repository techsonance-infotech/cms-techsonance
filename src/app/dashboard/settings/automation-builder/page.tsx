'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, History, Search, Bell, Grid, HelpCircle, 
  Plus, Minus, Maximize, X, Zap, ArrowRightLeft, 
  MessageSquare, RefreshCw
} from 'lucide-react';

export default function VisualWorkflowAutomationBuilder() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Top Navigation Bar - simplified for embed */}
      <header className="h-14 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 shadow-sm flex justify-between items-center px-6 shrink-0 z-40">
        <div className="flex items-center gap-6">
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">Nexus ERP</span>
          <div className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
            <span className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Overview</span>
            <span className="text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-1 cursor-pointer">Reports</span>
            <span className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Logs</span>
          </div>
        </div>
        <div className="flex-1 max-w-md px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full py-1.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Search workflow components..." 
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8">
            Create New
          </Button>
          <div className="flex gap-2 text-muted-foreground">
            <Bell className="h-5 w-5 cursor-pointer hover:text-indigo-600 transition-colors" />
            <Grid className="h-5 w-5 cursor-pointer hover:text-indigo-600 transition-colors" />
            <HelpCircle className="h-5 w-5 cursor-pointer hover:text-indigo-600 transition-colors" />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-indigo-600 shrink-0">
            JD
          </div>
        </div>
      </header>

      {/* Workflow Builder Interface */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Builder Canvas */}
        <div className="flex-1 relative overflow-hidden bg-slate-50/50 dark:bg-zinc-950/50" 
             style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          
          {/* Workflow Toolbar (Floating) */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <Button variant="ghost" size="sm" className="gap-2 font-bold h-8">
              <Play className="h-4 w-4" /> Test Workflow
            </Button>
            <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1"></div>
            <Button variant="ghost" size="sm" className="gap-2 font-bold h-8">
              <History className="h-4 w-4" /> History
            </Button>
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm h-8">
              Publish
            </Button>
          </div>

          {/* Canvas Area / Node Representation */}
          <div className="absolute inset-0 p-8 flex flex-col items-center justify-start pt-32 overflow-auto min-w-[800px]">
            
            {/* SVG Container for Connectors */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Connection: Trigger -> Condition */}
              <path className="stroke-slate-300 dark:stroke-zinc-700 stroke-2 fill-none" d="M 50% 180 L 50% 240"></path>
              {/* Connection: Condition -> Slack (True Path) */}
              <path className="stroke-slate-300 dark:stroke-zinc-700 stroke-2 fill-none" d="M 50% 320 L 40% 400"></path>
              {/* Connection: Condition -> CRM (False Path) */}
              <path className="stroke-slate-300 dark:stroke-zinc-700 stroke-2 fill-none" d="M 50% 320 L 60% 400"></path>
            </svg>

            {/* Trigger Node */}
            <div className="relative z-10 w-72 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 mb-8 cursor-pointer ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-zinc-950">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] tracking-wider mb-0.5">Trigger</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">New Lead Created</p>
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-2">Executes when a new contact is added to the CRM workspace.</p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-950 border-2 border-indigo-600 rounded-full"></div>
            </div>

            {/* Logic Node */}
            <div className="relative z-10 w-64 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 mb-8 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-600 dark:text-amber-500 uppercase text-[10px] tracking-wider mb-0.5">Logic</h4>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none group-hover:text-indigo-600 transition-colors">IF/ELSE Condition</p>
                </div>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-2">Check if lead budget &gt; $10,000</p>
              
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-950 border-2 border-slate-300 dark:border-zinc-700 rounded-full group-hover:border-indigo-500"></div>
              
              <div className="flex justify-between mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 text-[10px] font-black tracking-wider">
                <span className="text-emerald-600 dark:text-emerald-500 uppercase">True</span>
                <span className="text-rose-600 dark:text-rose-500 uppercase">False</span>
              </div>
              
              <div className="absolute -bottom-2 left-1/4 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-950 border-2 border-emerald-500 rounded-full"></div>
              <div className="absolute -bottom-2 right-1/4 translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-950 border-2 border-rose-500 rounded-full"></div>
            </div>

            {/* Action Nodes Row */}
            <div className="flex gap-16 w-full justify-center max-w-2xl">
              
              {/* Slack Notification */}
              <div className="relative z-10 w-64 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-500 shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sky-600 dark:text-sky-500 uppercase text-[10px] tracking-wider mb-0.5">Action</h4>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none group-hover:text-indigo-600 transition-colors">Send Slack Alert</p>
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-2">Notify #sales-vips channel immediately.</p>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-950 border-2 border-slate-300 dark:border-zinc-700 rounded-full group-hover:border-indigo-500"></div>
              </div>

              {/* CRM Update */}
              <div className="relative z-10 w-64 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] tracking-wider mb-0.5">Action</h4>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none group-hover:text-indigo-600 transition-colors">Update CRM Field</p>
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-2">Set 'Status' to 'Processing Queue'</p>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-zinc-950 border-2 border-slate-300 dark:border-zinc-700 rounded-full group-hover:border-indigo-500"></div>
              </div>

            </div>

          </div>

          {/* Canvas Controls */}
          <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"><Plus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"><Minus className="h-4 w-4" /></Button>
            <div className="w-full h-px bg-slate-200 dark:bg-zinc-800 my-0.5"></div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-slate-100 dark:hover:bg-zinc-800"><Maximize className="h-4 w-4" /></Button>
          </div>

          {/* Contextual FAB */}
          <Button className="absolute bottom-8 right-8 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg z-30">
            <Plus className="h-6 w-6" />
          </Button>
          
        </div>

        {/* Properties Sidebar */}
        <aside className="w-80 bg-white dark:bg-zinc-950 border-l border-slate-200 dark:border-zinc-800 flex flex-col shrink-0">
          
          <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Node Properties</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground"><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-zinc-900/50 rounded-lg border border-slate-200 dark:border-zinc-800">
              <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">New Lead Created</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Source App</label>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-400">N</div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Nexus CRM</span>
                </div>
                <Button variant="link" className="h-auto p-0 text-indigo-600 dark:text-indigo-400 font-bold">Change</Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Event Type</label>
              <Select defaultValue="created">
                <SelectTrigger className="w-full h-10 font-medium">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Record Created</SelectItem>
                  <SelectItem value="updated">Record Updated</SelectItem>
                  <SelectItem value="deleted">Record Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Filtering Logic</label>
              <div className="p-4 border border-dashed border-slate-300 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-900/50">
                <p className="text-xs font-medium text-center text-muted-foreground">Add conditions to filter incoming data before processing.</p>
                <Button variant="outline" className="w-full mt-4 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-bold">
                  Add Filter Rule
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Output Variables</label>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-muted-foreground">5 detected</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-default">
                  <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">lead_id</code>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">String</span>
                </div>
                <div className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-default">
                  <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">lead_name</code>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">String</span>
                </div>
                <div className="flex items-center justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-zinc-900/50 rounded border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-all cursor-default">
                  <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">lead_email</code>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Email</span>
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 font-bold">Reset</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Save Changes</Button>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
