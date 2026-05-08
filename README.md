# My Biz Address — Marketing Website

Production Next.js 14 site for **My Biz Address**, a virtual mailbox and professional business address service at 802 North Goliad Street, Rockwall, TX 75087.

---

## Quick start

```bash
cp .env.local.example .env.local
# fill in all values (see below)
npm install
npm run dev
```

Visit `http://localhost:3000`.

---

## Backend Setup

### Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Copy your project URL and keys from **Settings → API**.
3. Add the values to `.env.local` (see Environment Variables below).
4. Apply the database migrations:
   ```bash
   # Option A — Supabase CLI
   supabase link --project-ref <your-project-ref>
   supabase db push

   # Option B — Supabase SQL editor
   # Paste the contents of supabase/migrations/001_initial_schema.sql
   ```
5. Set up storage buckets by following `supabase/storage-setup.md`.

> **Note:** Replace `types/database.ts` with generated types once your schema is stable:
> ```bash
> supabase gen types typescript --project-id <ref> > types/database.ts
> ```

### Stripe Webhook Setup

The webhook endpoint is `/api/stripe/webhook` and handles subscription lifecycle.

**Handled events:**
- `checkout.session.completed` — creates profile/customer/subscription in Supabase
- `customer.subscription.created` — syncs subscription status
- `customer.subscription.updated` — syncs status and renewal date
- `customer.subscription.deleted` — marks subscription and customer as cancelled

**Local testing with Stripe CLI:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook signing secret printed by the CLI into STRIPE_WEBHOOK_SECRET
```

**Vercel production webhook:**
1. Go to Stripe dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://mybizmailbox.biz/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.*`
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel env vars

**Customer account creation behavior:**
- When `checkout.session.completed` fires, the webhook calls `supabase.auth.admin.inviteUserByEmail(email)` if the customer does not yet have a Supabase account.
- The customer receives an email with a magic link to set their password.
- If the customer already has a Supabase account (signed up before checkout), their existing account is linked automatically.
- The `profiles` table stores email as a unique index for O(1) lookup during webhook processing.

**Suite number assignment:**
- Suite numbers are assigned sequentially: `MB1001`, `MB1002`, etc.
- Assignment happens in `lib/mailbox/suite.ts` on first checkout.
- **MVP limitation:** No concurrency protection. For production under heavy load, replace with a Postgres sequence.

### Stripe
2. Create four products:
   - **Business Address** — $29.99/month (recurring) → `STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY`
   - **Mail Scanning** — $9.99/month (recurring) → `STRIPE_PRICE_MAIL_SCANNING_MONTHLY`
   - **Business Phone Number** — $9.99/month (recurring) → `STRIPE_PRICE_BUSINESS_PHONE_MONTHLY`
   - **Google Business Profile Setup** — $49.99 one-time → `STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME`
     *(Must be type `one_time`, not recurring, for `add_invoice_items` to work)*
3. Copy each Price ID (`price_…`) into `.env.local`.
4. Set `NEXT_PUBLIC_BASE_URL` to your production domain (e.g. `https://mybizmailbox.biz`).
5. **Phase 4:** Add a Stripe webhook endpoint at `/api/webhooks/stripe` for subscription lifecycle events.

---

## Environment Variables

### Supabase

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — safe for the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **server-only, never expose to client** |

### Stripe

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Secret key from Stripe dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (Phase 4) |
| `NEXT_PUBLIC_BASE_URL` | Base URL for success/cancel redirect (e.g. `https://mybizmailbox.biz`) |
| `STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY` | Price ID — $29.99/mo base plan |
| `STRIPE_PRICE_MAIL_SCANNING_MONTHLY` | Price ID — $9.99/mo add-on |
| `STRIPE_PRICE_BUSINESS_PHONE_MONTHLY` | Price ID — $9.99/mo add-on |
| `STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME` | Price ID — $49.99 one-time add-on |

### Email / Analytics

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from resend.com |
| `CONTACT_EMAIL` | Receives contact form submissions |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 Measurement ID (e.g. `G-XXXXXXXXXX`) |

---

## Project Structure

```
app/
  page.tsx          — Public marketing homepage
  signup/           — Plan selection + Stripe checkout entry
  login/            — Auth (sign in / sign up / password reset)
  account/          — Protected customer dashboard (Phase 4)
  success/          — Post-checkout confirmation
  cancel/           — Checkout cancelled
  api/
    checkout/       — Stripe Checkout session creation
    contact/        — Contact form (Resend)
lib/
  stripe.ts         — Stripe server helper
  supabase/
    client.ts       — Browser Supabase client
    server.ts       — Server Supabase client (cookie-based)
    admin.ts        — Service role client (server-only)
types/
  database.ts       — Supabase Database type (replace with generated)
supabase/
  migrations/       — SQL migrations
  storage-setup.md  — Storage bucket setup instructions
components/
  Nav.tsx           — Site navigation
  Tiles.tsx         — ProductTile, FeatureGrid, Footer
  PricingSection.tsx
  ContactForm.tsx
```

---

## Phase Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Done | Public marketing site, dark premium redesign |
| 2 | ✅ Done | Stripe checkout flow, `/signup` page |
| 3 | ✅ Done | Supabase foundation, auth pages, DB schema, RLS |
| 4 | ✅ Done | Stripe webhooks, customer creation, mail inbox dashboard |
| 5 | Pending | Admin CRM, mail item management, scan uploads, billing portal |

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import at [vercel.com/new](https://vercel.com/new) — Next.js is auto-detected via `vercel.json`.
3. Add all environment variables in Vercel project settings.
4. Set your custom domain `mybizmailbox.biz` under **Domains**.
