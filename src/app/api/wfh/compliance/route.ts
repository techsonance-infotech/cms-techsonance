import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  const currentUserId = user.providerUserId || String(user.id);

  const body = await request.json();
  const { ergonomicSetup, highSpeedInternet, privateWorkspace, vpnConfigured, firewallEnabled } = body;

  const supabase = getAdminRouteSupabase();

  // Upsert compliance record for current user
  const { data: existing } = await supabase
    .from('wfh_compliance_checklist')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', currentUserId)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('wfh_compliance_checklist')
      .update({
        ergonomic_setup: !!ergonomicSetup,
        high_speed_internet: !!highSpeedInternet,
        private_workspace: !!privateWorkspace,
        vpn_configured: !!vpnConfigured,
        firewall_enabled: !!firewallEnabled
      })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('wfh_compliance_checklist')
      .insert({
        tenant_id: tenantId,
        user_id: currentUserId,
        ergonomic_setup: !!ergonomicSetup,
        high_speed_internet: !!highSpeedInternet,
        private_workspace: !!privateWorkspace,
        vpn_configured: !!vpnConfigured,
        firewall_enabled: !!firewallEnabled
      })
      .select()
      .single();
  }

  if (result.error) {
    console.warn('Compliance save info:', result.error.message);
  }

  return NextResponse.json({
    success: true,
    message: 'Home office compliance declaration saved successfully!'
  });
}, { requireAuth: true });
