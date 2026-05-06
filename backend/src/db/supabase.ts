import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[DB] Supabase not configured — running without persistence');
    return null;
  }

  client = createClient(url, key);
  console.log('[DB] Supabase connected');
  return client;
}
