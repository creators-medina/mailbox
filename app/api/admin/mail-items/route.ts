import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { notifyNewMailReceived } from '@/lib/email/notify-mail';
import { MAIL_ENVELOPE_BUCKET, MAIL_SCAN_BUCKET } from '@/lib/storage/buckets';

export async function POST(req: Request) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const formData = await req.formData();
  const customerId     = formData.get('customer_id') as string;
  const sender         = (formData.get('sender') as string) || null;
  const title          = (formData.get('title') as string) || null;
  const recipientName  = (formData.get('recipient_name') as string) || null;
  const trackingNumber = (formData.get('tracking_number') as string) || null;
  const notes          = (formData.get('notes') as string) || null;
  const receivedAt     = (formData.get('received_at') as string) || new Date().toISOString();
  const envelopeFile   = formData.get('envelope') as File | null;
  const scanFile       = formData.get('scan') as File | null;

  if (!customerId) {
    return Response.json({ error: 'customer_id is required' }, { status: 400 });
  }

  const admin = createAdminClientAny();

  // Validate the customer exists before creating the mail item.
  const { data: cust } = await admin
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .maybeSingle();
  if (!cust) {
    return Response.json({ error: 'Customer not found.' }, { status: 404 });
  }

  let envelopeUrl: string | null = null;
  let scanUrl: string | null = null;

  if (envelopeFile && envelopeFile.size > 0) {
    const buffer = await envelopeFile.arrayBuffer();
    const ext = envelopeFile.name.split('.').pop() ?? 'jpg';
    const path = `${customerId}/${Date.now()}-envelope.${ext}`;
    const { data: up, error: upErr } = await admin.storage
      .from(MAIL_ENVELOPE_BUCKET)
      .upload(path, buffer, { contentType: envelopeFile.type });
    if (upErr) {
      console.error('[mail-items] envelope upload failed:', upErr.message);
      return Response.json({ error: 'Could not upload the envelope image.' }, { status: 500 });
    }
    if (up) envelopeUrl = (up as { path: string }).path;
  }

  if (scanFile && scanFile.size > 0) {
    const buffer = await scanFile.arrayBuffer();
    const ext = scanFile.name.split('.').pop() ?? 'pdf';
    const path = `${customerId}/${Date.now()}-scan.${ext}`;
    const { data: up, error: upErr } = await admin.storage
      .from(MAIL_SCAN_BUCKET)
      .upload(path, buffer, { contentType: scanFile.type });
    if (upErr) {
      console.error('[mail-items] scan upload failed:', upErr.message);
      return Response.json({ error: 'Could not upload the scanned document.' }, { status: 500 });
    }
    if (up) scanUrl = (up as { path: string }).path;
  }

  const { data: mailItem, error } = await admin
    .from('mail_items')
    .insert({
      customer_id: customerId,
      sender,
      title,
      recipient_name: recipientName,
      tracking_number: trackingNumber,
      notes,
      envelope_image_url: envelopeUrl,
      scanned_document_url: scanUrl,
      status: 'received',
      received_at: receivedAt,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[mail-items] insert failed:', error.message);
    return Response.json({ error: 'Could not create the mail item.' }, { status: 500 });
  }

  const newId = (mailItem as { id: string } | null)?.id;

  // Non-fatal: notify the customer a new piece of mail arrived.
  if (newId) {
    await notifyNewMailReceived(admin, newId);
  }

  return Response.json({ success: true, id: newId });
}
