import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { notifyMailRequestUpdate } from '@/lib/email/notify-mail';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'staff']);
const VALID_STATUSES = new Set(['pending', 'in_progress', 'completed', 'cancelled']);

// mail_items.status enum: received, notified, scanned, held, forwarded,
// picked_up, shredded. Maps a completed request to the resulting item status.
const COMPLETION_ITEM_STATUS: Record<string, string> = {
  scan: 'scanned',
  forward: 'forwarded',
  pickup: 'picked_up',
  shred: 'shredded',
};

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // ── Auth: admin/staff only ──
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not authenticated.' }, { status: 401 });

  const admin = createAdminClientAny();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role ?? '';
  if (!STAFF_ROLES.has(role)) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // ── Parse + validate (accept camelCase or snake_case) ──
  let body: {
    status?: unknown;
    adminNotes?: unknown; staff_note?: unknown;
    customerResponse?: unknown; customer_response?: unknown;
    trackingNumber?: unknown; tracking_number?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const rawStaffNote = body.adminNotes ?? body.staff_note;
  const rawCustomerResponse = body.customerResponse ?? body.customer_response;
  const rawTracking = body.trackingNumber ?? body.tracking_number;

  if (body.status !== undefined && !VALID_STATUSES.has(String(body.status))) {
    return Response.json({ error: 'Invalid status value.' }, { status: 400 });
  }

  // ── Load the request ──
  const { data: reqData } = await admin
    .from('mail_requests')
    .select('id, status, request_type, mail_item_id, customer_id')
    .eq('id', params.id)
    .maybeSingle();
  const reqRow = reqData as {
    id: string; status: string; request_type: string; mail_item_id: string | null; customer_id: string | null;
  } | null;
  if (!reqRow) return Response.json({ error: 'Request not found.' }, { status: 404 });

  const priorStatus = reqRow.status;
  const nextStatus = body.status !== undefined ? String(body.status) : priorStatus;

  const staffNote = typeof rawStaffNote === 'string' && rawStaffNote.trim() !== '' ? rawStaffNote.trim() : null;
  let customerResponse = typeof rawCustomerResponse === 'string' && rawCustomerResponse.trim() !== ''
    ? rawCustomerResponse.trim() : null;
  const tracking = typeof rawTracking === 'string' && rawTracking.trim() !== ''
    ? rawTracking.trim() : null;

  // For forwards, fold any tracking number into the customer-visible note.
  if (reqRow.request_type === 'forward' && tracking) {
    customerResponse = `${customerResponse ?? 'Your mail was forwarded.'} Tracking: ${tracking}`.trim();
  }

  const update: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };
  if (staffNote !== null) update.admin_notes = staffNote;
  if (customerResponse !== null) update.customer_response = customerResponse;
  if (nextStatus === 'completed') {
    update.completed_at = new Date().toISOString();
    update.completed_by = user.id;
  }

  // Try the full update; if an optional column is missing (e.g. migration 016
  // not applied), progressively drop optional columns so the core status change
  // always lands.
  let { error: upErr } = await admin.from('mail_requests').update(update).eq('id', params.id);
  if (upErr) {
    console.warn('[admin/mail-requests PATCH] full update failed, retrying core:', upErr.message);
    const coreUpdate: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };
    if (nextStatus === 'completed') coreUpdate.completed_at = new Date().toISOString();
    ({ error: upErr } = await admin.from('mail_requests').update(coreUpdate).eq('id', params.id));
    if (upErr) {
      console.warn('[admin/mail-requests PATCH] core update failed, retrying status only:', upErr.message);
      ({ error: upErr } = await admin.from('mail_requests').update({ status: nextStatus }).eq('id', params.id));
    }
  }

  console.log('[admin/request/status]', {
    requestId: params.id,
    nextStatus,
    updated: !upErr,
    error: upErr?.message ?? null,
  });

  if (upErr) {
    // Temporary: surface the real Supabase error to debug production.
    return Response.json({ error: upErr.message }, { status: 500 });
  }

  // ── On completion, sync the related mail item's status (valid enum only) ──
  if (nextStatus === 'completed' && reqRow.mail_item_id) {
    const itemStatus = COMPLETION_ITEM_STATUS[reqRow.request_type];
    if (itemStatus) {
      const itemUpdate: Record<string, unknown> = { status: itemStatus };
      if (reqRow.request_type === 'forward' && tracking) itemUpdate.tracking_number = tracking;
      await admin.from('mail_items').update(itemUpdate).eq('id', reqRow.mail_item_id);
    }
  }

  // ── Non-fatal: notify the customer when the status actually changes ──
  if (nextStatus !== priorStatus) {
    await notifyMailRequestUpdate(admin, params.id);
  }

  const { data: updated } = await admin
    .from('mail_requests')
    .select('id, status, request_type, completed_at, updated_at')
    .eq('id', params.id)
    .maybeSingle();

  return Response.json({ ok: true, request: updated });
}
