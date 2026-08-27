-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 8b: mailbox-owned operational identity
-- Idempotent. Additive. Non-destructive. Drops nothing, moves nothing.
--
-- WHY
-- ───
-- Until now the business name displayed for a mailbox lived on
-- public.profiles.business_name. `profiles` is 1:1 with auth.users, so a single
-- person could only ever have ONE business name. The moment one billing person
-- controls two suites, editing "the business name of Suite 123" necessarily
-- rewrites Suite 122 as well — they are the same column in the same row.
--
-- This migration gives each mailbox (one row in public.customers) its own
-- operational identity, independent of the person who pays and independent of
-- every other mailbox. Nothing here touches Stripe columns:
-- customers.stripe_customer_id, customers.status and subscriptions.* are
-- deliberately untouched.
--
-- OWNERSHIP AFTER THIS MIGRATION
--   profiles.business_name   → legacy; read-only fallback, still populated by
--                              the Stripe webhook for the FIRST mailbox.
--   customers.business_name  → authoritative operational business name for
--                              THIS mailbox/suite.
--   customers.email          → unchanged. Still the account-link / notification
--                              email used by customer resolution. NOT edited by
--                              the admin mailbox editor.
--   customers.contact_email  → new. Optional operational contact for this
--                              mailbox. Display-only in this phase; it never
--                              affects login or billing.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customers
  add column if not exists business_name  text,
  add column if not exists recipient_name text,
  add column if not exists contact_email  text,
  add column if not exists contact_phone  text;

-- ── Backfill ─────────────────────────────────────────────────────────────────
-- Copy the person-level values down onto their mailbox so existing customers
-- render identically after the read path switches over. Only fills NULLs, so
-- re-running never overwrites an admin's edit.
update public.customers c
set business_name = p.business_name
from public.profiles p
where c.profile_id = p.id
  and c.business_name is null
  and nullif(btrim(p.business_name), '') is not null;

update public.customers c
set recipient_name = p.full_name
from public.profiles p
where c.profile_id = p.id
  and c.recipient_name is null
  and nullif(btrim(p.full_name), '') is not null;

update public.customers c
set contact_phone = p.phone
from public.profiles p
where c.profile_id = p.id
  and c.contact_phone is null
  and nullif(btrim(p.phone), '') is not null;

-- contact_email prefers the mailbox's existing notification email, then the
-- person's login email. customers.email itself is left exactly as it was.
update public.customers c
set contact_email = coalesce(nullif(btrim(c.email), ''), nullif(btrim(p.email), ''))
from public.profiles p
where c.profile_id = p.id
  and c.contact_email is null
  and coalesce(nullif(btrim(c.email), ''), nullif(btrim(p.email), '')) is not null;

-- ── Indexes ──────────────────────────────────────────────────────────────────
-- Admin customer search filters on business name.
create index if not exists customers_business_name_idx on public.customers(lower(business_name));

-- ── Suite uniqueness ─────────────────────────────────────────────────────────
-- Duplicate suites were only ever prevented in application code
-- (app/api/admin/customers/[id]/suite/route.ts), never by the database, and
-- lib/mailbox/suite.ts assigns numbers with no concurrency protection. Add the
-- real constraint — but NEVER fail a deploy over pre-existing production data.
-- If duplicates already exist the index is skipped and a warning naming them is
-- raised, so staff can reconcile and re-run this migration.
DO $$
DECLARE
  dupes text;
BEGIN
  SELECT string_agg(suite_number, ', ')
    INTO dupes
    FROM (
      SELECT suite_number
        FROM public.customers
       WHERE nullif(btrim(suite_number), '') IS NOT NULL
       GROUP BY suite_number
      HAVING count(*) > 1
    ) d;

  IF dupes IS NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS customers_suite_number_key
      ON public.customers(suite_number)
      WHERE nullif(btrim(suite_number), '') IS NOT NULL;
  ELSE
    RAISE WARNING
      'customers_suite_number_key NOT created — duplicate suite numbers present: %. Reconcile them and re-run this migration.',
      dupes;
  END IF;
END $$;

-- Refresh PostgREST's schema cache so the new columns are visible immediately.
notify pgrst, 'reload schema';
