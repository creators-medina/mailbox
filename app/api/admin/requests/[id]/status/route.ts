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

  const { status, admin_notes } = await req.json() as {
    status: string;
    admin_notes?: string;
  };

  const admin = createAdminClientAny();
  const { error } = await admin
    .from('mail_requests')
    .update({
      status,
      admin_notes: admin_notes ?? null,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', params.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
