import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'staff']);
const VALID_STATUSES = new Set(['pending', 'requested', 'received', 'verified', 'rejected']);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const customerId = params.id;

  // ── Auth: 401 unauth, 403 non-staff ──
  // Uses .maybeSingle() (not .single()) so a 0-row profile lookup doesn't
  // collapse role to '' and falsely 403 a real admin. Detailed cause is
  // surfaced in the [admin/compliance-api] server log below.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[admin/compliance-api]', { customerId, userId: null, role: null, authorized: false, error: 'no auth user' });
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createAdminClientAny();
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = (profile as { role: string } | null)?.role ?? '';
  const authorized = STAFF_ROLES.has(role);

  console.log('[admin/compliance-api]', {
    customerId,
    userId: user.id,
    role: role || null,
    authorized,
    error: profileErr?.message ?? null,
  });

  if (!authorized) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // ── Parse + validate ──
  let body: {
    form_1583_status?: unknown; photo_id_status?: unknown;
    notes?: unknown;
    rejected_reason?: unknown;
    form_1583_rejected_reason?: unknown;
    photo_id_rejected_reason?: unknown;
  };
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
    .select('form_1583_status, photo_id_status, notes, rejected_reason, form_1583_rejected_reason, photo_id_rejected_reason, verified_at, verified_by')
    .eq('customer_id', customerId)
    .maybeSingle();
  const ex = (existing ?? {}) as {
    form_1583_status?: string; photo_id_status?: string; notes?: string | null;
    rejected_reason?: string | null;
    form_1583_rejected_reason?: string | null;
    photo_id_rejected_reason?: string | null;
    verified_at?: string | null; verified_by?: string | null;
  };

  const form1583 = body.form_1583_status !== undefined
    ? String(body.form_1583_status)
    : (ex.form_1583_status ?? 'pending');
  const photoId = body.photo_id_status !== undefined
    ? String(body.photo_id_status)
    : (ex.photo_id_status ?? 'pending');
  const notes = body.notes !== undefined
    ? (typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes.trim() : null)
    : (ex.notes ?? null);

  // rejected_reason (legacy shared field): explicit empty string clears it,
  // absent preserves it. Kept for read-back compatibility; no longer the
  // authoritative reason.
  const rejectedReason = body.rejected_reason !== undefined
    ? (typeof body.rejected_reason === 'string' && body.rejected_reason.trim() !== '' ? body.rejected_reason.trim() : null)
    : (ex.rejected_reason ?? null);

  // Per-document rejection reasons. Each is preserved when absent in the body.
  // When the document is being verified, its reason is auto-cleared (verified
  // implies no outstanding rejection).
  function resolveReason(
    bodyVal: unknown,
    existingVal: string | null | undefined,
    newStatus: string,
  ): string | null {
    if (newStatus === 'verified') return null;
    if (bodyVal === undefined) return existingVal ?? null;
    return typeof bodyVal === 'string' && bodyVal.trim() !== '' ? bodyVal.trim() : null;
  }
  const form1583Reason = resolveReason(body.form_1583_rejected_reason, ex.form_1583_rejected_reason, form1583);
  const photoIdReason  = resolveReason(body.photo_id_rejected_reason,  ex.photo_id_rejected_reason,  photoId);

  const nowIso = new Date().toISOString();
  const bothVerified = form1583 === 'verified' && photoId === 'verified';

  // Preserve the original verification timestamp/staff if the customer was
  // already verified; only stamp now() on the verified transition. If the
  // admin downgraded either status away from verified, clear both fields.
  let verifiedAt: string | null = null;
  let verifiedBy: string | null = null;
  if (bothVerified) {
    verifiedAt = ex.verified_at ?? nowIso;
    verifiedBy = ex.verified_by ?? user.id;
  }

  const row = {
    customer_id: customerId,
    form_1583_status: form1583,
    photo_id_status: photoId,
    notes,
    rejected_reason: rejectedReason,
    form_1583_rejected_reason: form1583Reason,
    photo_id_rejected_reason: photoIdReason,
    // Every admin save is a review; stamp the review trail.
    reviewed_at: nowIso,
    reviewed_by: user.id,
    verified_at: verifiedAt,
    verified_by: verifiedBy,
    updated_at: nowIso,
  };

  const { data: saved, error } = await admin
    .from('customer_compliance')
    .upsert(row, { onConflict: 'customer_id' })
    .select('id, customer_id, form_1583_status, photo_id_status, rejected_reason, form_1583_rejected_reason, photo_id_rejected_reason, reviewed_at, reviewed_by, verified_at, verified_by, notes, updated_at')
    .single();

  if (error) {
    console.error('[admin/compliance] upsert failed:', error.message);
    return Response.json({ error: 'Could not update compliance status.' }, { status: 500 });
  }

  return Response.json({ ok: true, compliance: saved });
}
