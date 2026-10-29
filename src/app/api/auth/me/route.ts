import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdminClient } from '@/server/supabase/admin';
import { BadRequestError } from '@/server/http/errors';
import { cookies } from 'next/headers';
import { writeAccessTokenCookie } from '@/server/auth/session';

import { fetchRolePermissions } from '@/server/rbac/service';

export const GET = withApiHandler(async (request, context) => {
  const user = await getCurrentUser(request as NextRequest) as any;
  
  // Self-heal: If authenticated via Authorization header and session_token cookie is missing, write it
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (token && user) {
    try {
      const cookieStore = await cookies();
      if (!cookieStore.get('session_token')?.value) {
        await writeAccessTokenCookie(token, { persistent: true });
      }
    } catch {}
  }

  if (user && user.role && user.tenantId) {
    try {
      const supabase = getSupabaseAdminClient();
      const perms = await fetchRolePermissions(supabase, user.tenantId, user.role);
      if (perms) {
        user.permissions = perms;
      }
    } catch (err) {
      console.error('Failed to attach dynamic permissions to me user:', err);
    }
  }

  return NextResponse.json({ user: user ?? context.auth?.user ?? null });
}, { requireAuth: true });

export const PUT = withApiHandler(async (request, context) => {
  const payload = await request.json();
  const avatarUrl = payload.avatarUrl;

  if (avatarUrl !== null) {
    if (typeof avatarUrl !== 'string') {
      throw new BadRequestError('avatarUrl must be a string or null');
    }
    const isSafePath = avatarUrl.startsWith('/api/upload') || avatarUrl.startsWith('https://');
    if (!isSafePath) {
      throw new BadRequestError('Invalid avatarUrl format. Path must be a local API upload route or secure HTTPS address.');
    }
  }

  const authUserId = context.auth?.user.providerUserId;
  const tenantId = context.auth?.user.tenantId;

  if (!authUserId || !tenantId) {
    throw new BadRequestError('Authentication context missing user session details');
  }

  const admin = getSupabaseAdminClient() as any;

  // 1. Update Supabase users profile table
  const { data, error } = await admin
    .from('users')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', authUserId)
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update database profile record');
  }

  // 2. Also update app metadata and user metadata inside Supabase Auth
  await admin.auth.admin.updateUserById(authUserId, {
    user_metadata: {
      avatarUrl: avatarUrl,
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Profile updated successfully',
    avatarUrl: data.avatar_url,
  });
}, { requireAuth: true });
