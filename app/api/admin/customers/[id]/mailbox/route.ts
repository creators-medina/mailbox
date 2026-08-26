import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { buildMailboxUpdate } from '@/lib/mailbox/mailbox-profile';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'staff']);

// PATCH /api/admin/customers/[id]/mailbox
//
// Updates the operational identity of ONE mailbox. The write is scoped by
// `.eq('id', customerId)` against public.customers and the column set comes
// from buildMailboxUpdate's allow-list, so this route structurally cannot:
//   • touch another mailbox belonging to the same billing person,
//   • touch public.profiles (the person / login identity),
//   • touch stripe_customer_id, customers.status, or public.subscriptions,
//   • call Stripe at all — this file imports no Stripe client.
// Suite reassignment stays in the sibling /suite route, which owns duplicate
// checking and rebuilding business_address_line.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const customerId = params.id;

  // ── Auth: 401 if not signed in, 403 if signed in but not staff/admin ──
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
    .maybeSingle();

  const role = (profile as { role: string } | null)?.role ?? '';
  if (!STAFF_ROLES.has(role)) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // ── Parse + validate ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const built = buildMailboxUpdate(body);
  if (!built.ok) {
    return Response.json({ error: built.error }, { status: 400 });
  }

  // ── Confirm the mailbox exists before writing ──
  const { data: existing } = await admin
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .maybeSingle();
  if (!existing) {
    return Response.json({ error: 'Mailbox not found.' }, { status: 404 });
  }

  const { data: saved, error } = await admin
    .from('customers')
    .update({ ...built.update, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .select('id, suite_number, business_name, recipient_name, contact_email, contact_phone, forwarding_address, updated_at')
    .single();

  if (error) {
    console.error('[admin/mailbox] update failed:', error.message);
    return Response.json({ error: 'Could not update the mailbox. Please try again.' }, { status: 500 });
  }

  console.log('[admin/mailbox] updated', {
    customerId,
    fields: Object.keys(built.update),
    by: user.id,
  });

  return Response.json({ ok: true, mailbox: saved });
}
