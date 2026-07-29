'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { PageHeaderSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { 
  Bell, CheckCircle2, AlertTriangle, Info, XCircle, 
  Mail, MessageSquare, Smartphone, Check, Trash2,
  RefreshCw, Settings2, Sliders, ShieldCheck, MailQuestion
} from 'lucide-react';

export default function NotificationCenterDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'history' | 'preferences'>('inbox');
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          const r = u.role?.toLowerCase() || '';
          if (r === 'admin' || r === 'hr_manager' || r === 'project_manager' || r === 'superadmin') {
            setIsAdmin(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Preferences Form States
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  
  const [taskUpdates, setTaskUpdates] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [approvalRequests, setApprovalRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchInbox = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/notifications?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setInbox(json.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notification inbox.');
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/notifications/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          setInAppEnabled(d.in_app_enabled);
          setEmailEnabled(d.email_enabled);
          setSmsEnabled(d.sms_enabled);
          setWhatsAppEnabled(d.whatsapp_enabled);
          setPushEnabled(d.push_enabled);
          setTaskUpdates(d.task_updates);
          setAttendanceAlerts(d.attendance_alerts);
          setApprovalRequests(d.approval_requests);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchInbox(), fetchHistory(), fetchPreferences()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRead = async (id: number, currentRead: boolean) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: !currentRead })
      });

      if (res.ok) {
        toast.success(currentRead ? 'Notification marked unread' : 'Notification marked read');
        fetchInbox();
        fetchHistory();
      } else {
        toast.error('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('Notification removed.');
        fetchInbox();
        fetchHistory();
      } else {
        toast.error('Failed to delete notification.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          inAppEnabled,
          emailEnabled,
          smsEnabled,
          whatsAppEnabled,
          pushEnabled,
          taskUpdates,
          attendanceAlerts,
          approvalRequests
        })
      });

      if (res.ok) {
        toast.success('Notification channel settings updated.');
      } else {
        toast.error('Failed to update preferences.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 bg-emerald-500/10 p-0.5 rounded-lg" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 bg-amber-500/10 p-0.5 rounded-lg" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-rose-500 bg-rose-500/10 p-0.5 rounded-lg" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 bg-blue-500/10 p-0.5 rounded-lg" />;
    }
  };

  const filteredInbox = inbox.filter(n => {
    if (filter === 'Unread') return !n.isRead;
    return true;
  });

  if (loading && inbox.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto text-foreground p-1 border-t border-border flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0">
        <PageHeader 
          title="Notification Center"
          description="View alerts, configure delivery preferences across channels, and review audit history lists."
          actions={[
            isAdmin && (
              <Button 
                key="broadcast" 
                onClick={() => router.push('/dashboard/employees/broadcast')}
                className="bg-primary hover:bg-primary/95 text-white font-bold border-none"
              >
                Launch Broadcast Hub
              </Button>
            ),
            <Button 
              key="ref" 
              variant="outline" 
              onClick={loadData}
              className="border-border text-foreground font-bold hover:bg-accent flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" /> Refresh
            </Button>
          ].filter(Boolean) as React.ReactNode[]}
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notification Center' }]}
        />
      </div>

      {/* Main Tab layout */}
      <div className="flex-1 border border-border/80 rounded-2xl bg-card flex flex-col overflow-hidden mt-4">
        
        {/* Tab Selection */}
        <div className="border-b border-border px-6 py-2.5 flex bg-accent/5 shrink-0 justify-between items-center">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                activeTab === 'inbox' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              In-App Inbox ({inbox.filter(n => !n.isRead).length} Unread)
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 pt-1 text-xs font-bold border-b-2 mr-6 transition-all ${
                activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Delivery History
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`pb-2 pt-1 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'preferences' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Channel Preferences
            </button>
          </div>

          {activeTab === 'inbox' && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setFilter('All')}
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors ${
                  filter === 'All' ? 'bg-primary text-white' : 'bg-accent/40 text-muted-foreground hover:bg-accent/60'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('Unread')}
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors ${
                  filter === 'Unread' ? 'bg-primary text-white' : 'bg-accent/40 text-muted-foreground hover:bg-accent/60'
                }`}
              >
                Unread Only
              </button>
            </div>
          )}
        </div>

        {/* Tab Workspace content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: Inbox */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              {filteredInbox.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                    notif.isRead 
                      ? 'bg-accent/10 border-border/40 opacity-80' 
                      : 'bg-primary/5 border-primary/20 shadow-sm'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {getNotifIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-sm font-bold text-foreground truncate ${!notif.isRead && 'font-black'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1.5 ml-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleToggleRead(notif.id, notif.isRead)}
                      title={notif.isRead ? 'Mark as Unread' : 'Mark as Read'}
                      className="border-border text-foreground h-7 w-7"
                    >
                      <Check className={`h-3.5 w-3.5 ${notif.isRead ? 'text-muted-foreground' : 'text-primary font-bold'}`} />
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleDeleteNotification(notif.id)}
                      title="Delete Notification"
                      className="h-7 w-7 border-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredInbox.length === 0 && (
                <div className="text-center py-12 text-xs text-muted-foreground italic space-y-2">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p>Your notification inbox is empty.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Delivery History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Multi-Channel Dispatches</h3>
              {history.map((log) => (
                <Card key={log.id} className="border border-border/80 bg-accent/10 p-5 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{log.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{log.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Channel Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-border/40 text-[10px] font-bold uppercase">
                    <div className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border border-border/30">
                      <Smartphone className="h-3.5 w-3.5 text-primary" />
                      <span>In-App: <span className="text-emerald-500">{log.channels.inApp}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border border-border/30">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span>Email: <span className={log.channels.email === 'Delivered' ? 'text-emerald-500' : 'text-slate-400'}>{log.channels.email}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border border-border/30">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      <span>SMS: <span className={log.channels.sms === 'Delivered' ? 'text-emerald-500' : 'text-slate-400'}>{log.channels.sms}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border border-border/30">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      <span>WhatsApp: <span className={log.channels.whatsApp === 'Delivered' ? 'text-emerald-500' : 'text-slate-400'}>{log.channels.whatsApp}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border border-border/30">
                      <Smartphone className="h-3.5 w-3.5 text-primary" />
                      <span>Push: <span className={log.channels.push === 'Delivered' ? 'text-emerald-500' : 'text-slate-400'}>{log.channels.push}</span></span>
                    </div>
                  </div>
                </Card>
              ))}
              
              {history.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-6">No delivery logs found.</p>
              )}
            </div>
          )}

          {/* TAB 3: Preferences */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="max-w-2xl space-y-8">
              
              {/* Delivery Channels */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Notification Channels</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-accent/15 border border-border/40 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground">In-App Notifications</span>
                      <p className="text-[10px] text-muted-foreground">Display badge alerts inside web application.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={inAppEnabled}
                      onChange={(e) => setInAppEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent/15 border border-border/40 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground">Email Notifications</span>
                      <p className="text-[10px] text-muted-foreground">Send transaction reports to email.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent/15 border border-border/40 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground">SMS Notifications</span>
                      <p className="text-[10px] text-muted-foreground">Dispatch SMS text alerts for alerts.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={smsEnabled}
                      onChange={(e) => setSmsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent/15 border border-border/40 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground">WhatsApp Notifications</span>
                      <p className="text-[10px] text-muted-foreground">Integrate automated WhatsApp notifications.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={whatsAppEnabled}
                      onChange={(e) => setWhatsAppEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent/15 border border-border/40 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground">Push Notifications</span>
                      <p className="text-[10px] text-muted-foreground">Trigger browser push banners.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={pushEnabled}
                      onChange={(e) => setPushEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Event Subscriptions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4.5 w-4.5 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Event Subscriptions</h3>
                </div>

                <div className="space-y-3 font-semibold text-xs">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={taskUpdates}
                      onChange={(e) => setTaskUpdates(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Project deliverables & Task Board Updates</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={attendanceAlerts}
                      onChange={(e) => setAttendanceAlerts(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Attendance logs, shift checks & payroll cutoff alerts</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={approvalRequests}
                      onChange={(e) => setApprovalRequests(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <span>Approvals (Leave requests, reimbursables, supplier contracts)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/95 text-white font-bold border-none text-xs px-6 py-2 rounded-xl"
                >
                  {submitting ? 'Saving settings...' : 'Save Channel Preferences'}
                </Button>
              </div>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}
