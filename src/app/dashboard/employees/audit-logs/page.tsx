'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Search, Download, Filter, Clock, User, FileText, Shield, DollarSign, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: number;
  employeeId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  performedBy: string;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Will fetch from /api/employees/audit-logs once table is created
    setLoading(false);
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (action.includes('update') || action.includes('edit')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-500/10 text-red-600 border-red-500/20';
    if (action.includes('view') || action.includes('export')) return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'employee': return User;
      case 'document': return FileText;
      case 'payroll': return DollarSign;
      case 'access': return Shield;
      default: return FileText;
    }
  };

  return (
    <div className="flex flex-col bg-transparent text-slate-900 dark:text-[#fdfcfc]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-[#e6e4e6]/30 dark:border-[#2f3035]/30 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-3">
            <ScrollText className="h-7 w-7 text-[#f87941]" />
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] mt-1">
            Complete audit trail of all employee-related actions and data changes.
          </p>
        </div>
        <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 font-semibold flex items-center gap-2">
          <Download className="h-4 w-4" /> Export Logs
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by action, user, entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white dark:bg-[#1E1F22] border-[#e6e4e6]/30 dark:border-[#2f3035]/30 h-10"
          />
        </div>
        <Button variant="outline" className="border-[#e6e4e6]/30 dark:border-[#2f3035]/30 font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      {/* Audit Log List */}
      <Card className="bg-white dark:bg-[#1E1F22] border border-[#e6e4e6]/30 dark:border-[#2f3035]/30">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-[#f87941]/10 rounded-2xl flex items-center justify-center mb-4">
            <ScrollText className="h-10 w-10 text-[#f87941]" />
          </div>
          <h3 className="text-lg font-bold mb-2">Audit Trail Engine</h3>
          <p className="text-sm text-slate-500 dark:text-[#b1b1b1] max-w-md">
            Track every action: salary changes, document downloads, password resets, role modifications,
            data exports, and more. Complete with IP addresses, timestamps, and diff views.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['Salary Changed', 'Employee Deleted', 'Password Reset', 'PF Updated', 'Document Downloaded', 'Payroll Viewed', 'Data Exported'].map(action => (
              <Badge key={action} variant="outline" className="text-xs">
                {action}
              </Badge>
            ))}
          </div>
          <Badge variant="outline" className="mt-4 text-[#f87941] border-[#f87941]/30">
            Activates after SQL migration
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
