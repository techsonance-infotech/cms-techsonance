'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Building2, 
  FileCheck2, 
  Check, 
  ChevronRight, 
  Loader2, 
  Upload, 
  ArrowLeft, 
  AlertCircle, 
  Sparkles,
  FileText,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { getStoredSessionToken } from '@/lib/client-session';

export default function OnboardingPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  
  // Loading & State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  // Upload States
  const [files, setFiles] = useState<{
    registrationCert: { name: string; progress: number; url: string | null } | null;
    panCard: { name: string; progress: number; url: string | null } | null;
    gstCert: { name: string; progress: number; url: string | null } | null;
  }>({
    registrationCert: null,
    panCard: null,
    gstCert: null,
  });

  const steps = [
    { label: 'Company Profile', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Tax & Compliance', icon: <FileCheck2 className="h-4 w-4" /> },
    { label: 'Review & Activate', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  // 1. Session verification & load initial settings
  useEffect(() => {
    const sessionToken = getStoredSessionToken();
    if (!sessionToken) {
      router.push('/login');
      return;
    }
    setToken(sessionToken);

    async function loadSettings() {
      try {
        const response = await fetch(`/api/company-settings?t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          const settings = data?.data;
          if (settings) {
            setCompanyName(settings.companyName || '');
            setPhone(settings.phone || '');
            setWebsite(settings.website || '');
            setAddress(settings.address || '');
            setGstin(settings.gstin || '');
            setPan(settings.pan || '');
            
             // Restore file records if any
            setFiles({
              registrationCert: settings.registrationCertificateUrl ? { name: 'registration_certificate.pdf', progress: 100, url: settings.registrationCertificateUrl } : null,
              panCard: settings.panCardUrl ? { name: 'pan_card.pdf', progress: 100, url: settings.panCardUrl } : null,
              gstCert: settings.gstCertificateUrl ? { name: 'gst_certificate.pdf', progress: 100, url: settings.gstCertificateUrl } : null,
            });

            // Auto-redirect if onboarding is already fully complete!
            if (settings.companyName && settings.phone) {
              router.push('/dashboard');
              return;
            }
          }
        }
      } catch (err) {
        console.error('Failed to load onboarding info:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  // Handle Mock File Upload Simulator
  const simulateFileUpload = (field: 'registrationCert' | 'panCard' | 'gstCert', file: File) => {
    setFiles((prev) => ({
      ...prev,
      [field]: { name: file.name, progress: 0, url: null },
    }));

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setFiles((prev) => {
        const current = prev[field];
        if (!current) return prev;
        return {
          ...prev,
          [field]: { ...current, progress: Math.min(progress, 100) },
        };
      });

      if (progress >= 100) {
        clearInterval(interval);
        // Set mock URL path
        setFiles((prev) => {
          const current = prev[field];
          if (!current) return prev;
          return {
            ...prev,
            [field]: { ...current, url: `/uploads/mock_${field}_${Date.now()}.pdf` },
          };
        });
      }
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (field: 'registrationCert' | 'panCard' | 'gstCert', e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      simulateFileUpload(field, droppedFile);
    }
  };

  const handleFileChange = (field: 'registrationCert' | 'panCard' | 'gstCert', e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      simulateFileUpload(field, selectedFile);
    }
  };

  // Validations
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

  const isPhoneValid = phone.trim().length === 10;
  const isWebsiteValid = website.trim() === '' || urlRegex.test(website.trim());
  const isProfileValid = companyName.trim().length >= 2 && isPhoneValid && isWebsiteValid;

  const isGstinValid = gstin.trim() === '' || gstinRegex.test(gstin.trim());
  const isPanValid = pan.trim() === '' || panRegex.test(pan.trim());
  const isTaxValid = isGstinValid && isPanValid;

  const handleNext = async () => {
    if (currentStep === 0) {
      if (!companyName.trim()) {
        setErrorMsg('Company legal name is required.');
        return;
      }
      if (companyName.trim().length < 2) {
        setErrorMsg('Company name must be at least 2 characters.');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Official telephone number is required.');
        return;
      }
      if (!isPhoneValid) {
        setErrorMsg('Phone number must be exactly 10 digits.');
        return;
      }
      if (!isWebsiteValid) {
        setErrorMsg('Website must be a valid URL.');
        return;
      }
      setErrorMsg(null);
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!isGstinValid) {
        setErrorMsg('Invalid GSTIN format (15 characters: 22AAAAA0000A1Z5).');
        return;
      }
      if (!isPanValid) {
        setErrorMsg('Invalid PAN format (10 characters: ABCDE1234F).');
        return;
      }
      setErrorMsg(null);
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveAndSubmit = async () => {
    if (!isProfileValid) {
      setErrorMsg('Please ensure all profile information in Step 1 is correct.');
      return;
    }
    if (!isTaxValid) {
      setErrorMsg('Please ensure GSTIN and PAN fields in Step 2 are correct.');
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        companyName,
        phone,
        website: website || null,
        address: address || null,
        gstin,
        pan,
        registrationCertificateUrl: files.registrationCert?.url || null,
        panCardUrl: files.panCard?.url || null,
        gstCertificateUrl: files.gstCert?.url || null,
      };
      console.log('ONBOARDING_SUBMIT: payload being sent:', payload);

      const response = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('ONBOARDING_SUBMIT: response code & body:', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save settings.');
      }

      // Successful onboarding! Redirect to dashboard
      console.log('ONBOARDING_SUBMIT: redirecting...');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('ONBOARDING_SUBMIT: caught exception:', err);
      setErrorMsg(err.message || 'An unexpected error occurred saving onboarding setup.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#07111E]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm font-bold tracking-wide">Loading workspace onboarding...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111E] py-12 px-6 flex flex-col items-center justify-center relative font-sans overflow-hidden">
      {/* Decorative Orbs Container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#67D7E8]/5 rounded-full blur-3xl -ml-48 -mb-48" />
      </div>

      <div className="w-full max-w-2xl">
        
        {/* Logo Banner */}
        <div className="flex flex-col items-center text-center mb-8 animate-in slide-in-from-top duration-500">
          <div className="relative h-12 w-12 bg-white rounded-xl p-2 flex items-center justify-center border border-slate-100 shadow-sm mb-3">
            <Image
              src="/logo-icon.png"
              alt="TechSonance Logo"
              fill
              className="object-contain p-1.5"
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Enterprise Workspace Setup
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Configure your corporate profile to unlock full dashboard privileges
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8 px-4">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    idx === currentStep
                      ? 'bg-gradient-to-r from-[#245C80] to-[#337BAA] text-white shadow-md shadow-primary/20'
                      : idx < currentStep
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-white dark:bg-[#0A1A2F] text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {idx < currentStep ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.icon
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight className={`h-4 w-4 shrink-0 ${idx < currentStep ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-[#0A1A2F] rounded-3xl border border-slate-100 dark:border-slate-850 shadow-2xl p-6 sm:p-8 animate-in fade-in duration-300 relative">
          
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-500/10 rounded-xl text-rose-600 text-xs leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* ────────────────── Step 0: Company Details ────────────────── */}
          {currentStep === 0 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Corporate Identity</h2>
                  <p className="text-[11px] text-slate-500">Provide official identity parameters for invoice generation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Company Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter legal entity name"
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#337BAA] rounded-xl text-sm outline-none focus:bg-white transition-all focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Official Telephone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Corporate phone number"
                    className={`w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border ${phone.trim() !== '' && !isPhoneValid ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-[#337BAA] focus:ring-primary/10'} rounded-xl text-sm outline-none focus:bg-white transition-all focus:ring-4`}
                  />
                  {phone.trim() !== '' && !isPhoneValid && (
                    <span className="text-[10px] text-rose-500 font-medium ml-1 block">Phone number must be exactly 10 digits</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Corporate Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border ${website.trim() !== '' && !isWebsiteValid ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-[#337BAA] focus:ring-primary/10'} rounded-xl text-sm outline-none focus:bg-white transition-all focus:ring-4`}
                />
                {website.trim() !== '' && !isWebsiteValid && (
                  <span className="text-[10px] text-rose-500 font-medium ml-1 block">Please enter a valid website URL (e.g. https://example.com)</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Physical Business Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP details..."
                  rows={3}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#337BAA] rounded-xl text-sm outline-none focus:bg-white transition-all focus:ring-4 focus:ring-primary/10 resize-none"
                />
              </div>
            </div>
          )}

          {/* ────────────────── Step 1: Compliance Setup ────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileCheck2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Compliance & KYC</h2>
                  <p className="text-[11px] text-slate-500">Provide official compliance numbers and certificates</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                    className={`w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border ${gstin.trim() !== '' && !isGstinValid ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-[#337BAA] focus:ring-primary/10'} rounded-xl text-sm outline-none focus:bg-white transition-all focus:ring-4`}
                  />
                  {gstin.trim() !== '' && !isGstinValid && (
                    <span className="text-[10px] text-rose-500 font-medium ml-1 block">Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Permanent Account Number (PAN)
                  </label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className={`w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border ${pan.trim() !== '' && !isPanValid ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 dark:border-slate-800 focus:border-[#337BAA] focus:ring-primary/10'} rounded-xl text-sm outline-none focus:bg-white transition-all focus:ring-4`}
                  />
                  {pan.trim() !== '' && !isPanValid && (
                    <span className="text-[10px] text-rose-500 font-medium ml-1 block">Invalid PAN format (e.g. ABCDE1234F)</span>
                  )}
                </div>
              </div>

              {/* Document Upload Panels */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">KYC Document Photocopies</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* File Upload Slot 1 */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Incorporation Certificate</span>
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop('registrationCert', e)}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#337BAA] rounded-xl p-3 text-center transition-all bg-slate-50/50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[110px] relative cursor-pointer group"
                    >
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => handleFileChange('registrationCert', e)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {files.registrationCert ? (
                        <div className="space-y-1 text-center w-full">
                          <FileText className="h-6 w-6 text-emerald-500 mx-auto" />
                          <p className="text-[10px] text-slate-700 dark:text-slate-350 truncate font-semibold px-2">{files.registrationCert.name}</p>
                          <div className="w-full bg-slate-200 rounded-full h-1 mt-1 px-3">
                            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${files.registrationCert.progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors mb-1.5" />
                          <span className="text-[10px] text-slate-400 font-medium">Drag or Click to upload</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* File Upload Slot 2 */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">PAN Card Document</span>
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop('panCard', e)}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#337BAA] rounded-xl p-3 text-center transition-all bg-slate-50/50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[110px] relative cursor-pointer group"
                    >
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => handleFileChange('panCard', e)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {files.panCard ? (
                        <div className="space-y-1 text-center w-full">
                          <FileText className="h-6 w-6 text-emerald-500 mx-auto" />
                          <p className="text-[10px] text-slate-700 dark:text-slate-350 truncate font-semibold px-2">{files.panCard.name}</p>
                          <div className="w-full bg-slate-200 rounded-full h-1 mt-1 px-3">
                            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${files.panCard.progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors mb-1.5" />
                          <span className="text-[10px] text-slate-400 font-medium">Drag or Click to upload</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* File Upload Slot 3 */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">GST Certificate</span>
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop('gstCert', e)}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-[#337BAA] rounded-xl p-3 text-center transition-all bg-slate-50/50 dark:bg-slate-900 flex flex-col items-center justify-center min-h-[110px] relative cursor-pointer group"
                    >
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => handleFileChange('gstCert', e)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {files.gstCert ? (
                        <div className="space-y-1 text-center w-full">
                          <FileText className="h-6 w-6 text-emerald-500 mx-auto" />
                          <p className="text-[10px] text-slate-700 dark:text-slate-350 truncate font-semibold px-2">{files.gstCert.name}</p>
                          <div className="w-full bg-slate-200 rounded-full h-1 mt-1 px-3">
                            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${files.gstCert.progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors mb-1.5" />
                          <span className="text-[10px] text-slate-400 font-medium">Drag or Click to upload</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── Step 2: Final Confirmation ────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Sparkles className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Ready to Activate!</h2>
                  <p className="text-xs text-slate-500">Your enterprise profile is configured successfully</p>
                </div>
              </div>

              {/* Activation Telemetry Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Free Trial Privileges
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">License Type</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-extrabold">14-Day Evaluation</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Workplace Scope</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-extrabold">Multi-Tenant CMS Hub</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-start gap-2.5 text-[11px] text-slate-550 leading-relaxed">
                  <span className="text-sm shrink-0">✅</span>
                  <div>
                    Your trial workspace supports core database operations, dynamic branding templates, automatic document scanning, and supports infinite client onboarding.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Row Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-8">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold text-slate-650 dark:text-slate-350 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            ) : (
              <div></div> // Spacing
            )}

            {currentStep < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="h-11 px-6 bg-gradient-to-r from-[#245C80] to-[#337BAA] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndSubmit}
                disabled={saving}
                className="h-11 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Initializing Environment...
                  </>
                ) : (
                  <>
                    Go to Enterprise Dashboard
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
