'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
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
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
          accessToken: token,
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
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Restoring your session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Left Column: Visuals & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center p-12 bg-brand-gradient text-white gap-12">
        <div className="relative z-10 w-full flex flex-col items-center text-center">
          <div className="flex flex-col items-center gap-4 mb-2 animate-in slide-in-from-top duration-700">
            <div className="relative h-14 w-14 bg-white rounded-2xl p-2 flex items-center justify-center border border-slate-100 shadow-md">
              <Image
                src="/logo-icon.png"
                alt="TechSonance Logo"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              TechSonance InfoTech LLP
            </span>
          </div>
          
          <p className="text-sm font-semibold text-white/80 whitespace-nowrap animate-in fade-in duration-1000 delay-300">
            Empowering Businesses with Scalable Tech Solutions
          </p>
        </div>

        <div className="relative w-full aspect-square max-w-[420px] animate-in zoom-in duration-1000 delay-500 bg-white/5 backdrop-blur-xs rounded-2xl p-6 border border-white/10 shadow-2xl flex items-center justify-center">
           <Image
             src="/login-illustration.png"
             alt="CMS Portal Illustration"
             fill
             className="object-contain p-4"
             priority
           />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-white/60 font-semibold whitespace-nowrap">
          <span>&copy; {new Date().getFullYear()} TechSonance InfoTech LLP. All rights reserved.</span>
        </div>
        
        {/* Subtle Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48" />
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-[#0A1A2F] p-8 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right duration-500">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="relative h-16 w-16">
              <Image
                src="/logo-icon.png"
                alt="TechSonance InfoTech"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              CMS Portal
            </h1>
            <p className="text-muted-foreground text-sm">
              Login to manage your business seamlessly
            </p>
          </div>

          <div className="mt-8">
            {unverifiedEmail && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-xs space-y-3 animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                  <span className="text-base shrink-0 mt-0.5">⚠️</span>
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

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="email">Email / Username</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus-visible:ring-primary h-12"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 focus-visible:ring-primary h-12"
                    autoComplete="new-password"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                    className="data-[state=checked]:bg-primary flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Keep me logged in
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="font-extrabold text-primary hover:underline underline-offset-4 cursor-pointer"
              >
                Register Workspace
              </button>
            </div>

            <div className="mt-8 text-center sm:hidden">
               <p className="text-xs text-muted-foreground">
                  Powered by <span className="font-semibold text-primary">TechSonance InfoTech LLP</span>
               </p>
            </div>
            

          </div>
        </div>
      </div>
    </div>
  );
}
