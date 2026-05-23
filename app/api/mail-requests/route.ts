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

  // Verify the mail item belongs to this user
  const { data: itemData } = await admin
    .from('mail_items')
    .select('customer_id')
    .eq('id', mail_item_id)
    .single();

  const item = itemData as { customer_id: string } | null;
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 });

  const { data: custData } = await admin
    .from('customers')
    .select('profile_id')
    .eq('id', item.customer_id)
    .single();

  const cust = custData as { profile_id: string } | null;
  if (cust?.profile_id !== user.id) {
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
    customer_id: item.customer_id,
    request_type,
    notes,
    status: 'pending',
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
