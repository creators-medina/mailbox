-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 4c: Mail intake basics
-- Idempotent. Safe to run on top of 001/003/011. Adds no destructive changes.
--
-- NOTE ON STATUS VALUES:
--   mail_items.status keeps its existing CHECK set defined in 001/011:
--     received, notified, scanned, held, forwarded, picked_up, shredded
--   mail_requests.status keeps: pending, in_progress, completed, cancelled
--   mail_requests.request_type keeps: scan, forward, pickup, shred, hold
--   We intentionally do NOT introduce scan_requested/forward_requested/etc.,
--   which would violate the existing constraint and break inserts in prod.
-- ─────────────────────────────────────────────────────────────────────────────

-- Optional carrier/USPS tracking number for forwarded or tracked mail.
alter table public.mail_items
  add column if not exists tracking_number text;

-- Helpful indexes for admin filtering by status.
create index if not exists mail_items_status_idx     on public.mail_items(status);
create index if not exists mail_requests_status_idx   on public.mail_requests(status);

-- RLS is already enabled and policied in 001; re-assert enablement idempotently.
alter table public.mail_items    enable row level security;
alter table public.mail_requests enable row level security;

-- Refresh PostgREST's schema cache so the new column is visible immediately.
notify pgrst, 'reload schema';
