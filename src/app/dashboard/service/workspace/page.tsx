// @ts-nocheck
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Plus, Bell, HelpCircle, Settings, ChevronRight, Share, MoreHorizontal,
  Paperclip, Smile, Sparkles, Book, Zap, Keyboard, Timer, Server, Cloud
} from 'lucide-react';

export default function TicketResolutionWorkspace() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Top Navigation Bar - simplified for component embed */}
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 shadow-sm flex justify-between items-center px-6 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">Nexus ERP</span>
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">Workspaces</span>
            <span className="text-muted-foreground cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">Analytics</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold border-b-2 border-indigo-600 dark:border-indigo-400 pb-1 cursor-pointer">Reports</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64" 
              placeholder="Quick search tickets..." 
              type="text"
            />
          </div>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9">
            <Plus className="h-4 w-4" /> Create New
          </Button>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><Bell className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><HelpCircle className="h-5 w-5" /></Button>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-600">
            JD
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Ticket Queue */}
        <section className="w-80 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Queue</h3>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-black text-[10px] uppercase border-none">
                24 ACTIVE
              </Badge>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1 border-none cursor-pointer">Open</Badge>
              <Badge variant="ghost" className="text-muted-foreground hover:bg-slate-50 dark:hover:bg-zinc-900 font-medium px-3 py-1 cursor-pointer">Pending</Badge>
              <Badge variant="ghost" className="text-muted-foreground hover:bg-slate-50 dark:hover:bg-zinc-900 font-medium px-3 py-1 cursor-pointer">Unassigned</Badge>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Active Ticket Item */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors border-l-4 border-l-indigo-600 dark:border-l-indigo-500">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono font-bold text-muted-foreground">TKT-8842</span>
                <span className="text-[10px] font-black text-rose-600 dark:text-rose-500 uppercase tracking-tighter">High</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">Database connection timeout in prod</h4>
              <p className="text-xs font-medium text-muted-foreground line-clamp-1 mt-1">Getting 504 errors on the enterprise API endpoint...</p>
              <div className="flex justify-between items-center mt-3">
                <div className="flex -space-x-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-white dark:border-zinc-950 flex items-center justify-center text-[8px] font-bold text-emerald-700">AM</div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">2m ago</span>
              </div>
            </div>

            {/* Other Ticket Items */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors border-l-4 border-transparent">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono font-bold text-muted-foreground">TKT-8841</span>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tighter">Medium</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">Reset billing cycle for Acme Corp</h4>
              <p className="text-xs font-medium text-muted-foreground line-clamp-1 mt-1">Customer requested a change to their monthly billing date...</p>
              <div className="flex justify-between items-center mt-3">
                <div className="flex -space-x-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-white dark:border-zinc-950 flex items-center justify-center text-[8px] font-bold text-slate-700">JD</div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">15m ago</span>
              </div>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors border-l-4 border-transparent">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono font-bold text-muted-foreground">TKT-8839</span>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Low</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">Clarification on API Rate Limits</h4>
              <p className="text-xs font-medium text-muted-foreground line-clamp-1 mt-1">Documentation says 100/min but we see 50...</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] font-medium text-muted-foreground">1h ago</span>
              </div>
            </div>
          </div>
        </section>

        {/* Center Pane: Active Ticket Detail */}
        <section className="flex-1 bg-slate-50 dark:bg-zinc-900/30 flex flex-col overflow-hidden">
          
          {/* Ticket Header */}
          <div className="px-6 py-4 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">TKT-8842</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Infrastructure Issues</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Database connection timeout in production environment</h2>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 font-black uppercase text-[10px] tracking-wider gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Urgent Priority
                  </Badge>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 font-black uppercase text-[10px] tracking-wider gap-1.5">
                    <Zap className="h-3 w-3" /> Open Status
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                    Assigned to: Me
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="icon" className="h-9 w-9"><Share className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          {/* Threaded Conversation View */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            
            {/* System Message */}
            <div className="flex justify-center">
              <span className="text-[10px] font-bold text-muted-foreground px-4 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-full bg-white dark:bg-zinc-950 uppercase tracking-wider">
                Ticket opened by Alex Mercer via API Gateway • Oct 24, 09:12 AM
              </span>
            </div>
            
            {/* Customer Message */}
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                AM
              </div>
              <div className="space-y-2">
                <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl rounded-tl-none border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Alex Mercer</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">09:12 AM</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Hello Support Team, we are seeing recurring 504 Gateway Timeout errors when hitting the /v2/inventory endpoint. This started roughly 15 minutes ago. Our manufacturing lines are currently stalled because of this. Can we get an immediate check on the database health?
                  </p>
                </div>
                <div className="flex gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
                  <span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">Translate</span>
                  <span className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">Quote</span>
                </div>
              </div>
            </div>

            {/* Internal Note */}
            <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-200 dark:border-indigo-800 shrink-0 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                JD
              </div>
              <div className="space-y-2 w-full">
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl rounded-tr-none border border-amber-200 dark:border-amber-900/50 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-amber-900 dark:text-amber-500">Internal Note (Private)</span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-600 uppercase">09:20 AM</span>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-400/90 leading-relaxed font-medium italic">
                    Checked the load balancer logs. Node-4 is reporting high CPU utilization. Likely a runaway query from the Acme sync job. I'm going to kill the process and restart the node.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Dummy space for scroll */}
            <div className="h-4"></div>
          </div>

          {/* Customer Reply Box & Resolution Toolbox (Bottom Sticky) */}
          <div className="shrink-0 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800">
            {/* Reply Box */}
            <div className="p-4">
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden focus-within:border-indigo-500 transition-colors">
                <div className="bg-slate-50 dark:bg-zinc-900/50 px-4 py-2 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                  <div className="flex gap-4">
                    <button className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider border-b-2 border-indigo-600 dark:border-indigo-400 pb-1">Public Reply</button>
                    <button className="text-muted-foreground font-bold text-xs uppercase tracking-wider pb-1 hover:text-slate-900 dark:hover:text-white transition-colors">Internal Note</button>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Paperclip className="h-4 w-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" />
                    <Smile className="h-4 w-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" />
                  </div>
                </div>
                <Textarea 
                  className="w-full p-4 border-none focus-visible:ring-0 text-sm min-h-[100px] resize-none rounded-none shadow-none" 
                  placeholder="Type your response here..." 
                />
                <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center border-t border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Apply Macro:</span>
                    <Select>
                      <SelectTrigger className="w-[180px] h-8 text-xs bg-white dark:bg-zinc-950 font-medium">
                        <SelectValue placeholder="Select a macro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ack">Standard Acknowledgement</SelectItem>
                        <SelectItem value="reset">Node Reset Instructions</SelectItem>
                        <SelectItem value="esc">Escalate to Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="font-bold">Discard</Button>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Send Reply</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Toolbox */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex gap-6">
                <div className="flex items-center gap-2 cursor-pointer group">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Smart Macros</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer group">
                  <Book className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Knowledge Base</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer group">
                  <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Quick Responses</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:flex">
                <Keyboard className="h-3.5 w-3.5" />
                <span>Cmd + Enter to send</span>
              </div>
            </div>
          </div>
          
        </section>

        {/* Right Pane: Customer Context */}
        <section className="w-80 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shrink-0 overflow-y-auto">
          
          {/* Customer Profile */}
          <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-zinc-900 border-4 border-white dark:border-zinc-950 shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-2xl mb-3">AM</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alex Mercer</h3>
            <p className="text-sm font-medium text-muted-foreground">CTO @ Acme Corp</p>
            <div className="flex gap-2 mt-4 w-full">
              <Button variant="outline" className="flex-1 h-8 text-xs font-bold">View Profile</Button>
              <Button variant="outline" className="flex-1 h-8 text-xs font-bold">Chat Now</Button>
            </div>
          </div>

          {/* SLA / Countdown */}
          <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">SLA Performance</h4>
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Time to First Resolution</span>
                <Timer className="h-4 w-4 text-rose-600 dark:text-rose-500" />
              </div>
              <div className="text-3xl font-black text-rose-600 dark:text-rose-500 tracking-tighter font-mono">00:14:52</div>
              <p className="text-[10px] font-bold text-rose-700/70 dark:text-rose-400/70 mt-2 uppercase tracking-wider">Urgent priority target: 30m</p>
            </div>
          </div>

          {/* Customer History */}
          <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Recent Tickets</h4>
            <div className="space-y-4">
              <div className="group cursor-pointer">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                  <span>TKT-8211</span>
                  <span className="text-emerald-600 dark:text-emerald-500">Resolved</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">API Key rotation issues</p>
              </div>
              <div className="group cursor-pointer">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                  <span>TKT-7954</span>
                  <span className="text-emerald-600 dark:text-emerald-500">Resolved</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors line-clamp-1">Invoice dispute - Sep 2023</p>
              </div>
            </div>
          </div>

          {/* Linked Assets */}
          <div className="p-6">
            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Linked Assets</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer bg-slate-50 dark:bg-zinc-900/50">
                <Server className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Production DB Cluster</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">ID: AWS-009-PROD</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer bg-slate-50 dark:bg-zinc-900/50">
                <Cloud className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Enterprise API Tier</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Plan: Platinum 24/7</p>
                </div>
              </div>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
