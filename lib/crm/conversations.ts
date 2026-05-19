import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { Channel, Conversation, ConversationStatus } from './types';

export async function listConversationsForLead(
  leadId: string,
  opts: { status?: ConversationStatus | 'any' } = {},
): Promise<Conversation[]> {
  const admin = createAdminClientAny();
  let q = admin
    .from('crm_conversations')
    .select('*')
    .eq('lead_id', leadId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (opts.status && opts.status !== 'any') q = q.eq('status', opts.status);
  const { data } = await q;
  return (data ?? []) as Conversation[];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as Conversation | null) ?? null;
}

export async function createConversation(input: {
  lead_id: string;
  channel: Channel;
  subject?: string | null;
  status?: ConversationStatus;
  created_by?: string | null;
}): Promise<Conversation | null> {
  const admin = createAdminClientAny();
  const { data, error } = await admin
    .from('crm_conversations')
    .insert({
      lead_id: input.lead_id,
      channel: input.channel,
      subject: input.subject ?? null,
      status: input.status ?? 'open',
      created_by: input.created_by ?? null,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[crm.createConversation]', error);
    return null;
  }
  return data as Conversation;
}

// Reuse the most recent open conversation for (lead, channel), or create a
// new one. This is the canonical entry point for outbound senders that
// don't already know which thread they belong to (e.g. ad-hoc email or
// internal call log).
export async function ensureConversationForLead(input: {
  lead_id: string;
  channel: Channel;
  subject?: string | null;
  created_by?: string | null;
}): Promise<Conversation | null> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_conversations')
    .select('*')
    .eq('lead_id', input.lead_id)
    .eq('channel', input.channel)
    .eq('status', 'open')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return data as Conversation;
  return createConversation(input);
}

// Bump last_message_at when a new message lands. Called by createMessage().
export async function updateConversationLastMessage(
  conversationId: string,
  whenIso: string,
): Promise<void> {
  const admin = createAdminClientAny();
  const { error } = await admin
    .from('crm_conversations')
    .update({ last_message_at: whenIso })
    .eq('id', conversationId);
  if (error) console.error('[crm.updateConversationLastMessage]', error);
}

export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
): Promise<void> {
  const admin = createAdminClientAny();
  const { error } = await admin
    .from('crm_conversations')
    .update({ status })
    .eq('id', conversationId);
  if (error) console.error('[crm.updateConversationStatus]', error);
}
