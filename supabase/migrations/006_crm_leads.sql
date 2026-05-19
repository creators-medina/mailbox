-- ─────────────────────────────────────────────────────────────────────────────
-- CRM Phase 1 — crm_leads (cards on the Kanban board)
-- Apply after 005_crm_pipelines.sql.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.crm_leads (
  id              uuid primary key default gen_random_uuid(),
  pipeline_id     uuid not null references public.crm_pipelines(id) on delete cascade,
  stage_id        uuid not null references public.crm_stages(id)    on delete restrict,
  first_name      text,
  last_name       text,
  email           text,
  phone           text,
  source          text not null default 'manual',
  status          text not null default 'new',
  tags            text[] not null default '{}',
  notes           text,
  raw_submission  jsonb,
  assigned_to     uuid references auth.users(id) on delete set null,
  order_index     integer not null default 0,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists crm_leads_updated_at on public.crm_leads;
create trigger crm_leads_updated_at
  before update on public.crm_leads
  for each row execute function public.set_updated_at();

create index if not exists crm_leads_pipeline_idx       on public.crm_leads(pipeline_id);
create index if not exists crm_leads_stage_idx          on public.crm_leads(stage_id);
create index if not exists crm_leads_archived_idx       on public.crm_leads(archived);
create index if not exists crm_leads_stage_order_idx    on public.crm_leads(stage_id, order_index);
create index if not exists crm_leads_assigned_idx       on public.crm_leads(assigned_to);
create index if not exists crm_leads_created_idx        on public.crm_leads(created_at desc);
