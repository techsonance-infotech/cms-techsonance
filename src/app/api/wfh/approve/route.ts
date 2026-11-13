import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { isEmployeeRole, type UserRole } from '@/lib/permissions';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { requestId, action = 'approve', comments = '' } = payload;

  if (!requestId) {
    throw new BadRequestError('Request ID is required');
  }

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  // RBAC Enforcement: Regular employees are strictly forbidden from approving or rejecting WFH requests
  const userRole = (user.role || 'employee').toLowerCase().replace(/[\s-]+/g, '_') as UserRole;
  if (isEmployeeRole(userRole)) {
    throw new ForbiddenError('Employees are not authorized to approve or reject WFH requests.');
  }

  const supabase = getAdminRouteSupabase();

  const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
  const approverId = user.providerUserId || user.id;

  // Update `wfh_requests` row in Supabase DB
  try {
    await supabase.from('wfh_requests').update({
      status: newStatus,
      approver_id: approverId,
      manager_comments: comments,
      approved_at: action === 'approve' ? new Date().toISOString() : null
    }).eq('id', requestId).eq('tenant_id', tenantId);
  } catch (err) {
    console.warn('WFH approval DB update info:', err);
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    message: action === 'approve'
      ? 'WFH Request approved successfully!'
      : 'WFH Request rejected.',
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });

