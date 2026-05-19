import 'server-only';
import { currentStaffUserId } from '@/lib/auth/require-staff';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { sendEmailToLead } from '@/lib/crm/outbound/email';

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function pickStrArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return (value as unknown[])
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim())
    .filter(isEmail);
}

// POST — send a real email from staff to a lead.
// Body: { subject, body, cc?: string[], bcc?: string[] }
// Auth: must be admin or staff. RESEND_API_KEY is never exposed.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { subject?: unknown; body?: unknown; cc?: unknown; bcc?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';

  if (!subject) {
    return Response.json({ error: 'Subject is required.' }, { status: 400 });
  }
  if (!text) {
    return Response.json({ error: 'Message body is required.' }, { status: 400 });
  }

  const admin = createAdminClientAny();
  const { data: lead } = await admin
    .from('crm_leads')
    .select('id, email')
    .eq('id', params.id)
    .maybeSingle();

  const leadRow = lead as { id: string; email: string | null } | null;
  if (!leadRow) {
    return Response.json({ error: 'Lead not found.' }, { status: 404 });
  }
  if (!leadRow.email || !isEmail(leadRow.email)) {
    return Response.json(
      { error: 'This lead has no valid email address on file.' },
      { status: 400 },
    );
  }

  const result = await sendEmailToLead({
    leadId: leadRow.id,
    to: leadRow.email,
    subject,
    text,
    cc: pickStrArray(body.cc),
    bcc: pickStrArray(body.bcc),
    actorId,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, message: result.message ?? undefined },
      { status: 502 },
    );
  }
  return Response.json({
    ok: true,
    message: result.message,
    provider_message_id: result.provider_message_id,
  });
}
