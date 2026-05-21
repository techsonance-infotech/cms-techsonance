'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Search, 
  Settings, 
  HelpCircle, 
  Bell, 
  User, 
  Users, 
  BookOpen, 
  Cpu, 
  CreditCard, 
  PlusCircle, 
  Compass, 
  Layers, 
  ArrowRight, 
  MessageSquare, 
  Clock, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { InlineTableSkeleton } from '@/components/ui/dashboard-skeleton';

interface Ticket {
  id: number;
  ticketNumber: string;
  clientId: number;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tickets?limit=100');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Ticket ID', 'Subject', 'Priority', 'Status', 'Created'];
    const rows = tickets.map(t => [
      t.ticketNumber,
      t.subject,
      t.priority,
      t.status,
      new Date(t.createdAt).toLocaleDateString()
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support_tickets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Support tickets exported to CSV!');
  };

  const handleCreateTicket = () => {
    toast.info('Opening support ticket creation form...');
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-500 text-xs tracking-wider uppercase">
          <span>Operations Hub</span>
          <span>/</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Support Portal</span>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none font-bold uppercase text-[10px]">
            System Operational
          </Badge>
        </div>
      </div>

      {/* Hero Search Section */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-8 md:p-12 text-center shadow-lg border border-slate-800">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:20px_20px]"></div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
          How can we help you today?
        </h1>
        <p className="text-indigo-200 text-sm max-w-lg mx-auto mb-8">
          Search the Knowledge Base, view recent updates, or check the status of your active support requests in real time.
        </p>
        <div className="w-full max-w-2xl mx-auto relative shadow-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-xl border-none bg-slate-900/90 text-white placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm shadow-inner" 
            placeholder="Search active tickets or type topic keywords (e.g. 'Database', 'API', 'Billing')..." 
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-indigo-300 text-xs opacity-90">
          <span className="font-semibold text-slate-400">Popular:</span>
          <a className="underline hover:text-white transition-colors" href="#kb">API Integrations</a>
          <a className="underline hover:text-white transition-colors" href="#kb">SSO Activation</a>
          <a className="underline hover:text-white transition-colors" href="#kb">Billing Cycles</a>
        </div>
      </div>

      {/* Grid: Popular Categories & Create Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Popular Categories */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Knowledge Categories</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Browse detailed articles for common troubleshooting issues.</p>
            </div>
            <a href="#kb" className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:underline">
              View All Articles
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Category: Account */}
            <Card className="group border border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Account Management</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Profile settings, user directories, permissions, and audit parameters.</p>
                </div>
              </CardContent>
            </Card>

            {/* Category: Invoices & Billing */}
            <Card className="group border border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Billing & Invoices</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Subscription plans, credit lines, payment procedures, and balance audits.</p>
                </div>
              </CardContent>
            </Card>

            {/* Category: Technical */}
            <Card className="group border border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Technical Systems</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">API integration schemas, webhook structures, server latency, and logs.</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Support Sidebar Widget */}
        <div className="lg:col-span-4">
          <Card className="border border-slate-100 dark:border-slate-800 shadow-md bg-gradient-to-b from-indigo-50/50 via-slate-50/30 to-white dark:from-slate-900 dark:to-slate-950 p-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Need specialized assistance?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Our global support engineers are available 24/7. Get dedicated guidance on complex configuration workloads.
              </p>
              <Button 
                onClick={handleCreateTicket} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Create New Ticket
              </Button>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Avg Wait Time</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> ~4 Minutes
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Escalation SLA</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> Guaranteed
                </span>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Section: Support Tickets Log */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Active Requests Docket</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Trace status logs for ongoing support interactions.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm" className="text-xs font-semibold">
              Export Docket (.CSV)
            </Button>
          </div>
        </div>

        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-slate-100 dark:border-slate-800 overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8">
                <InlineTableSkeleton rows={4} columns={5} />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <MessageSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No active support requests found.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket ID</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-white font-bold">{ticket.subject}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Category ID: {ticket.clientId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                          ticket.status === 'open' 
                            ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50' 
                            : ticket.status === 'in_progress' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                          <span className={`w-2 h-2 rounded-full ${
                            ticket.priority === 'urgent' 
                              ? 'bg-rose-500 animate-pulse' 
                              : ticket.priority === 'high' 
                                ? 'bg-amber-500' 
                                : 'bg-slate-400'
                          }`} />
                          <span className="capitalize">{ticket.priority}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">
                Showing {filteredTickets.length} of {tickets.length} total records
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

      {/* Bottom Info Modules (Academy, Marketplace, Release Notes) */}
      <div id="kb" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Nexus Academy</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Equip your staff with certified training resources, deployment webinars, and integration lessons.
            </p>
          </div>
          <a href="#" className="mt-4 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 group hover:underline">
            Start Learning
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </a>
        </Card>

        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <Compass className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Integrations Marketplace</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Connect Nexus with tools like Slack, Jira, Twilio, Salesforce, and custom telemetry agents.
            </p>
          </div>
          <a href="#" className="mt-4 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 group hover:underline">
            Explore Channels
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </a>
        </Card>

        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-bold text-slate-900 dark:text-white text-base">V4.2 Release Ledger</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Analyze custom workflows, automated pipeline builders, multi-tenant IP rotators, and SOC2 features.
            </p>
          </div>
          <a href="#" className="mt-4 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 group hover:underline">
            Read System Logs
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </a>
        </Card>

      </div>
    </div>
  );
}
