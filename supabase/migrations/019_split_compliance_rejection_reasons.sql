-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 7c.1: split compliance rejection reasons
-- Idempotent. Non-destructive.
--
-- The single rejected_reason column was shared between Form 1583 and Photo ID,
-- so rejecting one document overwrote the other. Add per-document columns and
-- keep the legacy `rejected_reason` as a read-only fallback for any rows
-- written before this migration.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customer_compliance
  add column if not exists form_1583_rejected_reason text,
  add column if not exists photo_id_rejected_reason  text;

notify pgrst, 'reload schema';
