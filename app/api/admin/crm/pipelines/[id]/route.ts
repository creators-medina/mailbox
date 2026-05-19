import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';

type PatchBody = {
  name?: unknown;
  description?: unknown;
  is_archived?: unknown;
  is_default?: unknown;
};

// PATCH — update pipeline fields (name, description, archive toggle, default).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: PatchBody;
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
  if (typeof body.description === 'string' || body.description === null) {
    update.description =
      typeof body.description === 'string' ? body.description.trim() : null;
  }
  if (typeof body.is_archived === 'boolean') {
    update.is_archived = body.is_archived;
  }

  const admin = createAdminClientAny();

  // Setting default needs to clear other defaults first to honor the partial
  // unique index (is_default where is_default = true).
  if (body.is_default === true) {
    await admin
      .from('crm_pipelines')
      .update({ is_default: false })
      .eq('is_default', true);
    update.is_default = true;
    update.is_archived = false;
  } else if (body.is_default === false) {
    update.is_default = false;
  }

  // If we're archiving a pipeline that was the default, drop the default flag.
  if (update.is_archived === true) {
    update.is_default = false;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No changes.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('crm_pipelines')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ pipeline: data });
}

// DELETE — hard delete. Stages cascade via FK.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClientAny();
  const { error } = await admin
    .from('crm_pipelines')
    .delete()
    .eq('id', params.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
