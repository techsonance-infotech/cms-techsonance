'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  Search, 
  SlidersHorizontal, 
  Download, 
  Sparkles, 
  AlertTriangle,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Database
} from 'lucide-react';

interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  stock: number;
  maxStock: number;
  warehouse: string;
  price: number;
  status: 'STABLE' | 'REORDER' | 'SURPLUS';
}

export default function RetailInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([
    { sku: 'NEX-9042-AL', name: 'Aluminum Alloy Frame X-1', category: 'Raw Materials', stock: 842, maxStock: 1000, warehouse: 'North Hub (A-12)', price: 242.00, status: 'STABLE' },
    { sku: 'OPT-2105-CH', name: 'Core Processor Module V3', category: 'Electronics', stock: 12, maxStock: 100, warehouse: 'Main Depot (C-04)', price: 1850.00, status: 'REORDER' },
    { sku: 'GEN-8821-BP', name: 'Bio-Polymer Sealant 500ml', category: 'Chemicals', stock: 156, maxStock: 400, warehouse: 'East Wing (D-02)', price: 89.50, status: 'STABLE' },
    { sku: 'TCH-1120-SK', name: 'Sensor Array Calibration Kit', category: 'Tools', stock: 92, maxStock: 100, warehouse: 'North Hub (B-01)', price: 4200.00, status: 'SURPLUS' },
  ]);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NORTH' | 'EAST' | 'MAIN'>('ALL');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase());
    
    if (activeFilter === 'ALL') return matchesSearch;
    if (activeFilter === 'NORTH') return matchesSearch && item.warehouse.includes('North');
    if (activeFilter === 'EAST') return matchesSearch && item.warehouse.includes('East');
    if (activeFilter === 'MAIN') return matchesSearch && item.warehouse.includes('Main');
    return matchesSearch;
  });

  const handleExport = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'Stock Level', 'Max Stock', 'Warehouse', 'Unit Price', 'Status'];
    const rows = filteredItems.map(item => [
      item.sku,
      item.name,
      item.category,
      item.stock,
      item.maxStock,
      item.warehouse,
      item.price.toFixed(2),
      item.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Inventory catalog exported successfully as CSV!');
  };

  const handleAcceptAI = () => {
    toast.success('AI Optimization plan successfully deployed to North Hub!');
  };

  const handleRelocate = () => {
    toast.info('Initiating asset relocation wizard...');
  };

  const handleStockChange = (sku: string, newStock: number) => {
    setItems(prev => prev.map(item => {
      if (item.sku === sku) {
        let updatedStatus: 'STABLE' | 'REORDER' | 'SURPLUS' = 'STABLE';
        const pct = (newStock / item.maxStock) * 100;
        if (pct < 20) {
          updatedStatus = 'REORDER';
        } else if (pct > 90) {
          updatedStatus = 'SURPLUS';
        }
        return { ...item, stock: newStock, status: updatedStatus };
      }
      return item;
    }));
  };

  const lowStockCount = items.filter(i => i.status === 'REORDER').length;

  return (
    <div className="space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>Enterprise ERP Console</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Inventory &amp; ERP Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time tracking of 2,482 SKUs across 4 primary warehouse nodes.
          </p>
        </div>

        <div className="flex gap-4">
          <Card className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-lg text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Low Stock Alerts</p>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">{lowStockCount} Items</h4>
            </div>
          </Card>
          
          <Card className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">AI Optimization</p>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Active</h4>
            </div>
          </Card>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative max-w-sm w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs" 
              placeholder="Search by SKU, category or product..." 
            />
          </div>
          <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-950 text-xs">
            <button 
              onClick={() => setActiveFilter('ALL')} 
              className={`px-3 py-1.5 rounded font-semibold transition-all ${activeFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              All Stocks
            </button>
            <button 
              onClick={() => setActiveFilter('NORTH')} 
              className={`px-3 py-1.5 rounded font-semibold transition-all ${activeFilter === 'NORTH' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              North Hub
            </button>
            <button 
              onClick={() => setActiveFilter('EAST')} 
              className={`px-3 py-1.5 rounded font-semibold transition-all ${activeFilter === 'EAST' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              East Wing
            </button>
            <button 
              onClick={() => setActiveFilter('MAIN')} 
              className={`px-3 py-1.5 rounded font-semibold transition-all ${activeFilter === 'MAIN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Main Depot
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <Button onClick={handleExport} variant="outline" size="sm" className="font-semibold text-xs flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* Main Stock Data Table */}
      <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-slate-100 dark:border-slate-800 overflow-hidden shadow-md">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">AI Insights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredItems.map((item) => (
                <tr 
                  key={item.sku} 
                  className={`hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-all ${
                    item.status === 'REORDER' ? 'bg-rose-50/10 hover:bg-rose-50/20' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {item.category}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={(item.stock / item.maxStock) * 100} 
                        className={`h-2 w-20 bg-slate-100 dark:bg-slate-800 ${
                          item.status === 'REORDER' 
                            ? '[&>div]:bg-rose-500' 
                            : item.status === 'SURPLUS' 
                              ? '[&>div]:bg-emerald-500'
                              : '[&>div]:bg-indigo-500'
                        }`} 
                      />
                      <input 
                        type="number"
                        value={item.stock}
                        onChange={(e) => handleStockChange(item.sku, parseInt(e.target.value) || 0)}
                        className="w-12 bg-transparent text-xs font-mono font-bold border-none focus:ring-1 focus:ring-indigo-500 rounded p-0.5 text-center text-slate-800 dark:text-slate-200"
                      />
                      <span className="text-slate-400">/ {item.maxStock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {item.warehouse}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.status === 'REORDER' ? (
                      <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-none font-extrabold uppercase text-[9px] tracking-wider animate-pulse">
                        <AlertTriangle className="h-3 w-3 mr-1 inline" /> Reorder Point
                      </Badge>
                    ) : item.status === 'SURPLUS' ? (
                      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none font-extrabold uppercase text-[9px] tracking-wider">
                        <TrendingUp className="h-3 w-3 mr-1 inline" /> Surplus
                      </Badge>
                    ) : (
                      <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-none font-extrabold uppercase text-[9px] tracking-wider">
                        Stable
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Footer */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-slate-400 text-[11px]">
              Showing {filteredItems.length} of {items.length} main SKUs
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

      {/* AI Panel & Capacity Forecast (Asymmetric Bento) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Forecast Card */}
        <Card className="col-span-12 lg:col-span-7 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-lg">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-xl text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">Predictive Optimization Forecast</h3>
            </div>
            <p className="text-xs text-indigo-200 leading-relaxed max-w-md">
              Seasonal analytics predict a 15% demand surge for raw assembly parts. Nexus AI recommends increasing target safety buffers for Core Processors and Calibration assemblies before the winter logistics freeze.
            </p>
          </div>
          <div className="relative z-10 flex gap-3 mt-4">
            <Button onClick={handleAcceptAI} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4">
              Deploy Optimization Plan
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-white/10 font-bold text-xs text-white">
              View Analytics Report
            </Button>
          </div>
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,white_1px,transparent_0)] bg-[size:16px_16px]"></div>
        </Card>

        {/* Space Capacity */}
        <Card className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col justify-between p-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-600" /> Warehouse Space Utilization
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Real-time capacity footprint across regional depots.</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Main Depot</span>
                  <span className="text-rose-600 font-bold">92% (High Burden)</span>
                </div>
                <Progress value={92} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-rose-500" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">North Hub</span>
                  <span className="text-emerald-600 font-bold">45% (Stable)</span>
                </div>
                <Progress value={45} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">East Wing</span>
                  <span className="text-amber-600 font-bold font-mono">78%</span>
                </div>
                <Progress value={78} className="h-1.5 bg-slate-100 dark:bg-slate-800 [&>div]:bg-amber-500" />
              </div>
            </div>
          </div>
          <Button onClick={handleRelocate} variant="outline" size="sm" className="mt-6 font-bold text-xs w-full">
            <MoveHorizontal className="h-4 w-4 mr-2" /> Relocate Assets
          </Button>
        </Card>

      </div>
    </div>
  );
}
