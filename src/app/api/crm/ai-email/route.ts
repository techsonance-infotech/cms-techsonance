import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { prompt, tone, category, recipientName, brandVoice } = body;

  if (!prompt || !category) {
    throw new BadRequestError('Prompt and category are required');
  }

  // AI Generation Simulation logic based on prompt inputs
  let subject = `Follow-up: TechSonance CRM Solutions`;
  let emailBody = `Dear ${recipientName || 'Client'},\n\nHope you are doing well.\n\nFollowing up on our discussions regarding the CRM deployment. We are excited to partner with you to automate your sales pipeline.\n\nBest regards,\nSales Operations`;
  let cta = 'Schedule a brief 10-minute demo';
  let followUpSuggestion = 'Send an SMS nudge if no reply within 48 hours';
  let spamScore = '0.04 (Excellent - Inboxes directly)';

  const selectedTone = tone || 'Professional';
  const voice = brandVoice || 'TechSonance Standard';

  if (category === 'Cold Outreach') {
    subject = `Boost your sales pipeline efficiency with ${voice}`;
    emailBody = `Hello ${recipientName || 'Partner'},\n\nI noticed your team is managing deals across multiple channels. Our unified CRM SaaS consolidates WhatsApp, Email, and Slack leads into a single panel.\n\nWould you be open to a short discovery call next Tuesday?\n\nSincerely,\nSales Development Representative`;
    cta = 'Confirm call availability';
  } else if (category === 'Proposal') {
    subject = `Proposal Documents: TechSonance Enterprise CRM Integration`;
    emailBody = `Dear ${recipientName || 'Decision Maker'},\n\nPlease find attached the comprehensive scope of work (SOW) proposal. We have included fixed pricing structures, milestone schedules, and general ledger accounting integration support.\n\nLooking forward to your review.\n\nWarm regards,\nSales Lead`;
    cta = 'Approve proposal details';
  } else if (category === 'Payment Reminder') {
    subject = `Invoice Reminder: Outstanding balance for SaaS billing`;
    emailBody = `Dear ${recipientName || 'Billing Contact'},\n\nThis is a friendly reminder that invoice payment term is approaching. Please resolve the outstanding balance via the payment link below.\n\nThank you,\nFinance Department`;
    cta = 'Pay Outstanding Invoice';
  }

  // Adjust style based on Tone selection
  if (selectedTone === 'Casual') {
    emailBody = emailBody.replace('Dear', 'Hi').replace('Warm regards,', 'Cheers,').replace('Sincerely,', 'Best,');
  } else if (selectedTone === 'Persuasive') {
    emailBody += '\n\nNote: We are offering an exclusive 15% discount for commitments finalized before the end of the fiscal period.';
  }

  return NextResponse.json({
    success: true,
    data: {
      subject,
      body: emailBody,
      cta,
      followUpSuggestion,
      spamScore,
      confidence: 0.96
    }
  });
}, { requireAuth: true, roles: ['Employee'] });
