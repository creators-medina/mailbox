# USPS Form 1583 — Implementation Plan

## Phase 5a (shipped) — manual staff-managed status tracking

A real compliance record now exists and is tracked end to end, but the process
is **manual**: staff collect Form 1583 + photo ID out of band (in person or via
remote online notarization) and record the verification status in the admin UI.
No documents are uploaded or stored in-app yet, and mail intake is **not hard
blocked** — it shows a strong warning and the customer's verification status.

What 5a added:

- **Table `public.customer_compliance`** (migration `013_compliance_form_1583.sql`):
  one row per customer with `form_1583_status` and `photo_id_status`
  (`pending | requested | received | verified | rejected`), `verified_at`,
  `verified_by`, `notes`, timestamps, `unique(customer_id)`, indexes,
  `set_updated_at` trigger, and RLS (customer reads own; admin/staff manage all).
- **API `PATCH /api/admin/customers/[id]/compliance`** — admin/staff only,
  validates statuses, upserts the row, and stamps `verified_at`/`verified_by`
  when **both** statuses are `verified`.
- **Admin customer detail** (`/admin/customers/[id]`) — a "Mail authorization
  (Form 1583)" card with two status selects, internal notes, save, and a
  verified-on / verified-by readout.
- **Customer dashboard** (`/account`) — the "Mail authorization" card and the
  getting-started checklist read the real statuses. Copy says *"Mail can be
  received after your authorization is verified."* and only shows "verified"
  when both statuses are `verified`.
- **Mail intake** (`/admin/mail/upload`) — the customer dropdown flags verified
  (✓) vs not (⚠), shows the selected customer's status inline, and a strong
  warning to confirm before processing. Intake is not blocked in code.

Still manual / still TODO (see full build-out below): document + ID upload and
private storage, e-sign / notarization integration, hard-blocking mail intake
until verified, customer-facing upload flow, status-change notifications, and
an audit trail.

---

## What Form 1583 requires (business rules)

- Every customer must submit a completed, signed USPS Form 1583.
- Two forms of ID, at least one government-issued photo ID.
- The form must be notarized or verified per USPS CMRA rules.
- Mail acceptance/release is **blocked** until verification is complete.
- Records must be retained per USPS requirements and produced on request.

## Proposed schema (new migration, e.g. `011_form_1583.sql`)

```sql
create table if not exists public.compliance_form_1583 (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending','submitted','verified','rejected','expired')),
  full_legal_name   text,
  home_address      text,
  id_primary_type   text,   -- e.g. 'drivers_license', 'passport'
  id_secondary_type text,
  notarized         boolean not null default false,
  notarized_at      timestamptz,
  verified_by       uuid references auth.users(id) on delete set null,
  verified_at       timestamptz,
  rejection_reason  text,
  form_storage_path text,   -- signed PDF in private bucket
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.compliance_form_1583_documents (
  id              uuid primary key default gen_random_uuid(),
  form_id         uuid not null references public.compliance_form_1583(id) on delete cascade,
  doc_type        text not null,  -- 'signed_form','id_primary','id_secondary'
  storage_bucket  text not null,
  storage_path    text not null,
  file_name       text,
  mime_type       text,
  byte_size       bigint,
  created_at      timestamptz not null default now()
);
```

- Add a `set_updated_at` trigger on `compliance_form_1583`.
- Add indexes on `customer_id` and `status`.
- **RLS:** customers can read/insert their own form rows; staff/admin manage all
  (mirror the pattern in `010_crm_rls.sql` using `public.is_admin()` + a
  `customer_id -> profiles.id` ownership check like the existing
  `mail_items`/`mail_requests` policies in `001_initial_schema.sql`).

## Storage bucket (private)

- New bucket **`compliance-1583`** (private; signed-URL access only).
  - Allowed MIME: `application/pdf`, `image/jpeg`, `image/png`.
  - Max size ~25 MB.
  - Holds the signed form PDF and ID images. **Sensitive PII — never public.**
- Add it alongside `mail-envelopes` / `mail-scans` in `supabase/storage-setup.md`,
  with SELECT/INSERT policies restricting access to the owning customer and admins.

## App surface to build later

- **Customer:** a `/account/compliance` flow to upload/sign the form + IDs; the
  existing "Mail authorization" card links here and reflects live `status`.
- **Admin:** a `/admin/compliance` queue to review submissions, mark
  verified/rejected, and view documents via signed URLs. Block mail
  acceptance in the mail intake UI until `status = 'verified'`.
- **Integration option:** a remote-online-notarization / e-sign provider
  (e.g. an esignature API) — out of scope tonight; evaluate during the build.
- **Activity:** log status transitions (`submitted`, `verified`, `rejected`)
  so there's an audit trail.

## Acceptance criteria for the future phase

- [ ] Customer can submit form + two IDs; sees clear status.
- [ ] Staff can verify/reject with a reason; customer is notified.
- [ ] Mail intake blocks acceptance until verified.
- [ ] All documents stored privately; access via signed URLs only; RLS enforced.
- [ ] Status changes are auditable.
- [ ] Legal review of the collected fields + retention policy.
