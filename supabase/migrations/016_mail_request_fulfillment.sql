-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 5j: Mail request fulfillment
-- Idempotent. Non-destructive.
--
-- mail_requests already has: status, request_type, notes (customer note),
-- admin_notes (internal staff note), completed_at, created_at, updated_at,
-- last_status_email_sent_at. This adds a customer-visible response and the
-- staff member who completed the request.
--
-- Status set is unchanged: pending, in_progress, completed, cancelled.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.mail_requests
  add column if not exists customer_response text,
  add column if not exists completed_by      uuid references auth.users(id) on delete set null;

-- Refresh PostgREST's schema cache so the columns are visible immediately.
notify pgrst, 'reload schema';
