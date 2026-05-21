-- ─────────────────────────────────────────────────────────────────────────────
-- Launch Phase 1 — secure all CRM tables with Row-Level Security.
-- Apply after 008 (and 009 if present). Idempotent + defensive: only touches
-- CRM tables that actually exist, so it's safe whether or not CRM-5D's
-- crm_message_templates (009) has been applied yet.
--
-- Why this exists: CRM tables created in 005–009 never had RLS enabled.
-- In Supabase, a public-schema table without RLS is reachable by the anon
-- key (which ships in the browser bundle), exposing lead/customer PII and
-- message bodies. This migration locks every CRM table down to admin/staff
-- only. The app's server routes use the service-role key, which bypasses RLS,
-- so application behavior is unchanged. The public contact form also writes
-- leads via the service role, so anonymous lead creation keeps working.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Widen is_admin() to include staff. SECURITY DEFINER + stable, same as the
--    original definition in 001; CRM management is delegated to staff too.
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

-- 2) Enable RLS + an admin/staff "for all" policy on each CRM table that
--    exists. Policies are dropped first so the migration can be re-run safely.
do $$
declare
  t text;
  crm_tables text[] := array[
    'crm_pipelines',
    'crm_stages',
    'crm_leads',
    'crm_activities',
    'crm_tasks',
    'crm_comments',
    'crm_conversations',
    'crm_messages',
    'crm_message_attachments',
    'crm_message_templates'
  ];
begin
  foreach t in array crm_tables loop
    -- Skip tables that don't exist yet (e.g. crm_message_templates before 009).
    if to_regclass(format('public.%I', t)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security;', t);
    -- Belt-and-suspenders: also force RLS so even the table owner is subject
    -- to it (the service role bypasses RLS regardless of this).
    execute format('alter table public.%I force row level security;', t);

    execute format('drop policy if exists "crm_staff_all_%1$s" on public.%1$s;', t);
    execute format(
      'create policy "crm_staff_all_%1$s" on public.%1$s '
      || 'for all to authenticated '
      || 'using (public.is_admin()) '
      || 'with check (public.is_admin());',
      t
    );
  end loop;
end$$;
