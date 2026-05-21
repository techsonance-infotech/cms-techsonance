'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, Clock, ChevronLeft, ChevronRight, 
  Plus, Minus, Filter, Download, MoreVertical,
  ArrowUp, ArrowDown, Shield, Star, Award, MapPin
} from 'lucide-react';

export default function ServiceMaintenanceHub() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Dashboard Header & KPIs */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Service Operations Hub</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Live maintenance and technician dispatch tracking</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          
          <Card className="min-w-[220px] shadow-sm border-slate-200 dark:border-zinc-800 shrink-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500 flex items-center justify-center rounded-xl">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">First Time Fix Rate</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">94.2%</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-0.5">
                  <ArrowUp className="h-3 w-3" /> 2.1% vs LY
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-[220px] shadow-sm border-slate-200 dark:border-zinc-800 shrink-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500 flex items-center justify-center rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Avg Response Time</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">38m</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-0.5">
                  <ArrowDown className="h-3 w-3" /> 5m vs prev week
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Service Schedule Calendar (Col 1-8) */}
        <Card className="col-span-12 lg:col-span-8 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg font-bold">Service Schedule</CardTitle>
              <div className="flex bg-slate-200/50 dark:bg-zinc-800 rounded-lg p-1">
                <Button variant="ghost" size="sm" className="bg-white dark:bg-zinc-700 shadow-sm text-sm font-bold h-7 text-indigo-600 dark:text-indigo-400">Weekly</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground text-sm font-semibold h-7">Daily</Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Oct 23 - Oct 29, 2023</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-900/30">
                  <th className="border-b border-r border-slate-200 dark:border-zinc-800 p-3 w-40 bg-slate-100/50 dark:bg-zinc-900/50"></th>
                  <th className="border-b border-r border-slate-200 dark:border-zinc-800 p-3 text-xs font-bold text-muted-foreground uppercase text-center">Mon 23</th>
                  <th className="border-b border-r border-slate-200 dark:border-zinc-800 p-3 text-xs font-bold text-muted-foreground uppercase text-center bg-slate-100/50 dark:bg-zinc-900/50">Tue 24</th>
                  <th className="border-b border-r border-slate-200 dark:border-zinc-800 p-3 text-xs font-bold text-muted-foreground uppercase text-center">Wed 25</th>
                  <th className="border-b border-r border-slate-200 dark:border-zinc-800 p-3 text-xs font-bold text-muted-foreground uppercase text-center">Thu 26</th>
                  <th className="border-b border-slate-200 dark:border-zinc-800 p-3 text-xs font-bold text-muted-foreground uppercase text-center">Fri 27</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                
                {/* Tech 1 */}
                <tr className="h-20">
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-3 bg-slate-50 dark:bg-zinc-900/30 align-top">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="font-bold text-slate-900 dark:text-white">M. Rogers</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground mt-0.5 block">Senior HVAC</span>
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-2 rounded-r-lg shadow-sm h-full flex flex-col justify-center">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 truncate">#4421 Maintenance</p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">09:00 - 12:30</p>
                    </div>
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top bg-slate-50/50 dark:bg-zinc-900/20"></td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-2 rounded-r-lg shadow-sm h-full flex flex-col justify-center">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-500 truncate">#4450 Repair</p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">08:30 - 11:00</p>
                    </div>
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top"></td>
                  <td className="border-b border-slate-200 dark:border-zinc-800 p-1.5 align-top"></td>
                </tr>

                {/* Tech 2 */}
                <tr className="h-20">
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-3 bg-slate-50 dark:bg-zinc-900/30 align-top">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      <span className="font-bold text-slate-900 dark:text-white">J. Chen</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground mt-0.5 block">Electrical Spec.</span>
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top"></td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top bg-slate-50/50 dark:bg-zinc-900/20">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-2 rounded-r-lg shadow-sm h-full flex flex-col justify-center">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 truncate">#4425 Installation</p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">09:00 - 17:00</p>
                    </div>
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top"></td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top"></td>
                  <td className="border-b border-slate-200 dark:border-zinc-800 p-1.5 align-top"></td>
                </tr>

                {/* Tech 3 */}
                <tr className="h-20">
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-3 bg-slate-50 dark:bg-zinc-900/30 align-top">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                      <span className="font-bold text-slate-900 dark:text-white">S. Knight</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground mt-0.5 block">Plumbing Lead</span>
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top"></td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top bg-slate-50/50 dark:bg-zinc-900/20"></td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top">
                    <div className="bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-2 rounded-r-lg shadow-sm h-full flex flex-col justify-center">
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-500 truncate">#4499 EMERGENCY</p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">13:00 - 15:30</p>
                    </div>
                  </td>
                  <td className="border-b border-r border-slate-200 dark:border-zinc-800 p-1.5 align-top">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 p-2 rounded-r-lg shadow-sm h-full flex flex-col justify-center">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 truncate">#4502 Audit</p>
                      <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">09:00 - 11:00</p>
                    </div>
                  </td>
                  <td className="border-b border-slate-200 dark:border-zinc-800 p-1.5 align-top"></td>
                </tr>

              </tbody>
            </table>
          </div>
        </Card>

        {/* Map Widget (Col 9-12) */}
        <Card className="col-span-12 lg:col-span-4 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between bg-slate-50 dark:bg-zinc-900/50">
            <CardTitle className="text-lg font-bold">Live Fleet Map</CardTitle>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">14 Active</span>
            </div>
          </CardHeader>
          <div className="flex-1 relative min-h-[350px] bg-slate-100 dark:bg-zinc-950">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2074')] bg-cover opacity-50 mix-blend-luminosity"></div>
            <div className="absolute inset-0 bg-blue-900/10 dark:bg-blue-900/20 mix-blend-overlay"></div>
            
            {/* Custom Map Markers */}
            <div className="absolute top-[25%] left-[33%] z-10 flex flex-col items-center">
              <div className="bg-indigo-600 text-white p-1.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-xl cursor-pointer">
                <MapPin className="h-4 w-4" fill="currentColor" />
              </div>
            </div>
            
            <div className="absolute bottom-[33%] right-[25%] z-10 flex flex-col items-center">
              <div className="bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-xl cursor-pointer">
                <MapPin className="h-4 w-4" fill="currentColor" />
              </div>
            </div>
            
            <div className="absolute top-[50%] left-[50%] z-10 flex flex-col items-center">
              <div className="bg-amber-500 text-white p-1.5 rounded-full border-2 border-white dark:border-zinc-900 shadow-xl cursor-pointer">
                <MapPin className="h-4 w-4" fill="currentColor" />
              </div>
            </div>

            {/* Map Controls Overlay */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
              <Button variant="secondary" size="icon" className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur shadow-md hover:bg-white dark:hover:bg-zinc-800">
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur shadow-md hover:bg-white dark:hover:bg-zinc-800">
                <Minus className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3">Fleet Pulse</p>
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-muted-foreground">On-Route Efficiency</span>
                  <span className="text-slate-900 dark:text-white font-black">88%</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[88%]"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-muted-foreground">Fuel Consumption</span>
                  <span className="text-slate-900 dark:text-white font-black">Optimal</span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[75%]"></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Service Contract Management Table */}
        <Card className="col-span-12 shadow-sm border-slate-200 dark:border-zinc-800 overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 dark:bg-zinc-900/50 gap-4">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg font-bold">Service Contract Management</CardTitle>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-black tracking-wider text-[10px]">
                284 ACTIVE SLAs
              </Badge>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2 font-semibold bg-white dark:bg-zinc-950">
                <Filter className="h-4 w-4" /> Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2 font-semibold bg-white dark:bg-zinc-950">
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4">Contract ID / Client</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">SLA Level</th>
                  <th className="px-6 py-4">Interval</th>
                  <th className="px-6 py-4">Renewal Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 dark:divide-zinc-800/50">
                
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">SC-2023-001</div>
                    <div className="text-xs font-medium text-muted-foreground mt-0.5">Global Logistics Hub</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">HVAC Maintenance</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Award className="h-4 w-4" /> Platinum (4hr)
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Quarterly</td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">Dec 12, 2023</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-black tracking-wider text-[10px]">ACTIVE</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">SC-2023-045</div>
                    <div className="text-xs font-medium text-muted-foreground mt-0.5">Tech Plaza North</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Electrical Systems</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold text-xs">
                      <Star className="h-4 w-4" /> Gold (8hr)
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Bi-Annual</td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">Nov 05, 2023</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500 border-none font-black tracking-wider text-[10px]">EXPIRING</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">SC-2023-088</div>
                    <div className="text-xs font-medium text-muted-foreground mt-0.5">Harbor Point Medical</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Fire Safety Compliance</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                      <Award className="h-4 w-4" /> Platinum (2hr)
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Monthly</td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">Jan 18, 2024</td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-black tracking-wider text-[10px]">ACTIVE</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">SC-2023-112</div>
                    <div className="text-xs font-medium text-muted-foreground mt-0.5">Apex Manufacturing</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Heavy Machinery Service</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-bold text-xs">
                      <Shield className="h-4 w-4" /> Standard (24hr)
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Quarterly</td>
                  <td className="px-6 py-4 font-mono font-bold text-sm">Oct 30, 2023</td>
                  <td className="px-6 py-4">
                    <Badge variant="destructive" className="bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-none font-black tracking-wider text-[10px]">LAPSED</Badge>
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
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center text-sm">
            <span className="font-semibold text-muted-foreground">Showing 1 to 4 of 284 contracts</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled className="h-8">Previous</Button>
              <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">1</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 font-semibold">2</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 font-semibold">3</Button>
              <Button variant="outline" size="sm" className="h-8">Next</Button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
