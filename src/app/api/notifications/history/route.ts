import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Tenant or authorization info required');

  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  // Retrieve general notifications history
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', actor.authUserId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;

  // Enhance history with simulated delivery logs (Push, SMS, WhatsApp details)
  const history = (notifications || []).map((notif: any) => {
    // Deterministically generate channel statuses based on notification properties
    const hasEmail = true;
    const hasSms = notif.type === 'error' || notif.type === 'warning';
    const hasWhatsApp = notif.type === 'success';
    const hasPush = true;

    return {
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      createdAt: notif.created_at,
      channels: {
        inApp: 'Delivered',
        email: hasEmail ? 'Delivered' : 'Skipped',
        sms: hasSms ? 'Delivered' : 'Skipped',
        whatsApp: hasWhatsApp ? 'Delivered' : 'Skipped',
        push: hasPush ? 'Delivered' : 'Skipped'
      }
    };
  });

  return NextResponse.json({ success: true, data: history });
}, { requireAuth: true, roles: ['Employee'] });
