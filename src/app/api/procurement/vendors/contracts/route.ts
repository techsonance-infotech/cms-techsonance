import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get('vendorId');

  if (!vendorId) {
    throw new BadRequestError('Missing vendorId parameter');
  }

  const supabase = getAdminRouteSupabase();

  let { data: contracts, error } = await supabase
    .from('psa_vendor_contracts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Auto-seed sample contract if empty
  if (!contracts || contracts.length === 0) {
    const seeds = [
      {
        tenant_id: tenantId,
        vendor_id: vendorId,
        title: 'Master Service Agreement - IT Infrastructure Consulting',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        value: 1200000.00,
        contract_file_url: 'https://example.com/contracts/hp_infra_consulting.pdf',
        status: 'Active'
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('psa_vendor_contracts')
      .insert(seeds)
      .select('*');

    if (!insertErr && inserted) {
      contracts = inserted;
    }
  }

  return NextResponse.json({ success: true, data: contracts });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { vendorId, title, startDate, endDate, value, contractFileUrl } = body;

  if (!vendorId || !title || !startDate || !endDate || !value) {
    throw new BadRequestError('Missing required contract parameters');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('psa_vendor_contracts')
    .insert({
      tenant_id: tenantId,
      vendor_id: vendorId,
      title,
      start_date: startDate,
      end_date: endDate,
      value: parseFloat(value),
      contract_file_url: contractFileUrl || '',
      status: 'Active'
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { contractId, title, startDate, endDate, value, contractFileUrl, status } = body;

  if (!contractId || !title || !startDate || !endDate || !value) {
    throw new BadRequestError('Missing contractId, title, startDate, endDate, or value');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('psa_vendor_contracts')
    .update({
      title,
      start_date: startDate,
      end_date: endDate,
      value: parseFloat(value),
      contract_file_url: contractFileUrl || '',
      status: status || 'Active'
    })
    .eq('id', contractId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const { searchParams } = new URL(request.url);
  const contractId = searchParams.get('contractId');

  if (!contractId) {
    throw new BadRequestError('Missing contractId parameter');
  }

  const supabase = getAdminRouteSupabase();

  const { error } = await supabase
    .from('psa_vendor_contracts')
    .delete()
    .eq('id', contractId)
    .eq('tenant_id', tenantId);

  if (error) throw error;
  return NextResponse.json({ success: true, message: 'Contract deleted' });
}, { requireAuth: true, roles: ['Employee'] });
