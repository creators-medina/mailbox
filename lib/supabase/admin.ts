import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Service role client — never expose to the browser or client components.
// Note: typed with Database for IDE hints, but individual query results need
// explicit casts until Supabase types are generated from the live schema.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin env vars are not configured');
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Untyped variant — used in webhook write operations until generated types
// are available, at which point createAdminClient() can be used everywhere.
export function createAdminClientAny() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin env vars are not configured');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
