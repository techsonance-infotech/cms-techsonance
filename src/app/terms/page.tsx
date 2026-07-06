'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-slate-700 dark:text-slate-300 selection:bg-[#F87941]/20">
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="relative h-7 w-28">
            <Image
              src="/logo.png"
              alt="TechSonance CMS"
              fill
              className="object-contain"
            />
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 bg-[#F87941]/10 rounded-xl flex items-center justify-center text-[#F87941]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Last Updated: July 4, 2026
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <p>
            Welcome to <strong>TechSonance CMS</strong>. By using our multi-tenant enterprise CMS portal, tools, APIs, and associated services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">1. Acceptance of Terms</h2>
          <p>
            By creating a corporate account, registering a workspace, or using our Services in any manner, you represent that you are authorized to bind your corporation or organization to these Terms. If you do not agree to these Terms, you must not access or use our Services.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">2. Account Registration and Security</h2>
          <p>
            You must provide accurate, current, and complete information during registration. You are solely responsible for maintaining the confidentiality of your credentials and account access. Any activities that occur under your workspace are your organization's responsibility. Notify us immediately if you suspect unauthorized access.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">3. License and Permitted Use</h2>
          <p>
            Subject to compliance with these Terms, TechSonance InfoTech LLP grants you a limited, non-exclusive, non-transferable, revocable license to access and use the enterprise CMS platform for your internal business operations during your active subscription or trial.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">4. User Content & Prohibited Conduct</h2>
          <p>
            You retain all intellectual property rights in the content and data you upload to the CMS. However, you agree not to upload content or use the Services in a way that violates local laws, infringes on third-party intellectual property, or compromises system security. Prohibited actions include reverse-engineering the platform, launching denial-of-service attacks, or attempting unauthorized data extraction.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">5. Subscription, Trial, and Fees</h2>
          <p>
            We offer a 14-day free trial for new workspaces. After the trial period, continuous use requires a valid paid subscription. All fees are non-refundable unless specified otherwise. We reserves the right to modify subscription fees upon 30 days notice.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, TechSonance InfoTech LLP shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the CMS platform.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">7. Termination</h2>
          <p>
            We may suspend or terminate your access to the Services at any time, with or without cause, if we believe you have breached these Terms. You may terminate your account at any time by contacting our support team or deleting your workspace.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">8. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which TechSonance InfoTech LLP operates, without regard to conflict of law principles.
          </p>

          <p className="border-t border-slate-200 dark:border-zinc-800 pt-6 text-xs text-slate-400">
            If you have any questions regarding these Terms of Service, please contact us at support@techsonance.com.
          </p>
        </div>
      </main>
    </div>
  );
}
