import { UnauthorizedError } from '@/server/http/errors';
import { getSupabaseServerClient } from '@/server/supabase/client';
import { getSupabaseAdminClient } from '@/server/supabase/admin';
import { getSupabaseUserFromAccessToken } from '@/server/auth/supabase-auth';
import { normalizeAppRole } from '@/server/auth/rbac';

export type SupabaseUserProfile = {
  id: string;
  legacy_user_id: number | null;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  failed_login_attempts?: number | null;
  locked_until?: string | null;
  last_login?: string | null;
  is_email_verified?: boolean;
  verification_token?: string | null;
  verification_token_expires_at?: string | null;
};

export interface ProfileLookupOptions {
  accessToken?: string | null;
  useAdmin?: boolean;
  tenantId?: string | null;
}

function getClient(options?: ProfileLookupOptions) {
  if (options?.useAdmin) {
    return getSupabaseAdminClient();
  }
  return getSupabaseServerClient(options?.accessToken) as any;
}

async function selfHealLegacyUserId(data: any) {
  if (data && data.legacy_user_id === null) {
    try {
      const admin = getSupabaseAdminClient();
      const { data: maxQuery } = await admin
        .from('users')
        .select('legacy_user_id')
        .eq('tenant_id', data.tenant_id)
        .order('legacy_user_id', { ascending: false })
        .limit(1);
      
      const maxId = Number(maxQuery?.[0]?.legacy_user_id ?? 0);
      const nextId = maxId + 1;
      
      await admin
        .from('users')
        .update({ legacy_user_id: nextId })
        .eq('id', data.id);
      
      data.legacy_user_id = nextId;
      console.log(`Self-healed missing legacy_user_id for user ${data.email} -> ${nextId}`);
    } catch (e) {
      console.error('Failed to self-heal missing legacy_user_id:', e);
    }
  }
}

export async function getSupabaseProfileByAuthUserId(authUserId: string, options?: ProfileLookupOptions) {
  const supabase = getClient(options);
  let query = supabase
    .from('users')
    .select('*')
    .eq('id', authUserId);
    
  if (options?.tenantId) {
    query = query.eq('tenant_id', options.tenantId);
  }
  
  const { data, error } = await query.single();

  if (error || !data) {
    throw new UnauthorizedError(error?.message ?? 'Profile lookup failed');
  }

  await selfHealLegacyUserId(data);

  return data as SupabaseUserProfile;
}

export async function getCurrentSupabaseProfile(accessToken: string) {
  const authUser = await getSupabaseUserFromAccessToken(accessToken);
  const profile = await getSupabaseProfileByAuthUserId(authUser.id, { useAdmin: true });

  return {
    authUserId: authUser.id,
    tenantId: profile.tenant_id,
    legacyUserId: profile.legacy_user_id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: normalizeAppRole(profile.role),
    avatarUrl: profile.avatar_url,
    phone: profile.phone,
    isActive: profile.is_active,
    raw: profile,
  };
}

export async function getSupabaseProfileByEmail(emailOrUsername: string, options?: ProfileLookupOptions) {
  const supabase = getClient(options);
  const searchKey = emailOrUsername.toLowerCase().trim();
  const isEmail = searchKey.includes('@');

  let query = supabase.from('users').select('*');
  
  if (isEmail) {
    query = query.eq('email', searchKey);
  } else {
    query = query.eq('username', searchKey);
  }
    
  if (options?.tenantId) {
    query = query.eq('tenant_id', options.tenantId);
  }
  
  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new UnauthorizedError(error?.message ?? 'User profile lookup failed');
  }

  await selfHealLegacyUserId(data);

  return data as SupabaseUserProfile;
}

export async function getSupabaseProfileByLegacyUserId(legacyUserId: number, options?: ProfileLookupOptions) {
  const supabase = getClient(options);
  let query = supabase
    .from('users')
    .select('*')
    .eq('legacy_user_id', legacyUserId);
    
  if (options?.tenantId) {
    query = query.eq('tenant_id', options.tenantId);
  }
  
  const { data, error } = await query.single();

  if (error || !data) {
    throw new UnauthorizedError(error?.message ?? 'User not found');
  }

  return data as SupabaseUserProfile;
}

export async function listSupabaseProfilesByAuthIds(authUserIds: string[], options?: ProfileLookupOptions) {
  if (!authUserIds.length) {
    return new Map<string, SupabaseUserProfile>();
  }

  const supabase = getClient(options);
  let query = supabase
    .from('users')
    .select('*')
    .in('id', authUserIds);
    
  if (options?.tenantId) {
    query = query.eq('tenant_id', options.tenantId);
  }
  
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return new Map<string, SupabaseUserProfile>(
    ((data as SupabaseUserProfile[] | null) ?? []).map((profile) => [profile.id, profile])
  );
}

export async function updateSupabaseProfileByAuthUserId(
  authUserId: string,
  payload: Record<string, unknown>,
  options?: ProfileLookupOptions
) {
  const supabase = getClient(options);
  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', authUserId)
    .select('*')
    .single();

  if (error || !data) {
    throw error ? new Error(error.message) : new UnauthorizedError('Failed to update profile');
  }

  return data as SupabaseUserProfile;
}
