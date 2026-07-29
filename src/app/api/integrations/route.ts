import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { data: integrations, error } = await supabase
    .from('tenant_integrations')
    .select('*')
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return NextResponse.json({ success: true, data: integrations });
}, { requireAuth: true, roles: ['Admin', 'Manager'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { action, providerSlug, config, enabled } = await request.json();

  if (!providerSlug) throw new BadRequestError('providerSlug is required');

  if (action === 'connect') {
    const { data, error } = await supabase
      .from('tenant_integrations')
      .upsert({
        tenant_id: tenantId,
        provider_slug: providerSlug,
        config: config || {},
        enabled: enabled !== undefined ? !!enabled : true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tenant_id,provider_slug'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Connected to ${providerSlug} successfully!`, data });
  }

  if (action === 'disconnect') {
    const { error } = await supabase
      .from('tenant_integrations')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('provider_slug', providerSlug);

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Disconnected from ${providerSlug} successfully!` });
  }

  throw new BadRequestError('Invalid action. Must be connect or disconnect');
}, { requireAuth: true, roles: ['Admin'] });
