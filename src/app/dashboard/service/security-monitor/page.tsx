// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Lock, 
  Unlock, 
  Globe, 
  Eye, 
  Server, 
  Fingerprint, 
  Sparkles,
  SlidersHorizontal,
  Flame,
  Radio,
  Search,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface ThreatRecord {
  id: string;
  sourceIp: string;
  country: string;
  type: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  status: 'blocked' | 'monitored' | 'flagged';
}

export default function ITSecurityMonitorPage() {
  const [firewallMode, setFirewallMode] = useState<'standard' | 'strict' | 'emergency'>('standard');
  const [threats, setThreats] = useState<ThreatRecord[]>([
    { id: 'THT-901', sourceIp: '185.220.101.4', country: 'Netherlands (Tor Edge)', type: 'SQL Injection Probe', timestamp: '12:04:15', severity: 'high', status: 'blocked' },
    { id: 'THT-902', sourceIp: '94.23.45.112', country: 'France', type: 'SSH Brute-Force', timestamp: '12:03:55', severity: 'high', status: 'blocked' },
    { id: 'THT-903', sourceIp: '203.0.113.50', country: 'United States', type: 'API Rate Limit Ingestion', timestamp: '12:02:10', severity: 'medium', status: 'monitored' },
    { id: 'THT-904', sourceIp: '89.163.242.18', country: 'Germany', type: 'Directory Traversal Probe', timestamp: '12:00:44', severity: 'medium', status: 'flagged' },
  ]);

  const handleFirewallChange = (mode: 'standard' | 'strict' | 'emergency') => {
    setFirewallMode(mode);
    if (mode === 'emergency') {
      toast.warning("EMERGENCY SYSTEM LOCK ACTIVATED: Firewall set to quarantine zone, all external ingress blocked except VPN!");
    } else {
      toast.success(`Firewall rule set to ${mode} mode.`);
    }
  };

  const handleSystemLock = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Broadcasting lock instructions to active service threads...',
        success: 'All multi-tenant API scopes safely locked. Operator clearance required to unlock.',
        error: 'Scope locking unsuccessful.',
      }
    );
  };

  const handleWhitelistIp = (ip: string) => {
    toast.success(`IP ${ip} temporarily white-listed on network interfaces.`);
  };

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e1b4b] via-[#311042] to-[#111827] p-6 text-white shadow-xl border border-purple-950/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-violet-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="h-4 w-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">Security Command center</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
              IT Infrastructure Security Monitor
            </h2>
            <p className="text-sm text-purple-200 mt-1 max-w-xl">
              Inspect multi-tenant packet capture logs, verify active DDoS rules, and toggle emergency quarantine firewalls.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-purple-800 bg-purple-950 text-white hover:bg-purple-900" onClick={handleSystemLock}>
              <Lock className="mr-1.5 h-4 w-4 text-rose-500" /> Lock All Sessions
            </Button>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white border-none shadow-sm font-bold" onClick={() => toast.success("Security status logs downloaded.")}>
              Download Threat Report
            </Button>
          </div>
        </div>
      </div>

      {/* Security Telemetry Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        
        {/* Active DDoS Prevention */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Blocked Ingress (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">1,482 IPs</div>
            <p className="text-[10px] text-muted-foreground mt-2">DDoS automated rule mitigations</p>
          </CardContent>
        </Card>

        {/* Global Security Index */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Security Integrity Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">98.4%</div>
            <p className="text-[10px] text-muted-foreground mt-2">Optimal system partition defense</p>
          </CardContent>
        </Card>

        {/* Threat Level */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30 border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Threat Level Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">ELEVATED</div>
            <p className="text-[10px] text-muted-foreground mt-2">Active target network probes</p>
          </CardContent>
        </Card>

        {/* SSL Expiration */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Global Cert Validities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-600">28 days left</div>
            <p className="text-[10px] text-muted-foreground mt-2">Auto-renewal scheduled next week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Firewall & Logs Matrix */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Threat Logs */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Intrusion Detection Telemetry</CardTitle>
                <CardDescription>Live packet analyzer threat logs matching threat feeds</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-xs font-semibold text-muted-foreground uppercase bg-slate-50 dark:bg-zinc-900/50">
                  <th className="p-3">Threat ID</th>
                  <th className="p-3">Source IP</th>
                  <th className="p-3">Attack Vector</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Action Status</th>
                  <th className="p-3 text-right">Overrides</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {threats.map(threat => (
                  <tr key={threat.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="p-3 font-bold font-mono text-purple-600">{threat.id}</td>
                    <td className="p-3">
                      <p className="font-bold text-zinc-900 dark:text-zinc-50">{threat.sourceIp}</p>
                      <p className="text-[10px] text-muted-foreground">{threat.country}</p>
                    </td>
                    <td className="p-3 text-xs">{threat.type}</td>
                    <td className="p-3 text-xs font-mono">{threat.timestamp}</td>
                    <td className="p-3">
                      <Badge className={`text-[9px] uppercase font-bold ${
                        threat.severity === 'high' ? 'bg-rose-500 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        {threat.severity}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[9px] uppercase ${
                        threat.status === 'blocked' ? 'border-emerald-500 text-emerald-600' :
                        'border-amber-500 text-amber-600'
                      }`}>
                        {threat.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="xs" variant="outline" className="text-[10px] h-7" onClick={() => handleWhitelistIp(threat.sourceIp)}>
                        Whitelist
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Firewall Controls */}
        <Card>
          <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
            <CardTitle>Firewall Safeguards</CardTitle>
            <CardDescription>Configure external partition traffic levels</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            
            {/* Standard Mode */}
            <div className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
              firewallMode === 'standard' ? 'bg-indigo-50/60 border-indigo-500 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/40'
            }`} onClick={() => handleFirewallChange('standard')}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Standard Ingress</h4>
                {firewallMode === 'standard' && <Badge className="bg-indigo-600 text-white text-[9px]">ACTIVE</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">Standard tenant routing configuration. Allows SSL handshakes and normal ports.</p>
            </div>

            {/* Strict Mode */}
            <div className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
              firewallMode === 'strict' ? 'bg-indigo-50/60 border-indigo-500 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/40'
            }`} onClick={() => handleFirewallChange('strict')}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" /> Strict Ingress</h4>
                {firewallMode === 'strict' && <Badge className="bg-indigo-600 text-white text-[9px]">ACTIVE</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">Enforces rate-limits strictly, blocks suspicious cloud proxy nodes automatically.</p>
            </div>

            {/* Emergency Mode */}
            <div className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
              firewallMode === 'emergency' ? 'bg-rose-50/60 border-rose-500 dark:bg-rose-950/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/40'
            }`} onClick={() => handleFirewallChange('emergency')}>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-bold text-rose-600 flex items-center gap-1.5"><Flame className="h-4 w-4 text-rose-500 animate-pulse" /> Emergency quarantine</h4>
                {firewallMode === 'emergency' && <Badge className="bg-rose-600 text-white text-[9px]">ACTIVE</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">Total isolation zone. Block all ports. Operator console accessible via local loopback only.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
