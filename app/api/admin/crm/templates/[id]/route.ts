import 'server-only';
import { currentStaffUserId } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';

const CHANNELS = ['email', 'sms', 'internal'];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await currentStaffUserId())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) return Response.json({ error: 'Name cannot be empty.' }, { status: 400 });
    update.name = name;
  }
  if (typeof body.body === 'string') {
    const text = body.body.trim();
    if (!text) return Response.json({ error: 'Body cannot be empty.' }, { status: 400 });
    update.body = text;
  }
  if (typeof body.subject === 'string' || body.subject === null) {
    update.subject = typeof body.subject === 'string' ? body.subject.trim() || null : null;
  }
  if (typeof body.channel === 'string' && CHANNELS.includes(body.channel)) {
    update.channel = body.channel;
  }
  if (typeof body.is_active === 'boolean') {
    update.is_active = body.is_active;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No changes.' }, { status: 400 });
  }

  const admin = createAdminClientAny();
  const { data, error } = await admin
    .from('crm_message_templates')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ template: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await currentStaffUserId())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const admin = createAdminClientAny();
  const { error } = await admin.from('crm_message_templates').delete().eq('id', params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
