import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/server/http/handler';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdminClient } from '@/server/supabase/admin';
import { BadRequestError } from '@/server/http/errors';

export const GET = withApiHandler(async (request, context) => {
  const user = await getCurrentUser(request as NextRequest);
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
