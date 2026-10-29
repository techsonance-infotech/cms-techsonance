import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { buildListResponse } from '@/server/supabase/elm-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 200);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);
  const eventType = url.searchParams.get('eventType');

  const supabase = getAdminRouteSupabase();

  let query = supabase
    .from('employee_timeline')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('employee_id', Number(employeeId));

  if (eventType) query = query.eq('event_type', eventType);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
      console.warn('employee_timeline table missing in schema cache, returning empty list');
      return NextResponse.json(buildListResponse([], 0, 1, limit, 'Timeline events fetched successfully (fallback)'));
    }
    throw new Error(error.message);
  }

  return NextResponse.json(buildListResponse(
    (data as Record<string, unknown>[] | null) ?? [],
    Number(count ?? 0),
    Math.floor(offset / limit) + 1,
    limit,
    'Timeline events fetched successfully'
  ));
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const authUserId = context.auth?.user.id;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const url = new URL(request.url);
  const employeeId = url.pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employee ID required');

  const body = await request.json();
  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('employee_timeline')
    .insert({
      tenant_id: tenantId,
      employee_id: Number(employeeId),
      event_type: body.eventType || 'other',
      event_title: body.eventTitle || 'Event recorded',
      event_description: body.eventDescription || null,
      event_data: body.eventData || {},
      triggered_by: authUserId,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) throw error ? new Error(error.message) : new Error('Failed to create timeline event');

  return NextResponse.json({ success: true, data, message: 'Timeline event created' }, { status: 201 });
}, { requireAuth: true, roles: ['Manager'] });
