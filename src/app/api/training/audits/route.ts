import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('lms_audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Tenant credentials required');

  const actor = await getCurrentSupabaseActor(accessToken);

  const body = await request.json();
  const { action, details } = body;

  if (!action) {
    throw new BadRequestError('action is required');
  }

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('lms_audit_logs')
    .insert({
      tenant_id: tenantId,
      performed_by: actor.authUserId,
      action,
      details: details || {},
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
