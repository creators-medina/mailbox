import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { notifyScanReady } from '@/lib/email/notify-mail';
import { MAIL_ITEM_STATUSES } from '@/lib/mail/statuses';

export const dynamic = 'force-dynamic';

// Allowed mail item statuses — must match the production mail_item_status enum.
const VALID_STATUSES = new Set<string>(MAIL_ITEM_STATUSES);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    status?: unknown;
    sender?: unknown;
    title?: unknown;
    recipient_name?: unknown;
    notes?: unknown;
    tracking_number?: unknown;
    received_at?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const admin = createAdminClientAny();

  // Validate the mail item exists before updating.
  const { data: existing } = await admin
    .from('mail_items')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();
  if (!existing) {
    return Response.json({ error: 'Mail item not found.' }, { status: 404 });
  }

  // Build update from provided fields only.
  const update: Record<string, string | null> = {};

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!VALID_STATUSES.has(status)) {
      return Response.json({ error: 'Invalid status value.' }, { status: 400 });
    }
    update.status = status;
  }

  const textFields = ['sender', 'title', 'recipient_name', 'notes', 'tracking_number'] as const;
  for (const f of textFields) {
    if (body[f] !== undefined) {
      const v = body[f];
      update[f] = typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
    }
  }

  if (body.received_at !== undefined) {
    const r = String(body.received_at);
    const parsed = new Date(r);
    if (Number.isNaN(parsed.getTime())) {
      return Response.json({ error: 'Invalid received date.' }, { status: 400 });
    }
    update.received_at = parsed.toISOString();
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'No valid fields to update.' }, { status: 400 });
  }

  // Update and read the row back to return the persisted status.
  const { data, error } = await admin
    .from('mail_items')
    .update(update)
    .eq('id', params.id)
    .select('id, status')
    .maybeSingle();

  console.log('[admin/mail/status]', {
    mailItemId: params.id,
    nextStatus: update.status ?? null,
    updated: !!data,
    error: error?.message ?? null,
  });

  if (error) {
    console.error('[admin/mail-items PATCH] update failed:', error.message);
    return Response.json({ error: 'Could not update status.' }, { status: 500 });
  }

  // Non-fatal: notify the customer when the item becomes scanned.
  if (update.status === 'scanned') {
    await notifyScanReady(admin, params.id);
  }

  const persistedStatus = (data as { status: string } | null)?.status
    ?? (typeof update.status === 'string' ? update.status : undefined);
  return Response.json({ ok: true, status: persistedStatus });
}
