'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Building2, Send, Filter, CheckCircle2, ShieldAlert, 
  Clock, CheckSquare, Layers, Award, ClipboardCheck, Sparkles 
} from 'lucide-react';

interface RFIItem {
  id: string;
  subject: string;
  category: string;
  assignee: string;
  initials: string;
  dueDate: string;
  status: 'CRITICAL' | 'IN_REVIEW' | 'PENDING';
}

interface LogEntry {
  id: string;
  user: string;
  time: string;
  message: string;
  borderClass: string;
}

export default function ConstructionRFIsPage() {
  const [rfis, setRfis] = useState<RFIItem[]>([
    { id: 'RFI-204', subject: 'Concrete Slab Foundation Discrepancy', category: 'Level 2 - Structural Pours', assignee: 'Marcus K.', initials: 'MK', dueDate: 'Oct 24, 2026', status: 'CRITICAL' },
    { id: 'SUB-881', subject: 'HVAC Ductwork Shop Drawings', category: 'Mechanical - Wing A', assignee: 'Sarah L.', initials: 'SL', dueDate: 'Oct 28, 2026', status: 'IN_REVIEW' },
    { id: 'RFI-208', subject: 'Lobby Lighting Fixture Substitution', category: 'Architectural Finishings', assignee: 'Ben R.', initials: 'BR', dueDate: 'Nov 02, 2026', status: 'PENDING' },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', user: 'Mike (Superintendent)', time: '12:45 PM', message: 'Concrete truck delayed on Sector 4. Adjusting pour schedule. RFI-204 needs immediate sign-off before we proceed tomorrow morning.', borderClass: 'border-l-4 border-primary' },
    { id: '2', user: 'Project Architect', time: '11:20 AM', message: 'Submittal SUB-881 reviewed. Minor revisions required for duct sizing in Wing A corridor.', borderClass: 'border-l-4 border-slate-300 dark:border-slate-800' },
  ]);

  const [newLog, setNewLog] = useState('');

  const handlePostLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.trim()) return;

    const entry: LogEntry = {
      id: Date.now().toString(),
      user: 'You (Manager)',
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      message: newLog,
      borderClass: 'border-l-4 border-primary',
    };

    setLogs([...logs, entry]);
    setNewLog('');
    toast.success('Field update posted to live document log!');
  };

  const handleFilter = () => {
    toast.info('Opening filter settings...');
  };

  const handleNewSubmittal = () => {
    toast.info('Initiating new material submittal...');
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase mb-1.5">
            <Building2 className="h-4 w-4 text-primary" />
            <span>The Obsidian Tower Project</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">RFI &amp; Coordination Center</h1>
          <p className="text-sm text-muted-foreground">Manage Requests for Information (RFIs), architectural submittals, and field records.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleFilter} className="font-semibold flex items-center gap-2 border-slate-200 dark:border-slate-800">
            <Filter className="h-4 w-4 text-slate-500" />
            Filter View
          </Button>
          <Button size="sm" onClick={handleNewSubmittal} className="bg-primary hover:opacity-90 text-white font-bold flex items-center gap-2 shadow-md shadow-primary/10">
            <Send className="h-4 w-4" />
            New Submittal
          </Button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        
        <Card className="border-slate-100 dark:border-slate-800 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Open RFIs</p>
              <h3 className="text-xl font-black mt-0.5">24</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">In Review</p>
              <h3 className="text-xl font-black mt-0.5">18</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Approved</p>
              <h3 className="text-xl font-black mt-0.5">142</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Closed</p>
              <h3 className="text-xl font-black mt-0.5">305</h3>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Main Document Tracker Table */}
        <Card className="col-span-12 lg:col-span-8 border-slate-150 dark:border-slate-800 shadow-xs overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold">Priority RFIs &amp; Submittals</CardTitle>
              <Button variant="link" className="text-primary font-bold p-0 text-xs hover:underline">
                View All Documents
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {rfis.map((rfi) => (
                  <tr key={rfi.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900 dark:text-white">{rfi.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{rfi.subject}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{rfi.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-black text-slate-700 dark:text-slate-300">
                          {rfi.initials}
                        </div>
                        <span className="font-bold text-xs">{rfi.assignee}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-rose-600 dark:text-rose-400">{rfi.dueDate}</td>
                    <td className="px-6 py-4 text-right">
                      {rfi.status === 'CRITICAL' ? (
                        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none font-bold text-[9px] py-0.5 px-2 rounded">CRITICAL</Badge>
                      ) : rfi.status === 'IN_REVIEW' ? (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none font-bold text-[9px] py-0.5 px-2 rounded">IN REVIEW</Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] py-0.5 px-2 rounded">PENDING</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Live Field Log Updates */}
        <Card className="col-span-12 lg:col-span-4 border-slate-150 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Superintendent Live Feed</CardTitle>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <CardDescription>Real-time coordination feed directly from site superintendents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-y-auto max-h-[280px]">
            {logs.map((log) => (
              <div key={log.id} className={`p-3.5 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-850 ${log.borderClass}`}>
                <div className="flex justify-between items-center mb-1 text-[10px]">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{log.user}</span>
                  <span className="text-muted-foreground font-semibold">{log.time}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{log.message}</p>
              </div>
            ))}
          </CardContent>
          <form onSubmit={handlePostLog} className="p-4 border-t border-slate-100 dark:border-slate-850 relative bg-slate-50/10">
            <Input 
              value={newLog} 
              onChange={(e) => setNewLog(e.target.value)} 
              placeholder="Post coordination message..." 
              className="pr-12 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-xl py-2" 
            />
            <Button type="submit" size="icon" className="absolute right-6 top-6 h-7 w-7 bg-primary hover:opacity-90 text-white rounded-lg shadow-sm">
              <Send className="h-3 w-3" />
            </Button>
          </form>
        </Card>

        {/* Material Samples Grid */}
        <Card className="col-span-12 border-slate-150 dark:border-slate-800 shadow-xs p-6">
          <h3 className="text-sm font-bold mb-5 flex items-center gap-2 uppercase tracking-wider text-slate-500">
            <Layers className="h-4.5 w-4.5 text-primary" />
            Material Submittal Library
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="group overflow-hidden rounded-xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer">
              <div className="h-32 overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK7krvqfRZv9sWq0HkT0TbZCQWc7TsSDlNLOF8wUAPZeGr-WH5kvS5-5wlP-R2Htb43Y-a9H_9CYC1lxkter6_Bt7WWw_KVZrJQCMDlgv1-yhq-CAfl4Pj8ahaujOemF1UVaDFrYXpCgLtmwhMLEXc3L4MaMQOJcBlbcV29WVw734U4ScPzFAvpRsp1nl9fUJXNWs2ckvTMSPBgvyH4s4w7kjyjUV-BmB8DwJrLS8QogsohrN6orxjVmHF2FnHGWG1MmZkzLsLWXSu" 
                  alt="Architectural Concrete" 
                />
              </div>
              <div className="p-3 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">Architectural Concrete</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">Spec 03 35 00</p>
              </div>
            </div>
            
            <div className="group overflow-hidden rounded-xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer">
              <div className="h-32 overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvzckv_AwfM-Oc1wiXm5Lyl4v7IPCDPVU-f3NtH_VPiK-w23nb4kp0TBOGhedXC93Fvz1NdphdyIXi-Qoferq8iIMt6tOYOOmJu4F4Eygy_qdOPt7sgYHDr9c5PCwIeqcrzLlbKm7Qx1fQH_MGDnPao8hmhIZtlx2Ypbfe7_Hyjhy2sBaAqCVpjlPSKRtHKCt63RHhOkmgze3bJxAXKWGLb1BQYj1Xo4bpMSUPT5AbjGelkVHVVesdaUxonlK7ZIqi7UwPrk755WMF" 
                  alt="Powder-Coated Steel" 
                />
              </div>
              <div className="p-3 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">Powder-Coated Steel</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">Spec 05 12 00</p>
              </div>
            </div>

            <div className="group overflow-hidden rounded-xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer">
              <div className="h-32 overflow-hidden relative">
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuik6-5SGl7I2LBdcMoRihRqaVwwuvPxuGhpiAY4Pb7n6yo5rtFm6K67S-Fy0tEAYzskkmrJsk3T025pmYREOZzE1R36k6byvXgIkgyhr1ssYN7H2MDiW0FmeW3N59o87eS-3VO2SbQMhB5yH9LZDu2BU4GkWIOjLhv_iLm6ofj0b54pNF7teziVfKLOy-7ggGv6qR6q_K0rxHV0zo9S_mO3vKNO8IJabJ8Q_lrEWGCwBIl9nGhd6DMM9rsK13-rrlXvXs_Y4y0Pse" 
                  alt="Curtain Wall Glass" 
                />
              </div>
              <div className="p-3 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">Curtain Wall Glass</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">Spec 08 44 13</p>
              </div>
            </div>

            <div onClick={handleNewSubmittal} className="group overflow-hidden rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer min-h-[170px]">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Plus className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-primary">Submit Material</p>
            </div>

          </div>
        </Card>

      </div>
    </div>
  );
}
