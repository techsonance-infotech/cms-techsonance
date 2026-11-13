import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const { data, error } = await supabase
    .from('pms_succession')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('position_name', { ascending: true });

  if (error) {
    console.warn('pms_succession fetch warning:', error.message);
    throw new BadRequestError(error.message);
  }

  return NextResponse.json(data || []);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { positionName, primarySuccessorId, secondarySuccessorId, readinessTimeline, riskMitigation } = body;

  if (!positionName) {
    throw new BadRequestError('positionName is required');
  }

  const { data, error } = await supabase
    .from('pms_succession')
    .insert({
      tenant_id: tenantId,
      position_name: positionName,
      primary_successor_id: primarySuccessorId ? Number(primarySuccessorId) : null,
      secondary_successor_id: secondarySuccessorId ? Number(secondarySuccessorId) : null,
      readiness_timeline: readinessTimeline || 'ready_1_2_years',
      risk_mitigation: riskMitigation || null,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
