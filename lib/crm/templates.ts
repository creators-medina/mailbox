import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { MessageTemplate } from './types';

export async function listTemplates(
  opts: { channel?: string; activeOnly?: boolean } = {},
): Promise<MessageTemplate[]> {
  const admin = createAdminClientAny();
  let q = admin
    .from('crm_message_templates')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });
  if (opts.channel) q = q.eq('channel', opts.channel);
  if (opts.activeOnly) q = q.eq('is_active', true);
  const { data } = await q;
  return (data ?? []) as MessageTemplate[];
}

export async function getTemplate(id: string): Promise<MessageTemplate | null> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_message_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as MessageTemplate | null) ?? null;
}

export async function createTemplate(input: {
  name: string;
  channel?: 'email' | 'sms' | 'internal';
  subject?: string | null;
  body: string;
  created_by?: string | null;
}): Promise<MessageTemplate | null> {
  const admin = createAdminClientAny();
  const { data, error } = await admin
    .from('crm_message_templates')
    .insert({
      name: input.name,
      channel: input.channel ?? 'email',
      subject: input.subject ?? null,
      body: input.body,
      created_by: input.created_by ?? null,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[crm.createTemplate]', error);
    return null;
  }
  return data as MessageTemplate;
}
