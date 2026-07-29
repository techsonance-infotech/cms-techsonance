import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase, getCurrentSupabaseActor } from '@/server/supabase/route-helpers';
import { exceptionResolutionSchema } from '@/server/validation/attendance-admin';
import { logAuditAction } from '@/server/events/dispatcher';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const employeeId = searchParams.get('employee_id');
  const resolved = searchParams.get('resolved'); // 'true' | 'false'

  const supabase = getAdminRouteSupabase();

  let query = supabase
    .from('attendance_exceptions')
    .select(`
      *,
      employees(id, employee_id, department, user_id)
    `)
    .eq('tenant_id', tenantId);

  if (employeeId) query = query.eq('employee_id', Number(employeeId));
  if (resolved) query = query.eq('resolved', resolved === 'true');

  const { data: exceptions, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json(exceptions);
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });

export const PATCH = withApiHandler(async (request, context) => {
  const payload = exceptionResolutionSchema.parse(await request.json());
  const tenantId = context.auth?.user.tenantId;
  const accessToken = context.auth?.accessToken;
  if (!tenantId || !accessToken) throw new BadRequestError('Authorization and tenant info required');

  const supabase = getAdminRouteSupabase();
  const actor = await getCurrentSupabaseActor(accessToken);

  // Fetch target exception
  const { data: exception } = await supabase
    .from('attendance_exceptions')
    .select('*')
    .eq('id', payload.exceptionId)
    .eq('tenant_id', tenantId)
    .single();

  if (!exception) throw new NotFoundError('Attendance exception not found');

  const { data: updated, error } = await supabase
    .from('attendance_exceptions')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: actor.legacyUserId,
      resolution_notes: payload.resolutionNotes,
    })
    .eq('id', payload.exceptionId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !updated) throw error ?? new Error('Failed to resolve exception');

  // Log compliance audit trace
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  await logAuditAction(supabase, {
    tenantId,
    actorId: actor.legacyUserId ? String(actor.legacyUserId) : null,
    actionType: 'exception_resolve',
    clientIp,
    userAgent,
    metadata: { exceptionId: exception.id, resolutionNotes: payload.resolutionNotes }
  });

  return NextResponse.json({ success: true, exception: updated });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });
