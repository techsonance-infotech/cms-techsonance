import { getSupabaseAdminClient } from '@/server/supabase/admin';

/**
 * Resets the identity sequence for a given table to MAX(id) + 1.
 * This fixes "duplicate key value violates unique constraint" errors
 * caused by sequences drifting behind manually-inserted rows.
 */
export async function resetTableSequence(tableName: string, columnName = 'id'): Promise<void> {
  const admin = getSupabaseAdminClient() as any;
  const { error } = await admin.rpc('exec_sql', {
    query: `SELECT setval(pg_get_serial_sequence('public.${tableName}', '${columnName}'), COALESCE((SELECT MAX(${columnName}) FROM public.${tableName}), 0) + 1, false)`
  });
  if (error) {
    // Fallback: try direct query if RPC doesn't exist
    console.warn(`[resetTableSequence] RPC failed for ${tableName}, sequence may still be stale:`, error.message);
  }
}

/**
 * Wraps a Supabase insert, auto-retrying once if a duplicate key (23505) error
 * occurs. This handles identity sequence drift transparently.
 */
export async function safeInsert(
  tableName: string,
  row: Record<string, unknown>,
  supabase: any
): Promise<{ data: Record<string, unknown>; error: null } | { data: null; error: any }> {
  const { data, error } = await supabase
    .from(tableName)
    .insert(row)
    .select('*')
    .single();

  if (error && (error.code === '23505' || error.message?.includes('duplicate key'))) {
    // Attempt to heal the sequence via raw SQL using Admin privileges
    try {
      const admin = getSupabaseAdminClient() as any;
      await admin.rpc('exec_sql', {
        query: `SELECT setval(pg_get_serial_sequence('public.${tableName}', 'id'), COALESCE((SELECT MAX(id) FROM public.${tableName}), 0) + 1, false)`
      });
    } catch {
      // If RPC doesn't exist, the retry may still work if the collision was transient
    }

    // Retry once
    const retry = await supabase
      .from(tableName)
      .insert(row)
      .select('*')
      .single();

    return retry;
  }

  return { data, error };
}
