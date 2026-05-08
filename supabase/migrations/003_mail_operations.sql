-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 5: Mail operations columns
-- Apply after 001_initial_schema.sql and 002_add_email_to_profiles.sql
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.mail_items
  add column if not exists title          text,
  add column if not exists recipient_name text,
  add column if not exists notes          text,
  add column if not exists created_by     uuid references auth.users(id) on delete set null;

create index if not exists mail_items_created_by_idx on public.mail_items(created_by);

alter table public.mail_requests
  add column if not exists completed_at  timestamptz,
  add column if not exists admin_notes   text;
