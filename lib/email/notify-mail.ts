import 'server-only';
import { isResendConfigured } from './resend';
import { sendMailReceivedEmail } from './send-mail-received-email';
import { sendScanReadyEmail } from './send-scan-ready-email';
import { sendMailRequestUpdateEmail } from './send-mail-request-update-email';

// All functions here are non-throwing: a notification failure must never break
// the admin workflow. They handle recipient lookup, duplicate prevention via
// per-row *_email_sent_at stamps, sending, and stamping.

/* eslint-disable @typescript-eslint/no-explicit-any */

// Customer-facing dashboard link. Uses the canonical NEXT_PUBLIC_APP_URL (never
// a preview deployment URL) and always targets /account — never /admin. The
// recipient email is attached so /account can show the right guidance if an
// admin happens to be signed in when opening the link.
function appBase(): string | undefined {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
}

function accountUrl(customerEmail?: string | null): string | null {
  const base = appBase();
  if (!base) return null;
  const url = `${base.replace(/\/$/, '')}/account`;
  return customerEmail ? `${url}?customerEmail=${encodeURIComponent(customerEmail)}` : url;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type CustomerCtx = {
  email: string | null;
  businessName: string | null;
  suiteNumber: string | null;
};

async function loadCustomerCtx(admin: any, customerId: string): Promise<CustomerCtx | null> {
  const { data } = await admin
    .from('customers')
    .select('id, suite_number, email, profiles(email, business_name, full_name)')
    .eq('id', customerId)
    .maybeSingle();
  if (!data) return null;
  const c = data as {
    suite_number: string | null;
    email: string | null;
    profiles: { email: string | null; business_name: string | null; full_name: string | null } | null;
  };
  return {
    email: c.email || c.profiles?.email || null,
    businessName: c.profiles?.business_name || c.profiles?.full_name || null,
    suiteNumber: c.suite_number ?? null,
  };
}

// ── New mail received ────────────────────────────────────────────────────────
export async function notifyNewMailReceived(admin: any, mailItemId: string): Promise<void> {
  try {
    if (!isResendConfigured() || !process.env.RESEND_FROM_EMAIL) return;
    if (!appBase()) { console.warn('[notify] app URL not set — skipping mail-received email'); return; }

    const { data: item } = await admin
      .from('mail_items')
      .select('id, customer_id, sender, title, received_at, received_email_sent_at')
      .eq('id', mailItemId)
      .maybeSingle();
    if (!item) return;
    if (item.received_email_sent_at) return; // already notified

    const ctx = await loadCustomerCtx(admin, item.customer_id);
    if (!ctx?.email) { console.warn('[notify] no recipient email for mail item', mailItemId); return; }
    const url = accountUrl(ctx.email);
    if (!url) return;

    const id = await sendMailReceivedEmail({
      email: ctx.email,
      businessName: ctx.businessName,
      suiteNumber: ctx.suiteNumber,
      sender: item.sender,
      title: item.title,
      receivedDate: fmtDate(item.received_at),
      accountUrl: url,
    });

    await admin.from('mail_items')
      .update({ received_email_sent_at: new Date().toISOString() })
      .eq('id', mailItemId);
    console.log(`[notify] mail-received email sent (id ${id ?? 'n/a'}) for item ${mailItemId}`);
  } catch (err) {
    console.error('[notify] mail-received failed:', err instanceof Error ? err.message : 'unknown');
  }
}

// ── Scan ready ───────────────────────────────────────────────────────────────
export async function notifyScanReady(admin: any, mailItemId: string): Promise<void> {
  try {
    if (!isResendConfigured() || !process.env.RESEND_FROM_EMAIL) return;
    if (!appBase()) { console.warn('[notify] app URL not set — skipping scan-ready email'); return; }

    const { data: item } = await admin
      .from('mail_items')
      .select('id, customer_id, sender, title, received_at, scan_ready_email_sent_at')
      .eq('id', mailItemId)
      .maybeSingle();
    if (!item) return;
    if (item.scan_ready_email_sent_at) return; // already notified

    const ctx = await loadCustomerCtx(admin, item.customer_id);
    if (!ctx?.email) { console.warn('[notify] no recipient email for mail item', mailItemId); return; }
    const url = accountUrl(ctx.email);
    if (!url) return;

    const id = await sendScanReadyEmail({
      email: ctx.email,
      sender: item.sender,
      title: item.title,
      receivedDate: fmtDate(item.received_at),
      accountUrl: url, // never expose raw storage paths
    });

    await admin.from('mail_items')
      .update({ scan_ready_email_sent_at: new Date().toISOString() })
      .eq('id', mailItemId);
    console.log(`[notify] scan-ready email sent (id ${id ?? 'n/a'}) for item ${mailItemId}`);
  } catch (err) {
    console.error('[notify] scan-ready failed:', err instanceof Error ? err.message : 'unknown');
  }
}

// ── Mail request status update ───────────────────────────────────────────────
export async function notifyMailRequestUpdate(admin: any, requestId: string): Promise<void> {
  try {
    if (!isResendConfigured() || !process.env.RESEND_FROM_EMAIL) return;
    if (!appBase()) { console.warn('[notify] app URL not set — skipping request-update email'); return; }

    const { data: reqRow } = await admin
      .from('mail_requests')
      .select('id, customer_id, request_type, status, mail_items(sender, title)')
      .eq('id', requestId)
      .maybeSingle();
    if (!reqRow) return;

    const ctx = await loadCustomerCtx(admin, reqRow.customer_id);
    if (!ctx?.email) { console.warn('[notify] no recipient email for request', requestId); return; }
    const url = accountUrl(ctx.email);
    if (!url) return;

    const mail = reqRow.mail_items as { sender: string | null; title: string | null } | null;

    const id = await sendMailRequestUpdateEmail({
      email: ctx.email,
      requestType: reqRow.request_type,
      status: reqRow.status,
      mailSender: mail?.sender ?? null,
      mailTitle: mail?.title ?? null,
      accountUrl: url,
    });

    await admin.from('mail_requests')
      .update({ last_status_email_sent_at: new Date().toISOString() })
      .eq('id', requestId);
    console.log(`[notify] request-update email sent (id ${id ?? 'n/a'}) for request ${requestId}`);
  } catch (err) {
    console.error('[notify] request-update failed:', err instanceof Error ? err.message : 'unknown');
  }
}
