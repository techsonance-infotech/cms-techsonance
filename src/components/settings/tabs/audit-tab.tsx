'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface AuditLogRecord {
  id: string;
  action_by: string;
  action_name: string;
  old_value?: string | null;
  new_value?: string | null;
  ip_address?: string | null;
  device_info?: string | null;
  created_at: string;
}

export interface AuditTabProps {
  auditLogsList: AuditLogRecord[];
  onUndoAudit: (logId: string) => void;
}

export function AuditTab({ auditLogsList, onUndoAudit }: AuditTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Workspace Configuration Auditing</CardTitle>
          <CardDescription>Chronological sequence logs of settings table adjustments and operations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3">Actor / Who</th>
                  <th className="p-3">Action / What</th>
                  <th className="p-3">Old Value</th>
                  <th className="p-3">New Value</th>
                  <th className="p-3">IP & Client Device</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground/60 italic">
                      No settings changes recorded yet in audit system.
                    </td>
                  </tr>
                ) : (
                  auditLogsList.map((log: AuditLogRecord) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                      <td className="p-3 font-bold">{log.action_by}</td>
                      <td className="p-3">{log.action_name}</td>
                      <td className="p-3 font-mono text-[10px] max-w-[120px] truncate">{log.old_value || '—'}</td>
                      <td className="p-3 font-mono text-[10px] max-w-[120px] truncate text-primary">{log.new_value || '—'}</td>
                      <td className="p-3">
                        <span className="font-mono">{log.ip_address || '127.0.0.1'}</span>
                        {log.device_info && <p className="text-[9px] text-muted-foreground mt-0.5">{log.device_info}</p>}
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        {log.old_value ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] rounded-lg font-bold border-primary/20 text-primary hover:bg-primary/5 px-2.5"
                            onClick={() => onUndoAudit(log.id)}
                          >
                            Undo
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
