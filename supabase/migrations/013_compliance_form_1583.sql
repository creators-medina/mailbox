-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 5a: Form 1583 / compliance workflow
-- Idempotent. Safe to run on top of 001–012. Non-destructive.
--
-- Tracks the manual, staff-managed USPS Form 1583 + photo ID verification that
-- must be completed before mail handling proceeds. One row per customer.
--
-- Allowed statuses (both columns): pending, requested, received, verified, rejected
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.customer_compliance (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers(id) on delete cascade,
  form_1583_status  text not null default 'pending'
                      check (form_1583_status in ('pending','requested','received','verified','rejected')),
  photo_id_status   text not null default 'pending'
                      check (photo_id_status in ('pending','requested','received','verified','rejected')),
  verified_at       timestamptz,
  verified_by       uuid references auth.users(id) on delete set null,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (customer_id)
);

-- In case the table already exists from a partial apply, ensure columns/constraint.
alter table public.customer_compliance add column if not exists form_1583_status text not null default 'pending';
alter table public.customer_compliance add column if not exists photo_id_status  text not null default 'pending';
alter table public.customer_compliance add column if not exists verified_at      timestamptz;
alter table public.customer_compliance add column if not exists verified_by      uuid references auth.users(id) on delete set null;
alter table public.customer_compliance add column if not exists notes            text;
alter table public.customer_compliance add column if not exists created_at       timestamptz not null default now();
alter table public.customer_compliance add column if not exists updated_at       timestamptz not null default now();

create index if not exists customer_compliance_customer_id_idx on public.customer_compliance(customer_id);
create index if not exists customer_compliance_form_1583_idx   on public.customer_compliance(form_1583_status);

-- updated_at trigger (public.set_updated_at defined in 001).
drop trigger if exists customer_compliance_updated_at on public.customer_compliance;
create trigger customer_compliance_updated_at
  before update on public.customer_compliance
  for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.customer_compliance enable row level security;

-- Customers can read their own compliance row; admin/staff can read all.
drop policy if exists "Customers can read own compliance" on public.customer_compliance;
create policy "Customers can read own compliance"
  on public.customer_compliance for select
  using (
    exists (
      select 1 from public.customers c
      where c.id = customer_compliance.customer_id and c.profile_id = auth.uid()
    )
    or public.is_admin()
  );

-- Only admin/staff may create/update/delete compliance rows.
drop policy if exists "Admins can manage all compliance" on public.customer_compliance;
create policy "Admins can manage all compliance"
  on public.customer_compliance for all
  using (public.is_admin())
  with check (public.is_admin());

-- Refresh PostgREST's schema cache so the new table is visible immediately.
notify pgrst, 'reload schema';
