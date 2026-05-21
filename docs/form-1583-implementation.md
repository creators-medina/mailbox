# USPS Form 1583 — Implementation Plan

**Status today:** customer-facing *explanation* only. The signup flow, the
`/success` page, and the `/account` "Mail authorization" card all tell the
customer a signed Form 1583 + photo ID are required before mail can be
received. There is **no upload / e-sign / verification workflow yet**, and no
data is collected. Until that ships, collect 1583s through an interim manual
process (in-person or remote online notarization) and do not accept mail
without a verified form on file.

This doc specifies the full build-out so it can be implemented as one clean
phase later. It was intentionally **not** built tonight because it touches
legal/compliance and ID storage and deserves a focused, reviewed pass.

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
