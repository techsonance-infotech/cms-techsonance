import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { apiSuccess, apiError } from '@/server/http/response';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import nodemailer from 'nodemailer';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { to, subject, html } = body;

  if (!to || !subject || !html) {
    throw new BadRequestError('Recipient, subject, and email body are required');
  }

  const supabase = getAdminRouteSupabase();

  // Load the tenant's provisioned SMTP settings server-side
  const { data: settings } = await supabase
    .from('company_settings')
    .select('smtp_host, smtp_port, smtp_user, smtp_password')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  // Fallback to simulated delivery if no custom settings and default env variable is missing
  const defaultUser = process.env.SMTP_USER;
  const defaultPass = process.env.SMTP_PASSWORD;

  if ((!settings || !settings.smtp_host) && (!defaultUser || !defaultPass)) {
    console.warn('SMTP credentials are not configured. Falling back to simulated delivery.');
    return apiSuccess(
      { messageId: `sim-msg-${Date.now()}@techsonance.local`, isSimulated: true },
      'Simulated corporate SMTP relay dispatch (default configurations inactive)'
    );
  }

  // Determine SMTP transport config
  let transportConfig: any;

  if (settings && settings.smtp_host && settings.smtp_user && settings.smtp_password) {
    // Use custom settings retrieved securely from the server-side database
    transportConfig = {
      host: settings.smtp_host,
      port: Number(settings.smtp_port) || 587,
      secure: Number(settings.smtp_port) === 465,
      auth: {
        user: settings.smtp_user,
        pass: settings.smtp_password,
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
      from: settings?.smtp_user || process.env.SMTP_FROM || defaultUser || 'connect.techsonance@gmail.com',
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
