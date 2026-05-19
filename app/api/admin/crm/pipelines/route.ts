import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { slugify, uniqueSlug } from '@/lib/crm/slug';

// POST — create a new pipeline.
export async function POST(req: Request) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { name?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : null;

  if (!name) {
    return Response.json({ error: 'Name is required.' }, { status: 400 });
  }

  const admin = createAdminClientAny();

  // Determine a unique slug across all pipelines.
  const { data: existingRows } = await admin
    .from('crm_pipelines')
    .select('slug');
  const existing = new Set(
    ((existingRows ?? []) as { slug: string }[]).map((r) => r.slug),
  );
  const slug = uniqueSlug(slugify(name), existing);

  // Place new pipeline at the end of the active list.
  const { data: maxRow } = await admin
    .from('crm_pipelines')
    .select('order_index')
    .eq('is_archived', false)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder =
    ((maxRow as { order_index: number } | null)?.order_index ?? -1) + 1;

  // If there are no pipelines at all, this becomes the default.
  const { count } = await admin
    .from('crm_pipelines')
    .select('id', { count: 'exact', head: true });
  const isDefault = (count ?? 0) === 0;

  const { data, error } = await admin
    .from('crm_pipelines')
    .insert({
      name,
      slug,
      description,
      order_index: nextOrder,
      is_default: isDefault,
    })
    .select('*')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ pipeline: data });
}
