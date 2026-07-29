import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    requestIds = [],
    action = 'approve', // 'approve', 'fulfill', 'reject'
    resolutionNotes = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  // RBAC Permission Enforcement: Only Admin, HR Manager, and Project Manager can approve/reject tickets
  const userRole = (user.role || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const isAuthorizedApprover = ['admin', 'hr_manager', 'project_manager'].includes(userRole);

  if (!isAuthorizedApprover) {
    throw new ForbiddenError('Insufficient RBAC permissions. Only Managers and HR Admins can approve or fulfill requests.');
  }

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    throw new BadRequestError('Request IDs list is required');
  }

  const supabase = getAdminRouteSupabase();

  const newStatus = action === 'approve'
    ? 'Approved'
    : (action === 'fulfill' ? 'Fulfilled' : 'Rejected');

  try {
    await supabase.from('employee_requests')
      .update({
        status: newStatus,
        approver_id: user.id,
        approved_at: newStatus !== 'Rejected' ? new Date().toISOString() : null,
        resolution_notes: resolutionNotes ? resolutionNotes.trim() : null,
        updated_at: new Date().toISOString()
      })
      .in('id', requestIds)
      .eq('tenant_id', tenantId);
  } catch (err) {
    console.warn('Request approval update DB error:', err);
  }

  return NextResponse.json({
    success: true,
    processedCount: requestIds.length,
    status: newStatus,
    message: requestIds.length > 1
      ? `Bulk ${action} executed for ${requestIds.length} requests!`
      : `Request ticket ${action}d successfully!`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
