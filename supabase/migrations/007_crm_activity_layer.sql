-- ─────────────────────────────────────────────────────────────────────────────
-- CRM Phase 2 — activities, tasks, comments
-- Apply after 006_crm_leads.sql.
--
-- These three tables form the operational layer that future automations,
-- timers, sequences, and AI features will hook into. The activities table
-- is the universal event log; every important mutation should append to it.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── crm_activities ──────────────────────────────────────────────────────────
-- Append-only timeline. Type is left as text so the application is free
-- to introduce new event kinds without a migration; consumers should
-- treat unknown types as generic events rather than failing.
create table if not exists public.crm_activities (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.crm_leads(id) on delete cascade,
  type        text not null,
  title       text not null,
  description text,
  metadata    jsonb not null default '{}'::jsonb,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists crm_activities_lead_created_idx
  on public.crm_activities(lead_id, created_at desc);
create index if not exists crm_activities_type_idx
  on public.crm_activities(type);

-- ── crm_tasks ───────────────────────────────────────────────────────────────
create table if not exists public.crm_tasks (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.crm_leads(id) on delete cascade,
  assigned_to  uuid references auth.users(id) on delete set null,
  title        text not null,
  description  text,
  due_at       timestamptz,
  completed_at timestamptz,
  priority     text not null default 'medium'
               check (priority in ('low', 'medium', 'high', 'urgent')),
  order_index  integer not null default 0,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists crm_tasks_updated_at on public.crm_tasks;
create trigger crm_tasks_updated_at
  before update on public.crm_tasks
  for each row execute function public.set_updated_at();

create index if not exists crm_tasks_lead_idx          on public.crm_tasks(lead_id);
create index if not exists crm_tasks_assigned_idx      on public.crm_tasks(assigned_to);
create index if not exists crm_tasks_due_idx           on public.crm_tasks(due_at);
create index if not exists crm_tasks_lead_order_idx    on public.crm_tasks(lead_id, order_index);
create index if not exists crm_tasks_open_idx          on public.crm_tasks(lead_id) where completed_at is null;

-- ── crm_comments ────────────────────────────────────────────────────────────
-- Threaded notes / discussion. Distinct from crm_leads.notes which remains
-- as a short "summary" field; comments are the conversational layer.
create table if not exists public.crm_comments (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.crm_leads(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists crm_comments_updated_at on public.crm_comments;
create trigger crm_comments_updated_at
  before update on public.crm_comments
  for each row execute function public.set_updated_at();

create index if not exists crm_comments_lead_idx
  on public.crm_comments(lead_id, created_at desc);
