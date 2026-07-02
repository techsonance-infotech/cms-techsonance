'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

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
    <div className="w-full max-w-md bg-white dark:bg-[#0A1A2F] p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in duration-500">
      
      {/* Visual Telemetry */}
      {status === 'loading' && (
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Verifying Account</h2>
            <p className="text-slate-500 text-sm">{message}</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center py-6 space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 relative">
            <Check className="h-10 w-10 text-white" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              Verified Successfully!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed px-4">
              Welcome to the premium TechSonance Enterprise CMS. Your 14-day free trial workspace is now active!
            </p>
          </div>

          <Link
            href="/login"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-[#245C80] to-[#337BAA] text-white font-bold text-sm tracking-wide shadow-md hover:opacity-95 transition-all duration-300 flex items-center justify-center"
          >
            Proceed to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-6 space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <X className="h-10 w-10 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Verification Failed
            </h2>
            <p className="text-rose-600 dark:text-rose-400 text-sm leading-relaxed px-4">
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#245C80] to-[#337BAA] text-white font-bold text-sm tracking-wide shadow-md hover:opacity-95 transition-all duration-300 flex items-center justify-center"
            >
              Back to Login
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold text-slate-500 hover:text-primary transition-colors py-1"
            >
              Need to create an account? Sign up
            </Link>
          </div>
        </div>
      )}

      {/* Decorative Brand footer */}
      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 font-bold tracking-widest uppercase">
        TechSonance Enterprise Suite
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#07111E] overflow-hidden font-sans items-center justify-center p-6 relative">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#67D7E8]/5 rounded-full blur-3xl -ml-48 -mb-48" />

      <Suspense fallback={
        <div className="w-full max-w-md bg-white dark:bg-[#0A1A2F] p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm font-bold text-slate-500">Loading verification context...</span>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
