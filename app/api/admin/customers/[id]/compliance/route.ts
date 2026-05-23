import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'staff']);
const VALID_STATUSES = new Set(['pending', 'requested', 'received', 'verified', 'rejected']);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const customerId = params.id;

  // ── Auth: 401 unauth, 403 non-staff ──
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createAdminClientAny();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = (profile as { role: string } | null)?.role ?? '';
  if (!STAFF_ROLES.has(role)) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // ── Parse + validate ──
  let body: { form_1583_status?: unknown; photo_id_status?: unknown; notes?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  for (const key of ['form_1583_status', 'photo_id_status'] as const) {
    if (body[key] !== undefined && !VALID_STATUSES.has(String(body[key]))) {
      return Response.json({ error: `Invalid ${key} value.` }, { status: 400 });
    }
  }

  // Validate customer exists.
  const { data: cust } = await admin
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .maybeSingle();
  if (!cust) {
    return Response.json({ error: 'Customer not found.' }, { status: 404 });
  }

  // Merge with any existing row so partial updates are preserved.
  const { data: existing } = await admin
    .from('customer_compliance')
    .select('form_1583_status, photo_id_status, notes')
    .eq('customer_id', customerId)
    .maybeSingle();

  const form1583 = body.form_1583_status !== undefined
    ? String(body.form_1583_status)
    : (existing?.form_1583_status ?? 'pending');
  const photoId = body.photo_id_status !== undefined
    ? String(body.photo_id_status)
    : (existing?.photo_id_status ?? 'pending');
  const notes = body.notes !== undefined
    ? (typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes.trim() : null)
    : (existing?.notes ?? null);

  const bothVerified = form1583 === 'verified' && photoId === 'verified';

  const row = {
    customer_id: customerId,
    form_1583_status: form1583,
    photo_id_status: photoId,
    notes,
    verified_at: bothVerified ? new Date().toISOString() : null,
    verified_by: bothVerified ? user.id : null,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await admin
    .from('customer_compliance')
    .upsert(row, { onConflict: 'customer_id' })
    .select('id, customer_id, form_1583_status, photo_id_status, verified_at, verified_by, notes, updated_at')
    .single();

  if (error) {
    console.error('[admin/compliance] upsert failed:', error.message);
    return Response.json({ error: 'Could not update compliance status.' }, { status: 500 });
  }

  return Response.json({ ok: true, compliance: saved });
}
