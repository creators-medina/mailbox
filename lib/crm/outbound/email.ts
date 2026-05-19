import 'server-only';
import { Resend } from 'resend';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { ensureConversationForLead } from '@/lib/crm/conversations';
import { createMessage, updateMessageDeliveryStatus } from '@/lib/crm/messages';
import type { Message } from '@/lib/crm/types';

const DEFAULT_FROM = 'My Biz Address <contact@mybizmailbox.biz>';
const DEFAULT_SUBJECT = 'Re: Your My Biz Address inquiry';

export type SendEmailInput = {
  leadId: string;
  to: string;
  subject?: string | null;
  text: string;
  html?: string | null;
  cc?: string[];
  bcc?: string[];
  actorId: string;
};

export type SendEmailResult =
  | { ok: true; message: Message; provider_message_id: string | null }
  | { ok: false; error: string; message: Message | null };

// Convert plain text into a minimal HTML body. Paragraphs are split on
// blank lines, single newlines become <br>. Caller-supplied html wins.
function textToHtml(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export async function sendEmailToLead(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Email is not configured (RESEND_API_KEY missing).', message: null };
  }

  const from = process.env.CRM_FROM_EMAIL || DEFAULT_FROM;
  const subject = (input.subject?.trim() || DEFAULT_SUBJECT).slice(0, 200);
  const text = input.text.trim();
  const html = input.html?.trim() || textToHtml(text);

  // 1) Reuse the open email conversation for this lead, or create one. The
  //    first email's subject becomes the thread label.
  const conversation = await ensureConversationForLead({
    lead_id: input.leadId,
    channel: 'email',
    subject,
    created_by: input.actorId,
  });
  if (!conversation) {
    return { ok: false, error: 'Could not open an email conversation for this lead.', message: null };
  }

  // 2) Record the outbound message as queued — this is the durable audit
  //    trail even if the provider call later fails or the process dies.
  //    createMessage skips auto-activity-logging for outbound queued rows
  //    (see lib/crm/messages.ts); we'll log success or failure below.
  const message = await createMessage({
    lead_id: input.leadId,
    conversation_id: conversation.id,
    channel: 'email',
    direction: 'outbound',
    subject,
    body: text,
    body_html: html,
    from_address: from,
    to_address: input.to,
    cc_addresses: input.cc ?? [],
    bcc_addresses: input.bcc ?? [],
    provider: 'resend',
    delivery_status: 'queued',
    sent_by: input.actorId,
    actor_id: input.actorId,
  });
  if (!message) {
    return { ok: false, error: 'Could not record the outbound message.', message: null };
  }

  // 3) Hand off to Resend.
  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      cc: input.cc?.length ? input.cc : undefined,
      bcc: input.bcc?.length ? input.bcc : undefined,
      reply_to: process.env.CRM_REPLY_TO || undefined,
      subject,
      text,
      html,
    });

    if (error) {
      const errMsg = errorToString(error);
      await updateMessageDeliveryStatus(message.id, 'failed', {
        error_message: errMsg,
        actor_id: input.actorId,
      });
      return { ok: false, error: errMsg, message };
    }

    const providerId = data?.id ?? null;
    await updateMessageDeliveryStatus(message.id, 'sent', {
      provider_message_id: providerId,
      provider: 'resend',
      sent_at: new Date().toISOString(),
      actor_id: input.actorId,
    });

    // Re-fetch so the caller gets the final row with provider_message_id
    // and sent_at filled in.
    const admin = createAdminClientAny();
    const { data: refreshed } = await admin
      .from('crm_messages')
      .select('*')
      .eq('id', message.id)
      .maybeSingle();
    return {
      ok: true,
      message: (refreshed as Message) ?? message,
      provider_message_id: providerId,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unexpected error sending email.';
    await updateMessageDeliveryStatus(message.id, 'failed', {
      error_message: errMsg,
      actor_id: input.actorId,
    });
    return { ok: false, error: errMsg, message };
  }
}

function errorToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; name?: unknown };
    if (typeof e.message === 'string') return e.message;
    if (typeof e.name === 'string') return e.name;
  }
  return 'Email provider returned an unknown error.';
}
