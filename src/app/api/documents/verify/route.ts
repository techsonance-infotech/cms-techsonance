import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const PUT = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  const legacyUserId = context.auth?.user.id;
  if (!tenantId || !legacyUserId) throw new BadRequestError('Authorization credentials required');

  const body = await request.json();
  const { id, verificationStatus, rejectionReason } = body;
  if (!id || !verificationStatus) throw new BadRequestError('id and verificationStatus are required');

  const supabase = getAdminRouteSupabase();

  let profileQuery = supabase
    .from('users')
    .select('id, legacy_user_id')
    .eq('tenant_id', tenantId);

  if (String(legacyUserId).includes('-')) {
    profileQuery = profileQuery.eq('id', legacyUserId);
  } else {
    profileQuery = profileQuery.eq('legacy_user_id', Number(legacyUserId));
  }

  const { data: userProfile, error: profileErr } = await profileQuery.single();
  if (profileErr || !userProfile) throw new BadRequestError('Unable to identify HR user profile');

  const { data, error } = await supabase
    .from('employee_documents')
    .update({
      verification_status: verificationStatus,
      rejection_reason: rejectionReason || null,
      verified_by: userProfile.legacy_user_id || 1,
      verified_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
    })
    .eq('id', Number(id))
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw new BadRequestError(error.message);
  return NextResponse.json(data);
}, { requireAuth: true });
