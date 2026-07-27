import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { holidaySchema } from '@/server/validation/holidays';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const calendarId = searchParams.get('calendarId');
  if (!calendarId) throw new BadRequestError('calendarId is required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('calendar_id', Number(calendarId))
    .order('holiday_date', { ascending: true });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = holidaySchema.parse(body);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('holidays')
    .insert({
      tenant_id: tenantId,
      calendar_id: validated.calendarId,
      name: validated.name,
      holiday_date: validated.holidayDate,
      is_optional: validated.isOptional,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
