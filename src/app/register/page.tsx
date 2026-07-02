'use client';

import Image from 'next/image';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
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

      {/* Right Column: Register Form */}
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
              Create Profile
            </h1>
            <p className="text-muted-foreground text-sm">
              Set up your multi-tenant enterprise CMS workspace
            </p>
          </div>

          <div className="mt-8">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
