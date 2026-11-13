/**
 * Roles API Route - GET /api/rbac/roles
 * Fetches all roles for the current tenant
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRouteSupabase } from '@/server/supabase/route-helpers';
import { fetchRoles, fetchRolePermissions, updateRole } from '@/server/rbac/service';
import { requireRole } from '@/server/auth/rbac';
import { normalizeAppRole } from '@/server/auth/rbac';
import { authenticateRequest } from '@/server/auth/session';

export async function GET(request: Request) {
  try {
    // Authenticate request
    const auth = await authenticateRequest(request, { required: true });
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin-level access
    try {
      requireRole(normalizeAppRole(auth.user.role), ['SuperAdmin', 'Admin']);
    } catch (error) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const tenantId = auth.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant context' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = getRouteSupabase(auth.accessToken);

    // Fetch roles
    const roles = await fetchRoles(supabase, tenantId);

    // Fetch permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role: any) => {
        const rawPerms = role.permissions || {};
        const normalizedPerms: Record<string, string[]> = {};
        if (rawPerms && typeof rawPerms === 'object') {
          Object.keys(rawPerms).forEach((modKey) => {
            const val = rawPerms[modKey];
            if (Array.isArray(val)) {
              normalizedPerms[modKey] = val;
            } else if (val && typeof val === 'object') {
              normalizedPerms[modKey] = Object.keys(val).filter((action) => Boolean(val[action]));
            } else {
              normalizedPerms[modKey] = [];
            }
          });
        }

        const booleanPerms = await fetchRolePermissions(supabase, tenantId, role.id);

        return {
          ...role,
          permissions: normalizedPerms,
          module_permissions: booleanPerms,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: rolesWithPermissions,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request, { required: true });
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      requireRole(normalizeAppRole(auth.user.role), ['SuperAdmin', 'Admin']);
    } catch {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tenantId = auth.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
    }

    const body = await request.json();
    const { roleId, permissions, name, description, level, category } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Normalize incoming permissions so storage is always Record<string, string[]>
    let normalizedPermissions: Record<string, string[]> | undefined = undefined;
    if (permissions && typeof permissions === 'object') {
      normalizedPermissions = {};
      Object.keys(permissions).forEach((modKey) => {
        const val = permissions[modKey];
        if (Array.isArray(val)) {
          normalizedPermissions![modKey] = val;
        } else if (val && typeof val === 'object') {
          normalizedPermissions![modKey] = Object.keys(val).filter((action) => Boolean(val[action]));
        } else {
          normalizedPermissions![modKey] = [];
        }
      });
    }

    const supabase = getRouteSupabase(auth.accessToken);

    const updated = await updateRole(supabase, tenantId, roleId, {
      ...(normalizedPermissions ? { permissions: normalizedPermissions } : {}),
      ...(name ? { name } : {}),
      ...(description ? { description } : {}),
      ...(level !== undefined ? { level } : {}),
      ...(category ? { category } : {})
    });

    if (!updated) {
      return NextResponse.json({ error: 'Role not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Role permissions updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: 'Failed to update role permissions' }, { status: 500 });
  }
}
