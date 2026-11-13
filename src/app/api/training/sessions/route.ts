import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const { data, error } = await supabase
    .from('training_sessions')
    .select('*, training_programs(*), training_instructors(*)')
    .eq('tenant_id', tenantId)
    .order('start_date', { ascending: true });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { programId, trainerId, startDate, endDate, venue, meetingLink, capacity, waitlistLimit } = body;

  if (!programId || !startDate || !endDate) {
    throw new BadRequestError('programId, startDate, and endDate are required');
  }

  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      tenant_id: tenantId,
      program_id: programId,
      trainer_id: trainerId || null,
      start_date: startDate,
      end_date: endDate,
      venue: venue || null,
      meeting_link: meetingLink || null,
      capacity: capacity || 20,
      waitlist_limit: waitlistLimit || 5,
      status: 'scheduled',
    })
    .select('*, training_programs(*), training_instructors(*)')
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const DELETE = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('id is required');

  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json({ success: true });
}, { requireAuth: true });
