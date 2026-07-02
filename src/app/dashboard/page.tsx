'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FolderKanban, 
  DollarSign, 
  UserCog, 
  Loader2, 
  ClipboardList, 
  Calendar, 
  AlertCircle,
  Clock,
  Briefcase,
  ArrowRight,
  PlusCircle,
  FileText,
  BadgeCent,
  Settings,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  PackageOpen,
  CheckCircle2,
  ShoppingCart,
  Wallet,
  ChevronRight,
  Receipt,
  UserPlus,
  Hourglass,
  Sparkles
} from 'lucide-react';
import { getDashboardType, hasFullAccess, type UserRole } from '@/lib/permissions';
import { 
  ContentSkeleton, 
  PageHeaderSkeleton, 
  MetricCardGridSkeleton, 
  DashboardCompositeSkeleton, 
  TableSkeleton, 
  QuickActionsSkeleton 
} from '@/components/ui/dashboard-skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PerformanceCharts, FinancialRunRateChart } from '@/components/dashboard/performance-charts';
import { DashboardAnnouncements, DashboardApprovalQueue, DashboardBroadcaster } from '@/components/dashboard/dashboard-widgets';
import { PageHeader } from '@/components/ui/page-header';

interface DashboardStats {
  activeClients: number;
  activeProjects: number;
  totalRevenue: number;
  totalEmployees: number;
  monthlyRevenue: number;
  netCashFlow: number;
  pendingInvoicesCount: number;
  pendingInvoicesValue: number;
  lowStockAlertsCount: number;
  topCustomers: any[];
  recentActivity: any[];
  workforce: {
    presentToday: number;
    absentToday: number;
    missingReportsCount: number;
  };
  pendingApprovals: any[];
  recentProjects: any[];
  financialRunRate?: any[];
}

interface EmployeeDashboardStats {
  stats: {
    totalHoursMonth: number;
    totalHoursYear: number;
    totalAssignedProjects: number;
    activeProjects: number;
    assignedTasksTotal: number;
    assignedTasksDueToday: number;
  };
  performance: {
    attendanceHistory: { date: string, hours: number }[];
    reportHistory: { date: string, submitted: number }[];
    taskDistribution: { todo: number, in_progress: number, review: number, done: number };
  };
  announcements: any[];
  alerts: any[];
  pendingApprovals: any[];
  recentProjects: any[];
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
  const [employeeStats, setEmployeeStats] = useState<EmployeeDashboardStats | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchCurrentUser();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      const type = getDashboardType(currentUser.role as UserRole);
      setLoading(true);
      if (type === 'admin') {
        Promise.all([fetchAdminDashboardData(), fetchEmployeeDashboardData()]).finally(() => setLoading(false));
      } else {
        fetchEmployeeDashboardData().finally(() => setLoading(false));
      }
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('session_token');
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchEmployeeDashboardData = async () => {
    const token = localStorage.getItem('session_token');
    try {
      const response = await fetch('/api/dashboard/stats/employee', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setEmployeeStats(await response.json());
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const fetchAdminDashboardData = async () => {
    const token = localStorage.getItem('session_token');
    try {
      const response = await fetch('/api/dashboard/stats/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setAdminStats(await response.json());
      }
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
    }
  };

  if (!currentUser) return null;

  const dashboardType = getDashboardType(currentUser.role as UserRole);

  if (loading || !currentUser) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <MetricCardGridSkeleton count={dashboardType === 'employee' ? 5 : 4} />
        <div className="mt-8">
          <DashboardCompositeSkeleton />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">
          <div className="lg:col-span-4 italic">
            <TableSkeleton rows={5} columns={2} />
          </div>
          <div className="lg:col-span-3">
            <QuickActionsSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }

  if (dashboardType === 'employee') {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={`Welcome back, ${currentUser.firstName}!`}
          description="Here is an overview of your work and productivity metrics."
          breadcrumbs={[{ label: 'Dashboard' }]}
        />

        {employeeStats && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Card className="overflow-hidden border-none shadow-md bg-brand-gradient text-white">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold opacity-90 uppercase tracking-wider">Hours Month</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-black">{employeeStats.stats.totalHoursMonth ?? 0}h</div>
                <p className="text-[10px] opacity-75 mt-0.5 font-medium">Productive logged</p>
                <div className="absolute right-4 bottom-4 p-2 bg-white/10 backdrop-blur-md rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card text-card-foreground shadow-xs">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hours Year</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-black text-foreground">{employeeStats.stats.totalHoursYear ?? 0}h</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Annual total logged</p>
                <div className="absolute right-4 bottom-4 p-2 bg-secondary rounded-lg text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card text-card-foreground shadow-xs">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Projects</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-black text-foreground">{employeeStats.stats.activeProjects ?? 0}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium font-medium">Currently active</p>
                <div className="absolute right-4 bottom-4 p-2 bg-accent-cyan/10 rounded-lg text-primary-dark dark:text-accent-cyan">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card text-card-foreground shadow-xs">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Assigned</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-black text-foreground">{employeeStats.stats.totalAssignedProjects ?? 0}</div>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Lifetime projects</p>
                <div className="absolute right-4 bottom-4 p-2 bg-secondary rounded-lg text-primary">
                  <Briefcase className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border border-border bg-card text-card-foreground shadow-xs">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned To Me</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-baseline gap-1">
                  <div className="text-3xl font-black text-foreground">{employeeStats.stats.assignedTasksTotal ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">total</div>
                </div>
                <p className="text-[10px] font-bold mt-1 text-destructive bg-destructive/10 px-2 py-0.5 rounded-full inline-block">
                  {employeeStats.stats.assignedTasksDueToday ?? 0} due today
                </p>
                <div className="absolute right-4 bottom-4 p-2 bg-destructive/10 rounded-lg text-destructive">
                  <ClipboardList className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {employeeStats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PerformanceCharts data={employeeStats.performance} />
            </div>
            <div className="space-y-6">
              <DashboardAnnouncements 
                announcements={employeeStats.announcements} 
                alerts={employeeStats.alerts} 
              />
              {employeeStats.pendingApprovals && employeeStats.pendingApprovals.length > 0 && (
                <DashboardApprovalQueue items={employeeStats.pendingApprovals} />
              )}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4 bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your latest project assignments</CardDescription>
              </div>
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm" className="text-[#f87941] hover:text-[#f87941]/90">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {employeeStats?.recentProjects && employeeStats.recentProjects.length > 0 ? (
                  employeeStats.recentProjects.map((project: any) => (
                    <div key={project.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          project.status === 'completed' ? 'bg-green-100 text-green-700' :
                          project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{project.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {project.status.replace('_', ' ')} • {project.priority} priority
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Assigned on</p>
                        <p className="text-sm font-medium">{new Date(project.assignedAt || project.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No projects assigned yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Shortcuts to internal modules</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <Link href="/dashboard/daily-update" className="group">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed hover:border-solid hover:border-[#f87941] hover:bg-[#e6e4e6]/10 transition-all">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 group-hover:bg-[#f87941]/10 group-hover:text-[#f87941] transition-all">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Daily Updates</p>
                    <p className="text-xs text-muted-foreground">Report your progress</p>
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/attendance" className="group">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed hover:border-solid hover:border-[#f87941] hover:bg-[#e6e4e6]/10 transition-all">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 group-hover:bg-[#f87941]/10 group-hover:text-[#f87941] transition-all">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Attendance</p>
                    <p className="text-xs text-muted-foreground">Log your shift hours</p>
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/reimbursements" className="group">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed hover:border-solid hover:border-[#f87941] hover:bg-[#e6e4e6]/10 transition-all">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 group-hover:bg-[#f87941]/10 group-hover:text-[#f87941] transition-all">
                    <BadgeCent className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Reimbursement</p>
                    <p className="text-xs text-muted-foreground">Claim your expenses</p>
                  </div>
                </div>
              </Link>
              <Link href="/dashboard/help-desk" className="group">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed hover:border-solid hover:border-[#f87941] hover:bg-[#e6e4e6]/10 transition-all">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 group-hover:bg-[#f87941]/10 group-hover:text-[#f87941] transition-all">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Support</p>
                    <p className="text-xs text-muted-foreground">Open a help ticket</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const runRate = adminStats?.financialRunRate || [];
  const lastMonthData = runRate[runRate.length - 2] || { revenue: 0, expenses: 0 };

  const revenueTrend = lastMonthData.revenue > 0 
    ? (((adminStats?.monthlyRevenue ?? 0) - lastMonthData.revenue) / lastMonthData.revenue) * 100
    : 0;

  const lastMonthCashFlow = lastMonthData.revenue - lastMonthData.expenses;
  const currentCashFlow = adminStats?.netCashFlow ?? 0;
  const cashFlowTrend = lastMonthCashFlow !== 0
    ? ((currentCashFlow - lastMonthCashFlow) / Math.abs(lastMonthCashFlow)) * 100
    : 0;

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Morning';
    if (hr < 17) return 'Afternoon';
    return 'Evening';
  };

  const statCards = [
    {
      title: 'Monthly Revenue',
      value: `₹${(adminStats?.monthlyRevenue ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-900/30',
      trend: {
        value: `${Math.abs(revenueTrend).toFixed(1)}%`,
        isPositive: revenueTrend >= 0,
        show: lastMonthData.revenue > 0,
        className: revenueTrend >= 0 
          ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' 
          : 'text-rose-600 dark:text-rose-500 bg-rose-50/50 dark:bg-rose-900/10'
      },
      description: 'Accrued billings in current cycle',
      gradient: 'from-indigo-500 to-purple-600',
      stripeColor: 'from-indigo-500 to-purple-600',
      extraDetail: 'Target: ₹5,00,000',
      detailLink: '/dashboard/finance/invoices'
    },
    {
      title: 'Net Cash Flow',
      value: `₹${(adminStats?.netCashFlow ?? 0).toLocaleString()}`,
      icon: Wallet,
      iconColor: (adminStats?.netCashFlow ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500',
      iconBg: (adminStats?.netCashFlow ?? 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/30',
      trend: {
        value: `${Math.abs(cashFlowTrend).toFixed(1)}%`,
        isPositive: cashFlowTrend >= 0,
        show: lastMonthCashFlow !== 0,
        className: cashFlowTrend >= 0 
          ? 'text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' 
          : 'text-rose-600 dark:text-rose-500 bg-rose-50/50 dark:bg-rose-900/10'
      },
      description: 'Inflow minus outflow margin',
      gradient: (adminStats?.netCashFlow ?? 0) >= 0 ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600',
      stripeColor: (adminStats?.netCashFlow ?? 0) >= 0 ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600',
      extraDetail: 'Updated in real-time',
      detailLink: '/dashboard/reimbursements'
    },
    {
      title: 'Pending Invoices',
      value: `₹${(adminStats?.pendingInvoicesValue ?? 0).toLocaleString()}`,
      icon: Hourglass,
      iconColor: 'text-amber-600 dark:text-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-900/30',
      trend: {
        value: `${adminStats?.pendingInvoicesCount ?? 0} Items`,
        isPositive: true,
        show: true,
        className: 'text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
      },
      description: 'Awaiting client settlement',
      gradient: 'from-amber-500 to-orange-600',
      stripeColor: 'from-amber-500 to-orange-600',
      extraDetail: `${adminStats?.pendingInvoicesCount ?? 0} invoices unpaid`,
      detailLink: '/dashboard/finance/invoices'
    },
    {
      title: 'Active Customers',
      value: adminStats?.activeClients ?? 0,
      icon: Users,
      iconColor: 'text-sky-600 dark:text-sky-500',
      iconBg: 'bg-sky-50 dark:bg-sky-900/30',
      trend: {
        value: 'Active',
        isPositive: true,
        show: true,
        className: 'text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
      },
      description: 'Engaged clients in system',
      gradient: 'from-sky-500 to-blue-600',
      stripeColor: 'from-sky-500 to-blue-600',
      extraDetail: '100% retention rate',
      detailLink: '/dashboard/clients'
    }
  ];

  return (
    <div className="space-y-6">
      {/* C-Suite Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#2f3035] p-6 text-[#fdfcfc] shadow-sm border border-[#e6e4e6]/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-[#f87941]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#e6e4e6]/80">Global Executive Cockpit</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#fdfcfc]">
              {getGreeting()}, {currentUser.firstName}
            </h1>
            <p className="text-sm text-[#e6e4e6]/70 mt-1">Cross-vertical tenant metrics, forecasting yield runs, and operational status dashboards.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/finance/invoices">
              <Button variant="outline" className="border-[#e6e4e6]/20 bg-[#2f3035] text-[#fdfcfc] hover:bg-[#e6e4e6]/10 hover:text-[#fdfcfc] gap-2 font-semibold transition-all">
                <Receipt className="h-4 w-4" /> Create Invoice
              </Button>
            </Link>
            <Link href="/dashboard/reimbursements">
              <Button variant="outline" className="border-[#e6e4e6]/20 bg-[#2f3035] text-[#fdfcfc] hover:bg-[#e6e4e6]/10 hover:text-[#fdfcfc] gap-2 font-semibold transition-all">
                <Wallet className="h-4 w-4" /> Add Expense
              </Button>
            </Link>
            <Link href="/dashboard/clients">
              <Button className="gap-2 font-semibold bg-[#f87941] text-[#fdfcfc] hover:bg-[#f87941]/90 transition-all border-none shadow-sm">
                <UserPlus className="h-4 w-4" /> New Customer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {adminStats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link href={stat.detailLink} key={stat.title} className="group block relative overflow-hidden bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
                  {/* Accent stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#f87941]" />
                  
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-xl ${stat.iconBg} ${stat.iconColor} transition-transform group-hover:scale-110 duration-300`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      {stat.trend.show ? (
                        <span className={`text-[10px] font-extrabold flex items-center gap-1 px-2 py-0.5 rounded-full ${stat.trend.className}`}>
                          {stat.title !== 'Pending Invoices' && stat.title !== 'Active Customers' && (
                            stat.trend.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                          {stat.trend.value}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground bg-slate-100/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full">
                          Stable
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                      <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-[#f87941] transition-colors">
                        {stat.value}
                      </h3>
                      <p className="text-[11px] font-medium text-muted-foreground/80 mt-1 leading-relaxed">
                        {stat.description}
                      </p>
                    </div>

                    {/* Progress representation or bottom footer line */}
                    <div className="mt-4 pt-3 border-t border-slate-100/50 dark:border-zinc-800/50 flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                      <span>{stat.extraDetail}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#f87941] dark:text-[#f87941] flex items-center gap-0.5">
                        Details <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
            {/* Left Side: Financial Run Rate Chart & Recent Activity */}
            <div className="lg:col-span-8 space-y-6">
              {adminStats.financialRunRate && (
                <Card className="bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-[#f87941]" />
                  <FinancialRunRateChart data={adminStats.financialRunRate} />
                </Card>
              )}

              {/* AI Predictive Operations Insight Engine */}
              <Card className="bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
                <CardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#f87941]" />
                        AI Predictive Operations Insight Engine
                      </CardTitle>
                      <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">Forward predictive yield runs and capacity allocation insights</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-[#f9b095]/15 text-[#f87941] font-semibold border-none text-[10px]">
                      Cycle Yield: +18.4%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                      <p className="text-xs font-bold text-[#f87941]">CRM Conversion Pipeline</p>
                      <p className="text-lg font-black mt-1">94% Target Met</p>
                      <Progress value={94} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" />
                      <p className="text-[10px] text-muted-foreground mt-2">AI projects $1.4M pipeline close in 30 days</p>
                    </div>

                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                      <p className="text-xs font-bold text-[#f87941]">Facility Occupancy Peak</p>
                      <p className="text-lg font-black mt-1">17:00 - 19:00 Load</p>
                      <Progress value={78} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" />
                      <p className="text-[10px] text-muted-foreground mt-2">Alert: Telemetry indicators predict load surge risk</p>
                    </div>

                    <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                      <p className="text-xs font-bold text-emerald-600">Reimbursement Compliance</p>
                      <p className="text-lg font-black mt-1">0 Audits Flagged</p>
                      <Progress value={100} className="h-1.5 mt-2 bg-slate-100 dark:bg-slate-800" />
                      <p className="text-[10px] text-muted-foreground mt-2">100% compliance rate on batch audits</p>
                    </div>
                  </div>

                  {/* Recommendation Card */}
                  <div className="p-4 border border-[#e6e4e6]/30 bg-[#e6e4e6]/10 rounded-xl dark:border-[#2f3035]/30 dark:bg-[#2f3035]/25 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-[#f87941] dark:text-[#f87941] mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-[#2f3035] dark:text-[#fdfcfc]">Recommended Executive Operations Adjustment</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Shift technician coverage schedules towards Downtown Hub Sector A to mitigate peak SLAs delays as indicated by the Field Service Command logs. This adjustment is projected to raise Q3 First-Time Fix rates to a perfect 96.5%.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Table */}
              <Card className="bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                    <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">Latest transactions and activities across all departments</CardDescription>
                  </div>
                  <Link href="/dashboard/invoices">
                    <Button variant="link" className="text-[#f87941] dark:text-[#f87941] font-semibold p-0 h-auto">View Invoices</Button>
                  </Link>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-zinc-800">
                        <th className="pb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction / Activity</th>
                        <th className="pb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40">
                      {adminStats.recentActivity && adminStats.recentActivity.length > 0 ? (
                        adminStats.recentActivity.map((item: any) => {
                          let Icon = Clock;
                          let iconColor = 'text-slate-600 dark:text-slate-400';
                          let iconBg = 'bg-slate-50 dark:bg-slate-900/50';

                          if (item.type === 'invoice') {
                            Icon = Receipt;
                            iconColor = 'text-indigo-600 dark:text-indigo-400';
                            iconBg = 'bg-indigo-50 dark:bg-indigo-900/30';
                          } else if (item.type === 'reimbursement') {
                            Icon = Wallet;
                            iconColor = 'text-rose-600 dark:text-rose-400';
                            iconBg = 'bg-rose-50 dark:bg-rose-900/30';
                          } else if (item.type === 'project') {
                            Icon = FolderKanban;
                            iconColor = 'text-sky-600 dark:text-sky-400';
                            iconBg = 'bg-sky-50 dark:bg-sky-900/30';
                          }

                          return (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg shrink-0 ${iconBg} ${iconColor}`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</p>
                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{item.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-bold text-xs uppercase">
                                  {item.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="py-4 text-xs font-medium text-muted-foreground">
                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-4 text-right font-bold text-sm text-slate-900 dark:text-white">
                                {item.amount !== undefined ? `₹${item.amount.toLocaleString()}` : '—'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                            No recent activity found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Critical Actions, Top Customers, Workforce Hub */}
            <div className="lg:col-span-4 space-y-6">
              {/* Critical Actions */}
              <Card className="bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-bold">Critical Actions</CardTitle>
                  <Badge variant="destructive" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-none font-black tracking-wider text-[10px]">
                    HIGH PRIORITY
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Unpaid Invoices Alert */}
                  {adminStats.pendingInvoicesCount > 0 && (
                    <Link href="/dashboard/invoices" className="block">
                      <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 hover:border-[#f87941] dark:hover:border-[#f87941] transition-all group cursor-pointer">
                        <div className="w-10 h-10 shrink-0 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center rounded-lg">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="grow">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">Unpaid Invoices</h5>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {adminStats.pendingInvoicesCount} invoices pending (₹{(adminStats.pendingInvoicesValue).toLocaleString()})
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#f87941] dark:group-hover:text-[#f87941] self-center transition-colors" />
                      </div>
                    </Link>
                  )}

                  {/* Low Stock Alerts */}
                  {adminStats.lowStockAlertsCount > 0 && (
                    <Link href="/dashboard/procurement" className="block">
                      <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 hover:border-[#f87941] dark:hover:border-[#f87941] transition-all group cursor-pointer">
                        <div className="w-10 h-10 shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center rounded-lg">
                          <PackageOpen className="h-5 w-5" />
                        </div>
                        <div className="grow">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">Procurement Pending</h5>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {adminStats.lowStockAlertsCount} pending purchase requests.
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#f87941] dark:group-hover:text-[#f87941] self-center transition-colors" />
                      </div>
                    </Link>
                  )}

                  {/* Pending Approvals */}
                  {adminStats.pendingApprovals && adminStats.pendingApprovals.length > 0 && (
                    <Link href="/dashboard/reimbursements" className="block">
                      <div className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/80 hover:border-[#f87941] dark:hover:border-[#f87941] transition-all group cursor-pointer">
                        <div className="w-10 h-10 shrink-0 bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400 flex items-center justify-center rounded-lg">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <div className="grow">
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">Approvals Pending</h5>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {adminStats.pendingApprovals.length} requests awaiting reviews.
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#f87941] dark:group-hover:text-[#f87941] self-center transition-colors" />
                      </div>
                    </Link>
                  )}

                  {adminStats.pendingInvoicesCount === 0 && adminStats.lowStockAlertsCount === 0 && (!adminStats.pendingApprovals || adminStats.pendingApprovals.length === 0) && (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No high-priority critical actions currently required.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card className="bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg font-bold">Top Customers</CardTitle>
                  <Link href="/dashboard/clients">
                    <Button variant="ghost" size="sm" className="font-semibold text-xs text-[#f87941] hover:text-[#f87941]/90">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-6">
                  {adminStats.topCustomers && adminStats.topCustomers.length > 0 ? (
                    adminStats.topCustomers.map((customer: any, idx: number) => {
                      const colors = [
                        'text-[#f87941] bg-[#f87941]/10',
                        'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
                        'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
                        'text-amber-600 bg-amber-50 dark:bg-amber-950/20'
                      ];
                      const initials = (customer.companyName || 'C').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                      const circleClass = `h-10 w-10 rounded-full flex items-center justify-center font-semibold text-xs border border-transparent ${colors[idx % colors.length]}`;

                      return (
                        <div key={customer.id || idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={circleClass}>
                              {initials}
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[120px]">{customer.companyName}</h5>
                              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                {customer.invoiceCount} invoices • {customer.industry || 'Business'}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            ₹{customer.revenue.toLocaleString()}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      No client revenue computed yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Workforce Hub */}
              <Card className="bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-[#f87941]" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#f87941]" />
                    Workforce Hub
                  </CardTitle>
                  <CardDescription>Today's attendance and compliance overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Present Today</p>
                      <p className="text-xs text-muted-foreground">Checked into the system</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-600">{adminStats.workforce?.presentToday || 0}</span>
                      <span className="text-sm text-muted-foreground">/ {adminStats.totalEmployees || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Absent / On Leave</p>
                      <p className="text-xs text-muted-foreground">Not logged in today</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-rose-500">{adminStats.workforce?.absentToday || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none flex items-center gap-1">
                        Missing Daily Updates 
                        {adminStats.workforce?.missingReportsCount > 0 && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse ml-1" />}
                      </p>
                      <p className="text-xs text-muted-foreground">From the previous business day</p>
                    </div>
                    <div className="text-xl font-bold text-amber-600">{adminStats.workforce?.missingReportsCount || 0}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Broadcaster */}
              <DashboardBroadcaster />
            </div>
          </div>

          {/* Management Actions Shortcuts Grid */}
          <Card className="bg-card border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-sm">
            <CardHeader>
              <CardTitle>Management Actions</CardTitle>
              <CardDescription>Direct shortcuts to resources</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/projects">
                <Button variant="outline" className="w-full justify-start py-6 h-auto hover:bg-[#e6e4e6]/10 hover:border-[#f87941] hover:text-[#f87941] transition-all">
                  <FolderKanban className="mr-4 h-5 w-5 opacity-60 text-[#f87941]" />
                  <div className="text-left">
                    <p className="font-semibold">Projects</p>
                    <p className="text-[10px] text-muted-foreground">Kanban & Tasks</p>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/clients">
                <Button variant="outline" className="w-full justify-start py-6 h-auto hover:bg-[#e6e4e6]/10 hover:border-[#f87941] hover:text-[#f87941] transition-all">
                  <Users className="mr-4 h-5 w-5 opacity-60 text-[#f87941]" />
                  <div className="text-left">
                    <p className="font-semibold">Clients</p>
                    <p className="text-[10px] text-muted-foreground">Directory</p>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/team">
                <Button variant="outline" className="w-full justify-start py-6 h-auto hover:bg-[#e6e4e6]/10 hover:border-[#f87941] hover:text-[#f87941] transition-all">
                  <UserCog className="mr-4 h-5 w-5 opacity-60 text-[#f87941]" />
                  <div className="text-left">
                    <p className="font-semibold">Team</p>
                    <p className="text-[10px] text-muted-foreground">Roster</p>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/reimbursements">
                <Button variant="outline" className="w-full justify-start py-6 h-auto hover:bg-[#e6e4e6]/10 hover:border-[#f87941] hover:text-[#f87941] transition-all">
                  <BadgeCent className="mr-4 h-5 w-5 opacity-60 text-[#f87941]" />
                  <div className="text-left">
                    <p className="font-semibold">Claims</p>
                    <p className="text-[10px] text-muted-foreground">Approvals</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}

      {employeeStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12 pt-12 border-t border-white/5">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Personal Workspace</h3>
                <p className="text-muted-foreground">Your assigned tasks and individual performance metrics.</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Due Today</span>
                  <span className="text-2xl font-black text-rose-500">{employeeStats.stats.assignedTasksDueToday}</span>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Tasks</span>
                  <span className="text-2xl font-black">{employeeStats.stats.assignedTasksTotal}</span>
                </div>
              </div>
            </div>
            <PerformanceCharts data={employeeStats.performance} />
          </div>
          <div className="space-y-6">
            <DashboardAnnouncements 
              announcements={employeeStats.announcements} 
              alerts={employeeStats.alerts} 
            />
            {employeeStats.pendingApprovals && employeeStats.pendingApprovals.length > 0 && (
              <DashboardApprovalQueue items={employeeStats.pendingApprovals} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components as local items for centralization
// Using @/components/ui/button now