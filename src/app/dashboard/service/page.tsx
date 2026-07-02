'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Ticket, Activity, Plus, Search, Tag, Users, ShieldAlert, 
  Sparkles, Loader2, Wrench, Laptop, Star, StarHalf, Play, CheckCircle, Clock 
} from 'lucide-react';
import { toast } from 'sonner';

interface TicketRecord {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  created_at: string;
  assigned_to?: {
    email: string;
    first_name: string;
    last_name: string;
  } | null;
}

export default function ServiceTicketsPage() {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('support');
  const [newPriority, setNewPriority] = useState('medium');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/service/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      toast.error('Failed to retrieve service tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/service/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          type: newType,
          priority: newPriority,
        }),
      });

      if (res.ok) {
        toast.success('Support ticket created successfully!');
        setNewTitle('');
        setNewDesc('');
        setIsDialogOpen(false);
        await fetchTickets();
      } else {
        toast.error('Failed to submit ticket');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold uppercase text-[9px] py-0.5 px-2.5 rounded">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none font-bold uppercase text-[9px] py-0.5 px-2.5 rounded">High</Badge>;
      case 'medium':
        return <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[9px] py-0.5 px-2.5 rounded">Medium</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-none font-bold uppercase text-[9px] py-0.5 px-2.5 rounded">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold uppercase text-[9px] py-0.5 px-2.5 rounded">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-bold uppercase text-[9px] py-0.5 px-2.5 rounded">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-none font-bold uppercase text-[9px] py-0.5 px-2.5 rounded">Resolved</Badge>;
      default:
        return <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-none font-bold uppercase text-[9px] py-0.5 px-2.5 rounded">Closed</Badge>;
    }
  };

  // Filter Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                          t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || t.priority.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate Metrics
  const openCount = tickets.filter(t => t.status === 'open').length;
  const progressCount = tickets.filter(t => t.status === 'in_progress').length;
  const criticalCount = tickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 p-1">
      
      {/* Page Header / Workshop Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1.5">
            <Wrench className="h-4 w-4 text-primary" />
            <span>Enterprise Workshop Commands</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Computer Repair &amp; Service Command Center</h1>
          <p className="text-sm text-muted-foreground font-medium">Manage repair tickets, inventory levels, and active workshop diagnostics queue.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:opacity-90 text-white font-bold flex items-center gap-2 shadow-md shadow-primary/10">
              <Plus className="h-4 w-4" />
              File Repair Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Sparkles className="h-5 w-5 text-primary" />
                Submit Support / Repair Request
              </DialogTitle>
              <DialogDescription>Register customer service queries or engineering diagnostics orders.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase">Issue Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Server downtime, MacBook screen replacement"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-bold text-muted-foreground uppercase">Detailed Description</Label>
                <Input
                  id="desc"
                  placeholder="Provide precise details of device malfunction..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-bold text-muted-foreground uppercase">Device Category</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger id="type" className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Laptop / Notebook</SelectItem>
                      <SelectItem value="bug">Desktop Workstation</SelectItem>
                      <SelectItem value="feature">Smart Phone / Tablet</SelectItem>
                      <SelectItem value="maintenance">Network Hardware</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-xs font-bold text-muted-foreground uppercase">Priority Status</Label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger id="priority" className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low priority</SelectItem>
                      <SelectItem value="medium">Medium priority</SelectItem>
                      <SelectItem value="high">High priority</SelectItem>
                      <SelectItem value="critical">Critical Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="text-xs font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-primary text-white text-xs font-bold">
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Order
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Section */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-slate-150 dark:border-slate-800 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Tickets</p>
              <h3 className="text-xl font-black mt-0.5">{tickets.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-150 dark:border-slate-800 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Open Queue</p>
              <h3 className="text-xl font-black mt-0.5">{openCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-150 dark:border-slate-800 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">In Diagnostics</p>
              <h3 className="text-xl font-black mt-0.5">{progressCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-150 dark:border-slate-800 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Critical Actions</p>
              <h3 className="text-xl font-black mt-0.5">{criticalCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asymmetric Revenue & Parts bento */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Service Revenue chart component */}
        <Card className="col-span-12 lg:col-span-8 border-slate-150 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wrench className="h-4.5 w-4.5 text-primary" />
                Service Revenue Analytics
              </CardTitle>
              <CardDescription>Labor fees vs. spare parts replacement earnings (trailing 30 days).</CardDescription>
            </div>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-none text-[9px] py-1 px-3 rounded">
              Monthly Reports
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-40 flex items-end gap-3 px-2">
              <div className="flex-1 flex flex-col gap-1 items-center group">
                <div className="w-full bg-primary rounded-t-md h-28 group-hover:opacity-90 transition-opacity"></div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-b-md h-12 group-hover:opacity-90 transition-opacity"></div>
                <span className="text-[10px] text-muted-foreground font-bold mt-2">Week 1</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center group">
                <div className="w-full bg-primary rounded-t-md h-36 group-hover:opacity-90 transition-opacity"></div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-b-md h-8 group-hover:opacity-90 transition-opacity"></div>
                <span className="text-[10px] text-muted-foreground font-bold mt-2">Week 2</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center group">
                <div className="w-full bg-primary rounded-t-md h-24 group-hover:opacity-90 transition-opacity"></div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-b-md h-16 group-hover:opacity-90 transition-opacity"></div>
                <span className="text-[10px] text-muted-foreground font-bold mt-2">Week 3</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center group">
                <div className="w-full bg-primary rounded-t-md h-40 group-hover:opacity-90 transition-opacity"></div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-b-md h-10 group-hover:opacity-90 transition-opacity"></div>
                <span className="text-[10px] text-muted-foreground font-bold mt-2">Week 4</span>
              </div>
            </div>
            <div className="mt-4 flex gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span className="text-slate-500">Labor Wages: <span className="font-extrabold text-slate-800 dark:text-slate-100">₹84,200</span></span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <div className="w-3 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <span className="text-slate-500">Inventory Parts: <span className="font-extrabold text-slate-800 dark:text-slate-100">₹45,850</span></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parts inventory tracker widget */}
        <Card className="col-span-12 lg:col-span-4 border-slate-150 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Laptop className="h-4.5 w-4.5 text-primary" />
              Workshop Stock Levels
            </CardTitle>
            <CardDescription>Critical hardware spares and components units.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">NVMe SSDs (1TB)</span>
                <span className="text-emerald-600 dark:text-emerald-400">42 Units</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-1.5">
                <div className="bg-emerald-500 h-full rounded-full w-[80%]"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">MacBook Retina 16" Panels</span>
                <span className="text-amber-600">5 Units</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-1.5">
                <div className="bg-amber-500 h-full rounded-full w-[25%]"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">OEM Batteries (XPS / G15)</span>
                <span className="text-rose-600 font-extrabold">1 Unit (Low)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-1.5">
                <div className="bg-rose-500 h-full rounded-full w-[8%]"></div>
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10">
            <Button onClick={() => toast.info('Inventory console launching...')} variant="outline" className="w-full text-xs font-bold h-8">
              Open Inventory console
            </Button>
          </div>
        </Card>

      </div>

      {/* Main active diagnostics queue */}
      <Card className="border-slate-150 dark:border-slate-800 shadow-xs">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <div>
              <CardTitle className="text-base font-bold">Active Diagnostic &amp; Repairs Queue</CardTitle>
              <CardDescription>Track repair progression, assigned engineers, and parts status.</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search devices or issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8.5 rounded-lg"
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs py-1 px-3"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground/60 italic font-medium">
              No tickets in the repair queue. File a new workshop order to initiate diagnostics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Ticket ID</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Device &amp; Title</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Assigned Tech</th>
                    <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-right">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">
                        #{ticket.ticket_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{ticket.title}</div>
                        {ticket.description && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-xs">{ticket.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="capitalize text-[9px] border-slate-200 dark:border-slate-800 font-bold py-0.5 px-2 rounded">
                          {ticket.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                      <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                      <td className="px-6 py-4">
                        {ticket.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-700 dark:text-slate-300">
                              {ticket.assigned_to.first_name[0] || ''}{ticket.assigned_to.last_name[0] || ''}
                            </div>
                            <span className="font-bold text-xs">{ticket.assigned_to.first_name} {ticket.assigned_to.last_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic font-semibold">Idle / Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground font-bold">
                        {new Date(ticket.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technician concurrently workload slots */}
      <div className="grid grid-cols-12 gap-6">
        
        <Card className="col-span-12 lg:col-span-5 border-slate-150 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Technician Concurrent Workload</CardTitle>
            <CardDescription>Available bench capacity slots per technician.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="w-20">Jane Doe</span>
              <div className="flex-1 max-w-xs grid grid-cols-5 gap-1.5 px-4">
                <div className="h-3.5 bg-primary rounded-xs"></div>
                <div className="h-3.5 bg-primary rounded-xs"></div>
                <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded-xs"></div>
                <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded-xs"></div>
                <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded-xs"></div>
              </div>
              <span className="text-primary font-black">2/5 slots</span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span className="w-20">Alex Smith</span>
              <div className="flex-1 max-w-xs grid grid-cols-5 gap-1.5 px-4">
                <div className="h-3.5 bg-primary rounded-xs"></div>
                <div className="h-3.5 bg-primary rounded-xs"></div>
                <div className="h-3.5 bg-primary rounded-xs"></div>
                <div className="h-3.5 bg-primary rounded-xs"></div>
                <div className="h-3.5 bg-slate-100 dark:bg-slate-850 rounded-xs"></div>
              </div>
              <span className="text-primary font-black">4/5 slots</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer feedback glassmorphism block */}
        <Card className="col-span-12 lg:col-span-7 border-slate-150 dark:border-slate-800 bg-gradient-to-br from-primary-light/5 to-transparent p-5 shadow-xs">
          <h3 className="text-sm font-black mb-4 uppercase tracking-wider text-slate-500">Recent Diagnostic Feedback</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex gap-0.5 text-amber-500 mb-2">
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
              </div>
              <p className="text-xs italic text-muted-foreground leading-relaxed">"Quick diagnostics turnaround on my server cluster unit. Excellent support."</p>
              <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-2.5">&mdash; Sarah L., Sector D</p>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
              <div className="flex gap-0.5 text-amber-500 mb-2">
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <StarHalf className="h-3.5 w-3.5 fill-current" />
              </div>
              <p className="text-xs italic text-muted-foreground leading-relaxed">"Parts order took an extra day but diagnostic reporting was highly detailed."</p>
              <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-2.5">&mdash; Rohit P., Lab Tech</p>
            </div>
          </div>
        </Card>

      </div>

    </div>
  );
}
