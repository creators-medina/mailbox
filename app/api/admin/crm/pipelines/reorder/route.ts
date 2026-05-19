import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';

// POST — move a single pipeline up or down one slot.
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

  // Load active (non-archived) pipelines in order.
  const { data: rows, error: listErr } = await admin
    .from('crm_pipelines')
    .select('id, order_index')
    .eq('is_archived', false)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (listErr) return Response.json({ error: listErr.message }, { status: 500 });

  const items = (rows ?? []) as { id: string; order_index: number }[];
  const idx = items.findIndex((r) => r.id === id);
  if (idx === -1) {
    return Response.json({ error: 'Pipeline not found.' }, { status: 404 });
  }

  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) {
    return Response.json({ success: true, noop: true });
  }

  const a = items[idx];
  const b = items[swapWith];

  // Two-step swap with a sentinel to avoid bumping into any UNIQUE constraint
  // (the table has none on order_index but this keeps the pattern safe).
  await admin.from('crm_pipelines').update({ order_index: -1 }).eq('id', a.id);
  await admin
    .from('crm_pipelines')
    .update({ order_index: a.order_index })
    .eq('id', b.id);
  await admin
    .from('crm_pipelines')
    .update({ order_index: b.order_index })
    .eq('id', a.id);

  return Response.json({ success: true });
}
