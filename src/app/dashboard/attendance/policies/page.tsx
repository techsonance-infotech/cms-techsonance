'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ScrollText,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import PolicyConfigurator from '@/components/attendance/PolicyConfigurator';
import { getStoredSessionToken, getStoredUser } from '@/lib/client-session';
import { hasFullAccess, type UserRole } from '@/lib/permissions';

export default function AttendancePoliciesPage() {
  const [tenantId, setTenantId] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const user = getStoredUser();
    const token = getStoredSessionToken();

    if (user) {
      setTenantId((user as any).tenantId || (user as any).tenant_id || '');
      setUserName(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Admin');
      
      const role = String(user.role || '').toLowerCase().replace(/[\s-]+/g, '_');
      const hasAccess = hasFullAccess(role as UserRole) || ['admin', 'super_admin', 'superadmin', 'owner', 'ceo', 'cto', 'business_owner', 'hr_manager', 'project_manager'].includes(role);
      setIsAuthorized(hasAccess);
    } else if (token) {
      // Fetch user profile from /api/auth/me if local user not cached
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data?.user) {
            setTenantId(data.user.tenantId || data.user.tenant_id || '');
            setUserName(data.user.name || `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.email || 'Admin');
            const role = String(data.user.role || '').toLowerCase().replace(/[\s-]+/g, '_');
            const hasAccess = hasFullAccess(role as UserRole) || ['admin', 'super_admin', 'superadmin', 'owner', 'ceo', 'cto', 'business_owner', 'hr_manager', 'project_manager'].includes(role);
            setIsAuthorized(hasAccess);
          } else {
            setIsAuthorized(false);
          }
        })
        .catch(() => setIsAuthorized(false));
    } else {
      setIsAuthorized(false);
    }
  }, []);

  if (isAuthorized === null) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-slate-100 dark:bg-zinc-800" />
        <div className="h-96 rounded-2xl bg-slate-100 dark:bg-zinc-800" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Attendance policy and compliance rules configuration is restricted to administrators and HR managers.
        </p>
        <Link href="/dashboard/attendance/register">
          <Button className="bg-[#f87941] hover:bg-[#e06634] text-white rounded-xl">
            Go to My Attendance
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 text-white border border-slate-800 shadow-xl">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 h-36 w-36 rounded-full bg-[#f87941]/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-1">
              <Link href="/dashboard/attendance" className="hover:text-white flex items-center gap-1 transition-colors">
                <Clock className="h-3.5 w-3.5 text-[#f87941]" />
                Attendance Hub
              </Link>
              <span>/</span>
              <span className="text-[#f87941]">Policies &amp; Compliance</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <ScrollText className="h-7 w-7 text-[#f87941]" />
              Attendance Policies &amp; Compliance Rules
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
              Configure organizational work shifts, grace periods, biometric &amp; web punch pairing, geofencing coordinates, and overtime policies.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/dashboard/attendance">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 text-xs font-bold rounded-xl border-slate-700 hover:bg-slate-800 text-slate-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Attendance Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/employees/shifts">
              <Button
                size="sm"
                className="h-9 px-3.5 text-xs font-bold rounded-xl bg-[#f87941] hover:bg-[#e06634] text-white flex items-center gap-1.5 shadow-md shadow-[#f87941]/20"
              >
                <Layers className="h-3.5 w-3.5" /> Shift Management
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Policy Configurator Component */}
      <PolicyConfigurator tenantId={tenantId} />
    </div>
  );
}
