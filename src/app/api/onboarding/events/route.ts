import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { data: events, error } = await supabase
    .from('onboarding_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(events || []);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const { eventId, action } = body;
  if (!eventId) throw new BadRequestError('eventId is required');

  const supabase = getAdminRouteSupabase();

  if (action === 'retry') {
    // Increment retry count, mark pending, and simulate processing
    const { data: currentEvent } = await supabase
      .from('onboarding_events')
      .select('*')
      .eq('id', Number(eventId))
      .eq('tenant_id', tenantId)
      .single();

    if (!currentEvent) throw new BadRequestError('Event not found');

    const nextRetry = currentEvent.retry_count + 1;
    const nextStatus = nextRetry > 3 ? 'failed' : 'processed';

    const { data, error } = await supabase
      .from('onboarding_events')
      .update({
        retry_count: nextRetry,
        processed_status: nextStatus
      })
      .eq('id', Number(eventId))
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw new BadRequestError(error.message);
    return NextResponse.json(data);
  }

  throw new BadRequestError('Invalid event queue command action');
}, { requireAuth: true });
