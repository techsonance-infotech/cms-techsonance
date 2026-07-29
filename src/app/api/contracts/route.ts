import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const supabase = getAdminRouteSupabase();

  let { data: contracts, error } = await supabase
    .from('unified_contracts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Auto-seed sample Client, Employee, and Vendor contracts if empty
  if (!contracts || contracts.length === 0) {
    const seeds = [
      {
        tenant_id: tenantId,
        title: 'Enterprise Software License SLA Agreement',
        type: 'Client',
        party_name: 'Acme Global Corp Solutions',
        start_date: '2026-01-01',
        end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // expiring in 15 days
        value: 4500000.00,
        status: 'Pending Signature',
        signature_status: 'Unsigned',
        contract_file_url: 'https://example.com/contracts/acme_software_sla.pdf'
      },
      {
        tenant_id: tenantId,
        title: 'Executive Employment & Non-Compete Agreement',
        type: 'Employee',
        party_name: 'Priya Sharma (VP Engineering)',
        start_date: '2025-06-01',
        end_date: '2028-05-31',
        value: 3600000.00,
        status: 'Signed',
        signature_status: 'Signed',
        signed_at: new Date().toISOString(),
        signed_by: 'Priya Sharma',
        contract_file_url: 'https://example.com/contracts/priya_employment_terms.pdf'
      },
      {
        tenant_id: tenantId,
        title: 'Managed Datacenter Support Services Contract',
        type: 'Vendor',
        party_name: 'Dell Infrastructure Partners',
        start_date: '2025-01-01',
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // expiring in 45 days
        value: 1800000.00,
        status: 'Signed',
        signature_status: 'Signed',
        signed_at: new Date().toISOString(),
        signed_by: 'Dell Partner Rep',
        contract_file_url: 'https://example.com/contracts/dell_datacenter_support.pdf'
      }
    ];

    const { data: inserted, error: insertErr } = await supabase
      .from('unified_contracts')
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
  const { title, type, partyName, startDate, endDate, value, contractFileUrl } = body;

  if (!title || !type || !partyName || !startDate || !endDate || !value) {
    throw new BadRequestError('Missing required contract fields');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('unified_contracts')
    .insert({
      tenant_id: tenantId,
      title,
      type,
      party_name: partyName,
      start_date: startDate,
      end_date: endDate,
      value: parseFloat(value),
      status: 'Draft',
      signature_status: 'Unsigned',
      contract_file_url: contractFileUrl || ''
    })
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
