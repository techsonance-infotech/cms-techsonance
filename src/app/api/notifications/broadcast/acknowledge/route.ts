import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, resolveActorUuid } from '@/server/supabase/route-helpers';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveUserUuid(supabase: any, rawId: any, email?: string): Promise<string | null> {
  if (!rawId && !email) return null;
  const strId = String(rawId || '').trim();

  if (UUID_REGEX.test(strId)) {
    const { data } = await supabase.from('users').select('id').eq('id', strId).maybeSingle();
    if (data?.id) return data.id;
  }

  const numId = parseInt(strId, 10);
  if (!isNaN(numId)) {
    const { data: byLegacy } = await supabase.from('users').select('id').eq('legacy_user_id', numId).maybeSingle();
    if (byLegacy?.id) return byLegacy.id;

    const { data: byEmp } = await supabase.from('employees').select('user_id').eq('id', numId).maybeSingle();
    if (byEmp?.user_id && UUID_REGEX.test(byEmp.user_id)) return byEmp.user_id;
  }

  if (email) {
    const { data: byEmail } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (byEmail?.id) return byEmail.id;

    const { data: byEmpEmail } = await supabase.from('employees').select('user_id').eq('work_email', email).maybeSingle();
    if (byEmpEmail?.user_id && UUID_REGEX.test(byEmpEmail.user_id)) return byEmpEmail.user_id;
  }

  return null;
}

export const POST = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID missing');

  const payload = await request.json();
  const { broadcastId, ackId } = payload;

  if (!broadcastId && !ackId) {
    throw new BadRequestError('broadcastId or ackId is required');
  }

  const supabase = getAdminRouteSupabase();

  // 1. Resolve authentic UUID for User
  const actorUuid = await resolveActorUuid(context, supabase);
  let targetUserUuid: string | null = (actorUuid && UUID_REGEX.test(actorUuid)) ? actorUuid : null;
  if (!targetUserUuid) {
    targetUserUuid = await resolveUserUuid(supabase, user.id, user.email);
  }
  if (!targetUserUuid && user.email) {
    const { data: u } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle();
    if (u?.id && UUID_REGEX.test(u.id)) targetUserUuid = u.id;
  }

  // 2. Resolve authentic UUID for Broadcast (handles both UUID and code like 'BC-9540')
  let targetBroadcastUuid: string | null = null;
  if (broadcastId) {
    const strBId = String(broadcastId).trim();
    if (UUID_REGEX.test(strBId)) {
      targetBroadcastUuid = strBId;
    } else {
      const { data: bRec } = await supabase
        .from('broadcasts')
        .select('id')
        .eq('broadcast_code', strBId)
        .maybeSingle();
      if (bRec?.id) {
        targetBroadcastUuid = bRec.id;
      }
    }
  }

  // 3. Locate existing acknowledgment record
  let ackRecord: any = null;
  if (ackId && typeof ackId === 'string' && UUID_REGEX.test(ackId)) {
    const { data } = await supabase
      .from('broadcast_acknowledgements')
      .select('*')
      .eq('id', ackId)
      .maybeSingle();
    ackRecord = data;
  }

  if (!ackRecord && targetBroadcastUuid) {
    let query = supabase
      .from('broadcast_acknowledgements')
      .select('*')
      .eq('broadcast_id', targetBroadcastUuid);

    if (targetUserUuid) {
      query = query.eq('user_id', targetUserUuid);
    }
    const { data } = await query.maybeSingle();
    ackRecord = data;
  }

  const nowIso = new Date().toISOString();

  // 4. Update existing or insert on-demand confirmed record
  if (ackRecord) {
    const { error: updateErr } = await supabase
      .from('broadcast_acknowledgements')
      .update({
        status: 'Acknowledged',
        acknowledged_at: nowIso,
      })
      .eq('id', ackRecord.id);

    if (updateErr) {
      console.error('Ack update error:', updateErr);
      throw new BadRequestError(updateErr.message || 'Failed to record acknowledgment');
    }
  } else if (targetBroadcastUuid) {
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Employee';
    
    // Ensure we have a valid user UUID for foreign key constraint
    let effectiveInsertUserId = targetUserUuid;
    if (!effectiveInsertUserId) {
      const { data: fallbackUser } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1)
        .maybeSingle();
      effectiveInsertUserId = fallbackUser?.id;
    }

    if (effectiveInsertUserId) {
      const { data: inserted, error: insertErr } = await supabase
        .from('broadcast_acknowledgements')
        .insert({
          tenant_id: tenantId,
          broadcast_id: targetBroadcastUuid,
          user_id: effectiveInsertUserId,
          employee_name: userName,
          department: (user as any).department || 'General',
          branch: 'Headquarters (HQ)',
          channel_delivered: 'In-App',
          status: 'Acknowledged',
          acknowledged_at: nowIso,
        })
        .select()
        .maybeSingle();

      if (insertErr) {
        console.error('Ack insert error:', insertErr);
        throw new BadRequestError(insertErr.message || 'Failed to record acknowledgment');
      }
      ackRecord = inserted;
    }
  }

  // 5. Recalculate acknowledgment stats on the broadcast record
  const finalBroadcastId = targetBroadcastUuid || ackRecord?.broadcast_id;
  if (finalBroadcastId) {
    try {
      const { count: ackCount } = await supabase
        .from('broadcast_acknowledgements')
        .select('*', { count: 'exact', head: true })
        .eq('broadcast_id', finalBroadcastId)
        .eq('status', 'Acknowledged');

      const { data: bData } = await supabase
        .from('broadcasts')
        .select('total_target')
        .eq('id', finalBroadcastId)
        .maybeSingle();

      const totalTarget = Math.max(bData?.total_target || 1, 1);
      const verifiedAckCount = ackCount || 1;
      const newAckRate = parseFloat(((verifiedAckCount / totalTarget) * 100).toFixed(1));

      await supabase
        .from('broadcasts')
        .update({
          acknowledged_count: verifiedAckCount,
          ack_rate: Math.min(newAckRate, 100),
        })
        .eq('id', finalBroadcastId);
    } catch (statErr) {
      console.warn('Broadcast stats update info:', statErr);
    }
  }

  // 6. Mark in-app notification as read if exists
  if (targetUserUuid) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', targetUserUuid)
        .eq('tenant_id', tenantId);
    } catch (_notifErr) {}
  }

  return NextResponse.json({
    success: true,
    data: {
      acknowledgedAt: nowIso,
      status: 'Acknowledged',
      broadcastId: finalBroadcastId,
    },
    message: 'Announcement acknowledged successfully!',
    acknowledgedAt: nowIso,
    status: 'Acknowledged',
    broadcastId: finalBroadcastId,
  });
}, { requireAuth: true });
