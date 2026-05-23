import { createClient } from '@supabase/supabase-js';
import { env } from '@/server/config/env';

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient('http://localhost:54321', 'dummy-key-for-build', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return adminClient;
}
