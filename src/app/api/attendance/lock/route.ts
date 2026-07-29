import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { attendanceLockSchema } from '@/server/validation/attendance-admin';
import { logAuditAction, publishDomainEvent } from '@/server/events/dispatcher';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();

  const { data: locks, error } = await supabase
    .from('attendance_locks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) throw error;

  return NextResponse.json(locks);
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = attendanceLockSchema.parse(await request.json());
  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  const { data: lock, error } = await supabase
    .from('attendance_locks')
    .upsert({
      tenant_id: tenantId,
      year: payload.year,
      month: payload.month,
      locked: payload.locked,
      locked_by: actor.legacyUserId,
      locked_at: new Date().toISOString(),
    }, {
      onConflict: 'tenant_id, year, month'
    })
    .select('*')
    .single();

  if (error || !lock) throw error ?? new Error('Failed to toggle attendance lock');

  // Trigger Events
  await publishDomainEvent(supabase, tenantId, payload.locked ? 'AttendanceLocked' : 'AttendanceUnlocked', {
    year: payload.year,
    month: payload.month,
    actorId: actor.legacyUserId,
  });

  // Log compliance audit trace
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  await logAuditAction(supabase, {
    tenantId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: 'attendance_lock',
    clientIp,
    userAgent,
    metadata: { year: payload.year, month: payload.month, locked: payload.locked }
  });

  return NextResponse.json(lock);
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });
