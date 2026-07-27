import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError } from '@/server/http/errors';
import { getAdminRouteSupabase, buildLegacyUserIdMap } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const tenantId = context.auth?.user.tenantId;
  if (!tenantId) throw new BadRequestError('Tenant credentials required');

  const searchParams = new URL(request.url).searchParams;
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);
  const search = searchParams.get('search');
  const action = searchParams.get('action');
  const resourceType = searchParams.get('resourceType');

  const supabase = getAdminRouteSupabase();
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (action) {
    query = query.ilike('action', `%${action}%`);
  }
  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }
  if (search) {
    query = query.or(`action.ilike.%${search}%,resource_type.ilike.%${search}%,resource_id.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new BadRequestError(error.message);

  const rows = data || [];
  const actorIds = rows.map((r: any) => String(r.actor_user_id)).filter(Boolean);
  
  // Fetch profiles mapping
  const profilesMap = new Map<string, any>();
  if (actorIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', actorIds)
      .eq('tenant_id', tenantId);
    
    (users || []).forEach((u: any) => {
      profilesMap.set(u.id, u);
    });
  }

  const mappedLogs = rows.map((r: any) => {
    const profile = r.actor_user_id ? profilesMap.get(r.actor_user_id) : null;
    return {
      id: r.id,
      employeeId: null,
      action: r.action,
      entityType: r.resource_type,
      entityId: r.resource_id,
      oldValues: r.details?.oldValues || r.details?.previousValues || null,
      newValues: r.details?.newValues || r.details?.updatedValues || r.details || null,
      performedBy: profile ? `${profile.first_name} ${profile.last_name}` : (r.actor_user_id || 'System'),
      ipAddress: r.details?.ipAddress || r.details?.ip || 'N/A',
      createdAt: r.created_at
    };
  });

  return NextResponse.json({
    success: true,
    data: mappedLogs,
    meta: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: Number(count ?? 0)
    }
  });
}, { requireAuth: true, roles: ['Admin'] });
