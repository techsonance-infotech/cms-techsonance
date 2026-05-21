'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, ArrowRightLeft, Map, List, TrendingUp, 
  Package, Smartphone, Warehouse, Snowflake, Droplets,
  Truck, ArrowDown, MapPin
} from 'lucide-react';

export default function RetailInventoryTransfer() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Multi-Store Inventory</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Real-time stock management across 12 global locations.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 font-semibold">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <ArrowRightLeft className="h-4 w-4" /> New Transfer Request
          </Button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Stock Levels by Location (Map/Chart Hybrid) */}
        <Card className="col-span-12 lg:col-span-8 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold">Stock Levels by Location</CardTitle>
            <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-lg p-1">
              <Button variant="ghost" size="sm" className="bg-white dark:bg-zinc-800 shadow-sm text-sm font-bold gap-2">
                <Map className="h-4 w-4" /> Map View
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground text-sm font-semibold gap-2">
                <List className="h-4 w-4" /> List View
              </Button>
            </div>
          </CardHeader>
          <div className="flex-1 relative bg-slate-50 dark:bg-zinc-950 overflow-hidden border-t border-slate-100 dark:border-zinc-800/50">
            {/* Map Background Pattern */}
            <div className="absolute inset-0 opacity-20 dark:opacity-10">
              <div className="w-full h-full bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]"></div>
            </div>
            
            {/* Interaction Hotspots */}
            <div className="absolute top-1/4 left-1/3 group cursor-pointer">
              <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping absolute opacity-75"></div>
              <div className="w-4 h-4 bg-indigo-600 rounded-full relative border-2 border-white shadow-sm"></div>
              <div className="absolute top-6 -left-16 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl w-48 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="font-bold text-sm text-indigo-600 dark:text-indigo-400">Flagship London</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">8,420 SKUs • 92% Capacity</div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 mt-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[92%]"></div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-1/3 right-1/4 group cursor-pointer">
              <div className="w-4 h-4 bg-rose-500 rounded-full relative border-2 border-white shadow-sm"></div>
              <div className="absolute top-6 -left-16 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-xl w-48 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="font-bold text-sm text-rose-500">New York Hub</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1">1,200 SKUs • 14% Capacity</div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 mt-3 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-[14%]"></div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4">
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300">
                Global Network Map
              </div>
            </div>
          </div>
        </Card>

        {/* Inter-Store Transfer Panel */}
        <Card className="col-span-12 lg:col-span-4 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Quick Transfer</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Source Location</label>
                <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>Flagship London (Central)</option>
                  <option>Berlin Distribution</option>
                  <option>Tokyo Retail</option>
                </select>
              </div>
              
              <div className="flex justify-center -my-3 relative z-10">
                <div className="bg-white dark:bg-zinc-950 p-1.5 rounded-full border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <ArrowDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Destination Location</label>
                <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>New York Hub (Critical)</option>
                  <option>Paris Boutique</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Item SKU</label>
                <Input className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-semibold" placeholder="Search item..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Quantity</label>
                  <Input type="number" defaultValue="50" className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">Priority</label>
                  <select className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Normal</option>
                    <option className="text-rose-500 font-bold">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            
            <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold h-11">
              Request Transfer
            </Button>
          </CardContent>
        </Card>

        {/* SKU Performance & Alerts */}
        <Card className="col-span-12 lg:col-span-9 shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle className="text-lg font-bold">SKU Performance & Alerts</CardTitle>
            <div className="flex gap-2">
              <Badge variant="destructive" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-none font-black text-[10px] tracking-wider px-2 py-1">
                12 LOW STOCK
              </Badge>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400 border-none font-black text-[10px] tracking-wider px-2 py-1">
                8 BEST SELLERS
              </Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">SKU / Product</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Category</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Total Stock</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Velocity</th>
                  <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">TK-9082-BLK</div>
                        <div className="text-xs font-medium text-muted-foreground mt-0.5">Premium Cotton Tee - Black</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className="font-semibold text-slate-600 dark:text-slate-400">Apparel</Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-sm">42</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold text-sm">
                      <TrendingUp className="h-4 w-4" /> 12%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="destructive" className="font-black text-[10px] tracking-wider">CRITICAL</Badge>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">SM-112-SLV</div>
                        <div className="text-xs font-medium text-muted-foreground mt-0.5">Wireless Earbuds Pro</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="outline" className="font-semibold text-slate-600 dark:text-slate-400">Tech</Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-sm">1,240</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold text-sm">
                      <TrendingUp className="h-4 w-4" /> 48%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 font-black text-[10px] tracking-wider">HEALTHY</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Warehouse Status Card */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          
          {/* Main Warehouse Real-Time Card */}
          <Card className="bg-indigo-600 border-none text-white shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Warehouse className="w-32 h-32" />
            </div>
            <CardContent className="relative z-10 p-5">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-black opacity-80 uppercase tracking-wider">Central Distribution</span>
                <span className="flex items-center gap-1.5 text-[10px] font-black bg-white/20 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div> LIVE
                </span>
              </div>
              <div className="text-4xl font-black mb-1">94,203</div>
              <div className="text-xs font-semibold opacity-80 mb-6">Total Units Handled (24h)</div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Sortation Efficiency</span>
                  <span>98.2%</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full w-[98.2%]"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Warehouse Health */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
            <CardContent className="p-5">
              <h4 className="text-xs font-black text-muted-foreground mb-4 uppercase tracking-wider">Secondary Storage</h4>
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">12,400</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">Cold Storage Capacity</div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 border-t-indigo-600 animate-spin" style={{ animationDuration: '3s' }}></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl text-center border border-slate-100 dark:border-zinc-800">
                  <Snowflake className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
                  <div className="text-sm font-bold text-slate-900 dark:text-white">14°C</div>
                  <div className="text-[10px] font-bold text-muted-foreground">TEMP</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl text-center border border-slate-100 dark:border-zinc-800">
                  <Droplets className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-sm font-bold text-slate-900 dark:text-white">42%</div>
                  <div className="text-[10px] font-bold text-muted-foreground">HUMID</div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Recent Transfers Activity */}
        <Card className="col-span-12 shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Pending Transfers Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
              
              <div className="min-w-[320px] border border-slate-200 dark:border-zinc-800 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/30 flex items-center gap-4">
                <div className="p-2.5 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500 rounded-lg">
                  <Truck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">TRF-9022 • In Transit</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">Berlin → Paris • 450 Units</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">4h 20m</div>
                  <div className="text-[10px] font-black text-muted-foreground mt-0.5">REMAINING</div>
                </div>
              </div>

              <div className="min-w-[320px] border border-slate-200 dark:border-zinc-800 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/30 flex items-center gap-4 opacity-60">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">TRF-8812 • Scheduled</div>
                  <div className="text-xs font-semibold text-muted-foreground mt-0.5">Tokyo → Osaka • 1,200 Units</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">Tomorrow</div>
                  <div className="text-[10px] font-black text-muted-foreground mt-0.5">ARRIVAL</div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
