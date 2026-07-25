'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Eye, EyeOff, AlertCircle, User, Lock, Mail, Phone, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LegalModal } from '@/components/auth/legal-modal';

export function RegisterForm() {
  const router = useRouter();
  
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');

  const openLegalModal = (type: 'terms' | 'privacy') => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validations
  const isFirstNameValid = /^[a-zA-Z]{2,50}$/.test(firstName);
  const isLastNameValid = /^[a-zA-Z]{2,50}$/.test(lastName);
  const isUsernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = /^\d{10}$/.test(phone);
  const isCompanyNameValid = companyName.trim().length >= 2;

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  const isFormValid = 
    isFirstNameValid && 
    isLastNameValid && 
    isUsernameValid && 
    isEmailValid && 
    isPhoneValid && 
    isCompanyNameValid && 
    isPasswordStrong && 
    passwordsMatch &&
    agreed;

  const handleAlphabetChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z]/g, '');
    setter(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(value);
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getInputClass = (isValid: boolean, field: string, value: string) => {
    const base = 'pl-11 h-12 border-border bg-card focus-visible:ring-primary focus-visible:border-primary rounded-xl hover:border-muted-foreground/30 transition-colors duration-200';
    if (!touched[field] || value === '') return base;
    return isValid
      ? 'pl-11 h-12 border-emerald-500 bg-card focus-visible:ring-emerald-500 focus-visible:border-emerald-500 rounded-xl transition-colors duration-200'
      : 'pl-11 h-12 border-destructive bg-card focus-visible:ring-destructive focus-visible:border-destructive rounded-xl transition-colors duration-200';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMsg('Please complete all fields correctly and accept the terms.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          phone,
          companyName,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10 px-6 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-2xl animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
          <Check className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Verification Email Sent!</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed mb-6">
          We've sent a verification link to <span className="text-emerald-600 dark:text-emerald-400 font-bold">{email}</span>. Please check your inbox and click the link to activate your account and begin your 14-day free trial.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Waiting for verification…</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-primary hover:text-[var(--primary-hover)] transition-colors mt-2"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400 text-xs leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Profile Section Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-firstName" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide ml-1">
            First Name <span className="text-rose-500">*</span>
          </Label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
            <Input
              id="reg-firstName"
              type="text"
              placeholder="Enter your first name"
              required
              value={firstName}
              onChange={handleAlphabetChange(setFirstName)}
              onBlur={() => handleBlur('firstName')}
              className={getInputClass(isFirstNameValid, 'firstName', firstName)}
            />
          </div>
          {touched.firstName && !isFirstNameValid && (
            <p className="text-[10px] text-rose-500 ml-1 font-semibold">
              Must be at least 2 characters (letters only).
            </p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-lastName" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide ml-1">
            Last Name <span className="text-rose-500">*</span>
          </Label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
            <Input
              id="reg-lastName"
              type="text"
              placeholder="Enter your last name"
              required
              value={lastName}
              onChange={handleAlphabetChange(setLastName)}
              onBlur={() => handleBlur('lastName')}
              className={getInputClass(isLastNameValid, 'lastName', lastName)}
            />
          </div>
          {touched.lastName && !isLastNameValid && (
            <p className="text-[10px] text-rose-500 ml-1 font-semibold">
              Must be at least 2 characters (letters only).
            </p>
          )}
        </div>
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-username" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide ml-1">
          Username <span className="text-rose-500">*</span>
        </Label>
        <div className="relative group">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <Input
            id="reg-username"
            type="text"
            placeholder="Choose a username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            onBlur={() => handleBlur('username')}
            className={getInputClass(isUsernameValid, 'username', username)}
          />
        </div>
        {touched.username && !isUsernameValid && username !== '' && (
          <p className="text-[10px] text-rose-500 ml-1 font-semibold">
            Use 3-20 characters: letters, numbers, or underscores only.
          </p>
        )}
      </div>

      {/* Company Name */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-companyName" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide ml-1">
          Company / Organization <span className="text-rose-500">*</span>
        </Label>
        <div className="relative group">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
          <Input
            id="reg-companyName"
            type="text"
            placeholder="Enter your company or organization name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onBlur={() => handleBlur('companyName')}
            className={getInputClass(isCompanyNameValid, 'companyName', companyName)}
          />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-email" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide ml-1">
            Email Address <span className="text-rose-500">*</span>
          </Label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
            <Input
              id="reg-email"
              type="email"
              placeholder="Enter your email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              className={getInputClass(isEmailValid, 'email', email)}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide ml-1">
            Phone Number <span className="text-rose-500">*</span>
          </Label>
          <div className="relative group">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
            <Input
              id="reg-phone"
              type="tel"
              placeholder="Enter your phone number"
              required
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => handleBlur('phone')}
              className={getInputClass(isPhoneValid, 'phone', phone)}
            />
          </div>
          {touched.phone && !isPhoneValid && (
            <p className="text-[10px] text-rose-500 ml-1 font-semibold">
              Phone number must be exactly 10 digits.
            </p>
          )}
        </div>
      </div>

      {/* Password & Confirm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Password */}
        <div className="space-y-1.5 relative">
          <Label htmlFor="reg-password" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide ml-1">
            Password <span className="text-rose-500">*</span>
          </Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              className={getInputClass(isPasswordStrong, 'password', password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-20"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5 relative">
          <Label htmlFor="reg-confirmPassword" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide ml-1">
            Confirm Password <span className="text-rose-500">*</span>
          </Label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
            <Input
              id="reg-confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              className={getInputClass(passwordsMatch, 'confirmPassword', confirmPassword)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-20"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Password Strength Panel */}
      {password !== '' && (
        <div className="p-3.5 bg-orange-50/50 dark:bg-orange-950/15 border border-orange-100 dark:border-orange-900/20 rounded-xl space-y-1.5 animate-in fade-in duration-200">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Password must contain:
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-xs">
              <Check className={`h-3.5 w-3.5 ${hasMinLength ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className={hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}>8+ characters</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Check className={`h-3.5 w-3.5 ${hasUppercase ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className={hasUppercase ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}>1 uppercase letter</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Check className={`h-3.5 w-3.5 ${hasNumber ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className={hasNumber ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}>1 number</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Check className={`h-3.5 w-3.5 ${hasSpecial ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
              <span className={hasSpecial ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}>1 special character</span>
            </div>
          </div>
        </div>
      )}

      {/* Agreement Checkbox */}
      <div className="flex items-center space-x-2 py-1 select-none">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(Boolean(checked))}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-slate-300 flex h-[18px] w-[18px] items-center justify-center rounded-md shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <label
          htmlFor="terms"
          className="text-sm font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
        >
          I agree to the{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              openLegalModal('terms');
            }}
            className="text-primary hover:underline font-bold focus:outline-none cursor-pointer"
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              openLegalModal('privacy');
            }}
            className="text-primary hover:underline font-bold focus:outline-none cursor-pointer"
          >
            Privacy Policy
          </button>
        </label>
      </div>

      {/* Form Action Button */}
      <Button
        type="submit"
        disabled={loading || !isFormValid}
        className="w-full h-12 text-base font-bold text-white bg-primary hover:bg-[var(--primary-hover)] transition-all rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </Button>

      {/* Social Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
        </div>
        <span className="relative px-3 bg-white dark:bg-[#0A1A2F] text-xs font-semibold text-slate-400 uppercase tracking-wider">
          or sign up with
        </span>
      </div>      {/* Social Buttons */}
      <div className="flex">
        <button
          type="button"
          className="flex items-center justify-center gap-3 w-full border border-border bg-card hover:bg-accent hover:text-accent-foreground rounded-xl h-12 text-sm font-bold text-foreground transition-all shadow-sm hover:shadow duration-200 active:scale-[0.99] cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4 cursor-pointer">
          Login here
        </Link>
      </div>

      <LegalModal
        isOpen={legalModalOpen}
        onClose={setLegalModalOpen}
        type={legalModalType}
      />
    </form>
  );
}
