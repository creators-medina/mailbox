-- ─────────────────────────────────────────────────────────────────────────────
-- CRM Phase 0 — editable pipelines + stages
-- Apply after 001_initial_schema.sql .. 003_mail_operations.sql
-- (Skips 004 if not present; see feature branch for forwarding migration.)
-- ─────────────────────────────────────────────────────────────────────────────

-- Allow 'staff' alongside existing customer/admin so CRM management can be
-- delegated without granting full admin.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'admin', 'staff'));

-- ── crm_pipelines ────────────────────────────────────────────────────────────
create table if not exists public.crm_pipelines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  is_default  boolean not null default false,
  is_archived boolean not null default false,
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists crm_pipelines_updated_at on public.crm_pipelines;
create trigger crm_pipelines_updated_at
  before update on public.crm_pipelines
  for each row execute function public.set_updated_at();

create index if not exists crm_pipelines_order_idx
  on public.crm_pipelines(order_index);
create index if not exists crm_pipelines_archived_idx
  on public.crm_pipelines(is_archived);

-- At most one default pipeline at a time.
create unique index if not exists crm_pipelines_one_default_idx
  on public.crm_pipelines(is_default) where is_default = true;

-- ── crm_stages ───────────────────────────────────────────────────────────────
create table if not exists public.crm_stages (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.crm_pipelines(id) on delete cascade,
  name        text not null,
  slug        text not null,
  color       text not null default '#6B7280',
  order_index integer not null default 0,
  is_closed   boolean not null default false,
  close_type  text check (close_type in ('won', 'lost') or close_type is null),
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (pipeline_id, slug)
);

drop trigger if exists crm_stages_updated_at on public.crm_stages;
create trigger crm_stages_updated_at
  before update on public.crm_stages
  for each row execute function public.set_updated_at();

create index if not exists crm_stages_pipeline_order_idx
  on public.crm_stages(pipeline_id, order_index);
create index if not exists crm_stages_archived_idx
  on public.crm_stages(is_archived);

-- ── Seed default pipeline only if no pipelines exist yet ─────────────────────
do $$
declare
  pipe_id uuid;
begin
  if not exists (select 1 from public.crm_pipelines) then
    insert into public.crm_pipelines (name, slug, description, is_default, order_index)
    values (
      'Sales Pipeline',
      'sales-pipeline',
      'Default pipeline for inbound mailbox leads.',
      true,
      0
    )
    returning id into pipe_id;

    insert into public.crm_stages
      (pipeline_id, name, slug, color, order_index, is_closed, close_type)
    values
      (pipe_id, 'New Inquiry',           'new-inquiry',           '#3B82F6', 0, false, null),
      (pipe_id, 'Contacted',             'contacted',             '#8B5CF6', 1, false, null),
      (pipe_id, 'Qualified',             'qualified',             '#EAB308', 2, false, null),
      (pipe_id, 'Sent Signup Link',      'sent-signup-link',      '#F97316', 3, false, null),
      (pipe_id, 'Customer Onboarded',    'customer-onboarded',    '#10B981', 4, true,  'won'),
      (pipe_id, 'Lost / Not Interested', 'lost-not-interested',   '#EF4444', 5, true,  'lost');
  end if;
end$$;
