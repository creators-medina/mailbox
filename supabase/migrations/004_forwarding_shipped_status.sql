-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Phase 3G-3: add 'shipped' to mail_requests status enum
-- Required for the forwarding workflow: pending → in_progress → shipped → completed
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.mail_requests
  drop constraint if exists mail_requests_status_check;

alter table public.mail_requests
  add constraint mail_requests_status_check
  check (status in ('pending','in_progress','shipped','completed','cancelled'));
