import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createLead, resolveDefaultDestination } from '@/lib/crm/leads';

// POST — manually create a lead. Staff/admin only.
// Body:
//   { pipeline_id?, stage_id?, first_name?, last_name?, email?, phone?,
//     source?, notes?, tags? }
// If pipeline_id/stage_id are omitted, the default pipeline's first active
// stage is used.
export async function POST(req: Request) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let pipelineId =
    typeof body.pipeline_id === 'string' ? body.pipeline_id : null;
  let stageId = typeof body.stage_id === 'string' ? body.stage_id : null;

  if (!pipelineId || !stageId) {
    const dest = await resolveDefaultDestination();
    if (!dest) {
      return Response.json(
        { error: 'No active pipeline or stage configured.' },
        { status: 409 },
      );
    }
    pipelineId = dest.pipeline_id;
    stageId = dest.stage_id;
  }

  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[])
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim())
    : [];

  const lead = await createLead({
    pipeline_id: pipelineId,
    stage_id: stageId,
    first_name: typeof body.first_name === 'string' ? body.first_name.trim() : null,
    last_name: typeof body.last_name === 'string' ? body.last_name.trim() : null,
    email: typeof body.email === 'string' ? body.email.trim() : null,
    phone: typeof body.phone === 'string' ? body.phone.trim() : null,
    source: typeof body.source === 'string' ? body.source.trim() || 'manual' : 'manual',
    notes: typeof body.notes === 'string' ? body.notes : null,
    tags,
  });

  if (!lead) {
    return Response.json({ error: 'Could not create lead.' }, { status: 500 });
  }
  return Response.json({ lead });
}
