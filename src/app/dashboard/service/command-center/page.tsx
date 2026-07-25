'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Activity, 
  Truck, 
  Navigation,
  FileText,
  Calendar,
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Technician {
  id: string;
  name: string;
  avatar?: string;
  specialty: string;
  status: 'active' | 'busy' | 'offline';
  location: string;
  rating: number;
  completedToday: number;
}

interface WorkOrder {
  id: string;
  client: string;
  address: string;
  issue: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'dispatched' | 'en_route' | 'in_progress' | 'completed';
  assignedTech?: string;
  eta?: string;
  category: string;
}

export default function FieldServiceCommandCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [techFilter, setTechFilter] = useState<'all' | 'active' | 'busy' | 'offline'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'critical' | 'in_progress' | 'completed'>('all');

  const [technicians, setTechnicians] = useState<Technician[]>([
    { id: 'T101', name: 'Alex Rivera', specialty: 'HIIT Systems / Electrical', status: 'active', location: 'Downtown Hub A', rating: 4.9, completedToday: 5 },
    { id: 'T102', name: 'Jordan Smith', specialty: 'Hydraulics & HVAC', status: 'busy', location: 'West End Sector 4', rating: 4.8, completedToday: 3 },
    { id: 'T103', name: 'Marcus Chen', specialty: 'Mechanical Integrity', status: 'active', location: 'Industrial Sector 2', rating: 4.9, completedToday: 6 },
    { id: 'T104', name: 'Elena Rodriguez', specialty: 'Pneumatics & Automation', status: 'active', location: 'North Ridge Sector 7', rating: 4.7, completedToday: 4 },
    { id: 'T105', name: 'Sarah Jenkins', specialty: 'Structural Support', status: 'offline', location: 'Home Base', rating: 4.6, completedToday: 2 },
  ]);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    { id: 'WO-2940', client: 'Skyline Fitness Center', address: '492 Grand Avenue, Downtown', issue: 'Emergency Hydration Leak & HVAC Overload', priority: 'critical', status: 'in_progress', assignedTech: 'Alex Rivera', eta: '12 mins', category: 'HVAC' },
    { id: 'WO-2941', client: 'Apex Heavy Manufacturing', address: 'Building 12, Industrial Zone', issue: 'Pressure drop on primary compressor line B', priority: 'high', status: 'en_route', assignedTech: 'Marcus Chen', eta: '18 mins', category: 'Pneumatics' },
    { id: 'WO-2942', client: 'Starlight Retail Hub', address: '88 Broadway Mall, East Wing', issue: 'Power surge damaged security command relay', priority: 'medium', status: 'dispatched', assignedTech: 'Elena Rodriguez', eta: '25 mins', category: 'Electrical' },
    { id: 'WO-2943', client: 'Riverview Corporate Plaza', address: '707 Waterfront Drive', issue: 'Biometric turnstile diagnostic audit', priority: 'low', status: 'completed', assignedTech: 'Jordan Smith', eta: 'Completed', category: 'Security' },
    { id: 'WO-2944', client: 'Oakwood Recreation Center', address: '12 Forest Hills Lane', issue: 'Emergency water pressure backup valve failure', priority: 'critical', status: 'dispatched', assignedTech: 'Jordan Smith', eta: '8 mins', category: 'Hydraulics' },
  ]);

  const handleDispatch = (orderId: string) => {
    toast.success(`Dispatched immediate backup unit for ${orderId}`);
    setWorkOrders(orders => orders.map(o => o.id === orderId ? { ...o, status: 'en_route', eta: '5 mins' } : o));
  };

  const filteredTechs = technicians.filter(t => {
    if (techFilter !== 'all' && t.status !== techFilter) return false;
    return t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.specialty.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredOrders = workOrders.filter(o => {
    if (orderFilter === 'critical' && o.priority !== 'critical') return false;
    if (orderFilter === 'in_progress' && o.status !== 'in_progress') return false;
    if (orderFilter === 'completed' && o.status !== 'completed') return false;
    return o.client.toLowerCase().includes(searchQuery.toLowerCase()) || o.issue.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-6 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-200">Logistics & Dispatch Ops</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
              Field Service Command Center
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Real-time technician tracking, dynamic work order routing, and live emergency dispatch maps.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
              <Activity className="mr-1.5 h-4 w-4 text-cyan-400" /> System Live
            </Button>
            <Button size="sm" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => toast.info("Creating new dispatch ticket...")}>
              <Plus className="mr-1 h-4 w-4" /> Create Dispatch Ticket
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Time Fix Rate</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">94.2%</div>
            <Progress value={94.2} className="h-1.5 mt-3 bg-slate-100 dark:bg-slate-800" />
            <p className="text-xs text-muted-foreground mt-2">Target: &gt;90% (Industry Standard)</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Travel Time</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18.4m</div>
            <div className="flex items-center gap-1.5 mt-3">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">-2.1 mins</span>
              <span className="text-[10px] text-muted-foreground">vs last week</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Optimized via AI route planning</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jobs Completed Today</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Truck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">142</div>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span>Progress to target</span>
              <span className="font-bold">78%</span>
            </div>
            <Progress value={78} className="h-1.5 mt-1 bg-slate-100 dark:bg-slate-800" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Critical Emergency Tickets</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">3</div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-semibold text-rose-600">Immediate action required</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Backup units primed on stand-by</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dynamic Dispatch Visual Map (7 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="flex-1 min-h-[450px] flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <CardTitle>Live Dispatch Overlay Board</CardTitle>
                  <CardDescription>Visual vehicle telemetry and sector density coverage</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Active Dispatch: 4
                  </Badge>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    En Route: 3
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 relative bg-slate-950 dark:bg-black rounded-b-xl overflow-hidden min-h-[350px] p-0 flex flex-col justify-between">
              
              {/* Premium Cyber Grid Vector Simulation */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
              
              {/* Sector Bounds and Highlights */}
              <div className="absolute top-8 left-12 border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded text-[10px] text-blue-400">Sector Alpha (Downtown Hub)</div>
              <div className="absolute bottom-16 right-20 border border-violet-500/20 bg-violet-500/5 px-2 py-1 rounded text-[10px] text-violet-400">Sector Gamma (Industrial Park)</div>
              
              {/* Telemetry Markers */}
              {/* Tech 1 (Alex Rivera) */}
              <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                <div className="absolute -top-12 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-md text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
                  <p className="font-bold">Alex Rivera (T101)</p>
                  <p className="text-cyan-400">Status: In Progress (WO-2940)</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/40 rounded-full animate-ping scale-150" />
                  <div className="h-10 w-10 rounded-full border-2 border-cyan-400 bg-slate-900 flex items-center justify-center text-cyan-400 shadow-md">
                    <Navigation className="h-4 w-4 rotate-45" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold mt-1 bg-slate-900/80 px-2 py-0.5 rounded-full">Alex (Downtown)</span>
              </div>

              {/* Tech 3 (Marcus Chen) */}
              <div className="absolute top-1/2 right-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                <div className="absolute -top-12 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-md text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
                  <p className="font-bold">Marcus Chen (T103)</p>
                  <p className="text-amber-400">Status: En Route (WO-2941)</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/30 rounded-full animate-pulse" />
                  <div className="h-10 w-10 rounded-full border-2 border-amber-400 bg-slate-900 flex items-center justify-center text-amber-400 shadow-md">
                    <Truck className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold mt-1 bg-slate-900/80 px-2 py-0.5 rounded-full">Marcus (Industrial)</span>
              </div>

              {/* Tech 4 (Elena Rodriguez) */}
              <div className="absolute bottom-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                <div className="absolute -top-12 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-md text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
                  <p className="font-bold">Elena Rodriguez (T104)</p>
                  <p className="text-emerald-400">Status: Dispatched (WO-2942)</p>
                </div>
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-2 border-emerald-400 bg-slate-900 flex items-center justify-center text-emerald-400 shadow-md">
                    <Navigation className="h-4 w-4 -rotate-45" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-300 font-semibold mt-1 bg-slate-900/80 px-2 py-0.5 rounded-full">Elena (East Mall)</span>
              </div>

              {/* Custom Map Bottom Bar info panel */}
              <div className="relative z-10 w-full bg-slate-900/95 border-t border-slate-800 p-3.5 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-500 animate-bounce" />
                  <span className="font-semibold text-slate-200">Active High-Priority Emergency Node detected in Sector Alpha</span>
                </div>
                <Button size="xs" className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-7 px-3 text-[10px] rounded-lg" onClick={() => toast.info("Emergency dispatch map focused")}>
                  FOCUS NODE
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Technician Availability Registry (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Technician Registry</CardTitle>
                  <CardDescription>Live deployment roster</CardDescription>
                </div>
                <SelectRosterFilter filter={techFilter} setFilter={setTechFilter} />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[400px] space-y-4">
              {filteredTechs.map(tech => (
                <div key={tech.id} className="p-3 border rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs">
                        {tech.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-950 ${
                        tech.status === 'active' ? 'bg-emerald-500' :
                        tech.status === 'busy' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{tech.name}</p>
                      <p className="text-[11px] text-muted-foreground">{tech.specialty}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 inline text-slate-400" /> {tech.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={tech.status === 'active' ? 'default' : tech.status === 'busy' ? 'secondary' : 'outline'} className="text-[10px] capitalize">
                      {tech.status}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{tech.completedToday} jobs done</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Active Work Orders Ledger (Full Width) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Active Field Logistics Work Orders</CardTitle>
              <CardDescription>Live telemetry and emergency task dispatch logs</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="xs" variant={orderFilter === 'all' ? 'default' : 'outline'} onClick={() => setOrderFilter('all')} className="text-xs px-3 h-8">
                All Orders
              </Button>
              <Button size="xs" variant={orderFilter === 'critical' ? 'default' : 'outline'} onClick={() => setOrderFilter('critical')} className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 px-3 h-8">
                Critical Emergency
              </Button>
              <Button size="xs" variant={orderFilter === 'in_progress' ? 'default' : 'outline'} onClick={() => setOrderFilter('in_progress')} className="text-xs px-3 h-8">
                In Progress
              </Button>
              <Button size="xs" variant={orderFilter === 'completed' ? 'default' : 'outline'} onClick={() => setOrderFilter('completed')} className="text-xs px-3 h-8">
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer Client</th>
                <th className="p-3">Emergency / Issue details</th>
                <th className="p-3">Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Assigned Dispatcher</th>
                <th className="p-3">ETA Telemetry</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors group">
                  <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">{order.id}</td>
                  <td className="p-3">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{order.client}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {order.address}
                    </p>
                  </td>
                  <td className="p-3 max-w-[280px] truncate" title={order.issue}>{order.issue}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px]">{order.category}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
                      order.priority === 'critical' ? 'bg-rose-500/10 text-rose-600 border-rose-200' :
                      order.priority === 'high' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {order.priority}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {order.assignedTech ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-700">
                          {order.assignedTech.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-xs">{order.assignedTech}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> {order.eta}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge className={`text-[10px] uppercase ${
                      order.status === 'completed' ? 'bg-emerald-500 text-white' :
                      order.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' :
                      order.status === 'en_route' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {order.status !== 'completed' ? (
                      <Button size="xs" className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] h-7" onClick={() => handleDispatch(order.id)}>
                        Dispatch Immediate
                      </Button>
                    ) : (
                      <span className="text-emerald-600 text-xs font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Reconciled
                      </span>
                    )}
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

function SelectRosterFilter({ filter, setFilter }: { filter: string; setFilter: (v: any) => void }) {
  return (
    <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5">
      <button className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${filter === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setFilter('all')}>All</button>
      <button className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${filter === 'active' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setFilter('active')}>Active</button>
      <button className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${filter === 'busy' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-muted-foreground'}`} onClick={() => setFilter('busy')}>Busy</button>
    </div>
  );
}
