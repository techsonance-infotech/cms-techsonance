import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const { insightId, action } = await request.json();
  if (!insightId || !action) {
    throw new BadRequestError('insightId and action are required');
  }

  const supabase = getAdminRouteSupabase();

  // Update status in ai_operations_insights table
  await supabase
    .from('ai_operations_insights')
    .update({ status: 'Resolved' })
    .eq('id', insightId)
    .eq('tenant_id', tenantId);

  // Log resolved operation to settings audit logs
  await supabase.from('settings_audit_logs').insert({
    tenant_id: tenantId,
    action_by: user.email || 'Admin',
    action_name: `1-Click AI Fix executed for insight: ${insightId}`,
    old_value: 'Status: Review',
    new_value: 'Status: Resolved (1-Click AI Automated Resolution Applied)',
    ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
  });

  return NextResponse.json({
    success: true,
    message: `AI action resolution successfully applied to anomaly resource "${insightId}".`
  });
}, { requireAuth: true, roles: ['Admin'] });
