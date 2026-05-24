-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 5i: Launch schema hardening
-- Idempotent. Non-destructive. Aligns repo migrations with columns the app
-- relies on that were previously only present in production (schema drift).
--
-- The app reads/writes customers.email (account lookup, admin requests/queue,
-- mail notifications, add-on + compliance routes) and tolerates customers.user_id
-- (account customer resolution). Neither was defined in 001/011, so a fresh
-- database built from migrations would be missing them.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customers add column if not exists email   text;
alter table public.customers add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Case-insensitive-ish lookup support (account resolution does ilike on email).
create index if not exists customers_email_idx   on public.customers(lower(email));
create index if not exists customers_user_id_idx on public.customers(user_id);

-- Refresh PostgREST's schema cache so the columns are visible immediately.
notify pgrst, 'reload schema';
