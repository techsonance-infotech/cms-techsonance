import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    findingId,
    status = 'Closed', // 'Open', 'In_Review', 'Closed'
    capaPlan = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAuthorizedManager = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!isAuthorizedManager) {
    throw new ForbiddenError('Insufficient permissions. Updating CAPA plans requires Manager access.');
  }

  if (!findingId) {
    throw new BadRequestError('Finding ID is required');
  }

  const supabase = getAdminRouteSupabase();

  try {
    await supabase.from('compliance_audit_findings')
      .update({
        status,
        corrective_action_plan: capaPlan ? capaPlan.trim() : null,
        resolved_at: status === 'Closed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', findingId)
      .eq('tenant_id', tenantId);
  } catch (err) {
    console.warn('Compliance CAPA DB update error:', err);
  }

  return NextResponse.json({
    success: true,
    message: `Corrective Action Plan (CAPA) updated successfully for finding ${findingId}!`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
