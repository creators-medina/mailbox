import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { Activity, ActivityType } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Centralized activity log writer. All higher-level CRM mutations should
// route through these helpers so we never duplicate event-shape logic. Future
// automations subscribe to crm_activities (via realtime, polling, or a
// Postgres trigger) so the schema of these events matters.
// ─────────────────────────────────────────────────────────────────────────────

type LogInput = {
  lead_id: string;
  type: ActivityType | string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
};

export async function logActivity(input: LogInput): Promise<Activity | null> {
  const admin = createAdminClientAny();
  const { data, error } = await admin
    .from('crm_activities')
    .insert({
      lead_id: input.lead_id,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
      created_by: input.created_by ?? null,
    })
    .select('*')
    .single();

  if (error) {
    // Activity logging is best-effort. Never throw — a failed audit row
    // shouldn't roll back the user-facing action.
    console.error('[crm.logActivity]', error);
    return null;
  }
  return data as Activity;
}

// ── Typed helpers — call these from routes / server actions ─────────────────

export function logLeadCreated(
  leadId: string,
  source: string,
  actorId: string | null,
) {
  return logActivity({
    lead_id: leadId,
    type: 'lead_created',
    title: `Lead created via ${source}`,
    metadata: { source },
    created_by: actorId,
  });
}

export function logStageChange(
  leadId: string,
  fromStageName: string,
  toStageName: string,
  actorId: string | null,
  extra: { from_stage_id: string; to_stage_id: string },
) {
  return logActivity({
    lead_id: leadId,
    type: 'stage_changed',
    title: `Moved from ${fromStageName} → ${toStageName}`,
    metadata: { ...extra, from_name: fromStageName, to_name: toStageName },
    created_by: actorId,
  });
}

export function logTagAdded(
  leadId: string,
  tag: string,
  actorId: string | null,
) {
  return logActivity({
    lead_id: leadId,
    type: 'tag_added',
    title: `Added tag "${tag}"`,
    metadata: { tag },
    created_by: actorId,
  });
}

export function logTagRemoved(
  leadId: string,
  tag: string,
  actorId: string | null,
) {
  return logActivity({
    lead_id: leadId,
    type: 'tag_removed',
    title: `Removed tag "${tag}"`,
    metadata: { tag },
    created_by: actorId,
  });
}

export function logNoteAdded(
  leadId: string,
  preview: string,
  actorId: string | null,
) {
  return logActivity({
    lead_id: leadId,
    type: 'note_added',
    title: 'Notes updated',
    description: preview.slice(0, 200),
    created_by: actorId,
  });
}

export function logCommentAdded(
  leadId: string,
  preview: string,
  actorId: string | null,
) {
  return logActivity({
    lead_id: leadId,
    type: 'comment_added',
    title: 'Comment added',
    description: preview.slice(0, 200),
    created_by: actorId,
  });
}

export function logAssignmentChanged(
  leadId: string,
  fromName: string | null,
  toName: string | null,
  actorId: string | null,
) {
  const title = !fromName
    ? `Assigned to ${toName ?? 'someone'}`
    : !toName
    ? `Unassigned (was ${fromName})`
    : `Reassigned from ${fromName} → ${toName}`;
  return logActivity({
    lead_id: leadId,
    type: 'assignment_changed',
    title,
    metadata: { from: fromName, to: toName },
    created_by: actorId,
  });
}

export function logLeadArchived(leadId: string, actorId: string | null) {
  return logActivity({
    lead_id: leadId,
    type: 'lead_archived',
    title: 'Lead archived',
    created_by: actorId,
  });
}

export function logLeadRestored(leadId: string, actorId: string | null) {
  return logActivity({
    lead_id: leadId,
    type: 'lead_restored',
    title: 'Lead restored',
    created_by: actorId,
  });
}

export function logTaskCreated(
  leadId: string,
  taskTitle: string,
  actorId: string | null,
  metadata: Record<string, unknown> = {},
) {
  return logActivity({
    lead_id: leadId,
    type: 'task_created',
    title: `Task created: ${taskTitle}`,
    metadata,
    created_by: actorId,
  });
}

export function logTaskCompleted(
  leadId: string,
  taskTitle: string,
  actorId: string | null,
) {
  return logActivity({
    lead_id: leadId,
    type: 'task_completed',
    title: `Task completed: ${taskTitle}`,
    created_by: actorId,
  });
}

// ── Read side ───────────────────────────────────────────────────────────────

export async function listActivities(leadId: string): Promise<Activity[]> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(500);
  return (data ?? []) as Activity[];
}
