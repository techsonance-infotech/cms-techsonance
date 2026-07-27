import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();

  const { data: compliance, error } = await supabase
    .from('compliance_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const defaultCompliance = {
    gdpr_enabled: false,
    soc2_enabled: false,
    iso_enabled: false,
    hipaa_enabled: false,
    data_residency: 'US-East',
    consent_required: false,
    cookie_policy: 'We use cookies to enhance your experience.',
    retention_years: 7
  };

  return NextResponse.json({
    success: true,
    data: compliance || defaultCompliance
  });
}, { requireAuth: true, roles: ['Admin'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { 
    gdprEnabled, 
    soc2Enabled, 
    isoEnabled, 
    hipaaEnabled, 
    dataResidency, 
    consentRequired, 
    cookiePolicy, 
    retentionYears 
  } = await request.json();

  // Fetch current policy value for logging
  const { data: oldConfig } = await supabase
    .from('compliance_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  const { data, error } = await supabase
    .from('compliance_settings')
    .upsert({
      tenant_id: tenantId,
      gdpr_enabled: !!gdprEnabled,
      soc2_enabled: !!soc2Enabled,
      iso_enabled: !!isoEnabled,
      hipaa_enabled: !!hipaaEnabled,
      data_residency: dataResidency || 'US-East',
      consent_required: !!consentRequired,
      cookie_policy: cookiePolicy || '',
      retention_years: Number(retentionYears || 7),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'tenant_id'
    })
    .select()
    .single();

  if (error) throw error;

  // Log settings audit changes
  await supabase.from('settings_audit_logs').insert({
    tenant_id: tenantId,
    action_by: context.auth!.user.email || 'Admin',
    action_name: 'Update Compliance Policies',
    old_value: oldConfig ? JSON.stringify(oldConfig) : null,
    new_value: JSON.stringify(data),
    ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
  });

  return NextResponse.json({
    success: true,
    message: 'Compliance policy configurations saved successfully!',
    data
  });
}, { requireAuth: true, roles: ['Admin'] });
