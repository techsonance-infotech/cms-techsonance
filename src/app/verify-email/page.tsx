'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X, Loader2, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Please check your link.');
      return;
    }

    async function verify() {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setStatus('error');
          setMessage(data.message || 'Verification failed. The link might be invalid or expired.');
          return;
        }

        setStatus('success');
        setMessage('Your email has been successfully verified! You can now log in.');
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    }

    verify();
  }, [token]);

  return (
    <div className="w-full max-w-md bg-card p-8 rounded-3xl border border-border shadow-2xl relative animate-in fade-in zoom-in duration-500">

      {/* Loading State */}
      {status === 'loading' && (
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-foreground">Verifying Account</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>
          {/* Progress bar animation */}
          <div className="h-1 w-48 mx-auto bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '66%' }} />
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && (
        <div className="text-center py-6 space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-xl shadow-primary/20 relative">
            <Check className="h-10 w-10 text-primary-foreground" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Verified Successfully!
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed px-4">
              Welcome to the TechSonance Enterprise CMS. Your 14-day free trial workspace is now active.
            </p>
          </div>

          {/* Success details card */}
          <div className="p-4 bg-accent rounded-2xl border border-border text-left text-xs font-semibold grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-muted-foreground">Account Status</span>
              <p className="text-primary font-bold">Active</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Trial Period</span>
              <p className="text-foreground">14 Days Free</p>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full h-11 rounded-xl bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground font-bold text-sm tracking-wide shadow-md transition-all duration-300 flex items-center justify-center gap-2"
          >
            Proceed to Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="text-center py-6 space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <X className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground flex items-center justify-center gap-1.5">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Verification Failed
            </h2>
            <p className="text-destructive text-sm leading-relaxed px-4">
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full h-11 rounded-xl bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground font-bold text-sm tracking-wide shadow-md transition-all duration-300 flex items-center justify-center gap-2"
            >
              Back to Login
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-1"
            >
              Need to create an account? Sign up
            </Link>
          </div>
        </div>
      )}

      {/* Brand footer */}
      <div className="mt-8 pt-4 border-t border-border text-center text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
        TechSonance Enterprise Suite
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans items-center justify-center p-6 relative">
      {/* Decorative Orbs — use brand primary color */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -ml-48 -mb-48" />

      <Suspense fallback={
        <div className="w-full max-w-md bg-card p-8 rounded-3xl border border-border shadow-2xl flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm font-bold text-muted-foreground">Loading verification context...</span>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
