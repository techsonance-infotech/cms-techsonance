import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employeeId');

  let query = supabase.from('pms_pips').select('*').eq('tenant_id', tenantId);

  if (employeeId) {
    query = query.eq('employee_id', Number(employeeId));
  }

  const { data, error } = await query;
  if (error) {
    console.warn('pms_pips fetch warning:', error.message);
    throw new BadRequestError(error.message);
  }

  return NextResponse.json(data || []);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { employeeId, startDate, endDate, objectives, reviewMilestones, status } = body;

  if (!employeeId || !startDate || !endDate || !objectives) {
    throw new BadRequestError('employeeId, startDate, endDate, and objectives are required');
  }

  const normalizedObjectives = Array.isArray(objectives)
    ? objectives
    : [{ target: String(objectives), status: 'In Progress' }];

  const { data, error } = await supabase
    .from('pms_pips')
    .insert({
      tenant_id: tenantId,
      employee_id: Number(employeeId),
      start_date: startDate,
      end_date: endDate,
      objectives: normalizedObjectives,
      review_milestones: reviewMilestones || [],
      status: status || 'active',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
