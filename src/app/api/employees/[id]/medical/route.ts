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

  // Check if existing medical record exists
  const { data: existing } = await supabase
    .from('employee_medical')
    .select('id')
    .eq('employee_id', Number(employeeId))
    .maybeSingle();

  let data, error;
  if (existing) {
    const res = await supabase
      .from('employee_medical')
      .update({
        blood_group: bloodGroup || null,
        allergies: allergies || null,
        medical_conditions: medicalConditions || null,
        insurance_provider: insuranceProvider || null,
        insurance_policy_number: insurancePolicyNumber || null,
        insurance_expiry: insuranceExpiry || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  } else {
    const res = await supabase
      .from('employee_medical')
      .insert({
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
    data = res.data;
    error = res.error;
  }

  if (error) throw new BadRequestError(error.message);

  // Synchronize bloodGroup to employee's skills/column if provided
  if (bloodGroup && bloodGroup.trim()) {
    try {
      const { data: emp } = await supabase
        .from('employees')
        .select('id, skills')
        .eq('id', Number(employeeId))
        .single();

      if (emp) {
        const skillsObj = typeof emp.skills === 'string' ? JSON.parse(emp.skills) : emp.skills || {};
        await supabase
          .from('employees')
          .update({
            skills: { ...skillsObj, bloodGroup: bloodGroup.trim() },
            updated_at: new Date().toISOString(),
          })
          .eq('id', emp.id);
      }
    } catch (empErr) {
      console.warn('Failed to sync bloodGroup to employee record:', empErr);
    }
  }

  return NextResponse.json(data);
}, { requireAuth: true });
