import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess, apiError } from '@/server/http/response';
import nodemailer from 'nodemailer';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { to, subject, html, smtpConfig } = body;

  if (!to || !subject || !html) {
    throw new BadRequestError('Recipient, subject, and email body are required');
  }

  // Fallback to simulated delivery if no custom settings and default env variable is missing
  const defaultUser = process.env.SMTP_USER;
  const defaultPass = process.env.SMTP_PASSWORD;

  if (!smtpConfig && (!defaultUser || !defaultPass)) {
    console.warn('SMTP credentials are not configured. Falling back to simulated delivery.');
    return apiSuccess(
      { messageId: `sim-msg-${Date.now()}@techsonance.local`, isSimulated: true },
      'Simulated corporate SMTP relay dispatch (default configurations inactive)'
    );
  }

  // Determine SMTP transport config
  let transportConfig: any;

  if (smtpConfig && smtpConfig.host && smtpConfig.auth?.user && smtpConfig.auth?.pass) {
    // Use custom settings provided by user
    transportConfig = {
      host: smtpConfig.host,
      port: Number(smtpConfig.port) || 587,
      secure: smtpConfig.secure ?? false,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
    };
  } else {
    // Fall back to default corporate relay SMTP configurations
    transportConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: defaultUser,
        pass: defaultPass,
      },
    };
  }

  try {
    const transporter = nodemailer.createTransport(transportConfig);
    
    // Send mail
    const info = await transporter.sendMail({
      from: smtpConfig?.auth?.user || process.env.SMTP_FROM || defaultUser || 'connect.techsonance@gmail.com',
      to,
      subject,
      html,
    });

    return apiSuccess(
      { messageId: info.messageId },
      'Email dispatched successfully'
    );
  } catch (error: any) {
    console.error('SMTP sending error:', error);
    return apiError(
      error.message || 'Failed to dispatch email through SMTP relay.',
      { status: 500 }
    );
  }
}, { requireAuth: true, roles: ['Employee'] });
