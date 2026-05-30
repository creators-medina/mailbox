import { Resend } from 'resend';
import { createLead, resolveDefaultDestination } from '@/lib/crm/leads';

const DEFAULT_TO = 'isabelle@bomacnation.com';
// Prefer the configured Resend sender (verified domain); fall back to the
// legacy address so existing deployments keep working.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'My Biz Address <hello@mybizaddress.co>';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function splitName(full: string): { first: string | null; last: string | null } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return { first: null, last: null };
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export async function POST(req: Request) {
  let payload: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
    message?: unknown;
  };

  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (!name || !email || !message) {
    return Response.json(
      { error: 'Name, email, and message are required.' },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return Response.json(
      { error: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not configured');
    return Response.json(
      { error: 'Email service is not configured. Please try again later.' },
      { status: 500 },
    );
  }

  const to = process.env.CONTACT_TO_EMAIL || process.env.CONTACT_EMAIL || DEFAULT_TO;

  const resend = new Resend(apiKey);

  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    '',
    'Message:',
    message,
  ]
    .filter((line) => line !== null)
    .join('\n');

  // Fire-and-forget lead creation. CRM ingestion is best-effort so it can't
  // break the customer-facing form: log on failure and continue to email.
  try {
    const dest = await resolveDefaultDestination();
    if (dest) {
      const { first, last } = splitName(name);
      await createLead({
        pipeline_id: dest.pipeline_id,
        stage_id: dest.stage_id,
        first_name: first,
        last_name: last,
        email,
        phone: phone || null,
        source: 'contact_form',
        notes: message,
        raw_submission: { name, email, phone, message, submitted_at: new Date().toISOString() },
      });
    } else {
      console.warn('[contact] No active pipeline/stage configured — skipping lead creation.');
    }
  } catch (err) {
    console.error('[contact] Lead ingestion failed (continuing to email):', err);
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      reply_to: email,
      subject: `New inquiry from ${name}`,
      text,
    });

    if (error) {
      console.error('[contact] Resend error:', error);
      return Response.json(
        { error: 'Could not send your message. Please try again or call us.' },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return Response.json(
      { error: 'Could not send your message. Please try again or call us.' },
      { status: 500 },
    );
  }
}
