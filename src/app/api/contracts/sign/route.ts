import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { contractId, signedBy } = body;

  if (!contractId || !signedBy) {
    throw new BadRequestError('Missing contractId or signedBy name');
  }

  const supabase = getAdminRouteSupabase();

  const { data, error } = await supabase
    .from('unified_contracts')
    .update({
      status: 'Signed',
      signature_status: 'Signed',
      signed_at: new Date().toISOString(),
      signed_by: signedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', contractId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error) throw error;
  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
