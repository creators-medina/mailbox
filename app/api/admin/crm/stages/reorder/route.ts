import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';

// POST — move a single stage up or down one slot within its pipeline.
// Body: { id: string, direction: 'up' | 'down' }
export async function POST(req: Request) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { id?: unknown; direction?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  const direction = body.direction === 'up' || body.direction === 'down'
    ? body.direction
    : null;

  if (!id || !direction) {
    return Response.json({ error: 'id and direction required.' }, { status: 400 });
  }

  const admin = createAdminClientAny();

  const { data: stage, error: stageErr } = await admin
    .from('crm_stages')
    .select('id, pipeline_id, order_index')
    .eq('id', id)
    .maybeSingle();
  if (stageErr) {
    return Response.json({ error: stageErr.message }, { status: 500 });
  }
  if (!stage) {
    return Response.json({ error: 'Stage not found.' }, { status: 404 });
  }

  const { data: siblings, error: sibErr } = await admin
    .from('crm_stages')
    .select('id, order_index')
    .eq('pipeline_id', (stage as { pipeline_id: string }).pipeline_id)
    .eq('is_archived', false)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (sibErr) return Response.json({ error: sibErr.message }, { status: 500 });

  const items = (siblings ?? []) as { id: string; order_index: number }[];
  const idx = items.findIndex((r) => r.id === id);
  if (idx === -1) return Response.json({ success: true, noop: true });

  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) {
    return Response.json({ success: true, noop: true });
  }

  const a = items[idx];
  const b = items[swapWith];

  await admin.from('crm_stages').update({ order_index: -1 }).eq('id', a.id);
  await admin
    .from('crm_stages')
    .update({ order_index: a.order_index })
    .eq('id', b.id);
  await admin
    .from('crm_stages')
    .update({ order_index: b.order_index })
    .eq('id', a.id);

  return Response.json({ success: true });
}
