'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Download, Plus, Users, Badge as BadgeIcon, ShieldCheck, MoreVertical,
  Network, Briefcase, Users2, Shield, Smartphone, Laptop, Monitor,
  XCircle, Search, TrendingUp
} from 'lucide-react';

export default function UserPermissionsAccessControl() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Permissions & Access Control</h2>
          <p className="text-sm font-medium text-muted-foreground">Define roles, manage granular permissions, and configure security policies for your organization.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2 font-semibold">
            <Download className="h-4 w-4" /> Export Audit Log
          </Button>
          <Button className="gap-2 font-bold shadow-sm">
            <Plus className="h-4 w-4" /> Create Custom Role
          </Button>
        </div>
      </div>

      {/* Summary Stats (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Users</span>
              <div className="p-2 bg-secondary text-primary dark:bg-primary-light/10 dark:text-primary-light rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="text-4xl font-black text-slate-900 dark:text-white block">1,284</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1 mt-2 uppercase tracking-wider">
                <TrendingUp className="h-3 w-3" /> +12% from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Roles</span>
              <div className="p-2 bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-300 rounded-lg">
                <BadgeIcon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="text-4xl font-black text-slate-900 dark:text-white block">8</span>
              <span className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-wider italic">
                4 System, 4 Custom
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-zinc-800 md:col-span-2 overflow-hidden relative bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
          <CardContent className="p-6 flex items-center gap-6 h-full">
            <div className="flex-1">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-3">Security Health</span>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-black text-emerald-600 dark:text-emerald-500">94%</span>
                <div className="h-3 flex-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[94%]"></div>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                2-Step Verification is active for 98% of users. Session limits enforced.
              </p>
            </div>
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shrink-0 border-4 border-emerald-50 dark:border-emerald-900/10">
              <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Workspace: Roles & Permission Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Role Management List */}
        <Card className="lg:col-span-4 shadow-sm border-slate-200 dark:border-zinc-800 flex flex-col h-fit">
          <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 py-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold">Role Management</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreVertical className="h-4 w-4" /></Button>
          </CardHeader>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            
            {/* Role Item Active */}
            <div className="p-4 bg-secondary/40 dark:bg-primary-light/5 border-l-4 border-l-primary cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Super Admin</span>
                <Badge className="bg-primary text-white font-bold uppercase tracking-wider text-[10px]">SYSTEM</Badge>
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>3 Users</span>
                <span>Created Jan 2023</span>
              </div>
            </div>

            {/* Role Items */}
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group border-l-4 border-l-transparent">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary-light transition-colors">Manager</span>
                <Badge variant="secondary" className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">SYSTEM</Badge>
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>12 Users</span>
                <span>Created Feb 2023</span>
              </div>
            </div>

            <div className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group border-l-4 border-l-transparent">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary-light transition-colors">Editor</span>
                <Badge variant="secondary" className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">SYSTEM</Badge>
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>45 Users</span>
                <span>Created Mar 2023</span>
              </div>
            </div>

            <div className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group border-l-4 border-l-transparent">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary-light transition-colors">Viewer</span>
                <Badge variant="secondary" className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">SYSTEM</Badge>
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>1,224 Users</span>
                <span>Created Mar 2023</span>
              </div>
            </div>

            <div className="p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group border-l-4 border-l-transparent">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-primary-light transition-colors">Support Tier 1</span>
                <Badge variant="secondary" className="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 font-bold uppercase tracking-wider text-[10px]">CUSTOM</Badge>
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>5 Users</span>
                <span>Created Oct 2023</span>
              </div>
            </div>

          </div>
        </Card>

        {/* Permission Matrix & Security Policies */}
        <div className="lg:col-span-8 space-y-6">
          
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 flex flex-row justify-between items-center py-4">
              <div>
                <CardTitle className="text-lg font-bold">Permissions Matrix: Super Admin</CardTitle>
                <CardDescription className="text-xs font-semibold mt-1">Configure specific action-level overrides for this role.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Inherit all permissions</span>
                <Switch defaultChecked />
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-zinc-900/30">
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Module</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Create</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Read</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Update</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Delete</th>
                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  
                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <Network className="h-4 w-4 text-primary dark:text-primary-light" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">CRM Modules</span>
                    </td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-primary dark:text-primary-light" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Financial Records (ERP)</span>
                    </td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <Users2 className="h-4 w-4 text-primary dark:text-primary-light" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Employee Data (HRM)</span>
                    </td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <Shield className="h-4 w-4 text-primary dark:text-primary-light" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">IAM & Identity</span>
                    </td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                    <td className="p-4 text-center"><Checkbox defaultChecked className="border-slate-300 dark:border-zinc-700" /></td>
                  </tr>

                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-3">
              <Button variant="ghost" className="font-bold text-muted-foreground">Discard Changes</Button>
              <Button className="font-bold shadow-sm">Save Matrix</Button>
            </div>
          </Card>

          {/* Security Policies Section */}
          <Card className="shadow-sm border-slate-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold">Global Security Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Multi-Factor Authentication (MFA)</label>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-full h-10 font-medium">
                        <SelectValue placeholder="Select MFA requirement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Required for all users</SelectItem>
                        <SelectItem value="admin">Required for Admins only</SelectItem>
                        <SelectItem value="optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs font-medium text-muted-foreground">Force users to verify via SMS, Email, or Authenticator app.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Password Rotation</label>
                    <div className="flex items-center gap-3">
                      <Input type="number" defaultValue="90" className="w-24 h-10 font-mono font-bold" />
                      <span className="text-sm font-medium text-muted-foreground">Days until expiry</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Session Timeout Configuration</label>
                    <Select defaultValue="15m">
                      <SelectTrigger className="w-full h-10 font-medium">
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15m">15 Minutes of inactivity</SelectItem>
                        <SelectItem value="30m">30 Minutes of inactivity</SelectItem>
                        <SelectItem value="1h">1 Hour of inactivity</SelectItem>
                        <SelectItem value="never">Never timeout</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-xs font-medium text-muted-foreground">Automatically logout users after a period of idleness.</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Limit concurrent sessions</span>
                    </div>
                    <Switch />
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* High-Density Active Sessions Table */}
      <Card className="shadow-sm border-slate-200 dark:border-zinc-800 overflow-hidden">
        <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 flex flex-row flex-wrap justify-between items-center py-4 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle className="text-sm font-bold">Active Admin Sessions</CardTitle>
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary transition-shadow">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input className="border-none bg-transparent p-0 text-sm font-medium focus:ring-0 outline-none placeholder:text-muted-foreground w-40" placeholder="Search admins..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Showing 4 active sessions</span>
            <Button variant="link" className="text-rose-600 dark:text-rose-500 font-bold p-0 h-auto hover:text-rose-700">Terminate All</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-900/30">
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">IP Address</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Device</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Started</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              
              <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-primary font-bold text-xs shrink-0 flex items-center justify-center">JD</div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">John Doe</p>
                    <p className="text-xs font-medium text-muted-foreground">john.d@enterprise.com</p>
                  </div>
                </td>
                <td className="p-4 font-mono font-medium text-sm text-muted-foreground">192.168.1.142</td>
                <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">New York, USA</td>
                <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-muted-foreground" /> macOS • Chrome
                  </div>
                </td>
                <td className="p-4 text-sm font-medium text-muted-foreground">24 mins ago</td>
                <td className="p-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">SK</div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Sarah Klein</p>
                    <p className="text-xs font-medium text-muted-foreground">s.klein@enterprise.com</p>
                  </div>
                </td>
                <td className="p-4 font-mono font-medium text-sm text-muted-foreground">104.22.41.9</td>
                <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">Berlin, DE</td>
                <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" /> Windows • Edge
                  </div>
                </td>
                <td className="p-4 text-sm font-medium text-muted-foreground">1 hour ago</td>
                <td className="p-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </td>
              </tr>

              <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xs shrink-0">MT</div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Marcus Thorne</p>
                    <p className="text-xs font-medium text-muted-foreground">m.thorne@enterprise.com</p>
                  </div>
                </td>
                <td className="p-4 font-mono font-medium text-sm text-muted-foreground">82.14.99.214</td>
                <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">London, UK</td>
                <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" /> iPhone • Safari
                  </div>
                </td>
                <td className="p-4 text-sm font-medium text-muted-foreground">Just now</td>
                <td className="p-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
