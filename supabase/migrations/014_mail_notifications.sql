-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 5b: Mail event notification de-duplication stamps
-- Idempotent. Non-destructive. Adds nullable timestamp columns only.
--
-- These columns prevent duplicate transactional emails: a notification is only
-- sent when the relevant *_email_sent_at is null, and is stamped after a
-- successful send.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.mail_items
  add column if not exists received_email_sent_at   timestamptz,
  add column if not exists scan_ready_email_sent_at timestamptz;

alter table public.mail_requests
  add column if not exists last_status_email_sent_at timestamptz;

-- Partial indexes to cheaply find rows still awaiting their first notification.
create index if not exists mail_items_received_email_pending_idx
  on public.mail_items(id) where received_email_sent_at is null;
create index if not exists mail_items_scan_email_pending_idx
  on public.mail_items(id) where scan_ready_email_sent_at is null;

-- Refresh PostgREST's schema cache so the new columns are visible immediately.
notify pgrst, 'reload schema';
