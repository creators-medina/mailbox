import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';

// For pages / layouts / server actions — redirects on failure.
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClientAny();
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if ((data as { role: string } | null)?.role !== 'admin') redirect('/account');

  return user;
}

// For API route handlers — returns false instead of redirecting.
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClientAny();
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return (data as { role: string } | null)?.role === 'admin';
}
