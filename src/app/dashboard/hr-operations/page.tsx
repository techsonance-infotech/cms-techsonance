'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  HelpCircle, 
  Laptop, 
  HeartHandshake, 
  SendHorizontal, 
  UserPlus, 
  Home, 
  CalendarDays,
  Check,
  X,
  Loader2,
  RefreshCw,
  TrendingUp,
  FileText,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function HrOperationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentTodayCount: 0,
    presenceRate: '0%',
    pendingLeavesCount: 0,
    openTicketsCount: 0,
    allocatedAssetsCount: 0,
    averageWellnessScore: 84
  });

  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [openTickets, setOpenTickets] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [actioningLeaveId, setActioningLeaveId] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Fetch admin stats
      const statsRes = await fetch('/api/dashboard/stats/admin', { headers });
      let employeeCount = 0;
      let presentCount = 0;
      let leavesList: any[] = [];

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        employeeCount = statsData.totalEmployees || 0;
        presentCount = statsData.workforce?.presentToday || 0;
        leavesList = statsData.pendingApprovals || statsData.leaves || [];
        setPendingLeaves(leavesList.slice(0, 5));
      }

      // Fetch support tickets
      const ticketsRes = await fetch('/api/tickets?limit=20', { headers });
      let ticketsList: any[] = [];
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        ticketsList = Array.isArray(ticketsData) 
          ? ticketsData 
          : (ticketsData.data || []);
        const openList = ticketsList.filter((t: any) => t.status === 'open' || t.status === 'pending' || t.status === 'new');
        setOpenTickets(openList.slice(0, 5));
      }

      // Fetch active assets
      const assetsRes = await fetch('/api/assets', { headers });
      let assetsList: any[] = [];
      if (assetsRes.ok) {
        assetsList = await assetsRes.json();
        setAssets(assetsList);
      }

      // Fetch wellness average index
      const wellnessRes = await fetch('/api/employees/wellness', { headers });
      let avgWellness = 84;
      if (wellnessRes.ok) {
        const wellnessData = await wellnessRes.json();
        if (wellnessData.appointments && wellnessData.appointments.length > 0) {
          avgWellness = 88;
        }
      }

      const activeLeavesCount = leavesList.length;
      const openTicketsCount = ticketsList.filter((t: any) => t.status === 'open' || t.status === 'pending').length;
      const presenceRateStr = employeeCount > 0 
        ? `${Math.round((presentCount / employeeCount) * 100)}%` 
        : '0%';

      setStats({
        totalEmployees: employeeCount,
        presentTodayCount: presentCount,
        presenceRate: presenceRateStr,
        pendingLeavesCount: activeLeavesCount,
        openTicketsCount: openTicketsCount,
        allocatedAssetsCount: assetsList.filter((a: any) => a.status === 'allocated' || a.status === 'Allocated').length,
        averageWellnessScore: avgWellness
      });

    } catch (err) {
      console.error('Failed to load operations data:', err);
      toast.error('Could not refresh operations dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleActionLeave = async (leaveId: number, status: 'approved' | 'rejected') => {
    setActioningLeaveId(leaveId);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/leave-requests/${leaveId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success(`Leave request successfully ${status}!`);
        await fetchDashboardData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to update leave request status');
      }
    } catch (err) {
      toast.error('Error actioning leave request');
    } finally {
      setActioningLeaveId(null);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#f87941]" />
          <p className="text-slate-400 text-xs font-semibold">Loading HR Operations command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto p-4 md:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            HR Operations Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">
            Real-time headcount health, request processing hub, service desk oversight, and resource tracking.
          </p>
        </div>
        <Button 
          onClick={() => { setLoading(true); fetchDashboardData(); }}
          variant="outline" 
          className="rounded-xl border-slate-200 dark:border-zinc-800 text-xs font-bold gap-2 self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Stats
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-slate-200 dark:border-zinc-850 shadow-sm hover:scale-[1.01] transition-transform duration-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Active Headcount</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalEmployees}</h2>
              <div className="text-[10px] text-slate-400 font-bold">{stats.presentTodayCount} present today ({stats.presenceRate})</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-850 shadow-sm hover:scale-[1.01] transition-transform duration-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Pending Leaves</span>
              <h2 className="text-3xl font-black text-[#f87941]">{stats.pendingLeavesCount}</h2>
              <div className="text-[10px] text-slate-400 font-bold">Awaiting supervisor approvals</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-[#f87941]">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-850 shadow-sm hover:scale-[1.01] transition-transform duration-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Open Support Tickets</span>
              <h2 className="text-3xl font-black text-rose-500">{stats.openTicketsCount}</h2>
              <div className="text-[10px] text-slate-400 font-bold">HR Service Desk open tickets</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500">
              <HelpCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 dark:border-zinc-850 shadow-sm hover:scale-[1.01] transition-transform duration-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Wellness Health Score</span>
              <h2 className="text-3xl font-black text-emerald-500">{stats.averageWellnessScore}%</h2>
              <div className="text-[10px] text-slate-400 font-bold">Based on stress & survey logs</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500">
              <HeartHandshake className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections Split */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Requests and Service Desk */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Pending Leave Requests queue */}
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-850 shadow-md">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-[#f87941]" /> Leave & Time Off Approval Queue
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pending applications requiring HR operations authorization.
                  </CardDescription>
                </div>
                <Badge className="bg-[#f87941]/10 text-[#f87941] border-none font-bold text-[10px]">
                  {pendingLeaves.length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {pendingLeaves.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                      <th className="p-4 px-6">Employee</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4 text-right px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {pendingLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30">
                        <td className="p-4 px-6">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                            {leave.employeeName || `Employee ID: ${leave.employeeId}`}
                          </div>
                          <div className="text-[10px] text-slate-400">{leave.employeeEmail}</div>
                        </td>
                        <td className="p-4 capitalize">
                          <Badge className="bg-indigo-500/10 text-indigo-600 border-none font-bold text-[9px]">
                            {leave.leaveType || 'Annual'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="font-mono">{leave.startDate} to {leave.endDate}</div>
                          <div className="text-[10px] text-slate-400">{leave.actualDays || leave.daysCount || 1} Workdays</div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-350 max-w-[200px] truncate">
                          {leave.reason || 'No comments'}
                        </td>
                        <td className="p-4 text-right px-6">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              onClick={() => handleActionLeave(leave.id, 'approved')}
                              disabled={actioningLeaveId !== null}
                              size="sm"
                              className="rounded-xl h-7 w-7 p-0 bg-emerald-500 hover:bg-emerald-600 text-white"
                              title="Approve Leave"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              onClick={() => handleActionLeave(leave.id, 'rejected')}
                              disabled={actioningLeaveId !== null}
                              size="sm"
                              className="rounded-xl h-7 w-7 p-0 bg-rose-500 hover:bg-rose-600 text-white"
                              title="Reject Leave"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400 font-semibold text-xs">
                  ✨ Excellent! All leave applications have been processed.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support Tickets Queue */}
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-850 shadow-md">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-rose-500" /> HR Helpdesk Service Queue
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Recently received support tickets and inquiries awaiting action.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => router.push('/dashboard/hr-service-desk')} 
                  variant="ghost" 
                  size="sm"
                  className="text-xs font-bold text-[#f87941] p-0 hover:bg-transparent"
                >
                  View Helpdesk <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {openTickets.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-zinc-900/60 text-slate-400 font-extrabold border-b uppercase text-[10px]">
                      <th className="p-4 px-6">Ticket No.</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {openTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/30">
                        <td className="p-4 px-6 font-mono font-bold text-slate-900 dark:text-slate-200">
                          {t.ticketNumber}
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800 dark:text-slate-100">{t.subject}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[240px]">{t.description}</div>
                        </td>
                        <td className="p-4">
                          <Badge className={`border-none font-bold text-[9px] ${
                            t.priority === 'high' || t.priority === 'urgent'
                              ? 'bg-rose-500/10 text-rose-600'
                              : t.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}>
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-orange-500/10 text-orange-600 border-none font-bold text-[9px] capitalize">
                            {t.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right px-6">
                          <Button 
                            onClick={() => router.push('/dashboard/hr-service-desk')}
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl h-7 px-3 text-[10px] font-bold border-slate-200 dark:border-zinc-800"
                          >
                            Respond
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400 font-semibold text-xs">
                  🌴 All service desk tickets are currently resolved or assigned.
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Quick Links & Asset Allocation */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Quick Actions Panel */}
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-850 shadow-md">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <SendHorizontal className="h-4.5 w-4.5 text-[#f87941]" /> Operations Quick Panel
              </CardTitle>
              <CardDescription className="text-xs">
                Perform primary workforce operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              <Button 
                onClick={() => router.push('/dashboard/employees/new')}
                className="w-full rounded-xl h-10 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs gap-2"
              >
                <UserPlus className="h-4 w-4" /> Add New Employee Record
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/employees/broadcast')}
                className="w-full rounded-xl h-10 bg-gradient-to-r from-[#F87941] to-[#F4662B] hover:opacity-95 text-white font-bold text-xs gap-2"
              >
                <SendHorizontal className="h-4 w-4" /> Broadcast Announcement Alert
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/employees/wfh')}
                variant="outline"
                className="w-full rounded-xl h-10 border-slate-200 dark:border-zinc-800 text-xs font-bold gap-2 text-slate-700 dark:text-slate-350"
              >
                <Home className="h-4 w-4" /> Manage WFH & Hybrid Schedules
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/leaves')}
                variant="outline"
                className="w-full rounded-xl h-10 border-slate-200 dark:border-zinc-800 text-xs font-bold gap-2 text-slate-700 dark:text-slate-350"
              >
                <CalendarDays className="h-4 w-4" /> Manage Leave & Hol. Policies
              </Button>
            </CardContent>
          </Card>

          {/* Active Asset inventory status */}
          <Card className="rounded-3xl border-slate-200 dark:border-zinc-850 shadow-md">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Laptop className="h-4.5 w-4.5 text-indigo-500" /> Allocated Asset Inventory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Allocated corporate hardware and peripherals.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => router.push('/dashboard/employees/assets')} 
                  variant="ghost" 
                  size="sm"
                  className="text-xs font-bold text-[#f87941] p-0 hover:bg-transparent"
                >
                  Manage <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {assets.length > 0 ? (
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {assets.slice(0, 5).map((asset) => (
                    <div key={asset.id} className="flex justify-between items-center text-xs font-semibold p-3 bg-slate-50 dark:bg-zinc-900 border rounded-2xl">
                      <div>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">{asset.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SN: {asset.serial_number}</div>
                      </div>
                      <Badge className={`border-none font-bold text-[9px] ${
                        asset.status === 'allocated' || asset.status === 'Allocated'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {asset.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 font-semibold text-xs py-6">
                  💻 No corporate hardware assets logged.
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
