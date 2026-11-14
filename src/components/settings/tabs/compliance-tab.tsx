'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export interface ComplianceSettings {
  gdpr_enabled?: boolean;
  soc2_enabled?: boolean;
  iso_enabled?: boolean;
  hipaa_enabled?: boolean;
  data_residency?: string;
  retention_years?: number;
  consent_required?: boolean;
  cookie_policy?: string;
}

export interface ComplianceTabProps {
  complianceDraft: ComplianceSettings;
  onChangeComplianceDraft: (draft: ComplianceSettings) => void;
  onSaveCompliance: () => void;
}

export function ComplianceTab({
  complianceDraft,
  onChangeComplianceDraft,
  onSaveCompliance,
}: ComplianceTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Regulatory & Consent Frameworks</CardTitle>
          <CardDescription>Govern data processing compliance and local data residency partitions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">GDPR Compliance Flag</Label>
                  <p className="text-[9px] text-muted-foreground">Enforce cookies consent and data removal logs.</p>
                </div>
                <Switch
                  checked={!!complianceDraft.gdpr_enabled}
                  onCheckedChange={(checked: boolean) =>
                    onChangeComplianceDraft({ ...complianceDraft, gdpr_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">SOC2 Audit Framework</Label>
                  <p className="text-[9px] text-muted-foreground">Enforce storage lifecycle logs compliance checks.</p>
                </div>
                <Switch
                  checked={!!complianceDraft.soc2_enabled}
                  onCheckedChange={(checked: boolean) =>
                    onChangeComplianceDraft({ ...complianceDraft, soc2_enabled: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">ISO 27001 Certification</Label>
                  <p className="text-[9px] text-muted-foreground">Track structural settings change history.</p>
                </div>
                <Switch
                  checked={!!complianceDraft.iso_enabled}
                  onCheckedChange={(checked: boolean) =>
                    onChangeComplianceDraft({ ...complianceDraft, iso_enabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">HIPAA Health Standards</Label>
                  <p className="text-[9px] text-muted-foreground">Strict encryption key rotations for health records.</p>
                </div>
                <Switch
                  checked={!!complianceDraft.hipaa_enabled}
                  onCheckedChange={(checked: boolean) =>
                    onChangeComplianceDraft({ ...complianceDraft, hipaa_enabled: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Database Data Residency Region
              </Label>
              <select
                className="w-full text-xs rounded-xl border border-border px-3 outline-none focus-visible:ring-primary/20 bg-background font-sans h-10"
                value={complianceDraft.data_residency || 'US-East'}
                onChange={(e) =>
                  onChangeComplianceDraft({ ...complianceDraft, data_residency: e.target.value })
                }
              >
                <option value="US-East">US East (N. Virginia)</option>
                <option value="EU-West">EU West (Ireland)</option>
                <option value="AP-South">Asia Pacific (Mumbai)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Legal Data Retention Policy (Years)
              </Label>
              <Input
                type="number"
                min="1"
                max="25"
                className="text-xs rounded-xl h-10"
                value={complianceDraft.retention_years || 7}
                onChange={(e) =>
                  onChangeComplianceDraft({ ...complianceDraft, retention_years: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/20">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold">Explicit Cookie consent agreement</Label>
              <p className="text-[9px] text-muted-foreground">Display cookies disclaimer to guest visitors.</p>
            </div>
            <Switch
              checked={!!complianceDraft.consent_required}
              onCheckedChange={(checked: boolean) =>
                onChangeComplianceDraft({ ...complianceDraft, consent_required: checked })
              }
            />
          </div>

          {complianceDraft.consent_required && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cookie Consent Message Body
              </Label>
              <textarea
                rows={3}
                className="w-full text-xs rounded-xl border border-border p-3 outline-none focus-visible:ring-primary/20 bg-background"
                value={complianceDraft.cookie_policy || ''}
                onChange={(e) =>
                  onChangeComplianceDraft({ ...complianceDraft, cookie_policy: e.target.value })
                }
              />
            </div>
          )}

          <Button
            size="sm"
            className="text-[10px] rounded-lg h-9 font-bold px-4"
            onClick={onSaveCompliance}
          >
            Save Compliance Policies
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
