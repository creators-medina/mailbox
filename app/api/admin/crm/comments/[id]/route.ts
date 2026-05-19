import 'server-only';
import { currentStaffUserId } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';

// Edits and deletes are restricted to the comment author. Admins can extend
// this later by checking role on the actor.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { body?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) return Response.json({ error: 'body required' }, { status: 400 });

  const admin = createAdminClientAny();
  const { data: prior } = await admin
    .from('crm_comments')
    .select('user_id')
    .eq('id', params.id)
    .maybeSingle();
  const ownerId = (prior as { user_id: string | null } | null)?.user_id ?? null;
  if (ownerId !== actorId) {
    return Response.json({ error: 'Only the author can edit this comment.' }, { status: 403 });
  }

  const { data, error } = await admin
    .from('crm_comments')
    .update({ body: text })
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ comment: data });
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
  const { data: prior } = await admin
    .from('crm_comments')
    .select('user_id')
    .eq('id', params.id)
    .maybeSingle();
  const ownerId = (prior as { user_id: string | null } | null)?.user_id ?? null;
  if (ownerId !== actorId) {
    return Response.json({ error: 'Only the author can delete this comment.' }, { status: 403 });
  }

  const { error } = await admin.from('crm_comments').delete().eq('id', params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
