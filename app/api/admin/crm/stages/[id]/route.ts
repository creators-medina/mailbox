import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// PATCH — update stage fields.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    name?: unknown;
    color?: unknown;
    is_closed?: unknown;
    close_type?: unknown;
    is_archived?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) {
      return Response.json({ error: 'Name cannot be empty.' }, { status: 400 });
    }
    update.name = name;
  }
  if (typeof body.color === 'string' && HEX_RE.test(body.color)) {
    update.color = body.color;
  }
  if (typeof body.is_archived === 'boolean') {
    update.is_archived = body.is_archived;
  }
  if (typeof body.is_closed === 'boolean') {
    update.is_closed = body.is_closed;
    // Force-clear close_type if the stage is no longer closed.
    if (!body.is_closed) update.close_type = null;
  }
  if (
    body.close_type === 'won' ||
    body.close_type === 'lost' ||
    body.close_type === null
  ) {
    // Only meaningful when stage is/will be closed; ignore if explicitly opened.
    if (update.is_closed !== false) {
      update.close_type = body.close_type;
    }
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No changes.' }, { status: 400 });
  }

  const admin = createAdminClientAny();
  const { data, error } = await admin
    .from('crm_stages')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ stage: data });
}

// DELETE — hard delete.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClientAny();
  const { error } = await admin
    .from('crm_stages')
    .delete()
    .eq('id', params.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
