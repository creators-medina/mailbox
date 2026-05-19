import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { Comment } from './types';

export async function listComments(leadId: string): Promise<Comment[]> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_comments')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Comment[];
}

export async function createComment(input: {
  lead_id: string;
  user_id: string | null;
  body: string;
}): Promise<Comment | null> {
  const admin = createAdminClientAny();
  const { data, error } = await admin
    .from('crm_comments')
    .insert({
      lead_id: input.lead_id,
      user_id: input.user_id,
      body: input.body,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[crm.createComment]', error);
    return null;
  }
  return data as Comment;
}
