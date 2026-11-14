'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export interface SecuritySettings {
  min_password_length?: number;
  require_symbols?: boolean;
  mfa_enabled?: boolean;
  sso_enabled?: boolean;
  allowed_ips?: string;
}

export interface LoginHistoryRecord {
  id: string;
  email: string;
  status: 'success' | 'failed' | string;
  ip_address: string;
  user_agent: string;
  device_info: string;
  created_at: string;
}

export interface SecurityTabProps {
  securityDraft: SecuritySettings;
  loginHistoryList: LoginHistoryRecord[];
  onChangeSecurityDraft: (draft: SecuritySettings) => void;
  onSaveSecurity: () => void;
}

export function SecurityTab({
  securityDraft,
  loginHistoryList,
  onChangeSecurityDraft,
  onSaveSecurity,
}: SecurityTabProps) {
  return (
    <div className="space-y-6">
      {/* Policies config card */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Security Center & IAM Controls</CardTitle>
          <CardDescription>Configure password parameters, MFA settings, and whitelisted IP locations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Minimum Password Length</Label>
              <Input
                type="number"
                min="6"
                max="32"
                className="text-xs rounded-xl"
                value={securityDraft.min_password_length || 8}
                onChange={(e) =>
                  onChangeSecurityDraft({ ...securityDraft, min_password_length: Number(e.target.value) })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold">Require Special Symbols</Label>
                <p className="text-[9px] text-muted-foreground">Passphrases must contain numbers and symbols.</p>
              </div>
              <Switch
                checked={!!securityDraft.require_symbols}
                onCheckedChange={(checked: boolean) =>
                  onChangeSecurityDraft({ ...securityDraft, require_symbols: checked })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold">Two-Factor Authentication (2FA / MFA)</Label>
                <p className="text-[9px] text-muted-foreground">Force users to verify logins via Google Authenticator.</p>
              </div>
              <Switch
                checked={!!securityDraft.mfa_enabled}
                onCheckedChange={(checked: boolean) =>
                  onChangeSecurityDraft({ ...securityDraft, mfa_enabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold">SSO Federated Identities</Label>
                <p className="text-[9px] text-muted-foreground">Enable login bindings for Google Workspace & Azure AD.</p>
              </div>
              <Switch
                checked={!!securityDraft.sso_enabled}
                onCheckedChange={(checked: boolean) =>
                  onChangeSecurityDraft({ ...securityDraft, sso_enabled: checked })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IP Address Restriction Range (Comma separated)</Label>
            <textarea
              rows={2}
              placeholder="e.g. 192.168.1.1, 157.48.92.0/24"
              className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background font-mono"
              value={securityDraft.allowed_ips || ''}
              onChange={(e) =>
                onChangeSecurityDraft({ ...securityDraft, allowed_ips: e.target.value })
              }
            />
          </div>

          <Button
            size="sm"
            className="text-[10px] rounded-lg h-9 font-bold px-4"
            onClick={onSaveSecurity}
          >
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* Login history logs */}
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Corporate Login Session History</CardTitle>
          <CardDescription>Auditing failed/successful workspace authentication activities logs.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3">User Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Browser / OS</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loginHistoryList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                      No login activity recorded for this tenant yet.
                    </td>
                  </tr>
                ) : (
                  loginHistoryList.map((log: LoginHistoryRecord) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                      <td className="p-3 font-bold">{log.email}</td>
                      <td className="p-3">
                        {log.status === 'success' ? (
                          <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold border-none text-[8px] rounded-md">Success</Badge>
                        ) : (
                          <Badge className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-bold border-none text-[8px] rounded-md">Failed</Badge>
                        )}
                      </td>
                      <td className="p-3 font-mono">{log.ip_address}</td>
                      <td className="p-3 text-muted-foreground">{log.user_agent} ({log.device_info})</td>
                      <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
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
