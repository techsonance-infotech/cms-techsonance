import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('training_instructors')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { name, qualifications, hourlyRate, rating, availability } = body;

  if (!name) {
    throw new BadRequestError('name is required');
  }

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('training_instructors')
    .insert({
      tenant_id: tenantId,
      name,
      qualifications: qualifications || null,
      hourly_rate: hourlyRate || 0,
      rating: rating || 5.0,
      availability: availability || 'Available',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
