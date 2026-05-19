import 'server-only';
import { currentStaffUserId } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';
import {
  logAssignmentChanged,
  logLeadArchived,
  logLeadRestored,
  logNoteAdded,
  logTagAdded,
  logTagRemoved,
} from '@/lib/crm/activity';

// PATCH — update lead fields. Stage changes happen via /move so order_index
// is kept consistent; setting stage_id directly here is rejected.
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

  if ('stage_id' in body || 'order_index' in body) {
    return Response.json(
      { error: 'Use POST /api/admin/crm/leads/[id]/move to change stage or order.' },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};

  for (const key of ['first_name', 'last_name', 'email', 'phone', 'source', 'status'] as const) {
    if (typeof body[key] === 'string') {
      update[key] = (body[key] as string).trim() || null;
    } else if (body[key] === null) {
      update[key] = null;
    }
  }

  let notesChanged = false;
  if (typeof body.notes === 'string') {
    update.notes = body.notes.trim() || null;
    notesChanged = true;
  } else if (body.notes === null) {
    update.notes = null;
    notesChanged = true;
  }

  let newTags: string[] | undefined;
  if (Array.isArray(body.tags)) {
    newTags = (body.tags as unknown[])
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim());
    update.tags = newTags;
  }

  let archivedChange: boolean | null = null;
  if (typeof body.archived === 'boolean') {
    update.archived = body.archived;
    archivedChange = body.archived;
  }

  let assignmentChange: { provided: true; next: string | null } | null = null;
  if (typeof body.assigned_to === 'string' || body.assigned_to === null) {
    update.assigned_to = body.assigned_to;
    assignmentChange = { provided: true, next: (body.assigned_to as string | null) ?? null };
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No changes.' }, { status: 400 });
  }

  const admin = createAdminClientAny();

  // Read the prior row so activity logs can show before/after.
  const { data: prior } = await admin
    .from('crm_leads')
    .select('tags, archived, assigned_to')
    .eq('id', params.id)
    .maybeSingle();
  const priorRow = (prior as { tags: string[]; archived: boolean; assigned_to: string | null } | null) ?? null;

  const { data, error } = await admin
    .from('crm_leads')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // ── Activity logging (best-effort, never blocks the response) ──────────
  void (async () => {
    if (notesChanged && typeof update.notes === 'string' && update.notes) {
      await logNoteAdded(params.id, update.notes, actorId);
    }

    if (newTags && priorRow) {
      const before = priorRow.tags ?? [];
      const after = newTags;
      const added = after.filter((t) => !before.includes(t));
      const removed = before.filter((t) => !after.includes(t));
      for (const t of added) await logTagAdded(params.id, t, actorId);
      for (const t of removed) await logTagRemoved(params.id, t, actorId);
    }

    if (archivedChange !== null && priorRow && priorRow.archived !== archivedChange) {
      if (archivedChange) await logLeadArchived(params.id, actorId);
      else await logLeadRestored(params.id, actorId);
    }

    if (assignmentChange && priorRow && priorRow.assigned_to !== assignmentChange.next) {
      const ids = [priorRow.assigned_to, assignmentChange.next].filter(Boolean) as string[];
      let nameOf: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await admin
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ids);
        nameOf = Object.fromEntries(
          ((profs ?? []) as { id: string; full_name: string | null; email: string | null }[]).map(
            (p) => [p.id, p.full_name || p.email || 'someone'],
          ),
        );
      }
      await logAssignmentChanged(
        params.id,
        priorRow.assigned_to ? nameOf[priorRow.assigned_to] ?? null : null,
        assignmentChange.next ? nameOf[assignmentChange.next] ?? null : null,
        actorId,
      );
    }
  })();

  return Response.json({ lead: data });
}

// DELETE — hard delete a lead.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClientAny();
  const { error } = await admin.from('crm_leads').delete().eq('id', params.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
