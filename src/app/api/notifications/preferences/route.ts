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

  let { data: preferences, error } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', actor.authUserId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !preferences) {
    // Seed default preferences if not exists
    const { data: inserted, error: insertErr } = await supabase
      .from('user_notification_preferences')
      .insert({
        user_id: actor.authUserId,
        tenant_id: tenantId,
        in_app_enabled: true,
        email_enabled: true,
        sms_enabled: false,
        whatsapp_enabled: false,
        push_enabled: false,
        task_updates: true,
        attendance_alerts: true,
        approval_requests: true
      })
      .select('*')
      .single();

    if (!insertErr && inserted) {
      preferences = inserted;
    }
  }

  return NextResponse.json({ success: true, data: preferences });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Tenant or authorization info required');

  const actor = await getCurrentSupabaseActor(accessToken);
  const body = await request.json();
  const { 
    inAppEnabled, 
    emailEnabled, 
    smsEnabled, 
    whatsappEnabled, 
    pushEnabled,
    taskUpdates,
    attendanceAlerts,
    approvalRequests
  } = body;

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('user_notification_preferences')
    .upsert({
      user_id: actor.authUserId,
      tenant_id: tenantId,
      in_app_enabled: inAppEnabled,
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      whatsapp_enabled: whatsappEnabled,
      push_enabled: pushEnabled,
      task_updates: taskUpdates,
      attendance_alerts: attendanceAlerts,
      approval_requests: approvalRequests,
      updated_at: new Date().toISOString()
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
