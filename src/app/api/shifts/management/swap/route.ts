import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveUserUuid(
  supabase: any,
  tenantId: string,
  identifier: any,
  fallbackEmployeeCode?: string
): Promise<string | null> {
  if (!identifier && !fallbackEmployeeCode) return null;
  const str = identifier ? String(identifier).trim() : '';

  if (UUID_REGEX.test(str)) {
    return str;
  }

  // 1. Try public.users by legacy_user_id
  if (str && !isNaN(Number(str))) {
    try {
      const { data: userByLegacy } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('legacy_user_id', Number(str))
        .maybeSingle();

      if (userByLegacy?.id && UUID_REGEX.test(userByLegacy.id)) {
        return userByLegacy.id;
      }
    } catch (e) {
      console.warn('users by legacy_user_id error:', e);
    }
  }

  // 2. Try public.employees by id
  if (str && !isNaN(Number(str))) {
    try {
      const { data: empRecord } = await supabase
        .from('employees')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('id', Number(str))
        .maybeSingle();

      if (empRecord?.user_id && UUID_REGEX.test(empRecord.user_id)) {
        return empRecord.user_id;
      }
    } catch (e) {
      console.warn('employees by id error:', e);
    }
  }

  // 3. Try public.employees by employee_id code
  const codeToSearch = fallbackEmployeeCode || str;
  if (codeToSearch) {
    try {
      const { data: empByCode } = await supabase
        .from('employees')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('employee_id', codeToSearch)
        .maybeSingle();

      if (empByCode?.user_id && UUID_REGEX.test(empByCode.user_id)) {
        return empByCode.user_id;
      }
    } catch (e) {
      console.warn('employees by employee_id error:', e);
    }
  }

  return null;
}

export const POST = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const {
    isApproval = false,
    swapId,
    action = 'approve',
    // New Swap Request fields
    targetUserId,
    employeeId,
    employeeCode,
    requesterDate,
    targetDate,
    reason = ''
  } = payload;

  const user = context.auth!.user;
  const tenantId = user.tenantId;

  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const supabase = getAdminRouteSupabase();

  // Resolve current logged in user's auth UUID
  let currentAuthUserId = (user as any).providerUserId;
  if (!currentAuthUserId || !UUID_REGEX.test(currentAuthUserId)) {
    currentAuthUserId = await resolveUserUuid(supabase, tenantId, user.id);
  }
  if (!currentAuthUserId && user.email) {
    const { data: u } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', user.email)
      .maybeSingle();
    if (u?.id && UUID_REGEX.test(u.id)) {
      currentAuthUserId = u.id;
    }
  }

  if (isApproval) {
    if (!swapId) throw new BadRequestError('Swap ID is required');

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

    try {
      await supabase.from('shift_swap_requests')
        .update({
          status: newStatus,
          approver_id: currentAuthUserId || null,
          approved_at: new Date().toISOString()
        })
        .eq('id', swapId)
        .eq('tenant_id', tenantId);
    } catch (err) {
      console.warn('Swap approval update error:', err);
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: `Shift Swap request ${newStatus.toLowerCase()} successfully!`,
      timestamp: new Date().toISOString()
    });
  }

  // Submit Shift Swap Request
  if (!targetUserId || !requesterDate || !targetDate) {
    throw new BadRequestError('Target User, Requester Date, and Target Date are required');
  }

  if (!currentAuthUserId) {
    throw new BadRequestError('Could not identify active requester account in this workspace');
  }

  // Resolve targetUserId to real auth UUID
  const resolvedTargetUserId = await resolveUserUuid(
    supabase,
    tenantId,
    targetUserId,
    employeeCode || (employeeId ? String(employeeId) : undefined)
  );

  if (!resolvedTargetUserId || !UUID_REGEX.test(resolvedTargetUserId)) {
    throw new BadRequestError('Could not find active user account for the selected colleague');
  }

  let insertedSwap: any = null;
  const { data, error: insertError } = await supabase.from('shift_swap_requests').insert({
    tenant_id: tenantId,
    requester_user_id: currentAuthUserId,
    target_user_id: resolvedTargetUserId,
    requester_roster_date: requesterDate,
    target_roster_date: targetDate,
    reason: reason.trim() || 'Peer Shift Swap',
    status: 'Pending'
  }).select().single();

  if (insertError) {
    console.error('Shift swap insert error:', insertError);
    throw new BadRequestError(insertError.message || 'Failed to submit shift swap request');
  }
  insertedSwap = data;

  return NextResponse.json({
    success: true,
    swap: insertedSwap,
    message: `Shift Swap request submitted for manager review!`,
    timestamp: new Date().toISOString()
  }, { status: 201 });
}, { requireAuth: true });
