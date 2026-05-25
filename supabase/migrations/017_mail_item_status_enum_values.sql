-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — mail_item_status alignment
-- Idempotent. Non-destructive.
--
-- Production's public.mail_items.status is a Postgres ENUM `mail_item_status`
-- whose values are: received, scanned, awaiting_action, forwarded, picked_up,
-- shredded. This migration ensures `awaiting_action` exists (the only value the
-- app might be missing) WITHOUT adding `notified` or `held`.
--
-- For dev/repo databases where status is a plain text + CHECK column, it aligns
-- the CHECK to the same six values so both environments accept the same set.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enum case: add `awaiting_action` if the enum exists and lacks it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mail_item_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumtypid = 'mail_item_status'::regtype AND enumlabel = 'awaiting_action'
    ) THEN
      ALTER TYPE mail_item_status ADD VALUE 'awaiting_action';
    END IF;
  END IF;
END $$;

-- Text + CHECK case (repo schema): align the constraint to the six values.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mail_items'
      AND column_name = 'status' AND data_type IN ('text', 'character varying')
  ) THEN
    ALTER TABLE public.mail_items DROP CONSTRAINT IF EXISTS mail_items_status_check;
    ALTER TABLE public.mail_items
      ADD CONSTRAINT mail_items_status_check
      CHECK (status IN ('received','scanned','awaiting_action','forwarded','picked_up','shredded'));
  END IF;
END $$;

-- Refresh PostgREST's schema cache.
notify pgrst, 'reload schema';
