import { env } from '@/server/config/env';
import { logger } from '@/server/logging/logger';

function getFromAddress(settings?: {
  email?: string | null;
}) {
  const address = env.SMTP_FROM_EMAIL ?? settings?.email ?? env.SMTP_USER ?? 'no-reply@localhost';
  const name = env.SMTP_FROM_NAME ?? 'TechSonance InfoTech LLP';
  return `"${name}" <${address}>`;
}

async function createTransporter() {
  const settings = { email: env.SMTP_FROM_EMAIL ?? null };
  const host = env.SMTP_HOST ?? null;
  const port = env.SMTP_PORT ?? 587;
  const user = env.SMTP_USER ?? null;
  const password = env.SMTP_PASSWORD ?? null;

  const nodemailer = await import('nodemailer');

  if (!host || !user || !password) {
    if (env.NODE_ENV !== 'production') {
      return {
        transporter: nodemailer.default.createTransport({ jsonTransport: true }),
        settings,
        usesJsonTransport: true,
      };
    }

    throw new Error('SMTP configuration is incomplete for verification emails');
  }

  return {
    transporter: nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass: password,
      },
    }),
    settings,
    usesJsonTransport: false,
  };
}

export async function sendVerificationEmail(input: {
  email: string;
  name: string;
  token: string;
}) {
  const { transporter, settings, usesJsonTransport } = await createTransporter();
  const appBaseUrl = env.APP_BASE_URL ?? 'http://localhost:3000';
  const verifyUrl = `${appBaseUrl}/verify-email?token=${input.token}`;

  const result = await transporter.sendMail({
    from: getFromAddress(settings),
    to: input.email,
    subject: 'Verify your TechSonance CMS Account',
    text: `Hello ${input.name}, please verify your TechSonance CMS account by clicking this link: ${verifyUrl}. The link will expire in 24 hours.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 32px 24px; color: #1e293b; background-color: #f4f7fa; max-width: 600px; margin: 0 auto; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #245C80; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TechSonance InfoTech LLP</h2>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px; font-weight: 600;">Enterprise CMS Portal</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #d9e3ec; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h3 style="margin: 0 0 16px; color: #1e293b; font-size: 18px; font-weight: 700;">Account Verification</h3>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">Hello ${input.name},</p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">Thank you for registering with TechSonance CMS. To complete your registration and unlock your 14-day free trial, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; border-radius: 8px; background: linear-gradient(135deg, #245C80 0%, #337BAA 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 4px 10px rgba(51, 123, 170, 0.25);">
              Verify My Account
            </a>
          </div>
          
          <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.5; color: #64748b;">Or copy and paste this URL into your browser:</p>
          <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.5; color: #337BAA; word-break: break-all;">${verifyUrl}</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          
          <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">This verification link will remain active for 24 hours. If you did not register for a TechSonance CMS account, you can safely ignore this email.</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px;">
          &copy; ${new Date().getFullYear()} TechSonance InfoTech LLP. All rights reserved.
        </div>
      </div>
    `,
  });

  if (usesJsonTransport) {
    logger.warn('verification_email_dev_fallback', {
      email: input.email,
      verifyUrl,
      preview: typeof result?.message === 'string' ? result.message : null,
      note: 'SMTP is not configured, so no real email was sent. Use the link from this log in local development.',
    });
  }

  logger.info('verification_email_sent', {
    email: input.email,
  });
}

export async function sendWelcomeEmail(input: {
  email: string;
  name: string;
}) {
  const { transporter, settings, usesJsonTransport } = await createTransporter();
  const appBaseUrl = env.APP_BASE_URL ?? 'http://localhost:3000';

  const result = await transporter.sendMail({
    from: getFromAddress(settings),
    to: input.email,
    subject: 'Welcome to TechSonance CMS!',
    text: `Hello ${input.name}, your account is now verified! Welcome to the premium TechSonance Enterprise CMS portal.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 32px 24px; color: #1e293b; background-color: #f4f7fa; max-width: 600px; margin: 0 auto; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #245C80; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TechSonance InfoTech LLP</h2>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 13px; font-weight: 600;">Enterprise CMS Portal</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #d9e3ec; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h3 style="margin: 0 0 16px; color: #22c55e; font-size: 18px; font-weight: 700;">Account Successfully Verified!</h3>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">Hello ${input.name},</p>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">Your email has been successfully verified, and your 14-day free trial is now active! Welcome to TechSonance.</p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">You are now ready to set up your corporate profile and configure your brand credentials in the workspace.</p>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${appBaseUrl}/login" style="display: inline-block; padding: 14px 32px; border-radius: 8px; background: linear-gradient(135deg, #245C80 0%, #337BAA 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 4px 10px rgba(51, 123, 170, 0.25);">
              Login to CMS Portal
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          
          <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8;">If you did not verify this account, please contact our support team immediately.</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px;">
          &copy; ${new Date().getFullYear()} TechSonance InfoTech LLP. All rights reserved.
        </div>
      </div>
    `,
  });

  if (usesJsonTransport) {
    logger.warn('welcome_email_dev_fallback', {
      email: input.email,
      preview: typeof result?.message === 'string' ? result.message : null,
    });
  }

  logger.info('welcome_email_sent', {
    email: input.email,
  });
}
