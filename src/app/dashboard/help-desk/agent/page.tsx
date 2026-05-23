'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Ticket, Clock, BarChart3, ThumbsUp, Star, StarHalf,
  Filter, ArrowUpDown, MoreVertical, AlertTriangle, Shield,
  TrendingDown, TrendingUp, Medal
} from 'lucide-react';

export default function ServiceDeskAgentDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Quick Stats Header (Bento Style) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Open Tickets</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                <Ticket className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">142</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> 4%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overdue SLA</span>
              <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-500 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">08</span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> 12%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg. Response Time</span>
              <div className="p-2 bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white">14m 20s</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Goal: &lt; 20m</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-indigo-500/20 bg-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold opacity-80 uppercase tracking-wider">CSAT Score</span>
              <div className="p-2 bg-white/20 rounded-lg">
                <ThumbsUp className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black">4.8/5</span>
              <div className="flex gap-0.5 text-amber-400">
                <Star className="h-4 w-4" fill="currentColor" />
                <Star className="h-4 w-4" fill="currentColor" />
                <Star className="h-4 w-4" fill="currentColor" />
                <Star className="h-4 w-4" fill="currentColor" />
                <StarHalf className="h-4 w-4" fill="currentColor" />
              </div>
            </div>
          </CardContent>
        </Card>

      </section>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Ticket Queue Table (Col 8) */}
        <Card className="lg:col-span-8 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <CardTitle className="text-lg font-bold">Active Ticket Queue</CardTitle>
              <CardDescription className="text-xs font-semibold mt-1">Priority 1 & 2 tickets requiring immediate action</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 font-semibold">
                <Filter className="h-4 w-4" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2 font-semibold">
                <ArrowUpDown className="h-4 w-4" /> Sort
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Ticket</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">SLA</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">INC-8842: API Gateway Timeout</span>
                      <span className="text-xs font-medium text-muted-foreground mt-0.5">Reported by Jordan Smith • 12m ago</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold border-none">In Progress</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 font-black text-[10px] tracking-wider uppercase">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                      Critical
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-500">00:42:15</span>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-rose-500 w-4/5"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">SR-102: VPN Access Request</span>
                      <span className="text-xs font-medium text-muted-foreground mt-0.5">Reported by Sarah Connor • 1h ago</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 font-bold border-none">New</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-black text-[10px] tracking-wider uppercase">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                      Medium
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-xs text-slate-600 dark:text-slate-400">04:12:00</span>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-amber-500 w-1/3"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">PRB-45: Repeated Database Lag</span>
                      <span className="text-xs font-medium text-muted-foreground mt-0.5">Reported by DevOps Monitoring • 3h ago</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-bold border-none">Investigation</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 font-black text-[10px] tracking-wider uppercase">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                      High
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-black text-[10px] tracking-wider text-rose-600 dark:text-rose-500">EXPIRED</span>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-rose-500 w-full"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 flex justify-center">
            <Button variant="link" className="text-indigo-600 font-bold p-0 h-auto">View All 142 Tickets</Button>
          </div>
        </Card>

        {/* Sidebar (Col 4) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Agent Performance */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Performance</CardTitle>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Today</span>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Tickets Resolved</span>
                  <span className="text-slate-900 dark:text-white font-black">24/30</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[80%]"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Response Accuracy</span>
                  <span className="text-slate-900 dark:text-white font-black">98%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[98%]"></div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-zinc-700">
                  <Medal className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">Rank #2 This Week</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Top Tier Performance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time System Status */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 p-4">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">System Status</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Authentication</span>
                </div>
                <span className="font-mono font-bold text-xs text-muted-foreground">14ms</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Primary DB</span>
                </div>
                <span className="font-mono font-bold text-xs text-muted-foreground">32ms</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"></span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">S3 Storage (US-East)</span>
                </div>
                <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-500">Degraded</span>
              </div>

              <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 leading-relaxed">
                  Minor latency spike detected in North American routing. Engineers are investigating.
                </p>
              </div>

            </CardContent>
          </Card>

        </aside>
      </div>
    </div>
  );
}
