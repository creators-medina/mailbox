import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { Task } from './types';

export async function listTasks(leadId: string): Promise<Task[]> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_tasks')
    .select('*')
    .eq('lead_id', leadId)
    .order('completed_at', { ascending: true, nullsFirst: true })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });
  return (data ?? []) as Task[];
}

export async function createTask(input: {
  lead_id: string;
  title: string;
  description?: string | null;
  due_at?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string | null;
  created_by?: string | null;
}): Promise<Task | null> {
  const admin = createAdminClientAny();

  const { data: maxRow } = await admin
    .from('crm_tasks')
    .select('order_index')
    .eq('lead_id', input.lead_id)
    .is('completed_at', null)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder =
    ((maxRow as { order_index: number } | null)?.order_index ?? -1) + 1;

  const { data, error } = await admin
    .from('crm_tasks')
    .insert({
      lead_id: input.lead_id,
      title: input.title,
      description: input.description ?? null,
      due_at: input.due_at ?? null,
      priority: input.priority ?? 'medium',
      assigned_to: input.assigned_to ?? null,
      created_by: input.created_by ?? null,
      order_index: nextOrder,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[crm.createTask]', error);
    return null;
  }
  return data as Task;
}
