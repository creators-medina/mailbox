# Launch Smoke Test & Final Checklist

Run end-to-end against production after deploy. Check each box.

## 0. Pre-flight configuration
- [ ] **Vercel env vars** set (see `docs/production-env-vars.md`); `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_BASE_URL` both = `https://www.mybizaddress.co`.
- [ ] **Supabase migrations applied** in order: `011` → `012` → `013` → `014` → `015`. (Migrations are NOT auto-applied; run them manually in the Supabase SQL editor.)
- [ ] **Storage buckets** exist and are **private**: `mail-envelope-images`, `mail-scans` (RLS per `supabase/storage-setup.md`).
- [ ] **Stripe webhook** endpoint points to `/api/stripe/webhook` with the signing secret in `STRIPE_WEBHOOK_SECRET`; events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`.
- [ ] **Stripe price IDs** set for base + 3 add-ons.
- [ ] **Resend** sending domain verified; `RESEND_FROM_EMAIL` uses that domain.
- [ ] **Supabase Auth → URL config**: Site URL + redirect URLs include `https://www.mybizaddress.co/auth/callback` and `/auth/reset-password`.

## 1. Customer signup → live payment
- [ ] `/signup` → choose plan + add-ons → Stripe Checkout → pay with a **real card** (low-risk live test).
- [ ] Redirect to `/success`.
- [ ] Webhook provisions: `profiles`, `customers` (suite assigned, status active), `subscriptions` (flags match add-ons).
- [ ] Onboarding email arrives (branded, link = `https://www.mybizaddress.co/...`, NOT a vercel URL, NOT `/admin`).

## 2. Password setup → login
- [ ] Click "Set Your Password" → `/auth/reset-password` → set password → land on `/account`.
- [ ] Sign out, sign back in via `/login`.

## 3. Customer dashboard
- [ ] `/account` shows suite, full address (copy works), getting-started checklist, subscription + add-on states, mail authorization card.
- [ ] Inactive add-ons show purchase buttons; active ones show Active/Purchased.

## 4. Add-on purchase test
- [ ] Click "Add Mail Scanning" → Stripe Checkout → pay → returns to `/account?billing=success`.
- [ ] After webhook: flag flips to Active, button gone, single subscriptions row remains.
- [ ] Cancel checkout once → `/account?billing=cancelled` banner, no change.

## 5. Admin mail upload test
- [ ] As admin/staff, `/admin/mail/upload` → select a verified customer → upload envelope image + scan PDF → success.
- [ ] `/admin/mail` shows the item; "View envelope"/"View scan" open signed URLs.

## 6. Customer mail + request test
- [ ] Customer `/account` inbox shows the item with View envelope; status badge.
- [ ] No scan → Request scan/Forward/Hold/Shred; with scan → View scan + Forward/Hold/Shred.
- [ ] Submit a request → "Request pending: …"; duplicate blocked (API 409).
- [ ] `/admin/requests` shows it (suite, customer, type, status); change status → customer gets "request updated" email.

## 7. Compliance request email test
- [ ] `/admin/customers/[id]` → Compliance → "Send authorization request" → customer receives branded email; CTA → `/account`.
- [ ] Pending statuses move to `requested`; verified/rejected/received untouched.
- [ ] Set both statuses to verified → customer dashboard shows verified; mail handling cleared.

## 8. Security spot checks
- [ ] View page source / network on `/account` — no service-role key, no Stripe/Resend secret, no raw storage paths.
- [ ] Logged-out `/account` → `/login`; customer hitting `/admin/*` → redirected.
- [ ] Cross-customer: a second customer can't see the first's mail or compliance.
