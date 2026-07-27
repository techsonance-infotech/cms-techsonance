import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('competency_framework')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('designation', { ascending: true });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { designation, skillName, requiredLevel } = body;

  if (!designation || !skillName) {
    throw new BadRequestError('designation and skillName are required');
  }

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('competency_framework')
    .insert({
      tenant_id: tenantId,
      designation,
      skill_name: skillName,
      required_level: requiredLevel || 'intermediate',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
