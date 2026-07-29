import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const POST = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant context missing');

  const body = await request.json();
  const { passId, action } = body; // Action can be 'Approve', 'CheckIn', 'CheckOut', 'Reject'

  if (!passId || !action) {
    throw new BadRequestError('Missing passId or action');
  }

  const supabase = getAdminRouteSupabase();

  let updateFields: any = {
    updated_at: new Date().toISOString()
  };

  if (action === 'Approve') {
    updateFields.status = 'Approved';
  } else if (action === 'Reject') {
    updateFields.status = 'Rejected';
  } else if (action === 'CheckIn') {
    updateFields.status = 'Checked In';
    updateFields.check_in_at = new Date().toISOString();
    updateFields.security_approved_by = context.auth!.user.id;
    updateFields.security_approved_at = new Date().toISOString();
  } else if (action === 'CheckOut') {
    updateFields.status = 'Checked Out';
    updateFields.check_out_at = new Date().toISOString();
  } else {
    throw new BadRequestError('Invalid action parameter');
  }

  const { data, error } = await supabase
    .from('visitor_passes')
    .update(updateFields)
    .eq('id', passId)
    .eq('tenant_id', tenantId)
    .select('*, visitors(*)')
    .single();

  if (error) throw error;

  return NextResponse.json({ success: true, data });
}, { requireAuth: true, roles: ['Employee'] });
