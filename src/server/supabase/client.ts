import { createClient } from '@supabase/supabase-js';
import { env } from '@/server/config/env';

export function getSupabaseServerClient(accessToken?: string | null) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return createClient('http://localhost:54321', 'dummy-anon-key-for-build', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    });
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });
}
