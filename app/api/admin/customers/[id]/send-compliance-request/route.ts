import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { isResendConfigured } from '@/lib/email/resend';
import { sendComplianceRequestEmail } from '@/lib/email/send-compliance-request-email';

export const dynamic = 'force-dynamic';

const STAFF_ROLES = new Set(['admin', 'staff']);

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const customerId = params.id;

  // ── Auth: 401 unauth, 403 non-staff ──
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

  if (!isResendConfigured() || !process.env.RESEND_FROM_EMAIL) {
    return Response.json({ error: 'Email is not configured.' }, { status: 503 });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return Response.json({ error: 'App URL is not configured.' }, { status: 503 });
  }

  // ── Resolve customer + recipient email ──
  const { data: custData } = await admin
    .from('customers')
    .select('id, email, profiles(email, business_name, full_name)')
    .eq('id', customerId)
    .maybeSingle();
  if (!custData) {
    return Response.json({ error: 'Customer not found.' }, { status: 404 });
  }
  const cust = custData as unknown as {
    id: string;
    email: string | null;
    profiles: { email: string | null; business_name: string | null; full_name: string | null } | null;
  };
  const recipient = cust.email || cust.profiles?.email || null;
  if (!recipient) {
    return Response.json({ error: 'No email on file for this customer.' }, { status: 400 });
  }
  const businessName = cust.profiles?.business_name || cust.profiles?.full_name || null;

  // ── Send the branded email (fatal if it fails — admin needs to know) ──
  try {
    await sendComplianceRequestEmail({
      email: recipient,
      businessName,
      accountUrl: `${appUrl.replace(/\/$/, '')}/account`,
    });
  } catch (err) {
    console.error('[compliance-request] send failed:', err instanceof Error ? err.message : 'unknown');
    return Response.json({ error: 'Could not send the email. Please try again.' }, { status: 502 });
  }

  // ── Advance only pending statuses to "requested"; never overwrite
  //    verified/rejected/received. ──
  const { data: existing } = await admin
    .from('customer_compliance')
    .select('form_1583_status, photo_id_status')
    .eq('customer_id', customerId)
    .maybeSingle();

  const form1583 = (existing?.form_1583_status ?? 'pending') === 'pending'
    ? 'requested'
    : existing!.form_1583_status;
  const photoId = (existing?.photo_id_status ?? 'pending') === 'pending'
    ? 'requested'
    : existing!.photo_id_status;

  const { error: upErr } = await admin
    .from('customer_compliance')
    .upsert(
      {
        customer_id: customerId,
        form_1583_status: form1583,
        photo_id_status: photoId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'customer_id' },
    );
  if (upErr) {
    // Email already sent; report partial success so the admin doesn't resend.
    console.error('[compliance-request] status update failed:', upErr.message);
    return Response.json({ ok: true, emailed: true, statusUpdated: false });
  }

  return Response.json({ ok: true, emailed: true, statusUpdated: true });
}
