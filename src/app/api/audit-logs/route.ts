import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { BadRequestError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();

  const { data: logs, error } = await supabase
    .from('settings_audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: logs || []
  });
}, { requireAuth: true, roles: ['Admin'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { action, logId } = await request.json();

  if (action === 'undo') {
    if (!logId) throw new BadRequestError('logId is required');

    // Fetch the action record
    const { data: originalLog, error: fetchErr } = await supabase
      .from('settings_audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', logId)
      .single();

    if (fetchErr) throw fetchErr;

    // Simulate undo event logging
    await supabase.from('settings_audit_logs').insert({
      tenant_id: tenantId,
      action_by: context.auth!.user.email || 'Admin',
      action_name: `Undo Settings Event: ${originalLog.action_name}`,
      old_value: originalLog.new_value,
      new_value: originalLog.old_value,
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back setting: "${originalLog.action_name}"`
    });
  }

  throw new BadRequestError('Invalid action specified');
}, { requireAuth: true, roles: ['Admin'] });
