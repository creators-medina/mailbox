-- ─────────────────────────────────────────────────────────────────────────────
-- My Biz Address — Initial Schema
-- Apply with: supabase db push  (or paste into Supabase SQL editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: auto-update updated_at ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  business_name   text,
  phone           text,
  role            text not null default 'customer' check (role in ('customer', 'admin')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── customers ────────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id    text unique,
  status                text not null default 'pending' check (status in ('pending','active','cancelled','suspended')),
  suite_number          text,
  business_address_line text,
  forwarding_address    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists customers_profile_id_idx on public.customers(profile_id);
create index if not exists customers_stripe_customer_id_idx on public.customers(stripe_customer_id);

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ── subscriptions ─────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                              uuid primary key default gen_random_uuid(),
  customer_id                     uuid not null references public.customers(id) on delete cascade,
  stripe_subscription_id          text unique,
  status                          text not null check (status in ('active','past_due','cancelled','trialing','unpaid')),
  base_plan                       text not null default 'business_address',
  mail_scanning_enabled           boolean not null default false,
  business_phone_enabled          boolean not null default false,
  google_business_setup_purchased boolean not null default false,
  current_period_end              timestamptz,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists subscriptions_customer_id_idx on public.subscriptions(customer_id);
create index if not exists subscriptions_stripe_id_idx on public.subscriptions(stripe_subscription_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ── mail_items ────────────────────────────────────────────────────────────────
create table if not exists public.mail_items (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references public.customers(id) on delete cascade,
  sender                text,
  envelope_image_url    text,
  scanned_document_url  text,
  status                text not null default 'received'
                          check (status in ('received','notified','scanned','held','forwarded','picked_up','shredded')),
  received_at           timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists mail_items_customer_id_idx on public.mail_items(customer_id);
create index if not exists mail_items_received_at_idx on public.mail_items(received_at desc);

create trigger mail_items_updated_at
  before update on public.mail_items
  for each row execute function public.set_updated_at();

-- ── mail_requests ──────────────────────────────────────────────────────────────
create table if not exists public.mail_requests (
  id            uuid primary key default gen_random_uuid(),
  mail_item_id  uuid not null references public.mail_items(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  request_type  text not null check (request_type in ('scan','forward','pickup','shred','hold')),
  status        text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists mail_requests_customer_id_idx on public.mail_requests(customer_id);
create index if not exists mail_requests_mail_item_id_idx on public.mail_requests(mail_item_id);

create trigger mail_requests_updated_at
  before update on public.mail_requests
  for each row execute function public.set_updated_at();

-- ── admin_notes ───────────────────────────────────────────────────────────────
create table if not exists public.admin_notes (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  mail_item_id  uuid references public.mail_items(id) on delete set null,
  note          text not null,
  created_at    timestamptz not null default now()
);

create index if not exists admin_notes_customer_id_idx on public.admin_notes(customer_id);

-- ── contact_submissions ───────────────────────────────────────────────────────
create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles           enable row level security;
alter table public.customers          enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.mail_items         enable row level security;
alter table public.mail_requests      enable row level security;
alter table public.admin_notes        enable row level security;
alter table public.contact_submissions enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── profiles policies ─────────────────────────────────────────────────────────
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'customer'); -- users cannot self-elevate

create policy "Admins can manage all profiles"
  on public.profiles for all
  using (public.is_admin());

-- ── customers policies ────────────────────────────────────────────────────────
create policy "Customers can read own record"
  on public.customers for select
  using (profile_id = auth.uid() or public.is_admin());

create policy "Admins can manage all customers"
  on public.customers for all
  using (public.is_admin());

-- ── subscriptions policies ────────────────────────────────────────────────────
create policy "Customers can read own subscriptions"
  on public.subscriptions for select
  using (
    exists (
      select 1 from public.customers c
      where c.id = subscriptions.customer_id and c.profile_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Admins can manage all subscriptions"
  on public.subscriptions for all
  using (public.is_admin());

-- ── mail_items policies ───────────────────────────────────────────────────────
create policy "Customers can read own mail"
  on public.mail_items for select
  using (
    exists (
      select 1 from public.customers c
      where c.id = mail_items.customer_id and c.profile_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Admins can manage all mail items"
  on public.mail_items for all
  using (public.is_admin());

-- ── mail_requests policies ────────────────────────────────────────────────────
create policy "Customers can read own mail requests"
  on public.mail_requests for select
  using (customer_id in (
    select id from public.customers where profile_id = auth.uid()
  ) or public.is_admin());

create policy "Customers can create mail requests for own mail"
  on public.mail_requests for insert
  with check (
    customer_id in (select id from public.customers where profile_id = auth.uid())
    and mail_item_id in (select id from public.mail_items where customer_id in (
      select id from public.customers where profile_id = auth.uid()
    ))
  );

create policy "Admins can manage all mail requests"
  on public.mail_requests for all
  using (public.is_admin());

-- ── admin_notes policies ──────────────────────────────────────────────────────
create policy "Admins only"
  on public.admin_notes for all
  using (public.is_admin());

-- ── contact_submissions policies ──────────────────────────────────────────────
create policy "Public insert only"
  on public.contact_submissions for insert
  with check (true);

-- No select policy for contact_submissions — only service role can read them.
