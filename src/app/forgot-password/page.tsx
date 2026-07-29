'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, KeyRound, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type ResetStep = 1 | 2 | 3;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const stepItems = useMemo(() => ([
    { id: 1, icon: Mail, label: 'Email' },
    { id: 2, icon: KeyRound, label: 'Verify' },
    { id: 3, icon: Lock, label: 'Reset' },
  ]), []);

  const hasMinLength = newPassword.length >= 12;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
  const isFormValid = isPasswordStrong && passwordsMatch;

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Unable to send the verification code right now. Please try again.');
        return;
      }

      toast.success('If the email exists, a verification code has been sent.');
      setStep(2);
    } catch {
      toast.error('Unable to send the verification code right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Unable to verify the code. Please try again.');
        return;
      }

      toast.success('Verification code accepted.');
      setStep(3);
    } catch {
      toast.error('Unable to verify the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Unable to reset your password right now. Please try again.');
        return;
      }

      toast.success('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch {
      toast.error('Unable to reset your password right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Left Column: Visuals & Branding */}
      <div className="hidden lg:block lg:w-1/2 relative h-full overflow-hidden">
        <Image
          src="/login-left-banner.jpg"
          alt="CMS Portal Banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-card p-8 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right duration-500">
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
              Forgot Password
            </h1>
            <p className="text-muted-foreground text-sm">
              Verify your email, confirm the OTP, and set a new password
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            {stepItems.map((item, index) => {
              const isActive = step >= item.id;
              const Icon = item.icon;

              return (
                <div key={item.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </div>
                  {index < stepItems.length - 1 ? (
                    <div className={`mx-3 h-1 flex-1 rounded-full ${step > item.id ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                  ) : null}
                </div>
              );
            })}
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-5" autoComplete="off">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-foreground/80 uppercase tracking-wide">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-11 h-12 border-border bg-card focus-visible:ring-primary focus-visible:border-primary rounded-xl hover:border-muted-foreground/30 transition-colors duration-200"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold text-white bg-primary hover:bg-[var(--primary-hover)] transition-all rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : 'Send OTP'}
              </Button>
            </form>
          ) : null}

          {step === 2 ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5" autoComplete="off">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wide">Enter 6-digit OTP</Label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  containerClassName="justify-between"
                >
                  <InputOTPGroup className="w-full justify-between gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-12 w-12 rounded-xl border border-border text-base font-bold bg-card focus-visible:ring-primary focus-visible:border-primary"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-xs text-muted-foreground">
                  We sent the OTP to <span className="font-semibold text-primary">{email}</span>
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-border bg-card rounded-xl font-bold text-foreground cursor-pointer"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                  }}
                  disabled={loading}
                >
                  Change Email
                </Button>
                <Button
                  type="submit"
                  className="h-12 text-base font-bold text-white bg-primary hover:bg-[var(--primary-hover)] transition-all rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : 'Verify OTP'}
                </Button>
              </div>
            </form>
          ) : null}

          {step === 3 ? (
            <form onSubmit={handleResetPassword} className="space-y-5" autoComplete="off">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-bold text-foreground/80 uppercase tracking-wide">New Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="pl-11 h-12 border-border bg-card focus-visible:ring-primary focus-visible:border-primary rounded-xl hover:border-muted-foreground/30 transition-colors duration-200"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    minLength={12}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-bold text-foreground/80 uppercase tracking-wide">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="pl-11 h-12 border-border bg-card focus-visible:ring-primary focus-visible:border-primary rounded-xl hover:border-muted-foreground/30 transition-colors duration-200"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    minLength={12}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Strength Panel */}
              {newPassword !== '' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-2 animate-in fade-in duration-200">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Security Strength Indicators
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className={hasMinLength ? 'text-slate-900 dark:text-slate-200 font-medium' : 'text-slate-400'}>Min 12 characters</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasUppercase ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className={hasUppercase ? 'text-slate-900 dark:text-slate-200 font-medium' : 'text-slate-400'}>Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasLowercase ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className={hasLowercase ? 'text-slate-900 dark:text-slate-200 font-medium' : 'text-slate-400'}>Lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasNumber ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className={hasNumber ? 'text-slate-900 dark:text-slate-200 font-medium' : 'text-slate-400'}>Number indicator</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasSpecial ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className={hasSpecial ? 'text-slate-900 dark:text-slate-200 font-medium' : 'text-slate-400'}>Special symbol</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs col-span-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5 mt-1">
                      <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${passwordsMatch ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className={passwordsMatch ? 'text-slate-900 dark:text-slate-200 font-medium' : 'text-slate-400'}>Passwords match exactly</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold text-white bg-primary hover:bg-[var(--primary-hover)] transition-all rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                disabled={loading || !isFormValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating Password...
                  </>
                ) : 'Reset Password'}
              </Button>
            </form>
          ) : null}

          <div className="mt-6 text-center text-sm text-slate-500">
            Remember your password?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4 cursor-pointer">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
