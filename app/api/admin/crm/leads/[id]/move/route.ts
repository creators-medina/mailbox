import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';

// POST — move a lead between stages and reorder.
// Body: { stage_id: string, ordered_lead_ids: string[] }
//   - stage_id: destination stage
//   - ordered_lead_ids: the full, new ordering of leads in the destination
//     stage (including the moved lead at its new position).
//
// The server renumbers order_index sequentially (0, 1, 2, ...) for every
// lead in `ordered_lead_ids`, which keeps the column consistent regardless
// of how the client computed positions.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { stage_id?: unknown; ordered_lead_ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const stageId = typeof body.stage_id === 'string' ? body.stage_id : '';
  const ordered = Array.isArray(body.ordered_lead_ids)
    ? (body.ordered_lead_ids as unknown[]).filter(
        (x): x is string => typeof x === 'string',
      )
    : [];

  if (!stageId || ordered.length === 0 || !ordered.includes(params.id)) {
    return Response.json(
      { error: 'stage_id and ordered_lead_ids (including the moved lead) are required.' },
      { status: 400 },
    );
  }

  const admin = createAdminClientAny();

  // Verify the destination stage exists and grab its pipeline so the moved
  // lead's pipeline_id stays in sync (cross-pipeline moves keep working).
  const { data: stage } = await admin
    .from('crm_stages')
    .select('id, pipeline_id, is_archived')
    .eq('id', stageId)
    .maybeSingle();

  const stageRow = stage as { id: string; pipeline_id: string; is_archived: boolean } | null;
  if (!stageRow || stageRow.is_archived) {
    return Response.json({ error: 'Destination stage not found or archived.' }, { status: 404 });
  }

  // Update the moved lead's stage (and pipeline if needed) first so the
  // renumber loop sees consistent rows.
  const { error: moveErr } = await admin
    .from('crm_leads')
    .update({ stage_id: stageRow.id, pipeline_id: stageRow.pipeline_id })
    .eq('id', params.id);
  if (moveErr) return Response.json({ error: moveErr.message }, { status: 500 });

  // Sequentially renumber every lead in the new order. We don't need a
  // sentinel here because order_index has no unique constraint.
  for (let i = 0; i < ordered.length; i += 1) {
    const id = ordered[i];
    const { error } = await admin
      .from('crm_leads')
      .update({ order_index: i })
      .eq('id', id)
      .eq('stage_id', stageRow.id);
    if (error) {
      console.error('[crm.move] renumber failed', { id, i, error });
    }
  }

  return Response.json({ success: true });
}
