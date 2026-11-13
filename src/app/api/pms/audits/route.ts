import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const { data, error } = await supabase
    .from('pms_audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('pms_audit_logs fetch warning:', error.message);
    throw new BadRequestError(error.message);
  }

  return NextResponse.json(data || []);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  let actorId = context.auth?.user?.providerUserId || null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(actorId || ''));
  if (!isUuid) {
    const { data: u } = await supabase.from('users').select('id').eq('tenant_id', tenantId).limit(1).maybeSingle();
    actorId = u?.id || null;
  }

  const body = await request.json();
  const { action, details } = body;

  if (!action) {
    throw new BadRequestError('action is required');
  }

  const { data, error } = await supabase
    .from('pms_audit_logs')
    .insert({
      tenant_id: tenantId,
      performed_by: actorId || '00000000-0000-0000-0000-000000000000',
      action,
      details: details || {},
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
