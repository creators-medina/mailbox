import 'server-only';
import { checkIsAdmin } from '@/lib/auth/require-admin';
import { createAdminClientAny } from '@/lib/supabase/admin';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { status } = await req.json() as { status: string };
  const admin = createAdminClientAny();
  const { error } = await admin
    .from('mail_items')
    .update({ status })
    .eq('id', params.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
