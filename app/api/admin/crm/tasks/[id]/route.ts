import 'server-only';
import { currentStaffUserId } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { logTaskCompleted } from '@/lib/crm/activity';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.title === 'string') {
    const title = body.title.trim();
    if (!title) return Response.json({ error: 'Title cannot be empty.' }, { status: 400 });
    update.title = title;
  }
  if (typeof body.description === 'string' || body.description === null) {
    update.description =
      typeof body.description === 'string' ? body.description.trim() || null : null;
  }
  if (typeof body.due_at === 'string' || body.due_at === null) {
    update.due_at = typeof body.due_at === 'string' && body.due_at ? body.due_at : null;
  }
  if (typeof body.priority === 'string' && PRIORITIES.includes(body.priority as Priority)) {
    update.priority = body.priority;
  }
  if (typeof body.assigned_to === 'string' || body.assigned_to === null) {
    update.assigned_to = body.assigned_to;
  }
  if (typeof body.order_index === 'number') {
    update.order_index = body.order_index;
  }

  // Completion toggle: body.completed (boolean) — true sets completed_at to
  // now, false clears it.
  let completionFlip: 'complete' | 'reopen' | null = null;
  if (body.completed === true) {
    update.completed_at = new Date().toISOString();
    completionFlip = 'complete';
  } else if (body.completed === false) {
    update.completed_at = null;
    completionFlip = 'reopen';
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No changes.' }, { status: 400 });
  }

  const admin = createAdminClientAny();
  const { data: prior } = await admin
    .from('crm_tasks')
    .select('lead_id, title, completed_at')
    .eq('id', params.id)
    .maybeSingle();
  const priorRow = (prior as { lead_id: string; title: string; completed_at: string | null } | null) ?? null;

  const { data, error } = await admin
    .from('crm_tasks')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (completionFlip === 'complete' && priorRow && !priorRow.completed_at) {
    void logTaskCompleted(priorRow.lead_id, priorRow.title, actorId);
  }

  return Response.json({ task: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const admin = createAdminClientAny();
  const { error } = await admin.from('crm_tasks').delete().eq('id', params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
