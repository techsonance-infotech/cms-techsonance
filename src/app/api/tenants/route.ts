import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { BadRequestError, NotFoundError } from '@/server/http/errors';
import { getAdminRouteSupabase } from '@/server/supabase/route-helpers';

export const GET = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization required');

  const supabase = getAdminRouteSupabase();

  // Fetch all tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (tenantsError) throw new Error(tenantsError.message);

  // Fetch tenant user memberships to count users
  const { data: tenantUsers, error: usersError } = await supabase
    .from('tenant_users')
    .select('tenant_id');

  const mockIndustries = ['IT Services', 'Construction', 'Real Estate'];

  const mappedTenants = (tenants || []).map((t: any) => {
    // Generate deterministic mock industry, revenue, health based on string lengths/hashes
    const nameLength = t.name.length;
    const industry = mockIndustries[nameLength % mockIndustries.length];
    const revenue = t.status === 'active' ? (nameLength * 13800) % 250000 + 45000 : 0;
    const health = t.status === 'active' ? 90 + (nameLength % 11) : 75;
    const usersCount = tenantUsers ? tenantUsers.filter((tu: any) => tu.tenant_id === t.id).length : 0;

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      created_at: t.created_at,
      industry,
      revenue,
      users: usersCount,
      health,
    };
  });

  return NextResponse.json(mappedTenants);
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin'] });

export const PUT = withApiHandler(async (request, context) => {
  const accessToken = context.auth?.accessToken;
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization required');

  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  if (!id) throw new BadRequestError('Tenant ID is required');

  const payload = await request.json();
  const { name, status } = payload;

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
      ...(status !== undefined ? { status } : {}),
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
  const tenantId = context.auth?.user.tenantId;
  if (!accessToken || !tenantId) throw new BadRequestError('Authorization required');

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
}, { requireAuth: true, roles: ['Admin', 'SuperAdmin'] });
