'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Receipt, Wallet, UserPlus, TrendingUp, ArrowUp, ArrowDown, 
  Hourglass, Users, Plus, ChevronRight, AlertTriangle, PackageOpen,
  CalendarDays, CheckCircle2, MoreHorizontal, ShoppingCart, 
  Clock, ArrowRight
} from 'lucide-react';

export default function SMBBusinessOverview() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Morning, Jonathan</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Here's what's happening with your business today.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2 font-semibold">
            <Receipt className="h-4 w-4" /> Create Invoice
          </Button>
          <Button variant="outline" className="gap-2 font-semibold">
            <Wallet className="h-4 w-4" /> Add Expense
          </Button>
          <Button className="gap-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
            <UserPlus className="h-4 w-4" /> New Customer
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                <ArrowUp className="h-3 w-3" /> 12.5%
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Monthly Revenue</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">$42,850.00</h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-500 rounded-lg">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-500 flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-full">
                <ArrowDown className="h-3 w-3" /> 3.2%
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Net Cash Flow</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">$18,210.50</h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500 rounded-lg">
                <Hourglass className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                8 Items
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending Invoices</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">$6,440.00</h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-500 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                <Plus className="h-3 w-3" /> 4 New
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Customers</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">156</h3>
          </CardContent>
        </Card>

      </div>

      {/* Bento Grid Main Content */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Cash Flow Chart Container */}
        <Card className="col-span-12 xl:col-span-8 shadow-sm border-slate-200 dark:border-zinc-800 min-h-[400px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold">Cash Flow Summary</CardTitle>
              <CardDescription className="text-xs font-semibold mt-1">Income vs Expenses over the last 6 months</CardDescription>
            </div>
            <select className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-700 rounded-lg font-semibold text-sm text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Last 6 Months</option>
              <option>Year to Date</option>
            </select>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col pt-6">
            {/* Mock Chart Visualization */}
            <div className="flex-grow flex items-end justify-between gap-2 overflow-x-auto min-h-[250px]">
              
              <div className="flex-1 flex flex-col items-center gap-3 group min-w-[40px]">
                <div className="w-full flex gap-1 items-end h-48 justify-center">
                  <div className="w-1/3 bg-indigo-600 dark:bg-indigo-500 rounded-t-md hover:brightness-110 transition-all" style={{ height: '70%' }}></div>
                  <div className="w-1/3 bg-rose-500 dark:bg-rose-400 rounded-t-md hover:brightness-110 transition-all" style={{ height: '45%' }}></div>
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Jan</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center gap-3 group min-w-[40px]">
                <div className="w-full flex gap-1 items-end h-48 justify-center">
                  <div className="w-1/3 bg-indigo-600 dark:bg-indigo-500 rounded-t-md hover:brightness-110 transition-all" style={{ height: '85%' }}></div>
                  <div className="w-1/3 bg-rose-500 dark:bg-rose-400 rounded-t-md hover:brightness-110 transition-all" style={{ height: '50%' }}></div>
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Feb</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center gap-3 group min-w-[40px]">
                <div className="w-full flex gap-1 items-end h-48 justify-center">
                  <div className="w-1/3 bg-indigo-600 dark:bg-indigo-500 rounded-t-md hover:brightness-110 transition-all" style={{ height: '60%' }}></div>
                  <div className="w-1/3 bg-rose-500 dark:bg-rose-400 rounded-t-md hover:brightness-110 transition-all" style={{ height: '65%' }}></div>
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Mar</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center gap-3 group min-w-[40px]">
                <div className="w-full flex gap-1 items-end h-48 justify-center">
                  <div className="w-1/3 bg-indigo-600 dark:bg-indigo-500 rounded-t-md hover:brightness-110 transition-all" style={{ height: '90%' }}></div>
                  <div className="w-1/3 bg-rose-500 dark:bg-rose-400 rounded-t-md hover:brightness-110 transition-all" style={{ height: '40%' }}></div>
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase">Apr</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center gap-3 group min-w-[40px]">
                <div className="w-full flex gap-1 items-end h-48 justify-center">
                  <div className="w-1/3 bg-indigo-600 dark:bg-indigo-500 rounded-t-md hover:brightness-110 transition-all" style={{ height: '75%' }}></div>
                  <div className="w-1/3 bg-rose-500 dark:bg-rose-400 rounded-t-md hover:brightness-110 transition-all" style={{ height: '55%' }}></div>
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase">May</span>
              </div>
              
              <div className="flex-1 flex flex-col items-center gap-3 group min-w-[40px]">
                <div className="w-full flex gap-1 items-end h-48 justify-center relative">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap shadow-md">Active Month</div>
                  <div className="w-1/3 bg-indigo-600 dark:bg-indigo-500 rounded-t-md hover:brightness-110 transition-all" style={{ height: '95%' }}></div>
                  <div className="w-1/3 bg-rose-500 dark:bg-rose-400 rounded-t-md hover:brightness-110 transition-all" style={{ height: '48%' }}></div>
                </div>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">Jun</span>
              </div>

            </div>

            <div className="mt-8 flex gap-6 border-t border-slate-100 dark:border-zinc-800 pt-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-500"></span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Income</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 dark:bg-rose-400"></span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Expenses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical To-Do List */}
        <Card className="col-span-12 md:col-span-6 xl:col-span-4 shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold">Critical Actions</CardTitle>
            <Badge variant="destructive" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-none font-black tracking-wider text-[10px]">HIGH PRIORITY</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group cursor-pointer">
              <div className="w-10 h-10 shrink-0 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="grow">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white">3 Unpaid Invoices</h5>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Overdue by 5+ days ($2,400 total)</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 self-center transition-colors" />
            </div>

            <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group cursor-pointer">
              <div className="w-10 h-10 shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center rounded-lg">
                <PackageOpen className="h-5 w-5" />
              </div>
              <div className="grow">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white">Low Stock Alert</h5>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">"Premium Finish Paint" (2 units left)</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 self-center transition-colors" />
            </div>

            <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group cursor-pointer">
              <div className="w-10 h-10 shrink-0 bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 flex items-center justify-center rounded-lg">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="grow">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white">Leave Request</h5>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Sarah Miller: July 12 - July 15</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 self-center transition-colors" />
            </div>

            <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group cursor-pointer">
              <div className="w-10 h-10 shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center rounded-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="grow">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white">Review Payroll</h5>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">Finalize for period ending June 30</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 self-center transition-colors" />
            </div>

            <Button variant="ghost" className="w-full mt-2 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
              View All Tasks <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="col-span-12 md:col-span-6 xl:col-span-4 shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold">Top Customers</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                  HD
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">Horizon Design Lab</h5>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">12 Projects • Since 2022</p>
                </div>
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">$12,450</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400">
                  SB
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">Summit Build Co.</h5>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">8 Projects • Since 2023</p>
                </div>
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">$9,800</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-pink-600 dark:text-pink-400">
                  AR
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">Arbor Real Estate</h5>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">5 Projects • Since 2024</p>
                </div>
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">$7,220</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                  KL
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white">Kinetix Logistics</h5>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">3 Projects • Since 2024</p>
                </div>
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">$4,500</span>
            </div>

          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="col-span-12 xl:col-span-8 shadow-sm border-slate-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            <Button variant="link" className="text-indigo-600 font-bold p-0 h-auto">Download Report</Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-800">
                  <th className="pb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction / Activity</th>
                  <th className="pb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="pb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                
                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg shrink-0">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Invoice #INV-2024-045 Paid</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">Horizon Design Lab</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold">Completed</Badge>
                  </td>
                  <td className="py-4 text-xs font-medium text-muted-foreground">June 24, 2024</td>
                  <td className="py-4 text-right font-bold text-sm text-slate-900 dark:text-white">$3,200.00</td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg shrink-0">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">Supplier Payment: Global Paints</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">Operating Expense</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold">Sent</Badge>
                  </td>
                  <td className="py-4 text-xs font-medium text-muted-foreground">June 23, 2024</td>
                  <td className="py-4 text-right font-bold text-sm text-slate-900 dark:text-white">-$850.20</td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">New Quote Requested</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">Summit Build Co.</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none font-bold">Pending Review</Badge>
                  </td>
                  <td className="py-4 text-xs font-medium text-muted-foreground">June 22, 2024</td>
                  <td className="py-4 text-right font-semibold text-sm text-muted-foreground">Est. $5,500</td>
                </tr>

              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
