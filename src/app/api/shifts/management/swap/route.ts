import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    isApproval = false,
    swapId,
    action = 'approve',
    // New Swap Request fields
    targetUserId,
    requesterDate,
    targetDate,
    reason = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  if (isApproval) {
    if (!swapId) throw new BadRequestError('Swap ID is required');

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

    try {
      await supabase.from('shift_swap_requests')
        .update({
          status: newStatus,
          approver_id: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', swapId)
        .eq('tenant_id', tenantId);
    } catch (err) {
      console.warn('Swap approval update error:', err);
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Shift Swap request ${newStatus.toLowerCase()} successfully!`,
      timestamp: new Date().toISOString()
    });
  }

  // Submit Shift Swap Request
  if (!targetUserId || !requesterDate || !targetDate) {
    throw new BadRequestError('Target User, Requester Date, and Target Date are required');
  }

  let insertedSwap: any = null;
  try {
    const { data } = await supabase.from('shift_swap_requests').insert({
      tenant_id: tenantId,
      requester_user_id: user.id,
      target_user_id: targetUserId,
      requester_roster_date: requesterDate,
      target_roster_date: targetDate,
      reason: reason.trim() || 'Peer Shift Swap',
      status: 'Pending'
    }).select().single();
    insertedSwap = data;
  } catch (err) {
    console.warn('Shift swap insert error:', err);
  }

  return NextResponse.json({
    success: true,
    message: `Shift Swap request submitted for manager review!`,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });
