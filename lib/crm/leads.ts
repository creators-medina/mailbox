import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { logLeadCreated } from './activity';
import type { Lead } from './types';

export async function listLeadsForPipeline(
  pipelineId: string,
  includeArchived = false,
): Promise<Lead[]> {
  const admin = createAdminClientAny();
  let q = admin
    .from('crm_leads')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (!includeArchived) q = q.eq('archived', false);
  const { data } = await q;
  return (data ?? []) as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('crm_leads')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return (data as Lead | null) ?? null;
}

// Create a lead at the end of `stageId`. Caller resolves the destination
// pipeline + stage (e.g. the default pipeline's first active stage). Pass
// `actor_id` to attribute the resulting `lead_created` activity to a staff
// user; defaults to null for anonymous submissions like the contact form.
export async function createLead(input: {
  pipeline_id: string;
  stage_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string;
  notes?: string | null;
  tags?: string[];
  raw_submission?: unknown;
  actor_id?: string | null;
}): Promise<Lead | null> {
  const admin = createAdminClientAny();

  const { data: maxRow } = await admin
    .from('crm_leads')
    .select('order_index')
    .eq('stage_id', input.stage_id)
    .eq('archived', false)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder =
    ((maxRow as { order_index: number } | null)?.order_index ?? -1) + 1;

  const { data, error } = await admin
    .from('crm_leads')
    .insert({
      pipeline_id: input.pipeline_id,
      stage_id: input.stage_id,
      first_name: input.first_name ?? null,
      last_name: input.last_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: input.source ?? 'manual',
      notes: input.notes ?? null,
      tags: input.tags ?? [],
      raw_submission: input.raw_submission ?? null,
      order_index: nextOrder,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[crm.createLead]', error);
    return null;
  }
  const lead = data as Lead;
  await logLeadCreated(lead.id, lead.source, input.actor_id ?? null);
  return lead;
}

// Resolve a (pipeline, stage) pair to drop a new lead into.
// Picks the default pipeline (or any active one) and its first active stage.
export async function resolveDefaultDestination(): Promise<
  { pipeline_id: string; stage_id: string } | null
> {
  const admin = createAdminClientAny();

  // Prefer the explicit default.
  const { data: def } = await admin
    .from('crm_pipelines')
    .select('id')
    .eq('is_default', true)
    .eq('is_archived', false)
    .maybeSingle();

  let pipelineId = (def as { id: string } | null)?.id ?? null;

  // Fall back to any active pipeline ordered by order_index.
  if (!pipelineId) {
    const { data: any } = await admin
      .from('crm_pipelines')
      .select('id')
      .eq('is_archived', false)
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle();
    pipelineId = (any as { id: string } | null)?.id ?? null;
  }

  if (!pipelineId) return null;

  const { data: stage } = await admin
    .from('crm_stages')
    .select('id')
    .eq('pipeline_id', pipelineId)
    .eq('is_archived', false)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle();

  const stageId = (stage as { id: string } | null)?.id ?? null;
  if (!stageId) return null;

  return { pipeline_id: pipelineId, stage_id: stageId };
}
