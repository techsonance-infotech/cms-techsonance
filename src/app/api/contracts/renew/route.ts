import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const userId = context.auth?.user.id;
  if (!tenantId || !userId) throw new BadRequestError('Tenant or user context missing');

  const body = await request.json();
  const { contractId, newEndDate, newValue, remarks } = body;

  if (!contractId || !newEndDate || !newValue) {
    throw new BadRequestError('Missing contractId, newEndDate, or newValue');
  }

  const supabase = getAdminRouteSupabase();

  // 1. Retrieve the existing contract details
  const { data: contract, error: fetchErr } = await supabase
    .from('unified_contracts')
    .select('*')
    .eq('id', contractId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchErr || !contract) {
    throw new BadRequestError('Contract not found');
  }

  // 2. Insert into renewals audit history
  const { error: renewalErr } = await supabase
    .from('contract_renewals')
    .insert({
      tenant_id: tenantId,
      contract_id: contractId,
      previous_end_date: contract.end_date,
      new_end_date: newEndDate,
      previous_value: contract.value,
      new_value: parseFloat(newValue),
      renewed_by: userId,
      remarks: remarks || `Contract renewed. Extended expiry from ${contract.end_date} to ${newEndDate}.`
    });

  if (renewalErr) throw renewalErr;

  // 3. Update the contract record
  const { data: updatedContract, error: updateErr } = await supabase
    .from('unified_contracts')
    .update({
      end_date: newEndDate,
      value: parseFloat(newValue),
      status: 'Signed', // Automatically mark renewed signed contracts active
      updated_at: new Date().toISOString()
    })
    .eq('id', contractId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (updateErr) throw updateErr;

  return NextResponse.json({ success: true, data: updatedContract });
}, { requireAuth: true, roles: ['Employee'] });

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const contractId = searchParams.get('contractId');

  if (!contractId) {
    throw new BadRequestError('Missing contractId parameter');
  }

  const supabase = getAdminRouteSupabase();

  const { data: renewals, error } = await supabase
    .from('contract_renewals')
    .select('*, renewer:renewed_by(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json({ success: true, data: renewals });
}, { requireAuth: true, roles: ['Employee'] });
