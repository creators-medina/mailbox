-- Add email to profiles so the Stripe webhook can look up existing users
-- without a full auth.users table scan.
alter table public.profiles
  add column if not exists email text unique;

create index if not exists profiles_email_idx on public.profiles(email);
