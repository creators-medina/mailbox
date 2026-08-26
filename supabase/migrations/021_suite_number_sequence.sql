-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 2: race-free suite number assignment
-- Idempotent. Additive. Non-destructive. Writes no rows in public.customers.
--
-- WHY
-- ───
-- lib/mailbox/suite.ts assigned suite numbers by reading existing rows, taking
-- the maximum, and adding one. Two problems, both live:
--
--   1. No concurrency protection. Two Stripe webhooks arriving together both
--      read the same maximum and both hand out the same suite number.
--   2. The read was capped at 200 rows with no ordering, so past 200 customers
--      the "maximum" was computed from an arbitrary subset and numbering could
--      silently restart over numbers already in use.
--
-- A Postgres sequence fixes both: nextval() is atomic under concurrency by
-- design and never returns the same value twice, and it needs no table scan.
--
-- WHAT THIS DOES NOT DO
-- ─────────────────────
-- It does not rename, reassign, or renumber any existing suite. It does not
-- touch customers, profiles, subscriptions, mail, or compliance. It does not
-- add a constraint that could fail against existing production data. Existing
-- suite numbers — MB… and Suite… alike — are read only to seed the counter.
-- ─────────────────────────────────────────────────────────────────────────────

create sequence if not exists public.suite_number_seq as bigint;

-- ── Seed the counter above every suite number already in use ─────────────────
-- Monotonic and therefore safe to re-run: the sequence is only ever moved
-- FORWARD, to the greatest of (highest existing suite, current sequence value,
-- 1000). It can never be rewound to hand out a number a second time.
--
-- 1000 is the floor because lib/config/business.ts sets suiteStartNum = 1001,
-- and setval(..., n, true) makes the next nextval() return n + 1. On an empty
-- database the first assignment is therefore MB1001 — identical to the previous
-- behaviour.
--
-- The digit bound in the pattern is deliberate: an unbounded [0-9]+ could match
-- a malformed value long enough to overflow the bigint cast and abort the
-- migration. Values that long are not real suite numbers, so skipping them is
-- both safe and correct.
DO $$
DECLARE
  max_existing bigint;
  current_val  bigint;
BEGIN
  SELECT coalesce(max(substring(suite_number from '^MB([0-9]{1,15})$')::bigint), 0)
    INTO max_existing
    FROM public.customers
   WHERE suite_number ~ '^MB[0-9]{1,15}$';

  SELECT coalesce(last_value, 0) INTO current_val FROM public.suite_number_seq;

  PERFORM setval('public.suite_number_seq', greatest(max_existing, current_val, 1000), true);

  RAISE NOTICE 'suite_number_seq seeded to % (highest existing MB suite: %)',
    greatest(max_existing, current_val, 1000), max_existing;
END $$;

-- ── RPC used by lib/mailbox/suite.ts ─────────────────────────────────────────
-- PostgREST cannot call nextval() directly, so it is exposed as a function.
-- security definer so it runs with the sequence owner's rights; the search_path
-- is pinned so the definer context cannot be redirected at call time.
create or replace function public.next_suite_number()
returns bigint
language sql
security definer
set search_path = public, pg_temp
as $$
  select nextval('public.suite_number_seq');
$$;

-- Only the server may draw a suite number. Revoking the default PUBLIC grant
-- stops an anonymous caller from burning sequence values through the REST API.
revoke all on function public.next_suite_number() from public;
revoke all on function public.next_suite_number() from anon, authenticated;
grant execute on function public.next_suite_number() to service_role;

-- Refresh PostgREST's schema cache so the function is callable immediately.
notify pgrst, 'reload schema';
