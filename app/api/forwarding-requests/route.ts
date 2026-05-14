import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TERMINAL = new Set(['shredded', 'forwarded', 'picked_up']);

interface ForwardingBody {
  mail_item_ids: unknown;
  dest_name:     string;
  street:        string;
  city:          string;
  state?:        string;
  postal?:       string;
  country:       string;
  carrier?:      string;
  note?:         string;
}

// Serialize destination details into human-readable structured text for admin/staff.
// Stored in mail_requests.notes since no dedicated destination columns exist yet.
function buildNotes(d: {
  destName: string;
  street:   string;
  city:     string;
  state:    string;
  postal:   string;
  country:  string;
  carrier:  string;
  note:     string;
}): string {
  const cityLine = [d.city, d.state, d.postal].filter(Boolean).join(', ');
  const lines: string[] = [
    'SHIP TO',
    `Name:    ${d.destName}`,
    `Street:  ${d.street}`,
    `City:    ${cityLine}`,
    `Country: ${d.country}`,
  ];
  if (d.carrier && d.carrier !== 'No preference') {
    lines.push(`Carrier: ${d.carrier}`);
  }
  if (d.note) {
    lines.push('', `Customer note: ${d.note}`);
  }
  return lines.join('\n');
}

export async function POST(req: Request) {
  // ── Auth ───────────────────────────────────────────────────────────────
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Parse & validate body ──────────────────────────────────────────────
  let body: ForwardingBody;
  try {
    body = await req.json() as ForwardingBody;
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const {
    mail_item_ids,
    dest_name  = '',
    street     = '',
    city       = '',
    state      = '',
    postal     = '',
    country    = '',
    carrier    = 'No preference',
    note       = '',
  } = body;

  if (!Array.isArray(mail_item_ids) || mail_item_ids.length === 0)
    return Response.json({ error: 'Select at least one mail item.' }, { status: 400 });
  if (mail_item_ids.length > 50)
    return Response.json({ error: 'Too many items selected (max 50).' }, { status: 400 });
  if (!mail_item_ids.every((id): id is string => typeof id === 'string' && UUID_RE.test(id)))
    return Response.json({ error: 'Invalid mail item IDs.' }, { status: 400 });
  if (!dest_name.trim())
    return Response.json({ error: 'Destination name is required.' }, { status: 400 });
  if (!street.trim())
    return Response.json({ error: 'Street address is required.' }, { status: 400 });
  if (!city.trim())
    return Response.json({ error: 'City is required.' }, { status: 400 });
  if (!country.trim())
    return Response.json({ error: 'Country is required.' }, { status: 400 });

  const admin = createAdminClientAny();

  // ── Resolve customer ───────────────────────────────────────────────────
  const { data: custData } = await admin
    .from('customers')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  const customerId = (custData as { id: string } | null)?.id;
  if (!customerId)
    return Response.json({ error: 'No customer account found.' }, { status: 403 });

  // ── Ownership check: fetch items filtered by this customer_id ──────────
  // If the DB returns fewer rows than requested, some IDs don't belong here.
  const { data: itemsData } = await admin
    .from('mail_items')
    .select('id, status')
    .in('id', mail_item_ids)
    .eq('customer_id', customerId);

  const items = (itemsData ?? []) as { id: string; status: string }[];

  if (items.length !== mail_item_ids.length)
    return Response.json(
      { error: 'One or more items were not found or do not belong to your account.' },
      { status: 403 },
    );

  // ── Terminal-status guard ──────────────────────────────────────────────
  const terminalCount = items.filter(i => TERMINAL.has(i.status)).length;
  if (terminalCount > 0)
    return Response.json(
      { error: 'One or more items cannot be forwarded (already forwarded, shredded, or picked up).' },
      { status: 400 },
    );

  // ── Duplicate open-request guard ───────────────────────────────────────
  const { data: dupData } = await admin
    .from('mail_requests')
    .select('mail_item_id')
    .in('mail_item_id', mail_item_ids)
    .eq('request_type', 'forward')
    .in('status', ['pending', 'in_progress']);

  const duplicates = (dupData ?? []) as { mail_item_id: string }[];
  if (duplicates.length > 0)
    return Response.json(
      { error: 'One or more selected items already have an open forwarding request.' },
      { status: 409 },
    );

  // ── Build notes and insert ─────────────────────────────────────────────
  const notes = buildNotes({
    destName: dest_name.trim(),
    street:   street.trim(),
    city:     city.trim(),
    state:    state.trim(),
    postal:   postal.trim(),
    country:  country.trim(),
    carrier,
    note:     note.trim(),
  });

  const rows = mail_item_ids.map((id: string) => ({
    mail_item_id:  id,
    customer_id:   customerId,
    request_type:  'forward',
    status:        'pending',
    notes,
  }));

  const { error: insertError } = await admin.from('mail_requests').insert(rows);
  if (insertError)
    return Response.json({ error: insertError.message }, { status: 500 });

  return Response.json({ success: true, count: rows.length });
}
