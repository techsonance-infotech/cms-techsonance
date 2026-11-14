'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface BackupRecord {
  id: string;
  file_name: string;
  file_size: string;
  backup_type: string;
  status: 'completed' | 'in_progress' | 'failed' | string;
  created_at: string;
  download_url?: string;
}

export interface BackupTabProps {
  backupInterval: string;
  backupsList: BackupRecord[];
  onToggleBackupSchedule: (val: string) => void;
  onCreateBackup: () => void;
  onRestoreBackup: (backupId: string) => void;
}

export function BackupTab({
  backupInterval,
  backupsList,
  onToggleBackupSchedule,
  onCreateBackup,
  onRestoreBackup,
}: BackupTabProps) {
  return (
    <div className="space-y-6">
      {/* Trigger and Schedule options */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Cloud Snapshots & Backups</CardTitle>
          <CardDescription>Configure auto recurrence frequencies and trigger manual target recovery points.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl gap-4">
            <div>
              <h4 className="font-bold text-xs">Automated Cloud Backups Frequency</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Encrypts and relays schema structures to corporate cloud repositories.</p>
            </div>
            <select
              className="text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-9"
              value={backupInterval}
              onChange={(e) => onToggleBackupSchedule(e.target.value)}
            >
              <option value="daily">Daily Cron schedule</option>
              <option value="weekly">Weekly Cron schedule</option>
              <option value="monthly">Monthly Cron schedule</option>
              <option value="none">Deactivated / Off</option>
            </select>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 dark:bg-zinc-900/30 border border-border rounded-2xl gap-4">
            <div>
              <h4 className="font-bold text-xs">Execute Manual Database Snapshot</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Generate a complete system restore point snapshot targeting current workspace state immediately.</p>
            </div>
            <Button
              size="sm"
              className="text-[10px] font-bold h-9 px-4 rounded-lg"
              onClick={onCreateBackup}
            >
              Snapshot Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Snapshots Table */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Available Recovery Snapshots</CardTitle>
          <CardDescription>Select past restore points to roll back database structures.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3">File name</th>
                  <th className="p-3">Sizing</th>
                  <th className="p-3">Backup Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {backupsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground/60 italic">
                      No snapshots created yet. Click "Snapshot Now" to build one!
                    </td>
                  </tr>
                ) : (
                  backupsList.map((bk: BackupRecord) => (
                    <tr key={bk.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                      <td className="p-3 font-bold font-mono truncate max-w-xs">{bk.file_name}</td>
                      <td className="p-3 font-mono">{bk.file_size}</td>
                      <td className="p-3">
                        <Badge className="bg-slate-100 dark:bg-zinc-800 text-muted-foreground border-none font-bold text-[8px] rounded-md capitalize">{bk.backup_type}</Badge>
                      </td>
                      <td className="p-3">
                        {bk.status === 'completed' ? (
                          <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border-none text-[8px] rounded-md">Completed</Badge>
                        ) : bk.status === 'in_progress' ? (
                          <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold border-none text-[8px] rounded-md">In Progress</Badge>
                        ) : (
                          <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold border-none text-[8px] rounded-md">Failed</Badge>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(bk.created_at).toLocaleString()}</td>
                      <td className="p-3 text-right flex justify-end gap-1.5">
                        {bk.download_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/10 rounded-lg px-2 text-[10px] font-bold"
                            onClick={() => {
                              if (bk.download_url) {
                                window.open(bk.download_url, '_blank');
                                toast.success(`Downloading snapshot: ${bk.file_name}`);
                              }
                            }}
                          >
                            Download
                          </Button>
                        )}
                        {bk.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-primary/20 text-primary hover:bg-primary/5 rounded-lg px-2 text-[10px] font-bold"
                            onClick={() => onRestoreBackup(bk.id)}
                          >
                            Restore
                          </Button>
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
