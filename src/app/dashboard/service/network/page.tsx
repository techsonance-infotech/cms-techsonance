// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { 
  Server, 
  Cpu, 
  Activity, 
  RefreshCw, 
  Zap, 
  Database, 
  Wifi, 
  AlertOctagon, 
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Search,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface NetworkNode {
  id: string;
  name: string;
  region: string;
  ping: number;
  cpu: number;
  memory: number;
  status: 'operational' | 'degraded' | 'offline';
}

export default function ITNetworkDetailPage() {
  const [nodes, setNodes] = useState<NetworkNode[]>([
    { id: 'node-us-01', name: 'US-East primary API', region: 'N. Virginia', ping: 14, cpu: 32, memory: 54, status: 'operational' },
    { id: 'node-eu-02', name: 'EU-West CDN edge', region: 'Frankfurt', ping: 26, cpu: 84, memory: 72, status: 'degraded' },
    { id: 'node-ap-03', name: 'AP-South Database Mirror', region: 'Mumbai', ping: 38, cpu: 15, memory: 41, status: 'operational' },
    { id: 'node-sa-04', name: 'SA-East Failover Broker', region: 'São Paulo', ping: 112, cpu: 0, memory: 0, status: 'offline' },
  ]);

  const handleNodeReboot = (id: string, name: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `Initiating hardware power-cycle for node ${id}...`,
        success: `Node ${name} successfully rebooted and re-joined cluster.`,
        error: 'Failed to power-cycle node.',
      }
    );
    setNodes(prev => prev.map(node => node.id === id ? { ...node, status: 'operational', cpu: 12, memory: 28, ping: 15 } : node));
  };

  const handlePurgeCache = () => {
    toast.success("All edge node cache files purged across standard zones.");
  };

  const handleRerouteLoad = () => {
    toast.info("Rerouting load dynamically from degraded EU-West cluster to US-East primary.");
  };

  return (
    <div className="space-y-6 p-1 max-w-[1600px] mx-auto">
      
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1c30] to-[#213145] p-6 text-white shadow-xl border border-blue-900/40">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="absolute left-1/3 bottom-0 -mb-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Infrastructure Detail Telemetry</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              Network Services & Node Telemetry
            </h2>
            <p className="text-sm text-blue-200 mt-1 max-w-xl">
              Inspect multi-tenant server cluster metrics, load balancing ratios, and issue rapid telemetry mitigation overrides.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-blue-800 bg-blue-950 text-white hover:bg-blue-900" onClick={handlePurgeCache}>
              Purge CDN Cache
            </Button>
            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-none shadow-sm font-bold" onClick={handleRerouteLoad}>
              Reroute Load
            </Button>
          </div>
        </div>
      </div>

      {/* Network Health Bento Box */}
      <div className="grid gap-6 md:grid-cols-4">
        
        {/* Overall Cluster Uptime */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cluster Uptime (30d)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center">
            <div className="text-3xl font-black text-cyan-600">99.98%</div>
            <p className="text-[10px] text-muted-foreground mt-2">Exceeds standard multi-tenant SLA target</p>
          </CardContent>
        </Card>

        {/* Global Average Ping */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Average Ping</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center">
            <div className="text-3xl font-black text-emerald-600">22 ms</div>
            <p className="text-[10px] text-muted-foreground mt-2">Ultra-low latency connection grid</p>
          </CardContent>
        </Card>

        {/* Average CPU Thermal */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Node Load</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center">
            <div className="text-3xl font-black text-indigo-600">44.2%</div>
            <p className="text-[10px] text-muted-foreground mt-2">Balanced resource allocation</p>
          </CardContent>
        </Card>

        {/* Uptime Alert Status */}
        <Card className="border-none shadow-sm relative overflow-hidden bg-slate-50/50 dark:bg-zinc-900/30 border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Anomalies</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center">
            <div className="text-3xl font-black text-amber-600">2 Warnings</div>
            <p className="text-[10px] text-muted-foreground mt-2">1 node offline, 1 edge degraded</p>
          </CardContent>
        </Card>
      </div>

      {/* Rack & Server Visualization Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Telemetry Hardware Rack Nodes */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Regional Node Rack</CardTitle>
                <CardDescription>Real-time physical CPU cluster telemetry and reboot triggers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {nodes.map(node => (
              <div key={node.id} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${
                    node.status === 'operational' ? 'bg-emerald-50 text-emerald-600' :
                    node.status === 'degraded' ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{node.name}</h4>
                    <p className="text-xs text-muted-foreground">{node.region} • <span className="font-mono">{node.id}</span></p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Latency</p>
                    <p className="font-bold text-zinc-900 dark:text-zinc-50">{node.ping} ms</p>
                  </div>
                  <div className="w-24">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">CPU Load ({node.cpu}%)</p>
                    <Progress value={node.cpu} className="h-1 bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="w-24">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Memory ({node.memory}%)</p>
                    <Progress value={node.memory} className="h-1 bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div>
                    <Badge className={`text-[9px] uppercase font-bold ${
                      node.status === 'operational' ? 'bg-emerald-500 text-white' :
                      node.status === 'degraded' ? 'bg-amber-500 text-white animate-pulse' :
                      'bg-rose-500 text-white'
                    }`}>
                      {node.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Button size="xs" variant="outline" className="h-7 text-xs" onClick={() => handleNodeReboot(node.id, node.name)}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Reboot
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Load Balancer Allocation percentages */}
        <Card>
          <CardHeader className="pb-3 border-b dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20">
            <CardTitle>Load Distribution</CardTitle>
            <CardDescription>Cluster routing and load ratios</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-blue-500" /> US-East Cluster</span>
                <span className="text-blue-500">40% load</span>
              </div>
              <Progress value={40} className="h-2 bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-amber-500" /> EU-West cluster</span>
                <span className="text-amber-500">35% load</span>
              </div>
              <Progress value={35} className="h-2 bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-indigo-500" /> AP-South cluster</span>
                <span className="text-indigo-500">25% load</span>
              </div>
              <Progress value={25} className="h-2 bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="border-t pt-4 text-xs text-muted-foreground flex flex-col gap-1.5">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Active DNS Policy:</p>
              <p>Geo-Proximity Routing with automated health-check failovers.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
