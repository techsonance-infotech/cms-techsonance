import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('pms_succession')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('position_name', { ascending: true });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { positionName, primarySuccessorId, secondarySuccessorId, readinessTimeline, riskMitigation } = body;

  if (!positionName) {
    throw new BadRequestError('positionName is required');
  }

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('pms_succession')
    .insert({
      tenant_id: tenantId,
      position_name: positionName,
      primary_successor_id: primarySuccessorId || null,
      secondary_successor_id: secondarySuccessorId || null,
      readiness_timeline: readinessTimeline || 'ready_1_2_years',
      risk_mitigation: riskMitigation || null,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
