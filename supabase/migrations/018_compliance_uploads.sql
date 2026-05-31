-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 7a: compliance document upload foundation
-- Idempotent. Non-destructive.
--
-- Adds storage-path and review-tracking columns to customer_compliance so
-- customers can upload USPS Form 1583 + a photo ID, and staff can verify or
-- reject with a reason. The actual files live in the private
-- `compliance-documents` storage bucket (see supabase/storage-setup.md).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.customer_compliance
  add column if not exists form_1583_file_path     text,
  add column if not exists photo_id_file_path      text,
  add column if not exists form_1583_uploaded_at   timestamptz,
  add column if not exists photo_id_uploaded_at    timestamptz,
  add column if not exists rejected_reason         text,
  add column if not exists reviewed_at             timestamptz,
  add column if not exists reviewed_by             uuid references auth.users(id) on delete set null;

-- Useful indexes for admin filtering by status. customer_id is already indexed
-- (013); the status indexes help the "pending review" queue once it exists.
create index if not exists customer_compliance_form_1583_status_idx on public.customer_compliance(form_1583_status);
create index if not exists customer_compliance_photo_id_status_idx  on public.customer_compliance(photo_id_status);

-- Refresh PostgREST's schema cache so the new columns are visible immediately.
notify pgrst, 'reload schema';
