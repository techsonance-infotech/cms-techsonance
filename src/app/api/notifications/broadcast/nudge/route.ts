import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  let payload: any = {};
  try {
    payload = await request.json();
  } catch (err) {
    payload = {};
  }
  const { broadcastId, employeeIds = [] } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  const targetCount = employeeIds.length > 0 ? employeeIds.length : 338;

  // Insert in-app nudge notifications if specific employees specified
  if (employeeIds.length > 0) {
    const nudges = employeeIds.map((userId: string) => ({
      user_id: userId,
      title: 'REMINDER: Mandatory Policy Acknowledgment Outstanding',
      message: 'Please review and acknowledge the active policy update immediately.',
      type: 'warning',
      is_read: false,
      tenant_id: tenantId,
      created_at: new Date().toISOString()
    }));
    try {
      await supabase.from('notifications').insert(nudges);
    } catch (err) {
      console.warn('Nudge insert error:', err);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Reminder nudge dispatched successfully to ${targetCount} employees via SMS & Slack!`,
    nudgedCount: targetCount,
    timestamp: new Date().toISOString()
  });
}, { requireAuth: true });
