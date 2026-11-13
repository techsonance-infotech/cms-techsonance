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

export const GET = withApiHandler(async (_request, context) => {
  const user = context.auth!.user;
  const tenantId = user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant ID missing');

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

  // 2. Resolve employee profile details (department, branch, role)
  let userDept = (user as any).department || '';
  let userRole = (user.role || '').toLowerCase();

  if (targetUserUuid) {
    const { data: empRecord } = await supabase
      .from('employees')
      .select('id, department, designation')
      .eq('user_id', targetUserUuid)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (empRecord) {
      userDept = empRecord.department || userDept;
    }
  }

  // 3. Fetch all broadcasts for this tenant
  const { data: broadcastsData, error: bErr } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (bErr) {
    console.error('Fetch broadcasts error:', bErr);
    return NextResponse.json({ success: true, announcements: [], summary: { total: 0, pending: 0, completed: 0 } });
  }

  // 4. Fetch all acknowledgements for this user
  let userAcks: any[] = [];
  if (targetUserUuid) {
    const { data } = await supabase
      .from('broadcast_acknowledgements')
      .select('*')
      .eq('user_id', targetUserUuid)
      .eq('tenant_id', tenantId);
    if (data) userAcks = data;
  }

  const ackMap = new Map((userAcks || []).map((a: any) => [a.broadcast_id, a]));

  // 5. Filter broadcasts matching employee's audience scope
  const matchingBroadcasts = (broadcastsData || []).filter((b: any) => {
    if (!b.target_audience_scope || b.target_audience_scope === 'all') return true;
    if (b.target_audience_scope === 'department') {
      const targetDepts = Array.isArray(b.target_departments) ? b.target_departments : [];
      return targetDepts.length === 0 || (userDept && targetDepts.includes(userDept));
    }
    return true;
  });

  const announcements = matchingBroadcasts.map((b: any) => {
    const ack = ackMap.get(b.id) || ackMap.get(b.broadcast_code);
    const isAcknowledged = ack?.status === 'Acknowledged';
    const isPending = Boolean(b.requires_acknowledgement && !isAcknowledged);

    return {
      id: b.id, // Authentic UUID
      broadcastCode: b.broadcast_code,
      title: b.title,
      message: b.message,
      priority: b.priority || 'info',
      category: b.category,
      categoryName: b.category_name || 'Company Announcement',
      requiresAck: Boolean(b.requires_acknowledgement),
      ackDeadline: b.ack_deadline,
      createdAt: b.created_at,
      status: isAcknowledged ? 'Acknowledged' : (isPending ? 'Pending' : 'Read'),
      acknowledgedAt: ack?.acknowledged_at || null,
      ackId: ack?.id || null,
    };
  });

  const pendingCount = announcements.filter((a: any) => a.status === 'Pending').length;
  const completedCount = announcements.filter((a: any) => a.status === 'Acknowledged').length;

  return NextResponse.json({
    success: true,
    userProfile: {
      userId: targetUserUuid || user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      department: userDept || 'General',
    },
    summary: {
      total: announcements.length,
      pending: pendingCount,
      completed: completedCount,
    },
    announcements,
  });
}, { requireAuth: true });
