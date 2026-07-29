'use client';

import React from 'react';
import { Shield, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface LegalModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  type: 'terms' | 'privacy';
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const isTerms = type === 'terms';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        <DialogHeader className="flex flex-row items-center gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <div className="h-10 w-10 bg-[#F87941]/10 rounded-xl flex items-center justify-center text-[#F87941] shrink-0">
            {isTerms ? <Shield className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div className="text-left">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              {isTerms ? 'Terms of Service' : 'Privacy Policy'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Effective Date: July 4, 2026
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 space-y-4 font-sans">
          {isTerms ? (
            <>
              <p>
                Welcome to <strong>TechSonance CMS</strong>. By using our multi-tenant enterprise CMS portal, tools, APIs, and associated services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
              </p>
              
              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">1. Acceptance of Terms</h3>
              <p>
                By creating a corporate account, registering a workspace, or using our Services in any manner, you represent that you are authorized to bind your corporation or organization to these Terms. If you do not agree to these Terms, you must not access or use our Services.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">2. Account Registration and Security</h3>
              <p>
                You must provide accurate, current, and complete information during registration. You are solely responsible for maintaining the confidentiality of your credentials and account access. Any activities that occur under your workspace are your organization's responsibility. Notify us immediately if you suspect unauthorized access.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">3. License and Permitted Use</h3>
              <p>
                Subject to compliance with these Terms, TechSonance InfoTech LLP grants you a limited, non-exclusive, non-transferable, revocable license to access and use the enterprise CMS platform for your internal business operations during your active subscription or trial.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">4. User Content & Prohibited Conduct</h3>
              <p>
                You retain all intellectual property rights in the content and data you upload to the CMS. However, you agree not to upload content or use the Services in a way that violates local laws, infringes on third-party intellectual property, or compromises system security. Prohibited actions include reverse-engineering the platform, launching denial-of-service attacks, or attempting unauthorized data extraction.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">5. Subscription, Trial, and Fees</h3>
              <p>
                We offer a 14-day free trial for new workspaces. After the trial period, continuous use requires a valid paid subscription. All fees are non-refundable unless specified otherwise. We reserves the right to modify subscription fees upon 30 days notice.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">6. Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, TechSonance InfoTech LLP shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the CMS platform.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">7. Termination</h3>
              <p>
                We may suspend or terminate your access to the Services at any time, with or without cause, if we believe you have breached these Terms. You may terminate your account at any time by contacting our support team or deleting your workspace.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">8. Governing Law</h3>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which TechSonance InfoTech LLP operates, without regard to conflict of law principles.
              </p>

              <p className="pt-4 text-xs text-slate-400 border-t border-slate-100 dark:border-zinc-800">
                If you have any questions regarding these Terms, please contact us at support@techsonance.com.
              </p>
            </>
          ) : (
            <>
              <p>
                At <strong>TechSonance CMS</strong>, we value your privacy and are committed to protecting the corporate data, account details, and personal information you share with us. This Privacy Policy describes how we collect, use, store, and share your information when you use our multi-tenant enterprise CMS portal.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">1. Information We Collect</h3>
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

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">2. How We Use Your Information</h3>
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

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">3. Data Sharing and Disclosure</h3>
              <p>
                We do not sell, rent, or trade your data to third parties. We may share information with trusted third-party service providers (such as hosting, payment gateway, and email senders) only to the extent necessary to perform their services for us. We may also disclose information if required by law or to protect legal rights.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">4. Security and Data Protection</h3>
              <p>
                We implement industry-standard administrative, technical, and physical security measures to safeguard your information against unauthorized access, loss, alteration, or disclosure. All sensitive data is encrypted in transit using SSL/TLS and stored on secure enterprise-grade cloud servers.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">5. Data Retention</h3>
              <p>
                We retain account information and client database assets for as long as your corporate workspace is active, or as needed to comply with legal obligations, resolve disputes, and enforce agreements. Deleted workspace data is permanently scrubbed from our systems in accordance with standard backup rotation cycles.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">6. Your Privacy Rights</h3>
              <p>
                Depending on your location, you may have rights under the General Data Protection Regulation (GDPR), CCPA, or other data protection laws. These rights include accessing, correcting, or requesting erasure of your personal data, or restricting its processing. You can manage these settings directly inside your Workspace Dashboard settings.
              </p>

              <h3 className="font-bold text-slate-900 dark:text-white pt-2 text-base">7. Changes to This Policy</h3>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our site and updating the last modified date above. Continued use of the Services after changes constitute acceptance of the terms.
              </p>

              <p className="pt-4 text-xs text-slate-400 border-t border-slate-100 dark:border-zinc-800">
                If you have any questions or concerns about our Privacy Policy, please contact us at privacy@techsonance.com.
              </p>
            </>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
