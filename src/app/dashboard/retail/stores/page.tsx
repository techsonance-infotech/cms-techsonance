'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Megaphone, Store, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle2, MapPin
} from 'lucide-react';

export default function RetailMultiStoreOperations() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Dashboard Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Operations Hub</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Global chain performance and logistics oversight.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 font-semibold">
            <Megaphone className="h-4 w-4" /> Run Global Promotion
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Store className="h-4 w-4" /> Add Store
          </Button>
        </div>
      </div>

      {/* Main Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Sales by Region - Large Bento */}
        <Card className="col-span-12 lg:col-span-8 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl font-bold">Sales by Region</CardTitle>
            <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-lg p-1 border border-slate-200 dark:border-zinc-800">
              <Button variant="ghost" size="sm" className="bg-white dark:bg-zinc-800 shadow-sm text-xs font-bold h-7">Revenue</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs font-semibold h-7">Volume</Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-indigo-600 border border-slate-100 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">North America</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">$4.2M</p>
                <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" /> +12%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border-l-4 border-slate-300 dark:border-zinc-700 border border-slate-100 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Europe</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">$2.8M</p>
                <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" /> +5%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border-l-4 border-slate-300 dark:border-zinc-700 border border-slate-100 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Asia Pacific</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">$5.1M</p>
                <p className="text-xs text-rose-500 font-bold flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3" /> -2%
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border-l-4 border-slate-300 dark:border-zinc-700 border border-slate-100 dark:border-zinc-800/50">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">MENA</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">$1.4M</p>
                <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" /> +8%
                </p>
              </div>
            </div>

            <div className="h-64 w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50 rounded-xl flex items-end justify-between px-8 pb-4 relative overflow-hidden">
              {/* Simulated Chart */}
              <div className="absolute inset-0 opacity-20 dark:opacity-10 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,1)_1px,transparent_0)] bg-[size:24px_24px]"></div>
              
              <div className="w-[8%] bg-indigo-600 rounded-t-lg h-[60%] relative z-10 hover:opacity-80 transition-opacity cursor-pointer"></div>
              <div className="w-[8%] bg-indigo-400 rounded-t-lg h-[45%] relative z-10 hover:opacity-80 transition-opacity cursor-pointer"></div>
              <div className="w-[8%] bg-indigo-600 rounded-t-lg h-[85%] relative z-10 hover:opacity-80 transition-opacity cursor-pointer"></div>
              <div className="w-[8%] bg-indigo-400 rounded-t-lg h-[70%] relative z-10 hover:opacity-80 transition-opacity cursor-pointer"></div>
              <div className="w-[8%] bg-indigo-600 rounded-t-lg h-[95%] relative z-10 hover:opacity-80 transition-opacity cursor-pointer"></div>
              <div className="w-[8%] bg-indigo-400 rounded-t-lg h-[50%] relative z-10 hover:opacity-80 transition-opacity cursor-pointer"></div>
              <div className="w-[8%] bg-indigo-600 rounded-t-lg h-[75%] relative z-10 hover:opacity-80 transition-opacity cursor-pointer"></div>
              <div className="w-[8%] bg-indigo-400 rounded-t-lg h-[65%] relative z-10 hover:opacity-80 transition-opacity cursor-pointer"></div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Health - Side Bento */}
        <Card className="col-span-12 lg:col-span-4 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl font-bold">Inventory Health</CardTitle>
            <AlertCircle className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/10">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">High-End Wireless Buds</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Stock: 12 units (Critical)</p>
                </div>
                <Button variant="link" className="text-xs font-bold text-rose-600 dark:text-rose-400 p-0 h-auto underline">Restock</Button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Designer Tote Bag</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Stock: 48 units (Low)</p>
                </div>
                <Button variant="link" className="text-xs font-bold text-amber-600 dark:text-amber-500 p-0 h-auto underline">View All</Button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Cotton Essential Tee</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Stock: 1,200 units (Healthy)</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aggregate Efficiency</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">88.4%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-[88%]"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map View of Store Locations */}
        <div className="col-span-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm h-[400px] relative">
          <div className="absolute top-4 left-4 z-20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-5 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 w-64">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Store Fleet Health</h4>
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">142 Open / Stable</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">8 Maintenance Mode</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">3 Critical Alerts</span>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-zinc-800">
              <Input className="w-full bg-slate-50 dark:bg-zinc-900 border-none font-semibold text-sm h-9" placeholder="Locate store ID..." />
            </div>
          </div>

          {/* Simulated Map Background */}
          <div className="w-full h-full bg-slate-100 dark:bg-zinc-950 relative">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2074')] bg-cover opacity-60 mix-blend-luminosity"></div>
            <div className="absolute inset-0 bg-indigo-900/10 dark:bg-indigo-900/20 mix-blend-overlay"></div>
            
            {/* Simulated Markers */}
            <div className="absolute top-[40%] left-[30%] z-10 flex flex-col items-center">
              <div className="w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-white dark:border-zinc-900 shadow-xl flex items-center justify-center animate-bounce"></div>
              <div className="bg-white dark:bg-zinc-900 px-2.5 py-1 rounded shadow-md text-[10px] font-bold mt-1.5 border border-slate-200 dark:border-zinc-800 whitespace-nowrap text-slate-900 dark:text-white">NY Flagship</div>
            </div>
            
            <div className="absolute top-[60%] left-[55%] z-10 flex flex-col items-center">
              <div className="w-5 h-5 bg-rose-500 rounded-full border-[3px] border-white dark:border-zinc-900 shadow-xl flex items-center justify-center animate-bounce"></div>
              <div className="bg-white dark:bg-zinc-900 px-2.5 py-1 rounded shadow-md text-[10px] font-bold mt-1.5 border border-slate-200 dark:border-zinc-800 whitespace-nowrap text-slate-900 dark:text-white">LDN - Regent St</div>
            </div>
            
            <div className="absolute top-[20%] left-[80%] z-10 flex flex-col items-center">
              <div className="w-5 h-5 bg-amber-500 rounded-full border-[3px] border-white dark:border-zinc-900 shadow-xl flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s'}}></div>
              <div className="bg-white dark:bg-zinc-900 px-2.5 py-1 rounded shadow-md text-[10px] font-bold mt-1.5 border border-slate-200 dark:border-zinc-800 whitespace-nowrap text-slate-900 dark:text-white">TKY - Shibuya</div>
            </div>
          </div>
        </div>

        {/* Staffing & Rostering Section */}
        <Card className="col-span-12 lg:col-span-7 shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle className="text-xl font-bold">Staffing & Rostering</CardTitle>
            <Button variant="link" className="text-indigo-600 font-bold p-0 h-auto">Full Schedule</Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-zinc-900/50">
                <tr className="border-b border-slate-200 dark:border-zinc-800">
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Store Location</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Staff Ratio</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Coverage</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">NY</div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">New York City</p>
                        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">5th Avenue Mall</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">24 / 24</td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-black tracking-wider text-[10px]">OPTIMAL</Badge>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">LN</div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">London</p>
                        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Regent Street</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">18 / 22</td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[81%]"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500 border-none font-black tracking-wider text-[10px]">UNDERSTAFFED</Badge>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">TK</div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Tokyo</p>
                        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">Shibuya Cross</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">32 / 32</td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-full"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-black tracking-wider text-[10px]">OPTIMAL</Badge>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </Card>

        {/* Store Performance Leaderboard */}
        <Card className="col-span-12 lg:col-span-5 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Store Performance</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                <span className="font-mono text-xl text-indigo-600 dark:text-indigo-400 font-black">#01</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Paris - Champs-Élysées</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Target: 142% Achieved</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-500 text-lg">$182.4k</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-0.5">Today</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="font-mono text-xl text-slate-400 dark:text-slate-500 font-black">#02</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Seoul - Gangnam</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Target: 118% Achieved</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white text-lg">$156.1k</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-0.5">Today</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <span className="font-mono text-xl text-slate-400 dark:text-slate-500 font-black">#03</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Dubai - Mall of Emirates</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">Target: 105% Achieved</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white text-lg">$144.8k</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-0.5">Today</p>
                </div>
              </div>

            </div>
            
            <Button variant="outline" className="w-full mt-6 font-bold h-11 border-slate-200 dark:border-zinc-800">
              View Complete Ranking
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
