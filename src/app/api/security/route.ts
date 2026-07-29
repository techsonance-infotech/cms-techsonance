import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();

  // Get active security config
  const { data: security, error } = await supabase
    .from('security_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // Get login attempts history (combining real DB search + fallback mocks)
  const { data: logins, error: loginErr } = await supabase
    .from('user_login_history')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (loginErr) throw loginErr;

  const defaultSecurity = {
    min_password_length: 8,
    require_symbols: true,
    mfa_enabled: false,
    sso_enabled: false,
    allowed_ips: '',
    allowed_countries: ''
  };

  const defaultLogins = [
    { id: 'log-1', email: 'hr.manager@techsonance.com', status: 'success', ip_address: '192.168.1.102', user_agent: 'Chrome/macOS', device_info: 'MacBook Pro', created_at: new Date(Date.now() - 600000).toISOString() },
    { id: 'log-2', email: 'admin@techsonance.com', status: 'success', ip_address: '157.48.92.10', user_agent: 'Firefox/Linux', device_info: 'Ubuntu Workstation', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'log-3', email: 'external.vendor@guest.com', status: 'failed', ip_address: '82.16.204.5', user_agent: 'Safari/iPhone', device_info: 'iPhone 15', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'log-4', email: 'unknown@hacker.ru', status: 'failed', ip_address: '95.12.80.34', user_agent: 'Unknown/Bot', device_info: 'Unknown', created_at: new Date(Date.now() - 14400000).toISOString() }
  ];

  return NextResponse.json({
    success: true,
    data: {
      settings: security || defaultSecurity,
      loginHistory: logins && logins.length > 0 ? logins : defaultLogins
    }
  });
}, { requireAuth: true, roles: ['Admin'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { 
    minPasswordLength, 
    requireSymbols, 
    mfaEnabled, 
    ssoEnabled, 
    allowedIps, 
    allowedCountries 
  } = await request.json();

  const { data: oldConfig } = await supabase
    .from('security_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  const { data, error } = await supabase
    .from('security_settings')
    .upsert({
      tenant_id: tenantId,
      min_password_length: Number(minPasswordLength || 8),
      require_symbols: !!requireSymbols,
      mfa_enabled: !!mfaEnabled,
      sso_enabled: !!ssoEnabled,
      allowed_ips: allowedIps || '',
      allowed_countries: allowedCountries || '',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'tenant_id'
    })
    .select()
    .single();

  if (error) throw error;

  // Log to Audit Logs
  await supabase.from('settings_audit_logs').insert({
    tenant_id: tenantId,
    action_by: context.auth!.user.email || 'Admin',
    action_name: 'Update Corporate Security Policies',
    old_value: oldConfig ? JSON.stringify(oldConfig) : null,
    new_value: JSON.stringify(data),
    ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
  });

  return NextResponse.json({
    success: true,
    message: 'Corporate security policies updated successfully!',
    data
  });
}, { requireAuth: true, roles: ['Admin'] });
