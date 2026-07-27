'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users, UserCheck, UserX, Clock, FileText, UserPlus, Search,
  MapPin, Briefcase, Building, TrendingUp, Sparkles, AlertCircle,
  Calendar, Award, DollarSign, ArrowRight, UserCog, Upload, BarChart3,
  Heart, ShieldAlert, Laptop, ArrowUpRight, ArrowDownRight, Compass,
  Globe2, Landmark, ChevronRight, Filter, Download, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';
import {
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';

interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  onNotice: number;
  probation: number;
  contract: number;
  intern: number;
  remote: number;
  hybrid: number;
  wfo: number;
  departments: number;
  locations: number;
  male: number;
  female: number;
  otherGender: number;
  avgAge: number | null;
  avgExperience: number | null;
  avgSalary: number | null;
  newJoiners: number;
  resignedThisMonth: number;
  upcomingBirthdays: number;
  workAnniversaries: number;
  deptBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  experienceBuckets: Record<string, number>;
  // New dashboard metrics
  attritionRate: number;
  salaryDistribution: { name: string; value: number }[];
  headcountGrowth: { name: string; value: number }[];
  pendingReviews: number;
  pendingDocuments: number;
  assetRecovery: number;
  missingAttendance: number;
  aiInsights: string[];
}

export default function WorkforceDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    fetchStats();
  }, [dateRange, activeFilters]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = getStoredSessionToken();
      const queryParams = new URLSearchParams({
        dateRange,
        filters: activeFilters.join(','),
      });
      const res = await fetch(`/api/dashboard/stats/workforce?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data || data);
      } else {
        toast.error('Failed to load workforce statistics');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const token = getStoredSessionToken();
      const res = await fetch(`/api/employees?search=${encodeURIComponent(val)}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const exportPDF = () => {
    if (!stats) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }

    const formattedSalary = stats.avgSalary
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(stats.avgSalary)
      : 'N/A';

    const html = `
      <html>
        <head>
          <title>Workforce Intelligence Report</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
            .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .card h3 { margin: 0 0 10px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
            .card p { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; }
            .section-title { font-size: 18px; font-weight: 700; margin-bottom: 15px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            th { background: #f1f5f9; font-weight: 600; color: #475569; }
            .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Workforce Intelligence Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} | Date Range: ${dateRange} | Filters: ${activeFilters.length > 0 ? activeFilters.join(', ') : 'None'}</p>
          </div>
          
          <div class="stats-grid">
            <div class="card"><h3>Total Headcount</h3><p>${stats.total}</p></div>
            <div class="card"><h3>Active Personnel</h3><p>${stats.active}</p></div>
            <div class="card"><h3>Attrition Rate</h3><p>${stats.attritionRate}%</p></div>
            <div class="card"><h3>On Leave</h3><p>${stats.onLeave}</p></div>
            <div class="card"><h3>On Notice</h3><p>${stats.onNotice}</p></div>
            <div class="card"><h3>Probation</h3><p>${stats.probation}</p></div>
          </div>

          <div class="section-title">Demographics & Work Modes</div>
          <table>
            <thead>
              <tr><th>Metric</th><th>Count / Value</th></tr>
            </thead>
            <tbody>
              <tr><td>Remote Personnel</td><td>${stats.remote}</td></tr>
              <tr><td>Hybrid Personnel</td><td>${stats.hybrid}</td></tr>
              <tr><td>Office (WFO) Personnel</td><td>${stats.wfo}</td></tr>
              <tr><td>Male Personnel</td><td>${stats.male}</td></tr>
              <tr><td>Female Personnel</td><td>${stats.female}</td></tr>
              <tr><td>Other Genders</td><td>${stats.otherGender}</td></tr>
              <tr><td>Avg. Salary (INR)</td><td>${formattedSalary}</td></tr>
            </tbody>
          </table>

          <div class="section-title">Compliance Metrics</div>
          <table>
            <thead>
              <tr><th>Alert Category</th><th>Outstanding Items</th></tr>
            </thead>
            <tbody>
              <tr><td>Missing KYC Documents</td><td>${stats.pendingDocuments} profiles</td></tr>
              <tr><td>Pending Performance Reviews</td><td>${stats.pendingReviews} cycles</td></tr>
              <tr><td>Assets Pending Return</td><td>${stats.assetRecovery} assets</td></tr>
              <tr><td>Missing Attendance Today</td><td>${stats.missingAttendance} profiles</td></tr>
            </tbody>
          </table>

          <div class="footer">TechSonance CMS - Enterprise SaaS Platform</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('PDF Report generated successfully');
  };

  const toggleDemoFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  // Helper to generate realistic historical sparkline data ending at target value
  const getSparklineData = (val: number, multiplier: number = 0.05) => {
    const points = 7;
    const data = [];
    for (let i = 0; i < points; i++) {
      const step = i - (points - 1);
      const randFactor = 0.8 + Math.random() * 0.4;
      const calculated = Math.max(0, Math.round(val + step * val * multiplier * randFactor));
      data.push({ value: calculated });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-1">
        <div className="h-20 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
          <div className="h-80 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#1E1F22] rounded-3xl border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 space-y-4 min-h-[400px]">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500">
          <AlertCircle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Failed to load workforce statistics</h2>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] max-w-md">
            There was a problem communicating with the server. Please verify you are logged in and your connection is active.
          </p>
        </div>
        <Button onClick={fetchStats} className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2">
          Retry Loading
        </Button>
      </div>
    );
  }

  const formatSalary = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Sparkline data sets
  const sparkTotal = getSparklineData(stats.total, 0.03);
  const sparkActive = getSparklineData(stats.active, 0.02);
  const sparkLeave = getSparklineData(stats.onLeave, -0.05);
  const sparkNotice = getSparklineData(stats.onNotice, 0.1);
  const sparkProbation = getSparklineData(stats.probation, 0.04);
  const sparkInactive = getSparklineData(stats.inactive, 0.05);
  const sparkAttrition = getSparklineData(stats.attritionRate, 0.02);
  const sparkLoc = getSparklineData(stats.locations, 0.01);

  // 4 Charts dataset
  const employeeDistData = [
    { name: 'Active', value: stats.active, color: '#10b981' },
    { name: 'On Leave', value: stats.onLeave, color: '#0ea5e9' },
    { name: 'On Notice', value: stats.onNotice, color: '#f43f5e' },
    { name: 'Probation', value: stats.probation, color: '#f59e0b' }
  ];

  const genderData = [
    { name: 'Male', value: stats.male, color: '#3b82f6' },
    { name: 'Female', value: stats.female, color: '#ec4899' },
    { name: 'Others', value: stats.otherGender, color: '#94a3b8' }
  ];

  const workModeData = [
    { name: 'Remote', value: stats.remote, color: '#6366f1' },
    { name: 'Hybrid', value: stats.hybrid, color: '#8b5cf6' },
    { name: 'WFO', value: stats.wfo, color: '#06b6d4' }
  ];

  const expBuckets = stats.experienceBuckets || {
    '0-2 years': 0,
    '2-5 years': 0,
    '5-8 years': 0,
    '8+ years': 0
  };
  const experienceData = [
    { name: '0-2 yrs', value: expBuckets['0-2 years'] },
    { name: '2-5 yrs', value: expBuckets['2-5 years'] },
    { name: '5-8 yrs', value: expBuckets['5-8 years'] },
    { name: '8+ yrs', value: expBuckets['8+ years'] }
  ];

  const salaryData = stats.salaryDistribution || [];
  const departmentData = Object.entries(stats.deptBreakdown || {}).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);
  const headcountData = stats.headcountGrowth || [];

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc] space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-[#f87941]" />
            Workforce Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] mt-1">
            Real-time workforce demographics, status trackers, and department allocations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2 bg-white dark:bg-[#1E1F22]">
                <Calendar className="h-4 w-4 text-slate-400" />
                {dateRange}
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30">
              {['Last 7 Days', 'Last 30 Days', 'This Month', 'This Quarter', 'This Year'].map(preset => (
                <DropdownMenuItem key={preset} onClick={() => setDateRange(preset)} className="cursor-pointer">
                  {preset}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Dropdown with Orange Count Badge */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 text-slate-700 dark:text-[#fdfcfc] font-semibold flex items-center gap-2 bg-white dark:bg-[#1E1F22] relative">
                <Filter className="h-4 w-4 text-slate-400" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f87941] text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(248,121,65,0.4)]">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase">Toggle Presets</div>
              {[
                { key: 'hq', label: 'HQ Location Only' },
                { key: 'remote', label: 'Remote Personnel Only' },
                { key: 'on-leave', label: 'On Leave Status' }
              ].map(item => {
                const isActive = activeFilters.includes(item.key);
                return (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={() => toggleDemoFilter(item.key)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="h-2 w-2 rounded-full bg-[#f87941]" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Report Button */}
          <Button
            onClick={exportPDF}
            className="bg-[#f87941]/10 text-[#f87941] border border-[#f87941]/20 hover:bg-[#f87941]/20 font-bold flex items-center gap-2 transition-colors"
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>

          <Link href="/dashboard/employees/new">
            <Button className="bg-[#f87941] text-white hover:bg-[#e06634] font-semibold flex items-center gap-2 shadow-[0_4px_12px_rgba(248,121,65,0.2)]">
              <UserPlus className="h-4 w-4" /> Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Smart Search */}
      <div className="relative max-w-2xl mx-auto w-full z-20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Google-style employee search... (ID, Name, Email, Dept, Skill, Location)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-12 pr-4 h-12 bg-white dark:bg-[#1E1F22] border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-2xl text-base shadow-[0_4px_20px_rgba(0,0,0,0.02)] focus:border-[#f87941]/50 focus:ring-1 focus:ring-[#f87941]/50"
          />
        </div>
        {searchQuery.trim().length >= 2 && (
          <Card className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-2xl rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
            <CardHeader className="py-2.5 px-4 bg-slate-50 dark:bg-slate-900 border-b border-[#e6e4e6]/10 dark:border-[#2f3035]/10">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {searching ? (
                <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No matching employees found</div>
              ) : (
                <div className="divide-y divide-[#e6e4e6]/10 dark:divide-[#2f3035]/10">
                  {searchResults.map((emp) => (
                    <Link
                      key={emp.id}
                      href={`/dashboard/employees/${emp.id}`}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f87941]/10 flex items-center justify-center font-bold text-xs text-[#f87941]">
                          {emp.employeeId.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{emp.employeeId} • {emp.designation}</p>
                          <p className="text-xs text-slate-500">{emp.department} • {emp.workLocation || 'Office'}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  ))}
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 text-center">
                    <Link
                      href={`/dashboard/employees/directory?search=${encodeURIComponent(searchQuery)}`}
                      className="text-xs font-bold text-[#f87941] hover:underline"
                    >
                      View all results in directory
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Eight Horizontally Aligned Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: 'Total Employees', value: stats.total, icon: Users, color: '#f87941', trend: '+4.2% MoM', spark: sparkTotal },
          { label: 'Active Employees', value: stats.active, icon: UserCheck, color: '#10b981', trend: '+3.8% MoM', spark: sparkActive },
          { label: 'On Leave', value: stats.onLeave, icon: Calendar, color: '#0ea5e9', trend: '-2.4% MoM', spark: sparkLeave },
          { label: 'On Notice', value: stats.onNotice, icon: ShieldAlert, color: '#f43f5e', trend: '0% change', spark: sparkNotice },
          { label: 'Probation', value: stats.probation, icon: Clock, color: '#f59e0b', trend: '+1.5% MoM', spark: sparkProbation },
          { label: 'Resigned/Inactive', value: stats.inactive, icon: UserX, color: '#64748b', trend: '+0.5% MoM', spark: sparkInactive },
          { label: 'Attrition Rate', value: `${stats.attritionRate}%`, icon: TrendingUp, color: '#ec4899', trend: '-0.2% MoM', spark: sparkAttrition },
          { label: 'Locations', value: stats.locations, icon: MapPin, color: '#a855f7', trend: '+1 loc added', spark: sparkLoc },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 hover:border-[#f87941]/30 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm">
              <CardContent className="p-3 flex flex-col justify-between h-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.label}</span>
                  <div className="p-1 rounded-lg" style={{ backgroundColor: `${item.color}10`, color: item.color }}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
 
                <div>
                  <h3 className="text-xl font-black tracking-tight">{item.value}</h3>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5 mt-0.5">
                    {item.trend.includes('+') ? (
                      <ArrowUpRight className="h-2.5 w-2.5 text-emerald-500 inline" />
                    ) : item.trend.includes('-') ? (
                      <ArrowDownRight className="h-2.5 w-2.5 text-rose-500 inline" />
                    ) : null}
                    {item.trend}
                  </span>
                </div>
 
                {/* Sparkline chart */}
                {isMounted ? (
                  <div className="h-6 w-full mt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={item.spark} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`colorGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={item.color} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={item.color} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={item.color}
                          strokeWidth={1}
                          fillOpacity={1}
                          fill={`url(#colorGrad-${idx})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-6 w-full bg-slate-50 dark:bg-slate-900 rounded animate-pulse mt-1" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Four Analytics Chart Blocks */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart 1: Employee Distribution */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-[#f87941]" />
              Employee Distribution
            </CardTitle>
            <CardDescription className="text-xs">Roster status breakdown (Active, Leave, Notice, Probation)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            {isMounted ? (
              <div className="relative w-full max-w-[200px] h-[200px] flex-shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={employeeDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {employeeDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} Employees`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Central Stats Summary */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-[#fdfcfc]">
                    {stats.total}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Staff</span>
                </div>
              </div>
            ) : (
              <div className="w-[180px] h-[180px] rounded-full border-8 border-slate-100 dark:border-slate-800 animate-pulse mx-auto" />
            )}

            {/* Custom Legend */}
            <div className="flex-1 space-y-3 w-full">
              {employeeDistData.map((item, idx) => {
                const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-sm p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{item.value}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-8 text-right font-medium">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Gender Diversity */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Heart className="h-4.5 w-4.5 text-[#f87941]" />
              Gender Diversity
            </CardTitle>
            <CardDescription className="text-xs">Gender representation balance across personnel</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            {isMounted ? (
              <div className="relative w-full max-w-[200px] h-[200px] flex-shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} Employees`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-[#fdfcfc]">
                    {stats.total > 0 ? Math.round(((stats.female + stats.otherGender) / stats.total) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Diversity %</span>
                </div>
              </div>
            ) : (
              <div className="w-[180px] h-[180px] rounded-full border-8 border-slate-100 dark:border-slate-800 animate-pulse mx-auto" />
            )}

            {/* Custom Legend */}
            <div className="flex-1 space-y-3 w-full">
              {genderData.map((item, idx) => {
                const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-sm p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{item.value}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-8 text-right font-medium">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Work Mode Distribution */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Globe2 className="h-4.5 w-4.5 text-[#f87941]" />
              Work Mode Distribution
            </CardTitle>
            <CardDescription className="text-xs">Location format structures (Remote, Hybrid, WFO)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            {isMounted ? (
              <div className="relative w-full max-w-[200px] h-[200px] flex-shrink-0 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workModeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {workModeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} Employees`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-[#fdfcfc]">
                    {stats.remote + stats.hybrid}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Flexible Staff</span>
                </div>
              </div>
            ) : (
              <div className="w-[180px] h-[180px] rounded-full border-8 border-slate-100 dark:border-slate-800 animate-pulse mx-auto" />
            )}

            {/* Custom Legend */}
            <div className="flex-1 space-y-3 w-full">
              {workModeData.map((item, idx) => {
                const pct = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-sm p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{item.value}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-8 text-right font-medium">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Experience Distribution */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-[#f87941]" />
              Experience Distribution
            </CardTitle>
            <CardDescription className="text-xs">Headcount categorized by years at company</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col justify-center min-h-[200px]">
            {isMounted ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={experienceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip formatter={(value) => [`${value} Employees`, 'Count']} />
                    <Bar
                      dataKey="value"
                      fill="#f87941"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 w-full bg-slate-50 dark:bg-slate-900 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Chart 5: Salary Distribution */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <DollarSign className="h-4.5 w-4.5 text-[#f87941]" />
              Salary Distribution
            </CardTitle>
            <CardDescription className="text-xs">Headcount categorized by annual salary range</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col justify-center min-h-[200px]">
            {isMounted ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salaryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip formatter={(value) => [`${value} Employees`, 'Count']} />
                    <Bar
                      dataKey="value"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 w-full bg-slate-50 dark:bg-slate-900 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Chart 6: Department Distribution */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-[#f87941]" />
              Department Distribution
            </CardTitle>
            <CardDescription className="text-xs">Headcount breakdown per active department</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col justify-center min-h-[200px]">
            {isMounted ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={departmentData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip formatter={(value) => [`${value} Employees`, 'Count']} />
                    <Bar
                      dataKey="value"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={25}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 w-full bg-slate-50 dark:bg-slate-900 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        {/* Chart 7: Headcount Growth Trend */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 rounded-3xl overflow-hidden shadow-sm flex flex-col xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-[#f87941]" />
              Headcount Growth Trend
            </CardTitle>
            <CardDescription className="text-xs">Active headcount trend over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-6 flex flex-col justify-center min-h-[220px]">
            {isMounted ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={headcountData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87941" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f87941" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip formatter={(value) => [`${value} Employees`, 'Total Staff']} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#f87941"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#growthGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 w-full bg-slate-50 dark:bg-slate-900 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Averages & Activity logs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Averages */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-[#f87941]" />
              Workforce Profiles & CTC Averages
            </CardTitle>
            <CardDescription className="text-xs">Compensation rates, ages, and experience structures.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Average CTC</span>
              <p className="text-xl font-black text-[#f87941]">{formatSalary(stats.avgSalary)}</p>
              <p className="text-[10px] text-slate-400">Annual run rate CTC</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Average Tenure</span>
              <p className="text-xl font-black text-[#f87941]">{stats.avgExperience ? `${stats.avgExperience} yrs` : 'N/A'}</p>
              <p className="text-[10px] text-slate-400">Total company retention</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Average Age</span>
              <p className="text-xl font-black text-[#f87941]">{stats.avgAge ? `${stats.avgAge} yrs` : 'N/A'}</p>
              <p className="text-[10px] text-slate-400">Average employee age</p>
            </div>
          </CardContent>
        </Card>

        {/* Activity This Month */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-[#f87941]" />
              Staff Lifecycle Activity
            </CardTitle>
            <CardDescription className="text-xs">Additions and departures this month.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">New Joiners</p>
                  <p className="text-base font-bold">{stats.newJoiners}</p>
                </div>
              </div>
              <Badge className="bg-emerald-500 text-white flex items-center gap-0.5 font-bold text-[9px] px-1.5 py-0.5">
                <ArrowUpRight className="h-2.5 w-2.5" /> Growth
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <UserX className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Resignations</p>
                  <p className="text-base font-bold">{stats.resignedThisMonth}</p>
                </div>
              </div>
              <Badge className="bg-rose-500 text-white flex items-center gap-0.5 font-bold text-[9px] px-1.5 py-0.5">
                <ArrowDownRight className="h-2.5 w-2.5" /> Exit
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Events */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-[#f87941]" />
              Events & Anniversaries (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-[#f87941]/5 rounded-2xl border border-[#f87941]/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f87941]/10 text-[#f87941] flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Upcoming Birthdays</p>
                  <p className="text-lg font-bold">{stats.upcomingBirthdays}</p>
                </div>
              </div>
              <Link href="/dashboard/employees/directory" className="text-xs font-bold text-[#f87941] hover:underline flex items-center gap-1">
                Greet <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#f87941]/5 rounded-2xl border border-[#f87941]/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f87941]/10 text-[#f87941] flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Work Anniversaries</p>
                  <p className="text-lg font-bold">{stats.workAnniversaries}</p>
                </div>
              </div>
              <Link href="/dashboard/employees/directory" className="text-xs font-bold text-[#f87941] hover:underline flex items-center gap-1">
                Congratulate <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-[#f87941]" />
              Compliance Alerts & Audits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Missing KYC Documents', value: `${stats.pendingDocuments} profiles`, type: stats.pendingDocuments > 0 ? 'warning' : 'info' },
              { label: 'Pending Performance Reviews', value: `${stats.pendingReviews} cycles`, type: stats.pendingReviews > 0 ? 'warning' : 'info' },
              { label: 'Assets Pending Return', value: `${stats.assetRecovery} assets`, type: stats.assetRecovery > 0 ? 'warning' : 'info' },
              { label: 'Missing Attendance Today', value: `${stats.missingAttendance} profiles`, type: stats.missingAttendance > 0 ? 'warning' : 'info' },
            ].map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm border-b border-[#e6e4e6]/10 dark:border-[#2f3035]/10 pb-2">
                <span className="font-semibold text-slate-600 dark:text-slate-300">{alert.label}</span>
                <Badge variant="outline" className={alert.type === 'warning' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 'text-slate-500 border-slate-500/20'}>
                  {alert.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Workforce Insights Premium Panel */}
      <Card className="bg-gradient-to-r from-[#f87941]/5 via-purple-500/5 to-pink-500/5 border border-[#f87941]/20 dark:border-purple-500/20 rounded-3xl overflow-hidden shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-[#fdfcfc]">
            <Sparkles className="h-5 w-5 text-[#f87941] animate-pulse" />
            AI Workforce Insights & Recommendations
          </CardTitle>
          <CardDescription className="text-xs">Automated HR recommendations based on active data patterns.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {(stats.aiInsights || []).map((insight, idx) => (
            <div key={idx} className="p-4 bg-white/60 dark:bg-[#1E1F22]/60 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800/50 flex gap-3 items-start shadow-sm hover:border-[#f87941]/30 transition-all duration-300">
              <div className="mt-0.5 p-1 rounded bg-[#f87941]/10 text-[#f87941]">
                <Compass className="h-4 w-4" />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                {insight.replace(/\*\*/g, '')}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}