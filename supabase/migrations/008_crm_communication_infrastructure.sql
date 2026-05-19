-- ─────────────────────────────────────────────────────────────────────────────
-- CRM 5A — Communication infrastructure.
-- Apply after 007_crm_activity_layer.sql.
--
-- Provider-agnostic message + conversation layer. No sending happens here;
-- this exists so CRM-5B (email), CRM-5C (SMS), and any future channel
-- (push, voice, fax, in-app) can write to the same tables. The crm_messages
-- table is the universal envelope; provider-specific adapters fill in
-- `provider`, `provider_message_id`, and `metadata` as appropriate.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── crm_conversations ───────────────────────────────────────────────────────
-- One conversation per (lead, channel, thread). For email this typically
-- maps to a Message-Id thread; for SMS to a phone number pair; for internal
-- notes/calls it's a free-form bucket the staff member creates.
create table if not exists public.crm_conversations (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid not null references public.crm_leads(id) on delete cascade,
  channel         text not null
                  check (channel in ('email', 'sms', 'internal', 'phone', 'system')),
  subject         text,
  status          text not null default 'open'
                  check (status in ('open', 'closed', 'archived')),
  last_message_at timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists crm_conversations_updated_at on public.crm_conversations;
create trigger crm_conversations_updated_at
  before update on public.crm_conversations
  for each row execute function public.set_updated_at();

create index if not exists crm_conversations_lead_idx     on public.crm_conversations(lead_id);
create index if not exists crm_conversations_status_idx   on public.crm_conversations(status);
create index if not exists crm_conversations_lead_last_idx
  on public.crm_conversations(lead_id, last_message_at desc nulls last);

-- ── crm_messages ────────────────────────────────────────────────────────────
-- A single message in a conversation. lead_id is duplicated for query
-- speed (timeline views fetch by lead, not by conversation).
create table if not exists public.crm_messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.crm_conversations(id) on delete cascade,
  lead_id             uuid not null references public.crm_leads(id)        on delete cascade,
  channel             text not null
                      check (channel in ('email', 'sms', 'internal', 'phone', 'system')),
  direction           text not null
                      check (direction in ('inbound', 'outbound', 'internal', 'system')),
  subject             text,
  body                text,
  body_html           text,
  from_address        text,
  to_address          text,
  cc_addresses        text[] not null default '{}',
  bcc_addresses       text[] not null default '{}',
  provider            text,
  provider_message_id text,
  delivery_status     text not null default 'draft'
                      check (delivery_status in (
                        'draft', 'queued', 'sent', 'delivered', 'failed',
                        'bounced', 'opened', 'clicked', 'received'
                      )),
  error_message       text,
  metadata            jsonb not null default '{}'::jsonb,
  sent_by             uuid references auth.users(id) on delete set null,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists crm_messages_updated_at on public.crm_messages;
create trigger crm_messages_updated_at
  before update on public.crm_messages
  for each row execute function public.set_updated_at();

create index if not exists crm_messages_conversation_idx
  on public.crm_messages(conversation_id, created_at asc);
create index if not exists crm_messages_lead_idx
  on public.crm_messages(lead_id, created_at desc);
create index if not exists crm_messages_created_idx
  on public.crm_messages(created_at desc);
create index if not exists crm_messages_delivery_idx
  on public.crm_messages(delivery_status);
-- Look up an inbound webhook by provider id quickly. Allows duplicate ids
-- across different providers (rare) so it's a regular index, not unique.
create index if not exists crm_messages_provider_msgid_idx
  on public.crm_messages(provider_message_id) where provider_message_id is not null;

-- ── crm_message_attachments ─────────────────────────────────────────────────
-- Points at Supabase Storage. The bucket + path pair is enough to resolve
-- a signed URL on demand.
create table if not exists public.crm_message_attachments (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references public.crm_messages(id) on delete cascade,
  storage_bucket  text not null,
  storage_path    text not null,
  file_name       text not null,
  mime_type       text,
  byte_size       bigint,
  created_at      timestamptz not null default now()
);

create index if not exists crm_message_attachments_message_idx
  on public.crm_message_attachments(message_id);
