'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Eye, EyeOff, Rocket, Check, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  clearClientSession,
  getStoredSessionToken,
  getStoredUser,
  persistClientSession,
  shouldRememberSession,
} from '@/lib/client-session';
import { LegalModal } from '@/components/auth/legal-modal';

export default function LoginPage() {
  const router = useRouter();
  
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');

  const openLegalModal = (type: 'terms' | 'privacy') => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);

  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    setRememberMe(shouldRememberSession());
  }, []);

  useEffect(() => {
    async function restoreRememberedSession() {
      const token = getStoredSessionToken();

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        let currentToken = token;
        let response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        if (response.status === 401) {
          // Access token is expired, try to refresh
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData.accessToken || refreshData.token;
            const newUser = refreshData.user;
            if (newToken && newUser) {
              currentToken = newToken;
              persistClientSession({
                accessToken: newToken,
                user: newUser,
                rememberMe: true,
              });
              // Retry fetching the profile
              response = await fetch('/api/auth/me', {
                headers: {
                  Authorization: `Bearer ${currentToken}`,
                },
              });
            }
          }
        }

        if (!response.ok) {
          clearClientSession();
          setCheckingSession(false);
          return;
        }

        const data = await response.json();
        const user = data?.user ?? data?.data ?? getStoredUser();

        if (!user) {
          clearClientSession();
          setCheckingSession(false);
          return;
        }

        persistClientSession({
          accessToken: currentToken,
          user,
          rememberMe: shouldRememberSession(),
        });

        router.replace('/dashboard');
        router.refresh();
      } catch {
        setCheckingSession(false);
        return;
      }
    }

    restoreRememberedSession();
  }, [router]);

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResendStatus('loading');
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResendStatus('error');
        setResendMessage(data.message || 'Failed to resend verification email.');
        return;
      }

      setResendStatus('success');
      setResendMessage('A new verification link has been sent to your email.');
    } catch (err) {
      setResendStatus('error');
      setResendMessage('Failed to resend verification email.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnverifiedEmail(null);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(email);
          setResendStatus('idle');
        } else {
          toast.error(data.message || 'Unable to sign in. Please check your credentials and try again.');
        }
        setLoading(false);
        return;
      }

      if (data.accessToken || data.token) {
        persistClientSession({
          accessToken: data.accessToken || data.token,
          user: data.user,
          rememberMe,
        });
      }

      // Redirect straight to onboarding if business details are not filled yet, else to dashboard
      if (data.requiresOnboarding) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      toast.error('Unable to sign in right now. Please try again.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background font-sans relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl -ml-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl -mr-48 -mb-48 pointer-events-none" />
        
        <div className="flex flex-col items-center justify-center space-y-6 z-10">
          <div className="relative h-16 w-16 bg-card border border-border rounded-2xl p-2.5 flex items-center justify-center shadow-xl overflow-hidden animate-pulse">
            <Image src="/logo-icon.png" alt="TechSonance Logo" width={48} height={48} className="object-contain" />
          </div>
          
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-bold text-foreground tracking-wide uppercase">Securing Session</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Please wait while we verify your workspace credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Left Column: Visuals & Branding */}
      <div className="hidden lg:block lg:w-1/2 relative h-full overflow-hidden bg-slate-900">
        {imageLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 z-10 animate-pulse">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute w-24 h-24 border border-[#F87941]/30 rounded-full animate-ping duration-1000" />
              {/* Inner spinner */}
              <div className="w-16 h-16 border-2 border-t-transparent border-[#F87941] rounded-full animate-spin" />
              {/* Center icon */}
              <div className="absolute text-2xl">🖼️</div>
            </div>
            <p className="mt-4 text-xs font-semibold text-slate-400 tracking-wider uppercase animate-bounce">
              Loading workspace visuals...
            </p>
          </div>
        )}
        <Image
          src="/login-left-banner.jpg"
          alt="CMS Portal Banner"
          fill
          className="object-cover"
          priority
          onLoad={() => setImageLoading(false)}
        />
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-[#0A1A2F] p-6 lg:p-12 relative overflow-y-auto lg:overflow-hidden">
        {/* Dot Grid Top Right */}
        <div className="absolute top-8 right-8 grid grid-cols-4 gap-2 opacity-15 pointer-events-none hidden lg:grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
          ))}
        </div>

        <div className="w-full max-w-md space-y-5 animate-in fade-in slide-in-from-right duration-500 my-auto">
          {/* Logo */}
          <div className="flex justify-center mb-4 animate-in slide-in-from-top duration-700">
            <div className="relative h-[130px] w-full max-w-[360px]">
              <Image
                src="/logo.png"
                alt="TechSonance CMS"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="space-y-1.5 text-center mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Welcome Back! 👋
            </h2>
            <p className="text-muted-foreground text-sm">
              Login to your CMS portal to continue
            </p>
          </div>

          {unverifiedEmail && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-xs space-y-3 animate-in fade-in slide-in-from-top duration-300">
              <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  Your email address is not verified yet. Please check your inbox or click below to resend the verification link.
                </div>
              </div>

              {resendMessage && (
                <div className={`p-2.5 rounded-lg font-bold ${resendStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/30'}`}>
                  {resendMessage}
                </div>
              )}

              {resendStatus !== 'success' && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendStatus === 'loading'}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:opacity-95 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {resendStatus === 'loading' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Resending link...
                    </>
                  ) : (
                    'Resend Verification Link'
                  )}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                Email / Username
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 border-border bg-card focus-visible:ring-primary focus-visible:border-primary rounded-xl"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 border-border bg-card focus-visible:ring-primary focus-visible:border-primary rounded-xl"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-slate-300 flex h-[18px] w-[18px] items-center justify-center rounded-md shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-semibold text-slate-655 dark:text-slate-400 cursor-pointer select-none"
                >
                  Keep me logged in
                </label>
              </div>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-sm font-bold text-primary hover:text-[var(--primary-hover)] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold text-white bg-primary hover:bg-[var(--primary-hover)] transition-all rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="font-bold text-primary hover:underline underline-offset-4 cursor-pointer"
            >
              Register Workspace
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400 mt-4 text-center">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Secure login protected by enterprise-grade security</span>
            </div>
            <span className="text-[10px] text-slate-400/60 mt-1">&copy; {new Date().getFullYear()} TechSonance InfoTech LLP. All rights reserved.</span>
            
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400/80 font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => openLegalModal('terms')}
                className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
              >
                Terms of Service
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => openLegalModal('privacy')}
                className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>

      <LegalModal
        isOpen={legalModalOpen}
        onClose={setLegalModalOpen}
        type={legalModalType}
      />
    </div>
  );
}
