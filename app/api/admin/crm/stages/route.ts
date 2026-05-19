import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { slugify, uniqueSlug } from '@/lib/crm/slug';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// POST — create a new stage in a pipeline.
// Body: { pipeline_id, name, color?, is_closed?, close_type? }
export async function POST(req: Request) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    pipeline_id?: unknown;
    name?: unknown;
    color?: unknown;
    is_closed?: unknown;
    close_type?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const pipelineId = typeof body.pipeline_id === 'string' ? body.pipeline_id : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const color =
    typeof body.color === 'string' && HEX_RE.test(body.color) ? body.color : '#6B7280';
  const isClosed = body.is_closed === true;
  const closeType =
    body.close_type === 'won' || body.close_type === 'lost'
      ? body.close_type
      : null;

  if (!pipelineId || !name) {
    return Response.json(
      { error: 'pipeline_id and name are required.' },
      { status: 400 },
    );
  }

  const admin = createAdminClientAny();

  const { data: existingRows } = await admin
    .from('crm_stages')
    .select('slug')
    .eq('pipeline_id', pipelineId);
  const existing = new Set(
    ((existingRows ?? []) as { slug: string }[]).map((r) => r.slug),
  );
  const slug = uniqueSlug(slugify(name), existing);

  const { data: maxRow } = await admin
    .from('crm_stages')
    .select('order_index')
    .eq('pipeline_id', pipelineId)
    .eq('is_archived', false)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder =
    ((maxRow as { order_index: number } | null)?.order_index ?? -1) + 1;

  const { data, error } = await admin
    .from('crm_stages')
    .insert({
      pipeline_id: pipelineId,
      name,
      slug,
      color,
      order_index: nextOrder,
      is_closed: isClosed,
      close_type: isClosed ? closeType : null,
    })
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ stage: data });
}
