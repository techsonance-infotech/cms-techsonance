'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Megaphone, Bell, CheckCircle2, Clock, AlertTriangle, FileText, IndianRupee, ArrowRight, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

interface ApprovalItem {
  id: number;
  type: 'leave' | 'reimbursement' | 'attendance';
  title: string;
  employee: string;
  details: string;
  date: string;
}

export function DashboardAnnouncements({ announcements, alerts }: { announcements: Announcement[], alerts: Announcement[] }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-none shadow-lg h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Announcements & Alerts
            </CardTitle>
            <CardDescription>Stay updated with company & system notices</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard/employees/broadcast?view=employee"
              className="text-xs font-bold text-[#f87941] hover:text-[#f4662b] flex items-center gap-1 hover:underline transition-colors px-2 py-1 rounded-md hover:bg-[#f87941]/10"
            >
              Notice Hub <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Badge variant="outline" className="bg-secondary text-primary border-primary/20">
              {announcements.length + alerts.length} New
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {announcements.length === 0 && alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Bell className="h-6 w-6 text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">No active announcements</p>
              </div>
            )}
            
            {/* Company Announcements */}
            {announcements.map((item) => (
              <Link 
                key={`ann-${item.id}`} 
                href="/dashboard/employees/broadcast?view=employee"
                className="group relative flex gap-4 p-3 rounded-xl border border-primary-light/10 bg-primary-light/5 hover:bg-primary-light/10 transition-colors block cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold group-hover:text-[#f87941] transition-colors">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                </div>
              </Link>
            ))}

            {/* System Alerts */}
            {alerts.map((item) => (
              <Link 
                key={`alert-${item.id}`} 
                href="/dashboard/employees/broadcast?view=employee"
                className="group relative flex gap-4 p-3 rounded-xl border border-rose-100 bg-rose-50/30 hover:bg-rose-50 transition-colors block cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold group-hover:text-rose-600 transition-colors">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function DashboardApprovalQueue({ items }: { items: ApprovalItem[] }) {
  const [queue, setQueue] = useState(items);
  const [processing, setProcessing] = useState<number | null>(null);

  if (queue.length === 0) return null;

  const handleAction = async (item: ApprovalItem, action: 'approved' | 'rejected') => {
    setProcessing(item.id);
    const token = localStorage.getItem('session_token');
    
    try {
      let endpoint = '';
      if (item.type === 'leave') endpoint = `/api/leave-requests?id=${item.id}`;
      else if (item.type === 'reimbursement') endpoint = `/api/reimbursements?id=${item.id}`;
      else if (item.type === 'attendance') endpoint = `/api/attendance/requests`;

      const res = await fetch(endpoint, {
        method: item.type === 'attendance' ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(
          item.type === 'attendance' 
            ? { id: item.id, action: action === 'approved' ? 'approve' : 'reject' }
            : { status: action }
        )
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`${item.title} ${action} successfully`);
      setQueue(prev => prev.filter(q => q.id !== item.id || q.type !== item.type));
    } catch (e: any) {
      toast.error(e.message || 'Error processing request');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-none shadow-lg">
      <CardHeader className="pb-3 border-b border-border/40 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Pending Approvals
            </CardTitle>
            <CardDescription>Actions required for your team</CardDescription>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold uppercase tracking-wider text-[9px]">
            High Priority
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {queue.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    item.type === 'leave' ? 'bg-amber-500/10 text-amber-600' : 
                    item.type === 'attendance' ? 'bg-secondary text-primary' :
                    'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {item.type === 'leave' ? <Clock className="h-5 w-5" /> : 
                     item.type === 'attendance' ? <CheckCircle2 className="h-5 w-5" /> :
                     <IndianRupee className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{item.employee}</p>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-border/60 capitalize text-muted-foreground font-semibold">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-[280px] break-words whitespace-normal leading-relaxed">{item.details}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </p>
                  <div className="flex items-center gap-1">
                    <button 
                      disabled={processing === item.id}
                      onClick={() => handleAction(item, 'approved')}
                      className="p-1.5 rounded-lg hover:bg-emerald-100 hover:text-emerald-600 text-muted-foreground transition-all disabled:opacity-50"
                      title="Approve"
                    >
                      {processing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button 
                      disabled={processing === item.id}
                      onClick={() => handleAction(item, 'rejected')}
                      className="p-1.5 rounded-lg hover:bg-rose-100 hover:text-rose-600 text-muted-foreground transition-all disabled:opacity-50"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function DashboardBroadcaster() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    const token = localStorage.getItem('session_token');
    
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, message, type })
      });

      if (!res.ok) throw new Error('Failed to broadcast');
      
      const payload = await res.json();
      toast.success(payload.message || 'Announcement broadcasted successfully!');
      setTitle('');
      setMessage('');
      setType('info');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-none shadow-lg mt-6">
      <CardHeader className="pb-3 border-b border-border/40 mb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Quick Broadcaster
        </CardTitle>
        <CardDescription>Instantly push announcements to all active employees</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input 
                type="text" 
                placeholder="Announcement Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3.5 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87941]/40 focus-visible:border-[#F87941] disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3.5 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87941]/40 focus-visible:border-[#F87941]"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Urgent</option>
            </select>
          </div>
          <textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex min-h-[90px] w-full rounded-xl border border-input bg-transparent px-3.5 py-2 text-sm shadow-sm placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87941]/40 focus-visible:border-[#F87941] disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
          <button 
            type="submit" 
            disabled={sending || !title.trim() || !message.trim()}
            className="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F87941]/40 disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-[#F87941] to-[#F4662B] hover:from-[#F4662B] hover:to-[#E95B1F] text-white shadow-md active:scale-[0.98] h-10 px-4 py-2 w-full cursor-pointer"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Megaphone className="h-4 w-4 mr-2" />}
            {sending ? 'Broadcasting...' : 'Broadcast to Organization'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
