import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/server/http/errors';
import { createNotificationSchema, notificationTypeSchema, updateNotificationSchema } from '@/server/validation/internal-comms';
import {
  buildLegacyUserIdMap,
  getCurrentSupabaseActor,
  getAdminRouteSupabase,
  resolveAuthUserIdFromLegacyUserId,
} from '@/server/supabase/route-helpers';

function normalizeSupabaseNotificationRow(
  row: Record<string, unknown>,
  userMap: Map<string, number | null>
) {
  const userId = typeof row.user_id === 'string' ? userMap.get(row.user_id) ?? null : null;

  return {
    id: Number(row.id),
    userId,
    title: row.title,
    message: row.message,
    type: row.type,
    link: row.link ?? null,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at ?? null,
  };
}

export const GET = withApiHandler(async (request, context) => {
  const user = context.auth!.user;
  const isAdminLike = user.role === 'Admin' || user.role === 'SuperAdmin';
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();

  if (id) {
    const notificationId = Number(id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      throw new BadRequestError('Valid notification id is required');
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('tenant_id', tenantId)
      .single();
    if (error || !notification) throw new NotFoundError('Notification not found');
    if (!isAdminLike && notification.user_id !== actor.authUserId) throw new ForbiddenError('Notification not found');
    const userMap = await buildLegacyUserIdMap(accessToken, [String(notification.user_id)].filter(Boolean), tenantId);
    return NextResponse.json(normalizeSupabaseNotificationRow(notification, userMap));
  }

  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);
  const filterUserId = searchParams.get('userId');
  const type = searchParams.get('type');
  const isRead = searchParams.get('isRead');
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (isAdminLike && filterUserId) {
    const numericUserId = Number(filterUserId);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      throw new BadRequestError('Valid user id is required');
    }
    query = query.eq('user_id', await resolveAuthUserIdFromLegacyUserId(accessToken, numericUserId, tenantId));
  } else {
    query = query.eq('user_id', actor.authUserId);
  }
  if (type) query = query.eq('type', notificationTypeSchema.parse(type));
  if (isRead === 'true' || isRead === 'false') query = query.eq('is_read', isRead === 'true');

  const { data, count, error } = await query
    .order('created_at', { ascending: searchParams.get('order') === 'asc' })
    .range(offset, offset + limit - 1);
  if (error) throw error;

  const rows = (data as Record<string, unknown>[] | null) ?? [];
  const userMap = await buildLegacyUserIdMap(accessToken, rows.map((row) => String(row.user_id)).filter(Boolean), tenantId);
  const normalizedRows = rows.map((row) => normalizeSupabaseNotificationRow(row, userMap));

  // Merge active company broadcast announcements so they show up directly in In-App Notification Center
  let broadcastItems: any[] = [];
  try {
    let bQuery = supabase
      .from('broadcasts')
      .select('id, title, message, priority, category_name, created_at, status')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (tenantId) {
      bQuery = bQuery.eq('tenant_id', tenantId);
    }

    const { data: bData } = await bQuery;

    if (bData && bData.length > 0) {
      broadcastItems = bData
        .filter((b: any) => !b.status || ['delivered', 'sent', 'active', 'published', 'scheduled'].includes(String(b.status).toLowerCase()))
        .map((b: any) => ({
          id: b.id,
          userId: null,
          title: b.title,
          message: b.message,
          type: b.priority === 'emergency' || b.priority === 'urgent' ? 'error' : b.priority === 'alert' ? 'warning' : 'info',
          link: '/dashboard/employees/broadcast',
          isRead: false,
          createdAt: b.created_at,
          category: b.category_name || 'Broadcast',
        }));
    }
  } catch (err) {
    console.warn('Broadcasts fetch fallback error:', err);
  }

  // Filter duplicates and combine
  const existingTitles = new Set(
    normalizedRows.map((r: any) => String(r.title ?? '').toLowerCase().trim())
  );
  const uniqueBroadcasts = broadcastItems.filter(
    (b: any) => !existingTitles.has(String(b.title ?? '').toLowerCase().trim())
  );

  const combined = [...normalizedRows, ...uniqueBroadcasts]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit);

  return NextResponse.json({
    success: true,
    data: combined,
    message: 'Notifications fetched successfully',
    errors: null,
    meta: { page: Math.floor(offset / limit) + 1, limit, total: Number(count ?? 0) + uniqueBroadcasts.length },
  });
}, { requireAuth: true, roles: ['Employee'] });

export const POST = withApiHandler(async (request, context) => {
  const payload = createNotificationSchema.parse(await request.json());

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  
  const supabase = getAdminRouteSupabase();
  const targetUserId = await resolveAuthUserIdFromLegacyUserId(accessToken, payload.userId, tenantId);
  const { data: created, error } = await supabase.from('notifications').insert({
    user_id: targetUserId,
    title: payload.title.trim(),
    message: payload.message.trim(),
    type: payload.type,
    link: payload.link?.trim() || null,
    is_read: false,
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
  }).select('*').single();

  if (error || !created) throw error ?? new Error('Failed to create notification');
  const userMap = await buildLegacyUserIdMap(accessToken, [targetUserId], tenantId);
  return NextResponse.json(normalizeSupabaseNotificationRow(created, userMap), { status: 201 });
}, { requireAuth: true, roles: ['Manager'] });

export const PUT = withApiHandler(async (request, context) => {
  const rawId = new URL(request.url).searchParams.get('id');
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    // If it's a non-integer or broadcast ID, acknowledge gracefully
    return NextResponse.json({ success: true, message: 'Notification acknowledged' });
  }
  const payload = updateNotificationSchema.parse(await request.json());
  const user = context.auth!.user;
  const isAdminLike = user.role === 'Admin' || user.role === 'SuperAdmin';

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase.from('notifications').select('*').eq('id', id).eq('tenant_id', tenantId).single();
  if (!existing) throw new NotFoundError('Notification not found');
  if (!isAdminLike && existing.user_id !== actor.authUserId) throw new ForbiddenError('Notification not found');

  const { data: updated, error } = await supabase.from('notifications').update({
    ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
    ...(payload.message !== undefined ? { message: payload.message.trim() } : {}),
    ...(payload.type !== undefined ? { type: payload.type } : {}),
    ...(payload.link !== undefined ? { link: payload.link?.trim() || null } : {}),
    ...(payload.isRead !== undefined ? { is_read: payload.isRead } : {}),
  })
  .eq('id', id)
  .eq('tenant_id', tenantId)
  .select('*')
  .single();

  if (error || !updated) throw error ?? new Error('Failed to update notification');
  const userMap = await buildLegacyUserIdMap(accessToken, [String(updated.user_id)].filter(Boolean), tenantId);
  return NextResponse.json(normalizeSupabaseNotificationRow(updated, userMap));
}, { requireAuth: true, roles: ['Employee'] });

export const DELETE = withApiHandler(async (request, context) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Valid notification id is required');
  const user = context.auth!.user;
  const isAdminLike = user.role === 'Admin' || user.role === 'SuperAdmin';

  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization and tenant info required');
  const actor = await getCurrentSupabaseActor(accessToken);
  const supabase = getAdminRouteSupabase();
  const { data: existing } = await supabase.from('notifications').select('*').eq('id', id).eq('tenant_id', tenantId).single();
  if (!existing) throw new NotFoundError('Notification not found');
  if (!isAdminLike && existing.user_id !== actor.authUserId) throw new ForbiddenError('Notification not found');

  const { data: deleted, error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();
    
  if (error || !deleted) throw error ?? new Error('Failed to delete notification');
  const userMap = await buildLegacyUserIdMap(accessToken, [String(deleted.user_id)].filter(Boolean), tenantId);
  return NextResponse.json({
    message: 'Notification deleted successfully',
    notification: normalizeSupabaseNotificationRow(deleted, userMap),
  });
}, { requireAuth: true, roles: ['Employee'] });
