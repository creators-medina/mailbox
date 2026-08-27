import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { BUSINESS, buildCustomerAddress } from '@/lib/config/business';
import { parseSuiteNumber, suiteFormatHint } from '@/lib/mailbox/suite-format';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'staff']);

async function handle(req: Request, customerId: string) {
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
    .single();

  const role = (profile as { role: string } | null)?.role ?? '';
  if (!STAFF_ROLES.has(role)) {
    return Response.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // ── Parse + validate ──
  // Normalization and the accepted formats live in lib/mailbox/suite-format.ts
  // so this route and the admin editor can never disagree. Both the generated
  // (MB1001) and hand-assigned (Suite201) shapes are valid.
  let body: { suiteNumber?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: suiteFormatHint(BUSINESS.suitePrefix) }, { status: 400 });
  }

  const parsed = parseSuiteNumber(body.suiteNumber, BUSINESS.suitePrefix);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const { suiteNumber } = parsed;

  // ── Duplicate prevention ──
  const { data: dupe } = await admin
    .from('customers')
    .select('id')
    .eq('suite_number', suiteNumber)
    .neq('id', customerId)
    .limit(1)
    .maybeSingle();

  if (dupe) {
    return Response.json({ error: 'This suite number is already assigned.' }, { status: 409 });
  }

  // ── Update (only suite_number, business_address_line, updated_at) ──
  const { error } = await admin
    .from('customers')
    .update({
      suite_number: suiteNumber,
      business_address_line: buildCustomerAddress(suiteNumber),
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);

  if (error) {
    console.error('[admin/suite] update failed:', error.message);
    return Response.json({ error: 'Could not update the suite. Please try again.' }, { status: 500 });
  }

  return Response.json({
    ok: true,
    suiteNumber,
    businessAddressLine: buildCustomerAddress(suiteNumber),
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(req, params.id);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(req, params.id);
}
