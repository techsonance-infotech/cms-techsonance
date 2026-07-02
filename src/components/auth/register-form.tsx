'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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
    passwordsMatch;

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
    const base = 'w-full h-11 px-4 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-300 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10';
    if (!touched[field] || value === '') return `${base} border-slate-200 focus:border-[#337BAA]`;
    return isValid
      ? `${base} border-emerald-500/30 focus:border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.02)]`
      : `${base} border-rose-500/30 focus:border-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.02)]`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMsg('Please complete all fields correctly.');
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
      <div className="text-center py-10 px-6 bg-emerald-50/50 border border-emerald-500/10 rounded-2xl animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
          <Check className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">Verification Email Sent!</h3>
        <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed mb-6">
          We've sent a verification link to <span className="text-emerald-600 font-bold">{email}</span>. Please check your inbox and click the link to activate your account and begin your 14-day free trial.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Waiting for verification…</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-[#337BAA] hover:text-[#245C80] transition-colors mt-2"
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
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-500/10 rounded-xl text-rose-600 text-xs leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Profile Section Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="space-y-1.5">
          <label htmlFor="reg-firstName" className="text-xs font-bold text-slate-700 ml-1">
            First Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="reg-firstName"
            type="text"
            placeholder="John"
            required
            value={firstName}
            onChange={handleAlphabetChange(setFirstName)}
            onBlur={() => handleBlur('firstName')}
            className={getInputClass(isFirstNameValid, 'firstName', firstName)}
          />
          {touched.firstName && !isFirstNameValid && (
            <p className="text-[10px] text-rose-500 ml-1 font-semibold">
              Must be at least 2 characters (letters only).
            </p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-1.5">
          <label htmlFor="reg-lastName" className="text-xs font-bold text-slate-700 ml-1">
            Last Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="reg-lastName"
            type="text"
            placeholder="Doe"
            required
            value={lastName}
            onChange={handleAlphabetChange(setLastName)}
            onBlur={() => handleBlur('lastName')}
            className={getInputClass(isLastNameValid, 'lastName', lastName)}
          />
          {touched.lastName && !isLastNameValid && (
            <p className="text-[10px] text-rose-500 ml-1 font-semibold">
              Must be at least 2 characters (letters only).
            </p>
          )}
        </div>
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <label htmlFor="reg-username" className="text-xs font-bold text-slate-700 ml-1">
          Username <span className="text-rose-500">*</span>
        </label>
        <input
          id="reg-username"
          type="text"
          placeholder="johndoe_99"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          onBlur={() => handleBlur('username')}
          className={getInputClass(isUsernameValid, 'username', username)}
        />
        {touched.username && !isUsernameValid && username !== '' && (
          <p className="text-[10px] text-rose-500 ml-1 font-semibold">
            Use 3-20 characters: letters, numbers, or underscores only.
          </p>
        )}
      </div>

      {/* Company Name */}
      <div className="space-y-1.5">
        <label htmlFor="reg-companyName" className="text-xs font-bold text-slate-700 ml-1">
          Company/Organization <span className="text-rose-500">*</span>
        </label>
        <input
          id="reg-companyName"
          type="text"
          placeholder="TechSonance Corp"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onBlur={() => handleBlur('companyName')}
          className={getInputClass(isCompanyNameValid, 'companyName', companyName)}
        />
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="text-xs font-bold text-slate-700 ml-1">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            placeholder="john@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            className={getInputClass(isEmailValid, 'email', email)}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="reg-phone" className="text-xs font-bold text-slate-700 ml-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            id="reg-phone"
            type="tel"
            placeholder="9876543210"
            required
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('phone')}
            className={getInputClass(isPhoneValid, 'phone', phone)}
          />
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
          <label htmlFor="reg-password" className="text-xs font-bold text-slate-700 ml-1">
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              className={getInputClass(isPasswordStrong, 'password', password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5 relative">
          <label htmlFor="reg-confirmPassword" className="text-xs font-bold text-slate-700 ml-1">
            Confirm Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="reg-confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              className={getInputClass(passwordsMatch, 'confirmPassword', confirmPassword)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Password Strength Panel */}
      {password !== '' && (
        <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2 animate-in fade-in duration-200">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Security Strength Indicators
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={hasMinLength ? 'text-slate-900 font-medium' : 'text-slate-400'}>Min 8 characters</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasUppercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={hasUppercase ? 'text-slate-900 font-medium' : 'text-slate-400'}>Uppercase letter</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasLowercase ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={hasLowercase ? 'text-slate-900 font-medium' : 'text-slate-400'}>Lowercase letter</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={hasNumber ? 'text-slate-900 font-medium' : 'text-slate-400'}>Number indicator</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${hasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={hasSpecial ? 'text-slate-900 font-medium' : 'text-slate-400'}>Special symbol</span>
            </div>
            <div className="flex items-center gap-2 text-xs col-span-2 border-t border-slate-200/50 pt-1.5 mt-1">
              <span className={`h-2 w-2 rounded-full transition-colors duration-300 ${passwordsMatch ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={passwordsMatch ? 'text-slate-900 font-medium' : 'text-slate-400'}>Passwords match exactly</span>
            </div>
          </div>
        </div>
      )}

      {/* Form Action Button */}
      <button
        type="submit"
        disabled={loading || !isFormValid}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#245C80] to-[#337BAA] hover:opacity-95 text-white font-bold text-sm tracking-wide shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Corporate Account...
          </>
        ) : (
          'Activate 14-Day Free Trial'
        )}
      </button>

      <div className="text-center pt-2 text-xs text-slate-500 font-medium">
        Already have a corporate profile?{' '}
        <Link href="/login" className="text-[#337BAA] hover:underline font-bold">
          Login here
        </Link>
      </div>
    </form>
  );
}
