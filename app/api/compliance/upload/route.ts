import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { COMPLIANCE_DOCUMENTS_BUCKET } from '@/lib/storage/buckets';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/* eslint-disable @typescript-eslint/no-explicit-any */

// Resolve THIS user's customer the same way /account does (profile_id →
// user_id → email exact match). Service-role client; bypasses RLS.
async function resolveCustomerId(admin: any, userId: string, email: string | null): Promise<string | null> {
  {
    const { data } = await admin.from('customers').select('id').eq('profile_id', userId).maybeSingle();
    if (data) return (data as { id: string }).id;
  }
  {
    const { data, error } = await admin.from('customers').select('id').eq('user_id', userId).maybeSingle();
    if (!error && data) return (data as { id: string }).id;
  }
  if (email) {
    const { data } = await admin.from('customers').select('id, email').ilike('email', email).limit(2);
    const rows = (data ?? []) as Array<{ id: string; email?: string | null }>;
    const match = rows.find(r => (r.email ?? '').toLowerCase() === email.toLowerCase());
    if (match) return match.id;
  }
  return null;
}

async function uploadOne(
  admin: any,
  customerId: string,
  file: File,
  kind: 'form-1583' | 'photo-id',
): Promise<{ ok: true; path: string } | { ok: false; error: string; status: number }> {
  if (file.size === 0) return { ok: false, error: 'Empty file.', status: 400 };
  if (file.size > MAX_BYTES) return { ok: false, error: 'File is larger than 20 MB.', status: 413 };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, error: 'Only PDF, JPG, and PNG are accepted.', status: 415 };

  const ext = EXT_BY_MIME[file.type];
  // Path must start with customer_id/ to satisfy storage RLS.
  const path = `${customerId}/${Date.now()}-${kind}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: upErr } = await admin.storage
    .from(COMPLIANCE_DOCUMENTS_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) {
    console.error(`[compliance/upload] ${kind} upload failed:`, upErr.message);
    return { ok: false, error: 'Upload failed. Please try again.', status: 500 };
  }
  return { ok: true, path };
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not authenticated.' }, { status: 401 });

  const admin = createAdminClientAny();
  const customerId = await resolveCustomerId(admin, user.id, user.email ?? null);
  if (!customerId) return Response.json({ error: 'No customer account found.' }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  const form1583 = formData.get('form_1583');
  const photoId  = formData.get('photo_id');
  const hasForm  = form1583 instanceof File && form1583.size > 0;
  const hasId    = photoId  instanceof File && photoId.size  > 0;
  if (!hasForm && !hasId) {
    return Response.json({ error: 'Choose a file to upload.' }, { status: 400 });
  }

  // Don't accept new uploads for items already verified — admin should reset
  // to "rejected" or "pending" if a redo is genuinely required.
  const { data: existing } = await admin
    .from('customer_compliance')
    .select('form_1583_status, photo_id_status, form_1583_file_path, photo_id_file_path, form_1583_rejected_reason, photo_id_rejected_reason')
    .eq('customer_id', customerId)
    .maybeSingle();
  const ex = (existing ?? {}) as {
    form_1583_status?: string; photo_id_status?: string;
    form_1583_file_path?: string | null; photo_id_file_path?: string | null;
    form_1583_rejected_reason?: string | null;
    photo_id_rejected_reason?: string | null;
  };

  if (hasForm && ex.form_1583_status === 'verified') {
    return Response.json({ error: 'Form 1583 is already verified — contact support to replace it.' }, { status: 409 });
  }
  if (hasId && ex.photo_id_status === 'verified') {
    return Response.json({ error: 'Photo ID is already verified — contact support to replace it.' }, { status: 409 });
  }

  const now = new Date().toISOString();
  // Customer-side upload never writes internal `admin_notes`/`notes` (those
  // are staff-only). Avoiding the column also dodges a PostgREST schema-cache
  // "Could not find the 'notes' column" error in production.
  const update: Record<string, unknown> = {
    customer_id: customerId,
    form_1583_status: ex.form_1583_status ?? 'pending',
    photo_id_status: ex.photo_id_status ?? 'pending',
    // Preserve the other document's reason; we only clear the matching one(s)
    // for the document(s) actually being re-uploaded, below.
    form_1583_rejected_reason: ex.form_1583_rejected_reason ?? null,
    photo_id_rejected_reason: ex.photo_id_rejected_reason ?? null,
    updated_at: now,
  };

  if (hasForm) {
    const r = await uploadOne(admin, customerId, form1583 as File, 'form-1583');
    if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
    update.form_1583_file_path = r.path;
    update.form_1583_uploaded_at = now;
    update.form_1583_status = 'received';
    update.form_1583_rejected_reason = null;
  }
  if (hasId) {
    const r = await uploadOne(admin, customerId, photoId as File, 'photo-id');
    if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
    update.photo_id_file_path = r.path;
    update.photo_id_uploaded_at = now;
    update.photo_id_status = 'received';
    update.photo_id_rejected_reason = null;
  }

  const { error: upErr } = await admin
    .from('customer_compliance')
    .upsert(update, { onConflict: 'customer_id' });
  if (upErr) {
    console.error('[compliance/upload] upsert failed:', upErr.message);
    return Response.json({ error: 'Could not save your upload.' }, { status: 500 });
  }

  return Response.json({
    ok: true,
    form1583Status: update.form_1583_status,
    photoIdStatus: update.photo_id_status,
  });
}
