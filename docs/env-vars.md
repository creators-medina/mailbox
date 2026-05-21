# Environment Variables

Set these in Vercel → Project → Settings → Environment Variables (and in
`.env.local` for local dev). **Never commit real secret values.** This file
lists names and purposes only.

Legend: ✅ set now · 🟡 after Stripe account is live · 🌐 after final domain ·
⚪ optional later.

## ✅ Required now (works without domain/Stripe/phone)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public). CRM tables are RLS-protected (migration 010), so this is safe to expose. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Used by API routes, the Stripe webhook, and CRM writes. **Never expose to the browser.** |
| `RESEND_API_KEY` | Server-only. Powers the public contact form and CRM email sending. |
| `CONTACT_TO_EMAIL` | Where contact-form submissions are delivered. Defaults to `isabelle@bomacnation.com` if unset — confirm the right recipient. |

## 🟡 Required after the Stripe account is finalized

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-only. Creates checkout + billing-portal sessions. |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures. From the webhook endpoint you create in the Stripe dashboard. |
| `STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY` | Price ID — base plan ($29.99/mo). |
| `STRIPE_PRICE_MAIL_SCANNING_MONTHLY` | Price ID — mail scanning add-on ($9.99/mo). |
| `STRIPE_PRICE_BUSINESS_PHONE_MONTHLY` | Price ID — business phone add-on ($9.99/mo). |
| `STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME` | Price ID — Google Business setup ($49.99 one-time). |

> Until these are set, `/signup` checkout returns a clear "Checkout is not
> configured" message (503) — no broken UX, just no payments yet.

## 🌐 Required after the final domain is chosen

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | Public site origin (e.g. `https://yourdomain.com`). Used for Stripe success/cancel + billing-portal return URLs. Set to the Vercel preview URL for now if testing checkout before the domain is live. |
| `CRM_FROM_EMAIL` | "From" address for CRM outbound email (default: `My Biz Address <contact@mybizmailbox.biz>`). Must be on a Resend-verified sending domain. |
| `CRM_REPLY_TO` | Optional reply-to header on CRM emails. |

## ⚪ Optional / later

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 Measurement ID. |
| `CONTACT_EMAIL` | Legacy fallback for `CONTACT_TO_EMAIL` (back-compat only). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Declared in `.env.local.example` but **not used in code** (checkout is Stripe-hosted). Safe to omit. |

## Notes
- Anything prefixed `NEXT_PUBLIC_` is bundled into the browser — never put a secret there.
- After changing env vars in Vercel, redeploy for them to take effect.
- SMS/Twilio variables are intentionally **not** listed — phone/SMS is a later phase.
