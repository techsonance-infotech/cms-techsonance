'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Clock, Ticket, Smile, ArrowUp, Minus, CheckCircle, 
  Mail, MessageSquare, Phone, Slack, Download
} from 'lucide-react';

export default function SLAAnalyticsDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Analytics Command Center</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Real-time Service Level Agreement monitoring and performance heuristics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-1 border border-slate-200 dark:border-zinc-700">
            <Button variant="ghost" size="sm" className="bg-white dark:bg-zinc-900 shadow-sm text-sm font-bold h-7">Last 24h</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-slate-900 dark:hover:text-white text-sm font-semibold h-7">7 Days</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-slate-900 dark:hover:text-white text-sm font-semibold h-7">30 Days</Button>
          </div>
          <Button variant="outline" className="gap-2 font-semibold">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SLA Compliance Rate</span>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">98.2%</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" /> +1.4% vs target
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg. First Response</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">18m 42s</div>
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Minus className="h-3 w-3" /> Steady this week
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Tickets</span>
              <Ticket className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">1,248</div>
            <div className="text-xs font-bold text-rose-600 dark:text-rose-500 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" /> +12% surge detected
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CSAT Score</span>
              <Smile className="h-5 w-5 text-pink-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">4.8/5.0</div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Top 5% of industry
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Chart Section: Asymmetric Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SLA Compliance Trend Chart */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle className="text-lg font-bold">SLA Compliance Trend</CardTitle>
              <CardDescription className="text-xs font-semibold mt-1">Hourly resolution tracking against 95% threshold.</CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resolution %</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 border-dashed border-rose-500/50"></span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SLA Target</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Visual Chart Placeholder */}
            <div className="h-[250px] flex items-end gap-3 px-2 relative mt-4">
              {/* Target Line */}
              <div className="absolute bottom-[95%] left-0 right-0 border-t-2 border-dashed border-rose-500/30 z-10 flex justify-end">
                <span className="bg-white dark:bg-zinc-950 text-rose-500 font-mono font-bold text-[10px] px-1 -mt-2">95% TARGET</span>
              </div>
              
              {/* Bars */}
              <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg group relative h-full">
                <div className="absolute bottom-0 w-full bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-600 transition-colors rounded-t-lg" style={{ height: '92%' }}></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono font-bold text-[10px] text-muted-foreground">08:00</span>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg group relative h-full">
                <div className="absolute bottom-0 w-full bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-600 transition-colors rounded-t-lg" style={{ height: '97%' }}></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono font-bold text-[10px] text-muted-foreground">10:00</span>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg group relative h-full">
                <div className="absolute bottom-0 w-full bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-600 transition-colors rounded-t-lg" style={{ height: '94%' }}></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono font-bold text-[10px] text-muted-foreground">12:00</span>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg group relative h-full">
                <div className="absolute bottom-0 w-full bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-600 transition-colors rounded-t-lg" style={{ height: '99%' }}></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono font-bold text-[10px] text-muted-foreground">14:00</span>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg group relative h-full">
                <div className="absolute bottom-0 w-full bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-600 transition-colors rounded-t-lg" style={{ height: '88%' }}></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono font-bold text-[10px] text-muted-foreground">16:00</span>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg group relative h-full">
                <div className="absolute bottom-0 w-full bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-600 transition-colors rounded-t-lg" style={{ height: '96%' }}></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono font-bold text-[10px] text-muted-foreground">18:00</span>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-zinc-800 rounded-t-lg group relative h-full">
                <div className="absolute bottom-0 w-full bg-indigo-200 dark:bg-indigo-900/50 group-hover:bg-indigo-600 transition-colors rounded-t-lg" style={{ height: '98%' }}></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono font-bold text-[10px] text-muted-foreground">20:00</span>
              </div>
            </div>
            
            <div className="mt-12 flex justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">Compliance remains <strong className="text-slate-900 dark:text-white">stable</strong> across 85% of time slots.</span>
              </div>
              <Button variant="link" className="text-indigo-600 font-bold p-0 h-auto">View Log</Button>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Volume by Channel */}
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Volume by Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Support</span>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">452</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Chat</span>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">328</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-pink-500 h-full" style={{ width: '32%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone / Voice</span>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">184</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full" style={{ width: '18%' }}></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Slack className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Slack Connect</span>
                </div>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">84</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full" style={{ width: '8%' }}></div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
              <p className="text-xs font-semibold text-muted-foreground italic leading-relaxed">
                "Email remains the dominant channel, but Live Chat volume has increased by 22% this quarter."
              </p>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Heatmap & Leaderboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Support Peak Heatmap */}
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div>
              <CardTitle className="text-lg font-bold">Load Heatmap</CardTitle>
              <CardDescription className="text-xs font-semibold mt-1">Ticket arrival density by day and hour.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Low</span>
              <div className="flex gap-0.5">
                <span className="w-3 h-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-sm"></span>
                <span className="w-3 h-3 bg-indigo-300 dark:bg-indigo-900/50 rounded-sm"></span>
                <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span>
                <span className="w-3 h-3 bg-indigo-700 rounded-sm"></span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">High</span>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[400px]">
              
              <div className="grid grid-cols-8 gap-1 mb-2">
                <div></div>
                <div className="font-mono font-bold text-[10px] text-center text-muted-foreground">MON</div>
                <div className="font-mono font-bold text-[10px] text-center text-muted-foreground">TUE</div>
                <div className="font-mono font-bold text-[10px] text-center text-muted-foreground">WED</div>
                <div className="font-mono font-bold text-[10px] text-center text-muted-foreground">THU</div>
                <div className="font-mono font-bold text-[10px] text-center text-muted-foreground">FRI</div>
                <div className="font-mono font-bold text-[10px] text-center text-muted-foreground">SAT</div>
                <div className="font-mono font-bold text-[10px] text-center text-muted-foreground">SUN</div>
              </div>

              <div className="space-y-1">
                {/* 08:00 Row */}
                <div className="grid grid-cols-8 gap-1">
                  <div className="font-mono font-bold text-[10px] text-right pr-2 flex items-center justify-end text-muted-foreground">08:00</div>
                  <div className="h-6 bg-indigo-300 dark:bg-indigo-900/50 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-100 dark:bg-indigo-900/20 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-500 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-700 rounded-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_8px_rgba(67,56,202,0.4)]"></div>
                  <div className="h-6 bg-indigo-500 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-slate-50 dark:bg-zinc-900 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-slate-50 dark:bg-zinc-900 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                </div>
                {/* 12:00 Row */}
                <div className="grid grid-cols-8 gap-1">
                  <div className="font-mono font-bold text-[10px] text-right pr-2 flex items-center justify-end text-muted-foreground">12:00</div>
                  <div className="h-6 bg-indigo-500 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-500 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-700 rounded-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_8px_rgba(67,56,202,0.4)]"></div>
                  <div className="h-6 bg-indigo-700 rounded-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_8px_rgba(67,56,202,0.4)]"></div>
                  <div className="h-6 bg-indigo-700 rounded-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_8px_rgba(67,56,202,0.4)]"></div>
                  <div className="h-6 bg-indigo-100 dark:bg-indigo-900/20 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-300 dark:bg-indigo-900/50 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                </div>
                {/* 16:00 Row */}
                <div className="grid grid-cols-8 gap-1">
                  <div className="font-mono font-bold text-[10px] text-right pr-2 flex items-center justify-end text-muted-foreground">16:00</div>
                  <div className="h-6 bg-indigo-300 dark:bg-indigo-900/50 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-700 rounded-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_8px_rgba(67,56,202,0.4)]"></div>
                  <div className="h-6 bg-indigo-500 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-500 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-500 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-slate-50 dark:bg-zinc-900 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-slate-50 dark:bg-zinc-900 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                </div>
                {/* 20:00 Row */}
                <div className="grid grid-cols-8 gap-1">
                  <div className="font-mono font-bold text-[10px] text-right pr-2 flex items-center justify-end text-muted-foreground">20:00</div>
                  <div className="h-6 bg-slate-50 dark:bg-zinc-900 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-100 dark:bg-indigo-900/20 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-100 dark:bg-indigo-900/20 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-100 dark:bg-indigo-900/20 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-indigo-100 dark:bg-indigo-900/20 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-slate-50 dark:bg-zinc-900 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                  <div className="h-6 bg-slate-50 dark:bg-zinc-900 rounded-sm hover:brightness-110 transition-all cursor-pointer"></div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Team Leaderboard */}
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold">Team Leaderboard</CardTitle>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Top Performers</span>
          </CardHeader>
          <CardContent className="space-y-2">
            
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                    AM
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-950"></span>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Alex Martinez</div>
                  <div className="text-xs font-medium text-muted-foreground mt-0.5">Senior Engineer</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">14m Avg</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mt-0.5">99.8% SLA</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 flex items-center justify-center text-pink-700 dark:text-pink-400 font-bold">
                    SC
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-950"></span>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Sarah Chen</div>
                  <div className="text-xs font-medium text-muted-foreground mt-0.5">SME - Assets</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">16m Avg</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mt-0.5">98.5% SLA</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold">
                    JD
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-950"></span>
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Jordan Davis</div>
                  <div className="text-xs font-medium text-muted-foreground mt-0.5">Tier 2 Analyst</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">19m Avg</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mt-0.5">97.2% SLA</div>
              </div>
            </div>

            <Button variant="ghost" className="w-full mt-2 text-muted-foreground hover:text-indigo-600 font-bold">
              View Full Rankings
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
