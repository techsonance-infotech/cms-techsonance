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

  return NextResponse.json({
    success: true,
    data: {
      settings: security || defaultSecurity,
      loginHistory: logins || []
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
