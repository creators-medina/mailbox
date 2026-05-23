import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Reads the service-role env at CALL TIME (never at import) so importing this
// module can't throw during build/static analysis. Reports which variable is
// missing by name — never prints the values.
function readAdminEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length > 0) {
    throw new Error(
      `Supabase admin client not configured: missing env var(s): ${missing.join(', ')}`,
    );
  }
  return { url: url as string, key: key as string };
}

// Service role client — never expose to the browser or client components.
// Note: typed with Database for IDE hints, but individual query results need
// explicit casts until Supabase types are generated from the live schema.
export function createAdminClient() {
  const { url, key } = readAdminEnv();
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Untyped variant — used in webhook / write operations until generated types
// are available, at which point createAdminClient() can be used everywhere.
export function createAdminClientAny() {
  const { url, key } = readAdminEnv();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
