import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  const supabase = getAdminRouteSupabase();
  let query = supabase.from('pms_feedback').select('*').eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Tenant credentials required');

  const actor = await getCurrentSupabaseActor(accessToken);

  const body = await request.json();
  const { employeeId, feedbackText, rating, badge, visibility } = body;

  if (!employeeId || !feedbackText) {
    throw new BadRequestError('employeeId and feedbackText are required');
  }

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('pms_feedback')
    .insert({
      tenant_id: tenantId,
      employee_id: employeeId,
      reviewer_id: actor.authUserId,
      feedback_text: feedbackText,
      rating: rating || null,
      badge: badge || null,
      visibility: visibility || 'public',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
