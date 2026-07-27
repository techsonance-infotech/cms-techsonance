import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const employeeId = new URL(request.url).pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employeeId parameter is required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('employee_emergency_contacts')
    .select('*')
    .eq('employee_id', Number(employeeId))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const employeeId = new URL(request.url).pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employeeId parameter is required');

  const body = await request.json();
  const { name, relationship, phone, alternatePhone, address } = body;
  if (!name || !relationship || !phone) throw new BadRequestError('name, relationship, and phone are required');

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('employee_emergency_contacts')
    .insert({
      tenant_id: tenantId,
      employee_id: Number(employeeId),
      name,
      relationship,
      phone,
      alternate_phone: alternatePhone || null,
      address: address || null,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('id parameter is required');

  const supabase = getAdminRouteSupabase();
  const { error } = await supabase
    .from('employee_emergency_contacts')
    .delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json({ success: true });
}, { requireAuth: true });
