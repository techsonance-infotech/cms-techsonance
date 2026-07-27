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
    .from('employee_bank_accounts')
    .select('*')
    .eq('employee_id', Number(employeeId))
    .eq('tenant_id', tenantId)
    .order('is_primary', { ascending: false });

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant info required');

  const employeeId = new URL(request.url).pathname.split('/').at(-2);
  if (!employeeId || isNaN(Number(employeeId))) throw new BadRequestError('Valid employeeId parameter is required');

  const body = await request.json();
  const { bankName, accountNumber, accountHolderName, ifscCode, accountType, isPrimary } = body;
  if (!bankName || !accountNumber || !accountHolderName || !ifscCode) {
    throw new BadRequestError('bankName, accountNumber, accountHolderName, and ifscCode are required');
  }

  const supabase = getAdminRouteSupabase();

  if (isPrimary) {
    await supabase
      .from('employee_bank_accounts')
      .update({ is_primary: false })
      .eq('employee_id', Number(employeeId))
      .eq('tenant_id', tenantId);
  }

  const { data, error } = await supabase
    .from('employee_bank_accounts')
    .insert({
      tenant_id: tenantId,
      employee_id: Number(employeeId),
      bank_name: bankName,
      account_number: accountNumber,
      account_holder_name: accountHolderName,
      ifsc_code: ifscCode,
      account_type: accountType || 'savings',
      is_primary: !!isPrimary,
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
    .from('employee_bank_accounts')
    .delete()
    .eq('id', Number(id))
    .eq('tenant_id', tenantId);

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json({ success: true });
}, { requireAuth: true });
