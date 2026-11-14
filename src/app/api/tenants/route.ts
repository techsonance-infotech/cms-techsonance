import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  const userRole = context.auth?.user.role;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization required');

  const supabase = getAdminRouteSupabase();
  const isSuperAdmin = userRole === 'SuperAdmin';

  // SuperAdmin sees all tenants; tenant Admin only sees their own organization
  let query = supabase.from('tenants').select('*').order('created_at', { ascending: false });
  if (!isSuperAdmin) {
    query = query.eq('id', tenantId);
  }

  const { data: tenants, error: tenantsError } = await query;
  if (tenantsError) throw new Error(tenantsError.message);

  // Fetch tenant user memberships to count users
  let usersQuery = supabase.from('tenant_users').select('tenant_id');
  if (!isSuperAdmin) {
    usersQuery = usersQuery.eq('tenant_id', tenantId);
  }
  const { data: tenantUsers } = await usersQuery;

  const mappedTenants = (tenants || []).map((t: any) => {
    const usersCount = tenantUsers ? tenantUsers.filter((tu: any) => tu.tenant_id === t.id).length : 0;

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      created_at: t.created_at,
      users: usersCount,
    };
  });

  return NextResponse.json(mappedTenants);
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin'] });

export const PUT = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  const userRole = context.auth?.user.role;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization required');

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('Tenant ID is required');

  const isSuperAdmin = userRole === 'SuperAdmin';

  // Non-superadmins cannot modify other tenants
  if (!isSuperAdmin && id !== tenantId) {
    throw new ForbiddenError('You can only modify your own organization settings');
  }

  const payload = await request.json();
  const { name, status } = payload;

  // Only SuperAdmin can alter tenant subscription status (e.g. active / suspended)
  if (status !== undefined && !isSuperAdmin) {
    throw new ForbiddenError('Only Super Administrators can change organization lifecycle status');
  }

  const supabase = getAdminRouteSupabase();

  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) throw new NotFoundError('Tenant not found');

  const { data: updated, error } = await supabase
    .from('tenants')
    .update({
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(status !== undefined && isSuperAdmin ? { status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true, tenant: updated });
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin'] });

export const DELETE = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const userRole = context.auth?.user.role;
  if (!accessToken) throw new BadRequestError('Authorization required');

  // Deleting an organization is restricted strictly to SuperAdmin
  if (userRole !== 'SuperAdmin') {
    throw new ForbiddenError('Only platform Super Administrators can delete tenants');
  }

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('Tenant ID is required');

  const supabase = getAdminRouteSupabase();

  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) throw new NotFoundError('Tenant not found');

  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
}, { requireAuth: true, roles: ['SuperAdmin'] });
