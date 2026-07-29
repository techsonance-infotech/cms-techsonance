'use client';

import Image from 'next/image';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Left Column: Visuals & Branding */}
      <div className="hidden lg:block lg:w-1/2 relative h-full overflow-hidden">
        <Image
          src="/register-left-banner.png"
          alt="CMS Portal Banner"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right Column: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white dark:bg-[#0A1A2F] p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-xl space-y-6 animate-in fade-in slide-in-from-right duration-500 my-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-4">
            <div className="relative h-12 w-12">
              <Image
                src="/logo-icon.png"
                alt="TechSonance InfoTech"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create Your Account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Set up your multi-tenant enterprise CMS workspace
            </p>
          </div>

          <div className="mt-4">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
