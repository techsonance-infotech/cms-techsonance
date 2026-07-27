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
    .from('employee_medical')
    .select('*')
    .eq('employee_id', Number(employeeId))
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data || null);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const employeeId = new URL(request.url).pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employeeId parameter is required');

  const body = await request.json();
  const { bloodGroup, allergies, medicalConditions, insuranceProvider, insurancePolicyNumber, insuranceExpiry } = body;

  const supabase = getAdminRouteSupabase();
  const { data, error } = await supabase
    .from('employee_medical')
    .upsert({
      tenant_id: tenantId,
      employee_id: Number(employeeId),
      blood_group: bloodGroup || null,
      allergies: allergies || null,
      medical_conditions: medicalConditions || null,
      insurance_provider: insuranceProvider || null,
      insurance_policy_number: insurancePolicyNumber || null,
      insurance_expiry: insuranceExpiry || null,
    })
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
