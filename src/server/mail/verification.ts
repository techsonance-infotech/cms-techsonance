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

// Brand color tokens (matching globals.css)
const BRAND = {
  primary: '#F87941',
  primaryHover: '#F4662B',
  primaryLight: '#F9B095',
  primarySoft: '#FFE7DC',
  background: '#FDFCFC',
  foreground: '#45464A',
  cardBg: '#FFFFFF',
  cardForeground: '#2F3035',
  muted: '#6B6C70',
  border: '#ECEBEC',
  accentBg: '#FFF5F1',
  footerText: '#94a3b8',
};

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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 32px 24px; color: ${BRAND.foreground}; background-color: ${BRAND.background}; max-width: 600px; margin: 0 auto; border-radius: 16px;">
        <!-- Header with brand accent bar -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 100%; height: 4px; background: linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%); border-radius: 4px; margin-bottom: 20px;"></div>
          <h2 style="margin: 0; color: ${BRAND.primary}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TechSonance InfoTech LLP</h2>
          <p style="margin: 4px 0 0; color: ${BRAND.muted}; font-size: 13px; font-weight: 600;">Enterprise CMS Portal</p>
        </div>
        
        <div style="background-color: ${BRAND.cardBg}; padding: 32px; border-radius: 12px; border: 1px solid ${BRAND.border}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h3 style="margin: 0 0 16px; color: ${BRAND.cardForeground}; font-size: 18px; font-weight: 700;">Account Verification</h3>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${BRAND.foreground};">Hello ${input.name},</p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: ${BRAND.foreground};">Thank you for registering with TechSonance CMS. To complete your registration and unlock your 14-day free trial, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; border-radius: 10px; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryHover} 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(248, 121, 65, 0.3);">
              Verify My Account
            </a>
          </div>
          
          <p style="margin: 0 0 8px; font-size: 12px; line-height: 1.5; color: ${BRAND.muted};">Or copy and paste this URL into your browser:</p>
          <p style="margin: 0 0 24px; font-size: 12px; line-height: 1.5; color: ${BRAND.primary}; word-break: break-all;">${verifyUrl}</p>
          
          <hr style="border: 0; border-top: 1px solid ${BRAND.border}; margin: 24px 0;" />
          
          <p style="margin: 0; font-size: 11px; line-height: 1.5; color: ${BRAND.footerText};">This verification link will remain active for 24 hours. If you did not register for a TechSonance CMS account, you can safely ignore this email.</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; color: ${BRAND.footerText}; font-size: 11px;">
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
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 32px 24px; color: ${BRAND.foreground}; background-color: ${BRAND.background}; max-width: 600px; margin: 0 auto; border-radius: 16px;">
        <!-- Header with brand accent bar -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 100%; height: 4px; background: linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%); border-radius: 4px; margin-bottom: 20px;"></div>
          <h2 style="margin: 0; color: ${BRAND.primary}; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TechSonance InfoTech LLP</h2>
          <p style="margin: 4px 0 0; color: ${BRAND.muted}; font-size: 13px; font-weight: 600;">Enterprise CMS Portal</p>
        </div>
        
        <div style="background-color: ${BRAND.cardBg}; padding: 32px; border-radius: 12px; border: 1px solid ${BRAND.border}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h3 style="margin: 0 0 16px; color: ${BRAND.primary}; font-size: 18px; font-weight: 700;">&#10003; Account Successfully Verified!</h3>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${BRAND.foreground};">Hello ${input.name},</p>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${BRAND.foreground};">Your email has been successfully verified, and your 14-day free trial is now active! Welcome to TechSonance.</p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: ${BRAND.foreground};">You are now ready to set up your corporate profile and configure your brand credentials in the workspace.</p>
          
          <!-- Trial info card -->
          <div style="background-color: ${BRAND.accentBg}; border: 1px solid ${BRAND.primarySoft}; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-size: 11px; color: ${BRAND.muted}; font-weight: 600; padding-bottom: 4px;">Account Status</td>
                <td style="font-size: 11px; color: ${BRAND.muted}; font-weight: 600; padding-bottom: 4px;">Trial Period</td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: ${BRAND.primary}; font-weight: 800;">Active</td>
                <td style="font-size: 13px; color: ${BRAND.cardForeground}; font-weight: 800;">14 Days Free</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${appBaseUrl}/login" style="display: inline-block; padding: 14px 32px; border-radius: 10px; background: linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryHover} 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(248, 121, 65, 0.3);">
              Login to CMS Portal
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid ${BRAND.border}; margin: 24px 0;" />
          
          <p style="margin: 0; font-size: 11px; line-height: 1.5; color: ${BRAND.footerText};">If you did not verify this account, please contact our support team immediately.</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; color: ${BRAND.footerText}; font-size: 11px;">
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
