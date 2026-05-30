import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';

const VALID_REQUEST_TYPES = new Set(['scan', 'forward', 'pickup', 'shred']);

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { mail_item_id?: unknown; request_type?: unknown; notes?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const mail_item_id = typeof body.mail_item_id === 'string' ? body.mail_item_id : '';
  const request_type = typeof body.request_type === 'string' ? body.request_type : '';
  const notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes.trim() : null;

  if (!mail_item_id || !request_type) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!VALID_REQUEST_TYPES.has(request_type)) {
    return Response.json({ error: 'Invalid request type' }, { status: 400 });
  }

  const admin = createAdminClientAny();

  // Resolve THIS user's customer record the same way /account does — tolerant
  // of how the row was linked (profile_id, user_id, or matching email) so a
  // self-healed/email-matched customer isn't wrongly rejected.
  const customer = await resolveCustomer(admin, user.id, user.email ?? null);

  // Confirm the requested mail item exists and belongs to the resolved customer.
  const { data: itemData } = await admin
    .from('mail_items')
    .select('id, customer_id')
    .eq('id', mail_item_id)
    .maybeSingle();
  const item = itemData as { id: string; customer_id: string } | null;

  const mailItemBelongsToCustomer = Boolean(customer && item && item.customer_id === customer.id);

  console.warn('[mail-request]', {
    userId: user.id,
    email: user.email,
    customerFound: Boolean(customer),
    mailItemBelongsToCustomer,
  });

  if (!item) return Response.json({ error: 'Not found' }, { status: 404 });
  if (!mailItemBelongsToCustomer) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Prevent duplicate open requests for the same mail item.
  const { data: openReq } = await admin
    .from('mail_requests')
    .select('id, request_type')
    .eq('mail_item_id', mail_item_id)
    .in('status', ['pending', 'in_progress'])
    .limit(1)
    .maybeSingle();
  if (openReq) {
    return Response.json(
      { error: 'A request is already open for this mail item.' },
      { status: 409 },
    );
  }

  const { error } = await admin.from('mail_requests').insert({
    mail_item_id,
    customer_id: item!.customer_id,
    request_type,
    notes,
    status: 'pending',
  });

  if (error) {
    console.error('[mail-requests] insert failed:', error.message);
    return Response.json({ error: 'Could not submit your request.' }, { status: 500 });
  }

  return Response.json({ success: true });
}

// Resolve a customer for the signed-in user, tolerant of how the row is linked.
// Order: profile_id → user_id (column may not exist) → email (exact, verified
// in JS). Uses the service-role client (server-only).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveCustomer(admin: any, userId: string, email: string | null): Promise<{ id: string } | null> {
  {
    const { data } = await admin.from('customers').select('id').eq('profile_id', userId).maybeSingle();
    if (data) return data as { id: string };
  }
  {
    const { data, error } = await admin.from('customers').select('id').eq('user_id', userId).maybeSingle();
    if (!error && data) return data as { id: string };
  }
  if (email) {
    const { data } = await admin.from('customers').select('id, email').ilike('email', email).limit(2);
    const rows = (data ?? []) as Array<{ id: string; email?: string | null }>;
    const match = rows.find((r) => (r.email ?? '').toLowerCase() === email.toLowerCase());
    if (match) return { id: match.id };
  }
  return null;
}
