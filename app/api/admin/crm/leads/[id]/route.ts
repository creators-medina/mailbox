import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';

// PATCH — update lead fields. Stage changes happen via /move so order_index
// is kept consistent; setting stage_id directly here is rejected.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if ('stage_id' in body || 'order_index' in body) {
    return Response.json(
      { error: 'Use POST /api/admin/crm/leads/[id]/move to change stage or order.' },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};

  for (const key of ['first_name', 'last_name', 'email', 'phone', 'notes', 'source', 'status'] as const) {
    if (typeof body[key] === 'string') {
      update[key] = (body[key] as string).trim() || null;
    } else if (body[key] === null) {
      update[key] = null;
    }
  }

  if (Array.isArray(body.tags)) {
    update.tags = (body.tags as unknown[])
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim());
  }

  if (typeof body.archived === 'boolean') {
    update.archived = body.archived;
  }

  if (typeof body.assigned_to === 'string' || body.assigned_to === null) {
    update.assigned_to = body.assigned_to;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No changes.' }, { status: 400 });
  }

  const admin = createAdminClientAny();
  const { data, error } = await admin
    .from('crm_leads')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ lead: data });
}

// DELETE — hard delete a lead.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClientAny();
  const { error } = await admin.from('crm_leads').delete().eq('id', params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
