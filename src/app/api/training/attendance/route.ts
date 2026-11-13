import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveTenantId } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const searchParams = new URL(request.url).searchParams;
  const sessionId = searchParams.get('sessionId');

  let query = supabase.from('training_attendance').select('*, training_enrollments(*)').eq('tenant_id', tenantId);

  if (sessionId) {
    query = query.eq('session_id', Number(sessionId));
  }

  const { data, error } = await query;
  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data || []);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const supabase = getAdminRouteSupabase();
  const tenantId = await resolveTenantId(context, supabase);
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const body = await request.json();
  const { enrollmentId, sessionId, date, status, checkinGpsLat, checkinGpsLong, verificationMethod } = body;

  if (!enrollmentId || !sessionId || !date) {
    throw new BadRequestError('enrollmentId, sessionId, and date are required');
  }

  const { data, error } = await supabase
    .from('training_attendance')
    .insert({
      tenant_id: tenantId,
      enrollment_id: enrollmentId,
      session_id: sessionId,
      date,
      status: status || 'present',
      checkin_gps_lat: checkinGpsLat || null,
      checkin_gps_long: checkinGpsLong || null,
      verification_method: verificationMethod || 'manual',
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
