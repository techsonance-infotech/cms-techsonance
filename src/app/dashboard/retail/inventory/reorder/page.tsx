'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  ShoppingCart, 
  Brain, 
  Search, 
  Download, 
  Zap, 
  Settings, 
  Star, 
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Activity,
  Plus
} from 'lucide-react';

interface ReorderItem {
  sku: string;
  name: string;
  stock: number;
  safety: number;
  runoutDays: number;
  vendor: string;
  suggestedQty: number;
  estCost: number;
  icon: string;
}

export default function InventoryReorderPage() {
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([
    { sku: 'IND-402-B', name: 'Industrial Bearing X-402', stock: 14, safety: 50, runoutDays: 4, vendor: 'Precision Dynamics', suggestedQty: 120, estCost: 3420.00, icon: 'settings_input_component' },
    { sku: 'WR-CP-50', name: 'Heavy Duty Copper Wire (50m)', stock: 42, safety: 60, runoutDays: 12, vendor: 'Global Logistics Corp', suggestedQty: 80, estCost: 5120.00, icon: 'cable' },
    { sku: 'ST-RB-G60', name: 'Premium Steel Rebar (Grade 60)', stock: 5, safety: 20, runoutDays: 2, vendor: 'Acme Steelworks Ltd', suggestedQty: 40, estCost: 18800.00, icon: 'foundation' },
    { sku: 'EC-U-V2', name: 'Electronic Controller Unit V2', stock: 8, safety: 15, runoutDays: 8, vendor: 'Silicon Systems', suggestedQty: 20, estCost: 12000.00, icon: 'precision_manufacturing' }
  ]);

  const [search, setSearch] = useState('');
  const [replenishActive, setReplenishActive] = useState(true);
  const [threshold, setThreshold] = useState(85);

  const filteredItems = reorderItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase()) ||
    item.vendor.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    toast.success('Low stock ledger exported successfully to CSV!');
  };

  const handleBulkOrder = () => {
    toast.success('Procurement dispatched! Bulk PO created for all 4 items.');
  };

  const handleResolveAll = () => {
    toast.success('Dispatched 12 urgent safety orders to active vendors!');
  };

  const handleSingleOrder = (sku: string) => {
    const item = reorderItems.find(i => i.sku === sku);
    if (item) {
      toast.success(`Purchase Order generated: Ordered ${item.suggestedQty} of ${item.name}!`);
    }
  };

  const handleRunAI = () => {
    toast.success('Running Nexus Intelligent Reorder optimization loop...');
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-500 text-xs tracking-wider uppercase">
          <span>Inventory</span>
          <span>/</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Reorder &amp; Vendor Management</span>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none font-bold uppercase text-[10px]">
            AI Auto-Replenishment Enabled
          </Badge>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Critical Alerts */}
        <div className="col-span-12 lg:col-span-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-rose-700 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider">Critical Alerts</span>
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">12 Items Below Safety</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Stockouts projected within 48 hours for 4 primary SKUs unless replenishments are initiated.
            </p>
          </div>
          <Button onClick={handleResolveAll} className="mt-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2">
            <Zap className="h-4 w-4" /> Resolve All Critical
          </Button>
        </div>

        {/* Suggested POs */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider">Suggested POs</span>
              <ShoppingCart className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">24 POs Queue</h3>
              <span className="text-emerald-600 text-xs font-bold font-mono">+8 Today</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Estimated total commitment value: <span className="font-semibold text-slate-800 dark:text-slate-200">$48,200.00</span>
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge className="bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold text-[9px] uppercase">Acme Steel (4)</Badge>
            <Badge className="bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold text-[9px] uppercase">Global Log (2)</Badge>
            <Badge className="bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold text-[9px] uppercase">TechParts (12)</Badge>
          </div>
        </Card>

        {/* AI Optimizer Replenishment Card */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider">AI Procurement</span>
              <Brain className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Auto-Replenish System</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Predictive lead-time adjustment saved $1,250 in expedited shipping charges this business cycle.
            </p>
          </div>
          <div className="relative z-10 flex justify-between items-center mt-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-indigo-200">Active</span>
            </div>
            <Button variant="ghost" size="sm" className="text-indigo-200 hover:text-white font-bold text-xs p-0 flex items-center gap-1">
              Adjust Parameters <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
            <Brain className="h-32 w-32" />
          </div>
        </div>

      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Low Stock Items Table */}
        <div className="col-span-12 xl:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Low Stock Pipeline
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-none text-[10px]">
                12 High Urgency
              </Badge>
            </h2>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="text-xs font-semibold">
                Export CSV
              </Button>
              <Button onClick={handleBulkOrder} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
                Bulk Order Suggested
              </Button>
            </div>
          </div>

          <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-slate-100 dark:border-slate-800 overflow-hidden shadow-md">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item Details</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inventory</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Forecast</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Suggested PO</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredItems.map((item) => (
                    <tr key={item.sku} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Activity className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">SKU: {item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-rose-600 dark:text-rose-400 font-extrabold">{item.stock} units</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Safety: {item.safety}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">Run-out: {item.runoutDays}d</span>
                          <Progress value={(item.runoutDays / 15) * 100} className="h-1 w-12 bg-slate-100 dark:bg-slate-800 [&>div]:bg-rose-500" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                        {item.vendor}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.suggestedQty} units</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">${item.estCost.toLocaleString()} Est.</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => handleSingleOrder(item.sku)}
                          variant="ghost" 
                          size="icon" 
                          className="hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 text-indigo-500"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table Footer */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-400 text-[11px]">
                  Showing {filteredItems.length} of {reorderItems.length} pipeline items
                </span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7 bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700">
                    <span>1</span>
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Vendors and Configuration */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          
          {/* Top Vendors */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Supplier Roster</h2>
            <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 p-4 space-y-4 shadow-sm">
              
              {/* Vendor 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                    PD
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">Precision Dynamics</div>
                    <div className="text-[10px] text-slate-400">42 Orders Cycle</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-amber-500 gap-1 font-bold">
                    <Star className="h-3.5 w-3.5 fill-current" /> <span>4.9</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight font-semibold">Reliability</span>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

              {/* Vendor 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                    GL
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">Global Logistics Corp</div>
                    <div className="text-[10px] text-slate-400">156 Orders Cycle</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-amber-500 gap-1 font-bold">
                    <Star className="h-3.5 w-3.5 fill-current" /> <span>4.2</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-tight font-semibold">Reliability</span>
                </div>
              </div>

            </Card>
          </div>

          {/* AI Auto-Replenish Configuration */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Replenish Settings</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Nexus Intelligence</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Predictive Automation</label>
                <div 
                  onClick={() => setReplenishActive(!replenishActive)} 
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${
                    replenishActive ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                    replenishActive ? 'right-1' : 'left-1'
                  }`} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">Confidence Threshold</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{threshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="99" 
                  value={threshold} 
                  onChange={(e) => setThreshold(parseInt(e.target.value))} 
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <Info className="h-4 w-4" /> Next Smart Run
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tonight at 02:00 AM (EST). Estimated batch value: <span className="font-semibold text-slate-700 dark:text-slate-200">$12,450.</span>
                </p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] font-bold py-1.5 h-8">Review Queue</Button>
                  <Button onClick={handleRunAI} size="sm" className="flex-1 bg-indigo-600 text-white font-bold text-[10px] py-1.5 h-8">Run Now</Button>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
