import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { logActivity } from './activity';
import { ensureConversationForLead, updateConversationLastMessage } from './conversations';
import type {
  ActivityType,
  Channel,
  DeliveryStatus,
  Direction,
  Message,
  MessageAttachment,
} from './types';

export async function listMessagesForLead(leadId: string): Promise<Message[]> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });
  return (data ?? []) as Message[];
}

export async function listMessagesForConversation(
  conversationId: string,
): Promise<Message[]> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  return (data ?? []) as Message[];
}

export async function getMessage(id: string): Promise<Message | null> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_messages')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as Message | null) ?? null;
}

export async function listAttachmentsForMessage(
  messageId: string,
): Promise<MessageAttachment[]> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_message_attachments')
    .select('*')
    .eq('message_id', messageId);
  return (data ?? []) as MessageAttachment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// createMessage — universal writer for inbound + outbound + internal messages.
// Provider adapters (Resend, Twilio, …) and webhook handlers all funnel here
// so activity logging, conversation bumping, and shape consistency happen
// once in a single place.
// ─────────────────────────────────────────────────────────────────────────────

export type CreateMessageInput = {
  lead_id: string;
  channel: Channel;
  direction: Direction;
  // If omitted, ensureConversationForLead() picks or creates an open one.
  conversation_id?: string | null;
  subject?: string | null;
  body?: string | null;
  body_html?: string | null;
  from_address?: string | null;
  to_address?: string | null;
  cc_addresses?: string[];
  bcc_addresses?: string[];
  provider?: string | null;
  provider_message_id?: string | null;
  delivery_status?: DeliveryStatus;
  error_message?: string | null;
  metadata?: Record<string, unknown>;
  sent_by?: string | null;
  sent_at?: string | null;
  // Optional: attach this actor id to the auto-logged activity row.
  actor_id?: string | null;
};

export async function createMessage(input: CreateMessageInput): Promise<Message | null> {
  const admin = createAdminClientAny();

  let conversationId = input.conversation_id ?? null;
  if (!conversationId) {
    const conv = await ensureConversationForLead({
      lead_id: input.lead_id,
      channel: input.channel,
      subject: input.subject ?? null,
      created_by: input.actor_id ?? null,
    });
    if (!conv) {
      console.error('[crm.createMessage] could not ensure conversation');
      return null;
    }
    conversationId = conv.id;
  }

  const { data, error } = await admin
    .from('crm_messages')
    .insert({
      conversation_id: conversationId,
      lead_id: input.lead_id,
      channel: input.channel,
      direction: input.direction,
      subject: input.subject ?? null,
      body: input.body ?? null,
      body_html: input.body_html ?? null,
      from_address: input.from_address ?? null,
      to_address: input.to_address ?? null,
      cc_addresses: input.cc_addresses ?? [],
      bcc_addresses: input.bcc_addresses ?? [],
      provider: input.provider ?? null,
      provider_message_id: input.provider_message_id ?? null,
      delivery_status: input.delivery_status ?? (input.direction === 'inbound' ? 'received' : 'draft'),
      error_message: input.error_message ?? null,
      metadata: input.metadata ?? {},
      sent_by: input.sent_by ?? null,
      sent_at: input.sent_at ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[crm.createMessage]', error);
    return null;
  }
  const message = data as Message;

  // Keep the conversation header in sync so list views can sort by it.
  await updateConversationLastMessage(message.conversation_id, message.created_at);

  // Activity logging. Outbound messages start as draft/queued — defer the
  // success activity until updateMessageDeliveryStatus() flips to 'sent'.
  const pendingOutbound =
    message.direction === 'outbound' &&
    (message.delivery_status === 'draft' || message.delivery_status === 'queued');

  if (!pendingOutbound) {
    const activityType = pickActivityType(message);
    if (activityType) {
      const title = pickActivityTitle(message);
      await logActivity({
        lead_id: message.lead_id,
        type: activityType,
        title,
        description:
          message.subject ||
          (message.body ? message.body.slice(0, 200) : null) ||
          null,
        metadata: {
          message_id: message.id,
          conversation_id: message.conversation_id,
          channel: message.channel,
          direction: message.direction,
          provider: message.provider,
          provider_message_id: message.provider_message_id,
          delivery_status: message.delivery_status,
        },
        created_by: input.actor_id ?? message.sent_by ?? null,
      });
    }
  }

  return message;
}

function pickActivityType(m: Message): ActivityType | null {
  if (m.delivery_status === 'failed' || m.delivery_status === 'bounced') {
    return 'message_failed';
  }
  if (m.channel === 'email') {
    return m.direction === 'inbound' ? 'email_received' : 'email_sent';
  }
  if (m.channel === 'sms') {
    return m.direction === 'inbound' ? 'sms_received' : 'sms_sent';
  }
  if (m.channel === 'phone') {
    // Phone calls are recorded as internal touchpoints.
    return 'call_logged';
  }
  if (m.channel === 'internal' || m.channel === 'system') {
    return 'internal_message_added';
  }
  return null;
}

function pickActivityTitle(m: Message): string {
  if (m.delivery_status === 'failed' || m.delivery_status === 'bounced') {
    const label = m.channel === 'email' ? 'Email' : m.channel === 'sms' ? 'SMS' : 'Message';
    return `${label} ${m.delivery_status === 'bounced' ? 'bounced' : 'failed to send'}`;
  }
  if (m.channel === 'email') {
    return m.direction === 'inbound' ? 'Email received' : 'Email sent';
  }
  if (m.channel === 'sms') {
    return m.direction === 'inbound' ? 'SMS received' : 'SMS sent';
  }
  if (m.channel === 'phone') return 'Call logged';
  return 'Internal note added';
}

// Update delivery status (e.g. from a Resend webhook or after an outbound
// provider call). Also emits the appropriate activity row on the relevant
// transitions: -> sent fires email_sent / sms_sent; -> failed/bounced
// fires message_failed.
export async function updateMessageDeliveryStatus(
  messageId: string,
  status: DeliveryStatus,
  opts: {
    error_message?: string | null;
    provider?: string | null;
    provider_message_id?: string | null;
    sent_at?: string | null;
    actor_id?: string | null;
  } = {},
): Promise<void> {
  const admin = createAdminClientAny();
  const { data: prior } = await admin
    .from('crm_messages')
    .select('lead_id, channel, direction, delivery_status, subject, body, sent_by')
    .eq('id', messageId)
    .maybeSingle();

  const update: Record<string, unknown> = { delivery_status: status };
  if (opts.error_message !== undefined) update.error_message = opts.error_message;
  if (opts.provider !== undefined) update.provider = opts.provider;
  if (opts.provider_message_id !== undefined) update.provider_message_id = opts.provider_message_id;
  if (opts.sent_at !== undefined) update.sent_at = opts.sent_at;

  const { error } = await admin.from('crm_messages').update(update).eq('id', messageId);
  if (error) {
    console.error('[crm.updateMessageDeliveryStatus]', error);
    return;
  }

  const priorRow = prior as
    | {
        lead_id: string;
        channel: Channel;
        direction: Direction;
        delivery_status: DeliveryStatus;
        subject: string | null;
        body: string | null;
        sent_by: string | null;
      }
    | null;
  if (!priorRow || priorRow.delivery_status === status) return;

  const actorId = opts.actor_id ?? priorRow.sent_by ?? null;
  const description = priorRow.subject || (priorRow.body ? priorRow.body.slice(0, 200) : null);

  if (status === 'failed' || status === 'bounced') {
    await logActivity({
      lead_id: priorRow.lead_id,
      type: 'message_failed',
      title:
        status === 'bounced'
          ? `${priorRow.channel === 'sms' ? 'SMS' : 'Email'} bounced`
          : `${priorRow.channel === 'sms' ? 'SMS' : 'Email'} failed to send`,
      description: opts.error_message ?? description,
      metadata: { message_id: messageId, delivery_status: status },
      created_by: actorId,
    });
    return;
  }

  // Fire the success activity exactly once — on the first transition away
  // from a pending state into 'sent'.
  if (status === 'sent' && priorRow.direction === 'outbound') {
    const type =
      priorRow.channel === 'email'
        ? 'email_sent'
        : priorRow.channel === 'sms'
        ? 'sms_sent'
        : priorRow.channel === 'phone'
        ? 'call_logged'
        : 'internal_message_added';
    const title =
      priorRow.channel === 'email'
        ? 'Email sent'
        : priorRow.channel === 'sms'
        ? 'SMS sent'
        : priorRow.channel === 'phone'
        ? 'Call logged'
        : 'Internal note added';
    await logActivity({
      lead_id: priorRow.lead_id,
      type,
      title,
      description,
      metadata: {
        message_id: messageId,
        channel: priorRow.channel,
        provider: opts.provider ?? null,
        provider_message_id: opts.provider_message_id ?? null,
      },
      created_by: actorId,
    });
  }
}
