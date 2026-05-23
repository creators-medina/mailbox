import 'server-only';
import { checkIsAdmin } from '@/lib/auth/require-admin';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { notifyMailRequestUpdate } from '@/lib/email/notify-mail';

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

  // Capture the prior status so we only notify on an actual change.
  const { data: prior } = await admin
    .from('mail_requests')
    .select('status')
    .eq('id', params.id)
    .maybeSingle();
  const priorStatus = (prior as { status: string } | null)?.status ?? null;

  const { error } = await admin
    .from('mail_requests')
    .update({
      status,
      admin_notes: admin_notes ?? null,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', params.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Non-fatal: notify the customer when the request status actually changes.
  if (status !== priorStatus) {
    await notifyMailRequestUpdate(admin, params.id);
  }

  return Response.json({ success: true });
}
