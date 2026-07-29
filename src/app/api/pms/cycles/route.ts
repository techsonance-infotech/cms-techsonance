import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('pms_cycles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('start_date', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { title, cycleType, startDate, endDate, status, weightageGoals, weightageCompetencies } = body;

  if (!title || !startDate || !endDate) {
    throw new BadRequestError('title, startDate, and endDate are required');
  }

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('pms_cycles')
    .insert({
      tenant_id: tenantId,
      title,
      cycle_type: cycleType || 'annual',
      start_date: startDate,
      end_date: endDate,
      status: status || 'draft',
      weightage_goals: weightageGoals || 50,
      weightage_competencies: weightageCompetencies || 50,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
