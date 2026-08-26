import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { buildPersonUpdate } from '@/lib/mailbox/person-profile';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'staff']);

// PATCH /api/admin/customers/[id]/person
//
// Updates the account holder's name on public.profiles. The mailbox is used
// only to resolve which person is being edited — the write itself is scoped to
// that person's profile row.
//
// Deliberately narrow. This route:
//   • writes exactly one column, profiles.full_name, via buildPersonUpdate's
//     allow-list,
//   • never writes business_name — that belongs to the mailbox and is owned by
//     PATCH .../mailbox,
//   • never writes email, role, or phone,
//   • never touches customers, subscriptions, or any Stripe identifier, and
//     imports no Stripe client,
//   • is staff/admin only. Authorization is checked here, on the server; the
//     service-role client used for the write bypasses RLS, so this check is the
//     boundary, not the UI.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const customerId = params.id;

  // ── Auth: 401 if not signed in, 403 if signed in but not staff/admin ──
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createAdminClientAny();
  const { data: actor } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (actor as { role: string } | null)?.role ?? '';
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

  const built = buildPersonUpdate(body);
  if (!built.ok) {
    return Response.json({ error: built.error }, { status: 400 });
  }

  // ── Resolve the person through the mailbox being viewed ──
  const { data: customer } = await admin
    .from('customers')
    .select('id, profile_id')
    .eq('id', customerId)
    .maybeSingle();

  const profileId = (customer as { profile_id: string | null } | null)?.profile_id ?? null;
  if (!customer) {
    return Response.json({ error: 'Mailbox not found.' }, { status: 404 });
  }
  if (!profileId) {
    return Response.json(
      { error: 'This mailbox is not linked to an account holder yet.' },
      { status: 409 },
    );
  }

  const { data: saved, error } = await admin
    .from('profiles')
    .update({ ...built.update, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .select('id, full_name, updated_at')
    .single();

  if (error) {
    console.error('[admin/person] update failed:', error.message);
    return Response.json(
      { error: 'Could not update the account holder. Please try again.' },
      { status: 500 },
    );
  }

  console.log('[admin/person] updated', {
    customerId,
    profileId,
    fields: Object.keys(built.update),
    by: user.id,
  });

  return Response.json({ ok: true, person: saved });
}
