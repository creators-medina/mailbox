import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { Pipeline, Stage } from './types';

// All pipelines ordered by (is_archived asc, order_index asc) — active first.
export async function listPipelines(includeArchived = true): Promise<Pipeline[]> {
  const admin = createAdminClientAny();
  let q = admin
    .from('crm_pipelines')
    .select('*')
    .order('is_archived', { ascending: true })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (!includeArchived) q = q.eq('is_archived', false);
  const { data } = await q;
  return (data ?? []) as Pipeline[];
}

export async function getPipeline(id: string): Promise<Pipeline | null> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_pipelines')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as Pipeline | null) ?? null;
}

export async function getDefaultPipeline(): Promise<Pipeline | null> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_pipelines')
    .select('*')
    .eq('is_default', true)
    .eq('is_archived', false)
    .maybeSingle();
  return (data as Pipeline | null) ?? null;
}

export async function listStages(
  pipelineId: string,
  includeArchived = true,
): Promise<Stage[]> {
  const admin = createAdminClientAny();
  let q = admin
    .from('crm_stages')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('is_archived', { ascending: true })
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (!includeArchived) q = q.eq('is_archived', false);
  const { data } = await q;
  return (data ?? []) as Stage[];
}
