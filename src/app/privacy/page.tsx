'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
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
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
              Last Updated: July 4, 2026
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
          <p>
            At <strong>TechSonance CMS</strong>, we value your privacy and are committed to protecting the corporate data, account details, and personal information you share with us. This Privacy Policy describes how we collect, use, store, and share your information when you use our multi-tenant enterprise CMS portal.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">1. Information We Collect</h2>
          <p>
            When you register a workspace, we collect business and account information, including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account Holder Name and Email Address</li>
            <li>Username, Password (encrypted), and Phone Number</li>
            <li>Company / Organization details</li>
            <li>Payment billing credentials (processed via secure PCI-compliant partners)</li>
            <li>Usage data and metadata related to your multi-tenant configurations</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to provide, improve, and secure our enterprise CMS, including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Creating, managing, and maintaining your multi-tenant workspace</li>
            <li>Processing payments and managing subscriptions</li>
            <li>Sending account updates, security alerts, and system notices</li>
            <li>Analyzing system performance and improving user experiences</li>
            <li>Detecting and preventing fraud, security breaches, and platform abuse</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">3. Data Sharing and Disclosure</h2>
          <p>
            We do not sell, rent, or trade your data to third parties. We may share information with trusted third-party service providers (such as hosting, payment gateway, and email senders) only to the extent necessary to perform their services for us. We may also disclose information if required by law or to protect legal rights.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">4. Security and Data Protection</h2>
          <p>
            We implement industry-standard administrative, technical, and physical security measures to safeguard your information against unauthorized access, loss, alteration, or disclosure. All sensitive data is encrypted in transit using SSL/TLS and stored on secure enterprise-grade cloud servers.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">5. Data Retention</h2>
          <p>
            We retain account information and client database assets for as long as your corporate workspace is active, or as needed to comply with legal obligations, resolve disputes, and enforce agreements. Deleted workspace data is permanently scrubbed from our systems in accordance with standard backup rotation cycles.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">6. Your Privacy Rights</h2>
          <p>
            Depending on your location, you may have rights under the General Data Protection Regulation (GDPR), CCPA, or other data protection laws. These rights include accessing, correcting, or requesting erasure of your personal data, or restricting its processing. You can manage these settings directly inside your Workspace Dashboard settings.
          </p>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-4">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our site and updating the last modified date above. Continued use of the Services after changes constitute acceptance of the terms.
          </p>

          <p className="border-t border-slate-200 dark:border-zinc-800 pt-6 text-xs text-slate-400">
            If you have any questions or concerns about our Privacy Policy or data handling practices, please contact us at privacy@techsonance.com.
          </p>
        </div>
      </main>
    </div>
  );
}
