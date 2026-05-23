# My Biz Address — Pre-Launch Checklist

Everything that still needs an external account (domain, Stripe, phone,
DNS) lives here. Work top to bottom. See `docs/env-vars.md` for the exact
variable names and `docs/form-1583-implementation.md` for the compliance
build-out.

---

## 1. Domain

- [ ] Purchase / finalize the production domain.
- [ ] Add it to Vercel → Project → Settings → Domains.
- [ ] Point DNS (A / CNAME) per Vercel's instructions; wait for SSL to provision.
- [ ] Set `NEXT_PUBLIC_BASE_URL` to `https://<domain>` and redeploy.
- [ ] Decide the canonical brand/domain: the site is branded **My Biz Address**
      but the current email domain is **mybizmailbox.biz**. Align metadata,
      `lib/config/business.ts` (`websiteUrl`), and email addresses once decided.

## 2. Stripe

- [ ] Create the Stripe account; complete business verification; switch to **live** mode.
- [ ] Create 4 products/prices and copy their price IDs into env:
  - [ ] Business Address — $29.99/mo → `STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY`
  - [ ] Mail Scanning — $9.99/mo → `STRIPE_PRICE_MAIL_SCANNING_MONTHLY`
  - [ ] Business Phone — $9.99/mo → `STRIPE_PRICE_BUSINESS_PHONE_MONTHLY`
  - [ ] Google Business Setup — $49.99 one-time → `STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME`
- [ ] Set `STRIPE_SECRET_KEY`.
- [ ] Create a webhook endpoint → `https://<domain>/api/stripe/webhook`, subscribe to:
      `checkout.session.completed`, `customer.subscription.created`,
      `customer.subscription.updated`, `customer.subscription.deleted`.
- [ ] Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
- [ ] Enable + configure the **Customer Portal** (used by the account billing button).
- [ ] Test a real checkout with a live card (or test mode first) end-to-end.

## 3. Resend / email domain

- [ ] Verify the sending domain in Resend (SPF/DKIM DNS records).
- [ ] Confirm `RESEND_API_KEY` is set (already used by the contact form).
- [ ] Set `CRM_FROM_EMAIL` to an address on the verified domain.
- [ ] Confirm `CONTACT_TO_EMAIL` points to the correct inbox.
- [ ] Optionally set `CRM_REPLY_TO`.
- [ ] Send a test contact-form submission and a test CRM email; confirm delivery + reply-to.

## 4. Google Workspace / business email

- [ ] Create/confirm mailboxes: general (`info@…`), privacy/support (`support@…`).
- [ ] Make sure both inboxes referenced in the Privacy Policy and Terms are monitored.
- [ ] Set up Google Business Profile for the Rockwall location (separate from the customer add-on).

## 5. Supabase migrations

Apply in order in the SQL editor (all idempotent):
- [ ] `001_initial_schema.sql` … `003_mail_operations.sql`
- [ ] `005_crm_pipelines.sql`
- [ ] `006_crm_leads.sql`
- [ ] `007_crm_activity_layer.sql`
- [ ] `008_crm_communication_infrastructure.sql`
- [ ] `009_crm_email_templates.sql`
- [ ] `010_crm_rls.sql` — **re-run after 009** so RLS covers `crm_message_templates`.
- [ ] Create Storage buckets `mail-envelopes` and `mail-scans` + their RLS policies (see `supabase/storage-setup.md`).
- [ ] Verify with the anon key that `crm_leads` returns `[]` (RLS working).

## 6. Vercel env vars

- [ ] Set all ✅ "required now" vars (see `docs/env-vars.md`).
- [ ] Set 🟡 Stripe vars after section 2.
- [ ] Set 🌐 domain vars after section 1.
- [ ] Redeploy after any change.

## 7. USPS Form 1583 (compliance — required to legally receive mail)

- [ ] Confirm your CMRA registration with USPS for the Rockwall location.
- [ ] Apply migration `013_compliance_form_1583.sql` (creates
      `public.customer_compliance`). Migrations are **not** auto-applied — run it
      manually in Supabase.
- [ ] Decide the interim process for collecting signed Form 1583 + two IDs
      (in-person notarization or remote online notarization) — document upload is
      not yet in-app.
- [ ] Staff workflow (Phase 5a, shipped): on `/admin/customers/[id]` set the
      Form 1583 and Photo ID statuses; both `verified` stamps `verified_at` and
      the customer dashboard reflects it.
- [ ] Mail intake (`/admin/mail/upload`) flags each customer ✓/⚠ — **do not
      process mail until the customer shows ✓ verified.** Intake is not yet hard
      blocked in code.
- [ ] See `docs/form-1583-implementation.md` for the remaining build-out
      (document storage, e-sign, hard blocking, notifications, audit trail).

## 8. Smoke test (after domain + Stripe live)

- [ ] Home page loads; footer links (Privacy, Terms, Contact, Sign in, Get your address) all resolve.
- [ ] `/signup` → choose plan + add-ons → Stripe checkout → pay → redirected to `/success`.
- [ ] Webhook fires → customer + subscription rows created in Supabase; suite number assigned.
- [ ] Invite email arrives → set password → `/login` → customer lands on `/account`; admin/staff land on `/admin`.
- [ ] `/account` shows suite, address, subscription add-ons, the Mail authorization card reflecting real compliance status, billing-portal button.
- [ ] Public contact form → email delivered → lead appears on CRM board.
- [ ] CRM: open a lead → send a template email → arrives; notes/tasks/activity all work.
- [ ] Orphan account (no customer row) → sees "not connected to a mailbox plan" page.
- [ ] `/sitemap.xml` and `/robots.txt` resolve.
