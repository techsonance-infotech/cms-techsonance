'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PageHeaderSkeleton, StatsSkeleton } from '@/components/ui/dashboard-skeleton';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  UserCheck, Plus, Calendar, ShieldCheck, Mail, 
  Phone, Building2, QrCode, ArrowRight, UserPlus, 
  Clock, ShieldAlert, Key, ClipboardList, CheckCircle2, XCircle, RefreshCw
} from 'lucide-react';

export default function VisitorPassDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [passes, setPasses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pre-register' | 'passes' | 'security'>('passes');
  
  // Dialogs
  const [selectedPass, setSelectedPass] = useState<any>(null);
  const [isPassCardOpen, setIsPassCardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [hostId, setHostId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPasses = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/visitors/passes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPasses(json.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load visitor records.');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUsers(json || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPasses(), fetchUsers()]);
      setLoading(false);
    };
    init();
  }, []);

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !purpose || !startDate || !endDate) {
      toast.error('Please fill in all required guest details.');
      return;
    }
    setSubmitting(true);

    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/visitors/passes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          company,
          hostId: hostId || users[0]?.id,
          purpose,
          scheduledStart: new Date(startDate).toISOString(),
          scheduledEnd: new Date(endDate).toISOString()
        })
      });

      if (res.ok) {
        toast.success('Visitor pre-registered successfully.');
        setFullName('');
        setEmail('');
        setPhone('');
        setCompany('');
        setPurpose('');
        setStartDate('');
        setEndDate('');
        setActiveTab('passes');
        fetchPasses();
      } else {
        toast.error('Failed to pre-register guest.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error scheduling visitor pass.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusAction = async (passId: string, action: 'Approve' | 'Reject' | 'CheckIn' | 'CheckOut') => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/visitors/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ passId, action })
      });

      if (res.ok) {
        toast.success(`Visitor status updated: ${action}`);
        fetchPasses();
      } else {
        toast.error('Failed to execute security action.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error logging pass update.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <PageHeaderSkeleton />
        <StatsSkeleton count={3} />
      </div>
    );
  }

  // Summary counts
  const totalUpcoming = passes.filter(p => p.status === 'Pre-Registered' || p.status === 'Approved').length;
  const totalCheckedIn = passes.filter(p => p.status === 'Checked In').length;
  const totalCheckedOut = passes.filter(p => p.status === 'Checked Out').length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-foreground p-1 border-t border-border flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header */}
      <div className="shrink-0">
        <PageHeader 
          title="Visitor & Pass Center"
          description="Pre-register external invitees, map corporate meeting hosts, and manage security desk scans."
          actions={[
            <Button 
              key="ref" 
              variant="outline" 
              onClick={fetchPasses}
              className="border-border text-foreground font-bold hover:bg-accent flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" /> Refresh
            </Button>
          ]}
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Visitor Management' }]}
        />
      </div>

      {/* KPI Stats Bento */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expected Guests</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalUpcoming}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Pre-registered scheduling logs</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Checked-In</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-450">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">{totalCheckedIn}</div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Currently inside premises</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Checked-Out</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalCheckedOut}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Completed check-out files</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="shrink-0 flex bg-accent/20 p-4 rounded-2xl border border-border/60 justify-between items-center mt-4">
        <div className="flex bg-accent/40 border border-border/80 rounded-xl p-1 shadow-xs">
          <button 
            onClick={() => setActiveTab('passes')}
            className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'passes' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Passes ({passes.length})
          </button>
          <button 
            onClick={() => setActiveTab('pre-register')}
            className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pre-register' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pre-Register Guest
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'security' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Security Scan Desk
          </button>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 overflow-y-auto pr-1 mt-4">
        
        {/* Tab 1: Passes List */}
        {activeTab === 'passes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {passes.map((pass) => {
              const visitor = pass.visitors;
              if (!visitor) return null;
              
              return (
                <Card 
                  key={pass.id}
                  onClick={() => {
                    setSelectedPass(pass);
                    setIsPassCardOpen(true);
                  }}
                  className="border-none shadow-xs hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer bg-card flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                        {visitor.company || 'Private Visit'}
                      </Badge>
                      <Badge className={`px-2 py-0.5 rounded-full border-none text-[9px] font-extrabold uppercase ${
                        pass.status === 'Checked In' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : pass.status === 'Pre-Registered'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-650'
                      }`}>
                        {pass.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-black truncate">{visitor.full_name}</CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1 mt-1 font-semibold text-muted-foreground">
                      Host: {pass.host ? `${pass.host.first_name} ${pass.host.last_name}` : 'Unknown'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      Purpose: {pass.purpose}
                    </p>
                    
                    <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled Start</span>
                      <span>{new Date(pass.scheduled_start).toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {passes.length === 0 && (
              <p className="text-center text-xs text-muted-foreground italic col-span-3 py-12">No visitor passes scheduled.</p>
            )}
          </div>
        )}

        {/* Tab 2: Pre-Register Form */}
        {activeTab === 'pre-register' && (
          <Card className="max-w-2xl mx-auto border-none shadow-xs p-6 mb-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg">Register Expected Guest</CardTitle>
              <CardDescription>Enter visitor contact information and match them to an internal host.</CardDescription>
            </CardHeader>
            <form onSubmit={handlePreRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Full Name *</label>
                  <Input 
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-accent/30 border-border text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Email Address *</label>
                  <Input 
                    type="email"
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-accent/30 border-border text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                  <Input 
                    placeholder="+91 99999 88888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-accent/30 border-border text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Company / Organization</label>
                  <Input 
                    placeholder="e.g. Acme Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="bg-accent/30 border-border text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Meeting Host (Employee) *</label>
                <select
                  value={hostId}
                  onChange={(e) => setHostId(e.target.value)}
                  className="w-full bg-accent/30 border border-border text-xs rounded-xl p-2.5 text-foreground cursor-pointer font-semibold"
                  required
                >
                  <option value="">Select Host Employee...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Purpose of Visit *</label>
                <Input 
                  placeholder="e.g. Sales pitch, PR meeting"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="bg-accent/30 border-border text-xs rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Scheduled Start Time *</label>
                  <Input 
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-accent/30 border-border text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Scheduled End Time *</label>
                  <Input 
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-accent/30 border-border text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold border-none" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Invite'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Tab 3: Security Desk Scan View */}
        {activeTab === 'security' && (
          <Card className="border-none shadow-xs overflow-hidden flex flex-col justify-between mb-6">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Security Entrance & Exit Logs
              </CardTitle>
              <CardDescription>Scan digital guest QR passes and check visitors in or out of the office facility.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-accent/40 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                      <th className="px-6 py-4">Visitor</th>
                      <th className="px-6 py-4">Host</th>
                      <th className="px-6 py-4">Timings</th>
                      <th className="px-6 py-4">QR Token</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground font-medium">
                    {passes.map((pass) => {
                      const visitor = pass.visitors;
                      if (!visitor) return null;
                      return (
                        <tr key={pass.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{visitor.full_name}</span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">{visitor.company || 'Private'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {pass.host ? `${pass.host.first_name} ${pass.host.last_name}` : 'Unknown'}
                          </td>
                          <td className="px-6 py-4">
                            {new Date(pass.scheduled_start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {new Date(pass.scheduled_end).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-primary">{pass.qr_code_token}</td>
                          <td className="px-6 py-4">
                            <Badge className={`px-2 py-0.5 rounded-full border-none text-[9px] font-extrabold uppercase ${
                              pass.status === 'Checked In' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : pass.status === 'Pre-Registered'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-650'
                            }`}>
                              {pass.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {pass.status === 'Pre-Registered' && (
                              <Button 
                                size="xs" 
                                onClick={() => handleStatusAction(pass.id, 'CheckIn')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-none text-[10px]"
                              >
                                Approve Entry
                              </Button>
                            )}
                            {pass.status === 'Checked In' && (
                              <Button 
                                size="xs" 
                                onClick={() => handleStatusAction(pass.id, 'CheckOut')}
                                className="bg-slate-700 hover:bg-slate-800 text-white font-bold border-none text-[10px]"
                              >
                                Log Exit
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {passes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground italic">No visitors scheduled today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Simulated QR Pass Card Dialog */}
      <Dialog open={isPassCardOpen} onOpenChange={setIsPassCardOpen}>
        <DialogContent className="max-w-md">
          {selectedPass && selectedPass.visitors && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center font-black">Alpha Corporate Pass</DialogTitle>
                <DialogDescription className="text-center">Authorized corporate workspace visitor pass</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-6 py-6 border-y border-border">
                {/* QR Code Simulation */}
                <div className="bg-white p-5 rounded-2xl border-4 border-primary/20 shadow-sm flex flex-col items-center gap-3">
                  <div className="bg-accent/40 w-44 h-44 flex items-center justify-center rounded-xl border border-border">
                    <QrCode className="h-32 w-32 text-slate-900" />
                  </div>
                  <span className="font-mono text-xs font-black text-slate-500">{selectedPass.qr_code_token}</span>
                </div>

                {/* Visitor Info Card */}
                <div className="w-full space-y-3.5 text-xs font-semibold">
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Visitor Name</span>
                    <span className="text-foreground font-bold">{selectedPass.visitors.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Representing</span>
                    <span className="text-foreground font-bold">{selectedPass.visitors.company || 'Private Visit'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Meeting Host</span>
                    <span className="text-foreground font-bold">
                      {selectedPass.host ? `${selectedPass.host.first_name} ${selectedPass.host.last_name}` : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Entry Timing</span>
                    <span className="text-foreground font-bold">
                      {new Date(selectedPass.scheduled_start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button className="w-full bg-primary hover:bg-primary/95 text-white font-bold border-none" onClick={() => setIsPassCardOpen(false)}>
                  Close Pass
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
