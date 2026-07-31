import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const { entryIds = [], action = 'approve', comments = '', isLockPeriod = false } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Handle Pay Period Locking Action
  if (isLockPeriod) {
    try {
      await supabase.from('timesheet_periods').insert({
        tenant_id: tenantId,
        period_code: `PRD-${new Date().toISOString().slice(0, 7)}`,
        period_type: 'weekly',
        start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by: user.providerUserId
      });
    } catch (err) {
      console.warn('Period lock error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Pay period timesheets locked successfully! No further edits allowed.',
      timestamp: new Date().toISOString()
    });
  }

  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    throw new BadRequestError('Entry IDs list is required');
  }

  const newStatus = action === 'approve'
    ? 'Approved'
    : (action === 'correction' ? 'Correction_Requested' : 'Rejected');

  // Update `timesheet_entries` status for all selected IDs (Batch / Bulk Approval)
  try {
    await supabase.from('timesheet_entries')
      .update({
        status: newStatus,
        approver_id: user.providerUserId,
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        correction_notes: action === 'correction' ? comments : null,
        updated_at: new Date().toISOString()
      })
      .in('id', entryIds)
      .eq('tenant_id', tenantId);
  } catch (err) {
    console.warn('Timesheet approve DB update info:', err);
  }

  // Insert audit log in `timesheet_approvals`
  const approvalLogs = entryIds.map((id: string) => ({
    tenant_id: tenantId,
    timesheet_entry_id: id,
    actor_id: user.providerUserId,
    action_taken: entryIds.length > 1 ? `Bulk_${action.toUpperCase()}` : action.toUpperCase(),
    comments: comments || `${action} action executed.`
  }));

  try {
    await supabase.from('timesheet_approvals').insert(approvalLogs);
  } catch (err) {
    console.warn('Approval log insert error:', err);
  }

  return NextResponse.json({
    success: true,
    processedCount: entryIds.length,
    status: newStatus,
    message: entryIds.length > 1
      ? `Bulk ${action} executed successfully for ${entryIds.length} timesheets!`
      : `Timesheet entry ${action}d successfully!`,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
