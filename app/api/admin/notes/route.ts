import 'server-only';
import { checkIsAdmin } from '@/lib/auth/require-admin';
import { createAdminClientAny } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  if (!(await checkIsAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { customer_id, note, mail_item_id } = await req.json() as {
    customer_id: string;
    note: string;
    mail_item_id?: string;
  };

  if (!customer_id || !note?.trim()) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const admin = createAdminClientAny();
  const { error } = await admin.from('admin_notes').insert({
    customer_id,
    note: note.trim(),
    mail_item_id: mail_item_id ?? null,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
