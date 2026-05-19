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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClientAny();
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return STAFF_ROLES.has((data as { role: string } | null)?.role ?? '');
}
