-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase: mail_item_status enum hardening
-- Idempotent. Non-destructive.
--
-- Production's public.mail_items.status is backed by a Postgres ENUM type named
-- `mail_item_status` (the admin dropdown 500'd with "invalid input value for
-- enum mail_item_status…"). The enum was missing some labels the app uses
-- (e.g. held / shredded). This adds every required label if, and only if, the
-- enum type exists — so it is a no-op on environments where status is a plain
-- text + CHECK column (as the repo's 001/011 define it).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  required text[] := ARRAY['received','notified','scanned','held','forwarded','picked_up','shredded'];
  label    text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mail_item_status') THEN
    FOREACH label IN ARRAY required LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'mail_item_status'::regtype
          AND enumlabel = label
      ) THEN
        EXECUTE format('ALTER TYPE mail_item_status ADD VALUE %L', label);
      END IF;
    END LOOP;
  END IF;
END $$;

-- Refresh PostgREST's schema cache so new enum values are accepted immediately.
notify pgrst, 'reload schema';
