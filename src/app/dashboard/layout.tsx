'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { User } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { AppErrorBoundary } from '@/components/ui/app-error-boundary';
import { clearClientSession, getStoredSessionToken } from '@/lib/client-session';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const token = getStoredSessionToken();
      
      if (!token) {
        setIsRedirecting(true);
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!response.ok) {
          clearClientSession();
          setIsRedirecting(true);
          router.push('/login');
          return;
        }

        const data = await response.json();
        const loggedUser = (data?.user ?? data?.data ?? null) as User | null;
        setUser(loggedUser);

        if (loggedUser) {
          // Check onboarding and license expiry
          const settingsRes = await fetch(`/api/company-settings?t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });

          if (settingsRes.ok) {
            const settingsRawText = await settingsRes.text();
            const settingsData = JSON.parse(settingsRawText);
            const settings = settingsData?.data;

            // Enforce onboarding check
            if (!settings || !settings.companyName || !settings.phone) {
              setIsRedirecting(true);
              router.push('/onboarding');
              return;
            }

            // Enforce trial key verification
            const licenseExpiresAt = settings.tenant?.licenseExpiresAt;
            if (licenseExpiresAt && new Date(licenseExpiresAt) < new Date()) {
              setIsLicenseExpired(true);
              setLicenseExpiryDate(licenseExpiresAt);
            }
          }
        }
      } catch (error) {
        setIsRedirecting(true);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isLicenseExpired) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-[#07111E] overflow-hidden font-sans items-center justify-center p-6 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="w-full max-w-lg bg-white dark:bg-[#0A1A2F] p-8 rounded-3xl border border-rose-500/10 shadow-2xl text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span className="text-4xl">🔒</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Evaluation Trial Expired
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              Your 14-day free trial period for the workspace has ended. To resume managing your business, please active your workspace license.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-left text-xs font-semibold">
            <div className="space-y-1">
              <span className="text-slate-400">Workspace Status</span>
              <p className="text-rose-600 font-bold">Suspended</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400">Trial Ended On</span>
              <p className="text-slate-800 dark:text-slate-200">
                {licenseExpiryDate ? new Date(licenseExpiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Expired'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                clearClientSession();
                router.push('/login');
              }}
              className="flex-1 h-11 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-xs transition-all"
            >
              Sign Out
            </button>
            <a
              href="mailto:support@techsonance.com?subject=Activate Workspace License"
              className="flex-1 h-11 bg-gradient-to-r from-[#245C80] to-[#337BAA] hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center shadow-md transition-all"
            >
              Contact Corporate Billing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <DashboardHeader user={user} />
        <main className="flex-1 p-6 overflow-y-auto">
          <AppErrorBoundary title="Dashboard module unavailable" description="We couldn't render this dashboard section.">
            {children}
          </AppErrorBoundary>
        </main>
      </div>
    </div>
  );
}
