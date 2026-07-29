import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';
import { shiftSchema } from '@/server/validation/shifts';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('shift_definitions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const body = await request.json();
  const validated = shiftSchema.parse(body);

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('shift_definitions')
    .insert({
      tenant_id: tenantId,
      shift_code: `SFT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: validated.name,
      shift_type: 'general',
      start_time: validated.startTime,
      end_time: validated.endTime,
      break_duration_minutes: 60,
      differential_pay_percentage: 0.00,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin', 'Manager'] });
