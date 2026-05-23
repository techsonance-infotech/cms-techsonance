'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Filter, ArrowUpDown, GripVertical, ChevronsUp, ChevronUp, Minus,
  MoreVertical, CheckCircle2, Lightbulb, ArrowRight,
  Plus
} from 'lucide-react';

export default function SprintPlanningBacklog() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-4">
      
      {/* Left Column: Planning & Backlog */}
      <div className="flex-1 space-y-6">
        
        {/* Active Sprint Section */}
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold uppercase tracking-wider text-[10px]">
                    Active
                  </Badge>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sprint 24: Core Infrastructure</h2>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Oct 12 - Oct 26 • 4 days remaining</p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2">68% Complete</p>
                <div className="w-full sm:w-48 h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: '68%' }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-zinc-800 pt-6">
              <div className="text-center sm:border-r border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Todo</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">12</p>
              </div>
              <div className="text-center sm:border-r border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">In Progress</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">8</p>
              </div>
              <div className="text-center sm:border-r border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Review</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">4</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Done</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">42</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backlog Management */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Product Backlog <span className="text-muted-foreground text-sm font-medium">(142 items)</span></h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 font-semibold bg-white dark:bg-zinc-950">
                <Filter className="h-4 w-4" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2 font-semibold bg-white dark:bg-zinc-950">
                <ArrowUpDown className="h-4 w-4" /> Sort
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            
            {/* Backlog Item 1 */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group shadow-sm">
              <GripVertical className="h-5 w-5 text-slate-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing hidden sm:block shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded">NX-402</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Implement Multi-factor Authentication for Enterprise Portals</h4>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-500 text-xs font-bold">
                    <ChevronsUp className="h-4 w-4" /> High
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Security
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full mt-2 sm:mt-0">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] font-bold text-emerald-700">SC</div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                  8
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Backlog Item 2 */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group shadow-sm">
              <GripVertical className="h-5 w-5 text-slate-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing hidden sm:block shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded">NX-398</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Refactor Data Persistence Layer for Postgres 15</h4>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 text-xs font-bold">
                    <ChevronUp className="h-4 w-4" /> Medium
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Tech Debt
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full mt-2 sm:mt-0">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] font-bold text-slate-700">JS</div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                  5
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Backlog Item 3 */}
            <div className="bg-white dark:bg-zinc-950 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group shadow-sm">
              <GripVertical className="h-5 w-5 text-slate-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing hidden sm:block shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded">NX-415</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Audit Trail Exports for Compliance Reporting</h4>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-500 text-xs font-bold">
                    <Minus className="h-4 w-4" /> Low
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> Compliance
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full mt-2 sm:mt-0">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-pink-100 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] font-bold text-pink-700">AM</div>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                  13
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Create New Add-on */}
            <div className="rounded-xl p-4 border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-center justify-center group">
              <span className="text-sm font-bold text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-2">
                <Plus className="h-5 w-5" /> Create new issue
              </span>
            </div>

          </div>
        </section>

      </div>

      {/* Right Column: Sprint Insights Sidebar */}
      <aside className="w-full lg:w-[320px] space-y-6 shrink-0">
        
        {/* Capacity vs Load Card */}
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
            {/* SVG Placeholder for Analytics icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Sprint Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Team Capacity</p>
                <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">120 pts / 140 pts</p>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mt-2 flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 className="h-3 w-3" /> Healthy load
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Individual Load</p>
              <div className="space-y-4">
                
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0">SC</div>
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">38pt</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-[10px] font-bold text-pink-700 shrink-0">ML</div>
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 shrink-0">24pt</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">BJ</div>
                  <div className="flex-1 h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: '100%' }}></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-500 shrink-0">44pt</span>
                </div>

              </div>
            </div>

          </CardContent>
        </Card>

        {/* Velocity Chart */}
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Velocity History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end justify-between gap-2 px-2">
              <div className="w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-t-md h-[60%] relative group hover:brightness-95 transition-all">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">42</div>
              </div>
              <div className="w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-t-md h-[75%] relative group hover:brightness-95 transition-all">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">58</div>
              </div>
              <div className="w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-t-md h-[65%] relative group hover:brightness-95 transition-all">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">48</div>
              </div>
              <div className="w-10 bg-indigo-600 rounded-t-md h-[85%] relative shadow-[0_0_12px_rgba(79,70,229,0.4)]">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">64</div>
              </div>
            </div>
            <div className="flex justify-between mt-3 px-2 text-[10px] font-mono font-bold text-muted-foreground uppercase">
              <span>S20</span>
              <span>S21</span>
              <span>S22</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-black">S23</span>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-3">
            <Lightbulb className="h-5 w-5" />
            <h4 className="text-xs font-black uppercase tracking-wider">AI Planning Suggestion</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Based on current velocity, <strong className="text-slate-900 dark:text-white">Sprint 24</strong> is projected to finish 1.2 days early. Consider pulling <strong className="font-mono text-indigo-600 dark:text-indigo-400">NX-402</strong> from the backlog to maximize team utilization.
          </p>
          <Button variant="link" className="mt-2 text-indigo-700 dark:text-indigo-400 font-bold p-0 h-auto gap-1">
            Apply Suggestion <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

      </aside>

    </div>
  );
}
