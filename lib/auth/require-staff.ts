import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';

const STAFF_ROLES = new Set(['admin', 'staff']);

// For pages / layouts / server actions — redirects on failure.
export async function requireStaff() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClientAny();
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (data as { role: string } | null)?.role ?? '';
  if (!STAFF_ROLES.has(role)) redirect('/account');

  return { user, role };
}

// For API route handlers — returns false instead of redirecting.
export async function checkIsStaff(): Promise<boolean> {
  return (await currentStaffUserId()) !== null;
}

// Resolve the current staff user's id, or null if not signed in / not staff.
// Used for activity attribution and ownership checks.
export async function currentStaffUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClientAny();
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (data as { role: string } | null)?.role ?? '';
  return STAFF_ROLES.has(role) ? user.id : null;
}
