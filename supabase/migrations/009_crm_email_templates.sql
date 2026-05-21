-- ─────────────────────────────────────────────────────────────────────────────
-- CRM 5D — reusable message templates.
-- Apply after 008_crm_communication_infrastructure.sql.
--
-- Channel-agnostic by design (default 'email'); SMS/other channels can reuse
-- the same table later. Body supports {{variable}} placeholders that the
-- composer resolves against the lead before sending.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.crm_message_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  channel     text not null default 'email'
              check (channel in ('email', 'sms', 'internal')),
  subject     text,
  body        text not null,
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists crm_message_templates_updated_at on public.crm_message_templates;
create trigger crm_message_templates_updated_at
  before update on public.crm_message_templates
  for each row execute function public.set_updated_at();

create index if not exists crm_message_templates_active_idx
  on public.crm_message_templates(is_active);
create index if not exists crm_message_templates_channel_idx
  on public.crm_message_templates(channel);

-- ── Seed starter templates only if the table is empty ───────────────────────
do $$
begin
  if not exists (select 1 from public.crm_message_templates) then
    insert into public.crm_message_templates (name, channel, subject, body) values
      (
        'First response',
        'email',
        'Thanks for reaching out to My Biz Address',
        E'Hi {{first_name}},\n\nThanks for getting in touch with My Biz Address! I''d love to help you get set up with a professional business address and mailbox.\n\nIs there a good time today or tomorrow for a quick call? In the meantime, feel free to reply here with any questions.\n\nTalk soon,\nThe My Biz Address Team'
      ),
      (
        'Follow-up',
        'email',
        'Following up on your My Biz Address inquiry',
        E'Hi {{first_name}},\n\nJust circling back on your inquiry about a business address with My Biz Address. Did you have any questions I can answer?\n\nHappy to walk you through the options whenever you''re ready.\n\nBest,\nThe My Biz Address Team'
      ),
      (
        'Signup link',
        'email',
        'Your My Biz Address signup link',
        E'Hi {{first_name}},\n\nGreat talking with you! You can complete your signup here:\n\nhttps://mybizmailbox.biz/signup\n\nOnce you''re set up we''ll assign your suite number and get your mail handling started right away. Reply here if you hit any snags.\n\nWelcome aboard,\nThe My Biz Address Team'
      ),
      (
        'No response follow-up',
        'email',
        'Still interested in a business address?',
        E'Hi {{first_name}},\n\nI haven''t heard back, so I wanted to check in one more time. If now isn''t the right moment, no problem at all — just let me know and I''ll close this out.\n\nIf you''re still interested, I''m here to help whenever you''re ready.\n\nBest,\nThe My Biz Address Team'
      );
  end if;
end$$;
