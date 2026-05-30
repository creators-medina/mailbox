import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { runLaunchChecks } from '@/lib/launch-check';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'staff']);

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not authenticated.' }, { status: 401 });

  const admin = createAdminClientAny();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = (profile as { role: string } | null)?.role ?? '';
  if (!STAFF_ROLES.has(role)) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const result = await runLaunchChecks();
  return Response.json(result);
}
