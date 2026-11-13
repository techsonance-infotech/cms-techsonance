import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor, resolveTenantId } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  let query = supabase.from('pms_feedback').select('*').eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.warn('pms_feedback fetch warning:', error.message);
    throw new BadRequestError(error.message);
  }

  return NextResponse.json(data || []);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const accessToken = context.auth?.accessToken;
  let reviewerId: string | null = context.auth?.user?.providerUserId || null;
  if (!reviewerId && accessToken) {
    try {
      const actor = await getCurrentSupabaseActor(accessToken);
      if (actor?.authUserId) reviewerId = actor.authUserId;
    } catch {}
  }

  const body = await request.json();
  const { employeeId, feedbackText, rating, badge, visibility } = body;

  if (!employeeId || !feedbackText) {
    throw new BadRequestError('employeeId and feedbackText are required');
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(reviewerId || ''));
  if (!isUuid) {
    const { data: u } = await supabase.from('users').select('id').eq('tenant_id', tenantId).limit(1).maybeSingle();
    reviewerId = u?.id || null;
  }

  if (!reviewerId) {
    throw new BadRequestError('Valid reviewer identity required');
  }

  const { data, error } = await supabase
    .from('pms_feedback')
    .insert({
      tenant_id: tenantId,
      employee_id: Number(employeeId),
      reviewer_id: reviewerId,
      feedback_text: feedbackText,
      rating: rating ? Number(rating) : 5,
      badge: badge || 'Team Player',
      visibility: visibility || 'public',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
