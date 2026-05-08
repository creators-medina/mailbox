import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    mail_item_id: string;
    request_type: string;
    notes?: string;
  };
  const { mail_item_id, request_type, notes } = body;

  if (!mail_item_id || !request_type) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
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

  const { error } = await admin.from('mail_requests').insert({
    mail_item_id,
    customer_id: item.customer_id,
    request_type,
    notes: notes ?? null,
    status: 'pending',
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ success: true });
}
