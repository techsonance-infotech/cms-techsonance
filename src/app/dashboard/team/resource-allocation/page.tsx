'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Calendar as CalendarIcon, Download, Sparkles, 
  Settings, ChevronRight, ChevronLeft, CalendarDays,
  Users, Bot, ArrowRightLeft
} from 'lucide-react';

export default function ResourceAllocationWorkload() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Resource Allocation & Workload</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Manage team utilization and resolve project bottlenecks.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-sm font-semibold text-muted-foreground">Period:</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">Oct 23 - Oct 29</span>
            <CalendarIcon className="h-4 w-4 text-slate-400 ml-1" />
          </div>
          <Button variant="outline" className="gap-2 font-semibold">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Main Content Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Weekly Heat Map */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold">Weekly Workload Heat Map</CardTitle>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-zinc-800"></span>Low</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-200 dark:bg-indigo-900/50"></span>Med</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-600"></span>High</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>Overload</span>
              </div>
            </CardHeader>
            <div className="overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-3 border-b border-slate-200 dark:border-zinc-800 font-bold">Team Member</th>
                    <th className="py-3 text-center border-b border-slate-200 dark:border-zinc-800 font-bold">Mon</th>
                    <th className="py-3 text-center border-b border-slate-200 dark:border-zinc-800 font-bold">Tue</th>
                    <th className="py-3 text-center border-b border-slate-200 dark:border-zinc-800 font-bold">Wed</th>
                    <th className="py-3 text-center border-b border-slate-200 dark:border-zinc-800 font-bold">Thu</th>
                    <th className="py-3 text-center border-b border-slate-200 dark:border-zinc-800 font-bold">Fri</th>
                    <th className="py-3 text-center border-b border-slate-200 dark:border-zinc-800 font-bold">Sat</th>
                    <th className="py-3 text-center border-b border-slate-200 dark:border-zinc-800 font-bold">Sun</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1 */}
                  <tr className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
                          <Image src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" alt="Alex" width={36} height={36} className="object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">Alex Rivera</div>
                          <div className="text-[11px] font-semibold text-muted-foreground">Senior Dev</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">6h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">8h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">10h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">8h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">4h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
                          <Image src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop" alt="Sarah" width={36} height={36} className="object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">Sarah Chen</div>
                          <div className="text-[11px] font-semibold text-muted-foreground">Product Lead</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">8h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">8h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">8h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">6h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">8h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
                          <Image src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" alt="Jordan" width={36} height={36} className="object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">Jordan Smyth</div>
                          <div className="text-[11px] font-semibold text-muted-foreground">UX Designer</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">4h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">4h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">2h</div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                    <td className="p-1"><div className="h-10 rounded-md bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 border-dashed"></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Capability Matrix */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Capability Matrix</CardTitle>
              <Button variant="link" className="text-indigo-600 font-bold p-0 h-auto">View Detailed Directory</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 border border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Development</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">React/TS</span>
                    <span className="text-emerald-500 font-bold font-mono text-sm">92%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="p-4 border border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Cloud Arch</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">AWS/Infra</span>
                    <span className="text-amber-500 font-bold font-mono text-sm">64%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: '64%' }}></div>
                  </div>
                </div>

                <div className="p-4 border border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Data Science</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">Python/ML</span>
                    <span className="text-indigo-600 font-bold font-mono text-sm">48%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: '48%' }}></div>
                  </div>
                </div>

                <div className="p-4 border border-slate-100 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                  <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Design</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">Figma/UI</span>
                    <span className="text-blue-500 font-bold font-mono text-sm">88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: '88%' }}></div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Bottom Section: Calendar Grid */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg font-bold">Availability Calendar</CardTitle>
                <div className="flex bg-slate-200/50 dark:bg-zinc-800 rounded-lg p-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-bold bg-white dark:bg-zinc-700 shadow-sm">Monthly</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-muted-foreground">Quarterly</Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-bold text-slate-900 dark:text-white px-2">November 2023</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
                <div key={day} className={`p-3 text-center text-xs font-bold tracking-wider text-muted-foreground border-r border-slate-100 dark:border-zinc-800 ${i > 4 ? 'bg-slate-50 dark:bg-zinc-900/50' : ''}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 h-32 bg-white dark:bg-zinc-950">
              <div className="p-2 border-r border-slate-100 dark:border-zinc-800 relative group hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                <span className="text-xs font-semibold text-muted-foreground">23</span>
                <div className="mt-2 space-y-1">
                  <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold truncate">9:00 AM Sprint Planning</div>
                  <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-bold truncate">11:30 AM Team Sync</div>
                </div>
              </div>
              <div className="p-2 border-r border-slate-100 dark:border-zinc-800 group hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                <span className="text-xs font-semibold text-muted-foreground">24</span>
                <div className="mt-2">
                  <div className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-bold truncate">Major Release Window</div>
                </div>
              </div>
              <div className="p-2 border-r border-slate-100 dark:border-zinc-800 bg-indigo-50/50 dark:bg-indigo-900/10 border-t-2 border-t-indigo-500">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-black">25</span>
                <div className="mt-2">
                  <div className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm truncate">Nexus Workshop</div>
                </div>
              </div>
              <div className="p-2 border-r border-slate-100 dark:border-zinc-800 group hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                <span className="text-xs font-semibold text-muted-foreground">26</span>
              </div>
              <div className="p-2 border-r border-slate-100 dark:border-zinc-800 group hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                <span className="text-xs font-semibold text-muted-foreground">27</span>
              </div>
              <div className="p-2 border-r border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                <span className="text-xs font-semibold text-muted-foreground">28</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-zinc-900/50">
                <span className="text-xs font-semibold text-muted-foreground">29</span>
              </div>
            </div>
          </Card>

        </div>

        {/* Side Column: Utilization & AI Suggestions */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Utilization Breakdown */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" /> Current Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Engineering Team</span>
                  <span className="text-sm font-black text-rose-500">114%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: '100%' }}></div>
                </div>
                <div className="mt-2 text-xs font-bold text-muted-foreground">Critical: 3 members over capacity</div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Design Team</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">78%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: '78%' }}></div>
                </div>
                <div className="mt-2 text-xs font-bold text-muted-foreground">Optimal: Available for sub-projects</div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Product Management</span>
                  <span className="text-sm font-black text-emerald-500">42%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '42%' }}></div>
                </div>
                <div className="mt-2 text-xs font-bold text-muted-foreground">Low: Bench time potential</div>
              </div>
            </CardContent>
          </Card>

          {/* AI Reallocation Suggestions */}
          <Card className="border-none shadow-xl relative overflow-hidden bg-[#0f172a] text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 blur-3xl -mr-16 -mt-16 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 blur-2xl -ml-12 -mb-12 rounded-full"></div>
            
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-lg font-bold">AI Reallocation Engine</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Overload Detected</div>
                <p className="text-sm font-medium text-slate-300 mb-3">Alex Rivera is at 125% capacity for Sprint 14.</p>
                <div className="flex items-center gap-2 text-xs font-semibold bg-indigo-500/20 p-2.5 rounded-lg border border-indigo-500/30 text-indigo-100">
                  <ArrowRightLeft className="h-3 w-3" />
                  <span>Move <strong className="text-white">Task #452</strong> to <strong className="text-white">Jamie L.</strong></span>
                </div>
                <Button className="w-full mt-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-9">
                  Apply Shift
                </Button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">Skill Optimization</div>
                <p className="text-sm font-medium text-slate-300 mb-2">Design phase ending early for project "Helios".</p>
                <p className="text-xs font-medium text-slate-400 mb-3">Reassign <strong className="text-white">Jordan Smyth</strong> to "Atlas" Prototype (High Affinity).</p>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 font-bold h-9 bg-transparent">
                  Review Impact
                </Button>
              </div>

            </CardContent>
            <div className="px-6 pb-4 pt-2 mt-2 border-t border-white/10 relative z-10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono font-medium">Model: Nexus-Optimus v2.4</span>
                <span className="text-indigo-400 font-bold flex items-center gap-1.5 cursor-pointer hover:text-indigo-300 transition-colors">
                  Configure Logic <Settings className="h-3 w-3" />
                </span>
              </div>
            </div>
          </Card>

          {/* Resource Request Queue */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Resource Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors rounded-xl cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Backend Dev (2wks)</div>
                    <div className="text-xs font-semibold text-muted-foreground mt-0.5">Project: Titan Pay</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              
              <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors rounded-xl cursor-pointer group border-t border-slate-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">QA Automation (1mo)</div>
                    <div className="text-xs font-semibold text-muted-foreground mt-0.5">Project: Core API</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
