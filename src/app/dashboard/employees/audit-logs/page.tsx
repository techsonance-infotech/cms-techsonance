'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ScrollText, Search, Download, Filter, Clock, User, FileText,
  Shield, DollarSign, Eye, ShieldCheck, X, Activity, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredSessionToken } from '@/lib/client-session';

interface AuditLog {
  id: string;
  employeeId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: any | null;
  newValues: any | null;
  performedBy: string;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [search, resourceFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = getStoredSessionToken();
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (resourceFilter) params.append('resourceType', resourceFilter);

      const res = await fetch(`/api/employees/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      } else {
        toast.error('Failed to load audit logs from server');
      }
    } catch (err) {
      console.error('Audit logs fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs available to export');
      return;
    }
    const headers = "Timestamp,Performed By,Action,Resource Type,Resource ID,IP Address\n";
    const rows = logs.map(l => 
      `"${new Date(l.createdAt).toLocaleString()}","${l.performedBy}","${l.action}","${l.entityType}","${l.entityId || 'N/A'}","${l.ipAddress || 'N/A'}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'compliance_audit_logs.csv');
    a.click();
    toast.success('Audit trail logs exported as CSV.');
  };

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('start')) return 'bg-emerald-500/10 text-emerald-500 border-none';
    if (act.includes('update') || act.includes('edit') || act.includes('calibrate') || act.includes('complete')) return 'bg-blue-500/10 text-blue-500 border-none';
    if (act.includes('delete') || act.includes('remove') || act.includes('terminate')) return 'bg-rose-500/10 text-rose-500 border-none';
    return 'bg-amber-500/10 text-amber-500 border-none';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType?.toLowerCase()) {
      case 'employee': return User;
      case 'document': return FileText;
      case 'payroll': return DollarSign;
      case 'access': return Shield;
      default: return ScrollText;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-pulse">
        <div className="h-28 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full"></div>
        <div className="h-16 bg-slate-100 dark:bg-zinc-800/50 rounded-xl w-full"></div>
        <div className="h-96 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc] max-w-[1600px] mx-auto p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f87941] via-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <ScrollText className="h-8 w-8 text-[#f87941]" />
            Enterprise Audit Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete compliance audit trail of all employee-related data modifications, role updates, and payroll edits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} className="bg-[#f87941] hover:bg-[#e06634] text-white font-bold flex items-center gap-2 text-xs h-9">
            <Download className="h-4 w-4" /> Export CSV Logs
          </Button>
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
            Audit Logging Active
          </Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by action, actor, resource ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-[#1E1F22] border-[#e6e4e6]/30 dark:border-[#2f3035]/30 h-10 text-xs"
          />
        </div>
        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="border rounded-lg p-2 bg-transparent text-xs border-input h-10 outline-none w-48 font-semibold text-slate-700 dark:text-slate-200"
        >
          <option value="">All Resource Types</option>
          <option value="employee">Employees</option>
          <option value="document">Documents</option>
          <option value="payroll">Payroll</option>
          <option value="training_program">Training Program</option>
          <option value="pms_cycle">PMS Appraisal Cycles</option>
        </select>
      </div>

      {/* Audit Log Table List */}
      <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30 shadow-lg">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-slate-400 font-bold bg-slate-50 dark:bg-zinc-900/30">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor User</th>
                <th className="p-3.5">Action Logged</th>
                <th className="p-3.5">Resource</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const Icon = getEntityIcon(log.entityType);
                return (
                  <tr key={log.id} className="border-b hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 border-slate-100 dark:border-zinc-800">
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {log.performedBy}
                    </td>
                    <td className="p-3.5">
                      <Badge className={`uppercase text-[8px] font-extrabold tracking-wide ${getActionColor(log.action)}`}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="capitalize">{log.entityType}</span> 
                        {log.entityId && <span className="text-[10px] text-slate-400 font-mono">({log.entityId})</span>}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-slate-400 italic py-16 text-center">
                    No compliance audit logs matched current search/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* JSON Value Inspector Dialog Overlay */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-[#1E1F22] border shadow-2xl animate-scaleUp">
            <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/20 border-b flex flex-row justify-between items-center pb-4">
              <div>
                <CardTitle className="text-md flex items-center gap-2"><Activity className="h-4.5 w-4.5 text-[#f87941]" /> Audit Value Change Inspector</CardTitle>
                <CardDescription>Inspect previous values vs. updated payload values.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedLog(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-500">Action:</h4>
                  <Badge className={`uppercase text-[8px] font-extrabold ${getActionColor(selectedLog.action)}`}>{selectedLog.action}</Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-500">Performed By:</h4>
                  <p className="font-semibold">{selectedLog.performedBy}</p>
                </div>
              </div>

              {/* Diffs values comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-400">Previous / Old Values</h5>
                  <pre className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border font-mono text-[10px] overflow-x-auto text-slate-600 dark:text-slate-400 h-44">
                    {selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : 'No previous state recorded.'}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-400 flex items-center gap-1">New / Updated Values <ArrowRight className="h-3 w-3 text-[#f87941]" /></h5>
                  <pre className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border font-mono text-[10px] overflow-x-auto text-slate-600 dark:text-slate-400 h-44">
                    {selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : 'No update details mapped.'}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
