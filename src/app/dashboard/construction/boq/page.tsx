'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Building2, TrendingUp, Coins, FileSpreadsheet, Plus, Camera, 
  Truck, ShieldAlert, BarChart3, Settings, Calendar, Layers 
} from 'lucide-react';

interface BOQItem {
  code: string;
  description: string;
  supplier: string;
  unit: string;
  qty: number;
  delivered: number;
  rate: number;
  status: 'COMPLETED' | 'PARTIAL' | 'ACTIVE';
}

export default function ConstructionBOQPage() {
  const [boqItems, setBoqItems] = useState<BOQItem[]>([
    { code: 'C-001', description: 'Ready-Mix Concrete (30MPa)', supplier: 'Lafarge Holcim', unit: 'm³', qty: 1200, delivered: 1200, rate: 115.00, status: 'COMPLETED' },
    { code: 'S-024', description: 'Reinforcement Steel (16mm)', supplier: 'ASTM A615 Grade 60', unit: 'Tons', qty: 450, delivered: 280, rate: 840.00, status: 'PARTIAL' },
    { code: 'L-091', description: 'Skilled Masonry Labor', supplier: 'Shift A & B - Level 4', unit: 'Hrs', qty: 8500, delivered: 1420, rate: 32.00, status: 'ACTIVE' },
  ]);

  const totalBOQValue = boqItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);

  const handleExport = () => {
    toast.success('BOQ Report exported successfully as Excel/CSV!');
  };

  const handleLogProgress = () => {
    toast.info('Opening daily log dialog...');
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1.5">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Zenith Heights Tower - B2</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Site Progress &amp; BOQ Tracker</h1>
          <p className="text-sm text-muted-foreground">Monitor concrete pours, steel reinforcement, and granular material deliverables.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleExport} className="font-semibold flex items-center gap-2 border-slate-200 dark:border-slate-800">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Report
          </Button>
          <Button size="sm" onClick={handleLogProgress} className="bg-primary hover:opacity-90 text-white font-bold flex items-center gap-2 shadow-md shadow-primary/10">
            <Camera className="h-4 w-4" />
            Log Daily Progress
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Work Package Progress Card */}
        <Card className="col-span-12 lg:col-span-8 border-slate-150 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Work Package Progress
              </CardTitle>
              <div className="flex gap-2">
                <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] py-0.5 px-2 rounded">Week 42</Badge>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[9px] py-0.5 px-2 rounded">On Schedule</Badge>
              </div>
            </div>
            <CardDescription>Real-time completion percentage of current construction workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Foundation */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">1. Foundation &amp; Substructure</span>
                <span className="font-bold text-primary">100%</span>
              </div>
              <Progress value={100} className="h-2 bg-slate-100 dark:bg-slate-800" />
              <div className="flex gap-4 text-[10px] text-muted-foreground">
                <span>Verified: Oct 12</span>
                <span>Inspector: Marcus K.</span>
              </div>
            </div>

            {/* Framing */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">2. Framing &amp; Structural Steel</span>
                <span className="font-bold text-primary">64.5%</span>
              </div>
              <Progress value={64.5} className="h-2 bg-slate-100 dark:bg-slate-800" />
              <div className="flex gap-4 text-[10px] text-muted-foreground">
                <span>Target: 70% by Friday</span>
                <span className="text-amber-600 font-semibold">Delay: Logistics (2 days)</span>
              </div>
            </div>

            {/* Electrical */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">3. Electrical Rough-in</span>
                <span className="font-bold text-primary">22%</span>
              </div>
              <Progress value={22} className="h-2 bg-slate-100 dark:bg-slate-800" />
              <div className="flex gap-4 text-[10px] text-muted-foreground">
                <span>Starting: Level 3 Floor</span>
                <span>Sub-contractor: Volt Systems</span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Quick Metrics */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-primary text-white border-none flex-1 flex flex-col justify-between p-6 min-h-[150px] shadow-lg shadow-primary/10 rounded-2xl">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">Total BOQ Value</span>
              <Coins className="h-5 w-5 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-black">₹{totalBOQValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] opacity-75 mt-1.5">Calculated from active bill of quantities ledger</div>
            </div>
          </Card>
          
          <Card className="border-slate-150 dark:border-slate-800 flex-1 flex flex-col justify-between p-6 min-h-[150px] rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Daily Burn Rate</span>
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">₹1,12,450.00</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1.5">
                <span>&darr;</span>
                2.4% below budget this week
              </div>
            </div>
          </Card>
        </div>

        {/* BOQ Detailed Tracker */}
        <Card className="col-span-12 border-slate-150 dark:border-slate-800 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold">Bill of Quantities (BOQ) Ledger</CardTitle>
                <CardDescription>Granular material and labor cost execution catalog.</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="font-semibold text-xs border-slate-200 dark:border-slate-800">
                Audit History
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">BOQ Qty</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Delivered</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {boqItems.map((item) => (
                  <tr key={item.code} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{item.code}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.description}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Supplier: {item.supplier}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.unit}</td>
                    <td className="px-6 py-4 font-semibold">{item.qty.toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">{item.delivered.toLocaleString()}</td>
                    <td className="px-6 py-4">₹{item.rate.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold">₹{(item.qty * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'COMPLETED' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold uppercase text-[9px] py-0.5 px-2 rounded">COMPLETED</Badge>
                      ) : item.status === 'PARTIAL' ? (
                        <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none font-bold uppercase text-[9px] py-0.5 px-2 rounded">PARTIAL</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-bold uppercase text-[9px] py-0.5 px-2 rounded">ACTIVE</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Site Documentation Photo Gallery */}
        <Card className="col-span-12 lg:col-span-6 border-slate-150 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Site Photo Documentation
              </CardTitle>
              <Button variant="link" size="sm" className="text-primary hover:opacity-90 font-bold p-0 text-xs">
                View Gallery
              </Button>
            </div>
            <CardDescription>Inspect ongoing physical operations via live daily photo logs.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-100 dark:border-slate-850 aspect-video">
              <img 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuOJVsCZIsdDQI5feR8TEHan-ri2StKZWWVyWa0riMrm_PxheaiRzr7CWbd47kiVfiC5yj-nj197KotG4qIz9TeLog-9qFXwmR_UFJ-lX0ky5cCQuQ6J6Jc2JkmP053V0i35ZecQIodsfo8q0p31I_hOJZ10uhjKCOze6LIVS0tmoNb57SJkKGRvK2kxbCqbg7GVfJrz3oZgiVCTtyR3Pfttezi5ymXDdSEP2wtoiGTT8P1jvmr46GwRjhvxTMldnNJIkv-imsJqEu" 
                alt="Foundation Pouring" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                <p className="text-[11px] font-bold">Foundation Pouring - Sector A</p>
                <p className="text-[9px] opacity-80">Today, 10:45 AM</p>
              </div>
            </div>
            <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-100 dark:border-slate-850 aspect-video">
              <img 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc4HMNfIxuz5Squk10WwyVa41uZkPH6av8V2eX-1DQKjjanR7zn_TjqWyC7vGpYO-Ty-E-XANXZMDQFHNQxQTF07XsMSZSRGQ8_es9mzQtILRVYpK3phF9-10QxWDCFuG15Ftuu0ud0QWc9t3jmDj35oUjqdJHuaFTPurdC4gGxOHS6OjVkP6XnGt-yKvG8qSk-6yZmItzOeL95XwTB7F0ez_A9zilA40dUN43N0bZC45n6i3Z4fs1z9nToxEK80A4X1WqgbfgZGjE" 
                alt="Framing Steel" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                <p className="text-[11px] font-bold">L3 Steel Erection</p>
                <p className="text-[9px] opacity-80">Oct 22, 02:15 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory & Procurement */}
        <Card className="col-span-12 lg:col-span-6 border-slate-150 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Inventory &amp; Procurement Alerts
            </CardTitle>
            <CardDescription>Track critical low materials and incoming field deliveries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex items-center gap-4 p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-800 dark:text-rose-300">
              <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="flex-1 text-xs">
                <p className="font-extrabold">Critical Low Stock: HVAC Vents</p>
                <p className="text-rose-700/80 dark:text-rose-300/80 mt-0.5">Last 12 units assigned to Level 2. Re-order needed.</p>
              </div>
              <Button onClick={() => toast.success('HVAC order placed')} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] h-7 px-3 rounded-lg">
                Order Now
              </Button>
            </div>
            
            <div className="flex items-center gap-4 p-3.5 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-800">
              <Truck className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 text-xs">
                <p className="font-extrabold">Scheduled Delivery: Glass Panes</p>
                <p className="text-muted-foreground mt-0.5">Arriving Oct 25 (Expected 08:00 AM)</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-none text-[9px] font-bold py-0.5 px-2 rounded-full">In Transit</Badge>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
