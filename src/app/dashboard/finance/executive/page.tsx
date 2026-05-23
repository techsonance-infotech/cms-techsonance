'use client';

import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  Calendar, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Calculator,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  ref: string;
  division: string;
  category: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'cleared' | 'pending' | 'flagged';
  date: string;
  description: string;
}

export default function FinancialExecutiveDashboard() {
  const [currency, setCurrency] = useState<'USD' | 'INR' | 'EUR'>('USD');
  const [reconciling, setReconciling] = useState(false);

  const exchangeRates = {
    USD: 1,
    INR: 83.5,
    EUR: 0.92
  };

  const getCurrencySymbol = () => {
    if (currency === 'USD') return '$';
    if (currency === 'INR') return '₹';
    return '€';
  };

  const formatVal = (valInUSD: number) => {
    const rate = exchangeRates[currency];
    const converted = valInUSD * rate;
    return `${getCurrencySymbol()}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const transactions: Transaction[] = [
    { id: 'TXN-9014', ref: 'INV-2026-88', division: 'Enterprise Systems', category: 'Software Licensing', amount: 48500, type: 'credit', status: 'cleared', date: '2026-05-19', description: 'License expansion - Skyline Ventures' },
    { id: 'TXN-9015', ref: 'PO-2026-092', division: 'Global Operations', category: 'Hardware Procurement', amount: 14200, type: 'debit', status: 'cleared', date: '2026-05-18', description: 'Technician dispatch laptops purchase' },
    { id: 'TXN-9016', ref: 'INV-2026-89', division: 'Corporate Consulting', category: 'Advisory Retainer', amount: 25000, type: 'credit', status: 'cleared', date: '2026-05-18', description: 'Bi-annual cybersecurity architecture review' },
    { id: 'TXN-9017', ref: 'REIMB-290', division: 'Construction Sector', category: 'Site Progression / BOQ', amount: 3850, type: 'debit', status: 'pending', date: '2026-05-17', description: 'Client inspection hospitality reimbursement' },
    { id: 'TXN-9018', ref: 'AUDIT-004', division: 'Enterprise Security', category: 'Penetration Testing', amount: 62000, type: 'debit', status: 'flagged', date: '2026-05-15', description: 'Third-party security posture assessment audit fee' },
    { id: 'TXN-9019', ref: 'INV-2026-90', division: 'Academic Systems', category: 'SaaS Multi-tenant subscription', amount: 18400, type: 'credit', status: 'cleared', date: '2026-05-15', description: 'VODOin curriculum management subscription' },
  ];

  const handleReconcile = () => {
    setReconciling(true);
    setTimeout(() => {
      setReconciling(false);
      toast.success("Ledger reconciliation run complete. All transactional audits match standard baseline!");
    }, 1500);
  };

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#022c22] to-[#064e3b] p-6 text-white shadow-xl border border-emerald-900/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-teal-400/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Financial Intelligence Tier</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
              Financial Executive Dashboard
            </h2>
            <p className="text-sm text-emerald-200 mt-1 max-w-xl">
              C-suite multi-tenant ledger overview, future liquid liabilities forecast, and aging balance sheet reviews.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Currency Selector */}
            <div className="bg-emerald-950/80 border border-emerald-800 rounded-lg p-0.5 flex">
              {(['USD', 'INR', 'EUR'] as const).map(curr => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    currency === curr ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300 hover:text-emerald-100'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="border-emerald-700 bg-emerald-800 text-white hover:bg-emerald-700" onClick={handleReconcile} disabled={reconciling}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${reconciling ? 'animate-spin' : ''}`} /> Reconcile Ledger
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Bento KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Metric 1 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue Q3</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{formatVal(1284500)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">+14.5%</span>
              <span className="text-[10px] text-muted-foreground">vs last quarter</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Driven by Enterprise upgrades</p>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Operating Profit</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Calculator className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{formatVal(412800)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">+3.8%</span>
              <span className="text-[10px] text-muted-foreground">operating margin yield</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">EBITDA margin at 32.1%</p>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Free Cash Flow</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{formatVal(182450)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">+18%</span>
              <span className="text-[10px] text-muted-foreground">liquid reserve surplus</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Includes client billing runs</p>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding Audit Risks</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">1</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-semibold text-rose-600">Flagged audit anomaly</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Reconciliation pending verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Overdue & Liability Forecast (Aging Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Accounts Receivable Overdue aging (6 Columns) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Accounts Receivable Aging Summary</CardTitle>
              <CardDescription>Overdue customer client invoices categorized by duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Current (0 - 30 Days)</span>
                  <span className="font-bold text-emerald-600">{formatVal(324000)}</span>
                </div>
                <Progress value={62} className="h-2 bg-slate-100 dark:bg-slate-800" />
                <p className="text-[10px] text-muted-foreground mt-1">Normal collection cycle (62% of AR)</p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Slight Overdue (31 - 60 Days)</span>
                  <span className="font-bold text-amber-500">{formatVal(118500)}</span>
                </div>
                <Progress value={22} className="h-2 bg-slate-100 dark:bg-slate-800" />
                <p className="text-[10px] text-muted-foreground mt-1">Notifications sent to account manager (22%)</p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>Highly Overdue (61 - 90 Days)</span>
                  <span className="font-bold text-orange-600">{formatVal(45000)}</span>
                </div>
                <Progress value={9} className="h-2 bg-slate-100 dark:bg-slate-800" />
                <p className="text-[10px] text-muted-foreground mt-1">Direct finance audit and calls triggered (9%)</p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold text-zinc-700 dark:text-zinc-300">
                  <span>At Critical Risk (&gt;90 Days)</span>
                  <span className="font-bold text-rose-600">{formatVal(36200)}</span>
                </div>
                <Progress value={7} className="h-2 bg-slate-100 dark:bg-slate-800" />
                <p className="text-[10px] text-muted-foreground mt-1">Account lock warned, legal pre-arbitration (7%)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liquid Liabilities AP Forecast (6 Columns) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Accounts Payable Forecast & Liabilities</CardTitle>
              <CardDescription>Future structural liabilities and vendor settlements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Dense Summary Widget */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Scheduled settlements next 14 days</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-zinc-50">{formatVal(84150)}</p>
                </div>
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200">
                  Surplus Covered
                </Badge>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendor Category Allocations</h4>
                
                <div>
                  <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Multi-tenant SaaS & Infrastructure hosting</span>
                    <span className="font-bold">42%</span>
                  </div>
                  <Progress value={42} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Office Real-estate & Physical Site assets</span>
                    <span className="font-bold">28%</span>
                  </div>
                  <Progress value={28} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>Contract Advisory & Pen-Testing Consultants</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <Progress value={30} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Recent Ledger Audit Feed (Full Width) */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <CardTitle>Recent Corporate Accounting Ledgers</CardTitle>
              <CardDescription>Cleared and flagged operational records</CardDescription>
            </div>
            <Button size="xs" variant="outline" className="text-xs" onClick={() => toast.info("Exporting corporate general ledger...")}>
              <Download className="mr-1.5 h-4 w-4" /> Export Ledger Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                <th className="p-3">Ref ID</th>
                <th className="p-3">Division</th>
                <th className="p-3">Cost Category</th>
                <th className="p-3 font-semibold">Value</th>
                <th className="p-3">Ledger Action</th>
                <th className="p-3">Expense Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Audit Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {transactions.map(txn => (
                <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                  <td className="p-3">
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{txn.id}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{txn.ref}</p>
                  </td>
                  <td className="p-3 text-xs">{txn.division}</td>
                  <td className="p-3">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{txn.category}</p>
                    <p className="text-[11px] text-muted-foreground">{txn.description}</p>
                  </td>
                  <td className="p-3 font-bold text-zinc-900 dark:text-zinc-50">{formatVal(txn.amount)}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase ${
                      txn.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {txn.type === 'credit' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {txn.type}
                    </span>
                  </td>
                  <td className="p-3 text-xs font-semibold">{new Date(txn.date).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Badge className={`text-[10px] uppercase font-bold ${
                      txn.status === 'cleared' ? 'bg-emerald-500 text-white' :
                      txn.status === 'flagged' ? 'bg-rose-600 text-white animate-bounce' : 'bg-amber-500 text-white'
                    }`}>
                      {txn.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    {txn.status === 'flagged' ? (
                      <Button size="xs" variant="destructive" className="text-[10px] h-7 px-2" onClick={() => toast.warning("Directing case file to compliance audit...")}>
                        Audit Details
                      </Button>
                    ) : (
                      <span className="text-emerald-600 text-xs font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Audited
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
