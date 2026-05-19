# My Biz Address — Launch Checklist

Follow these steps in order before going live.

---

## A. Supabase

1. Create a new Supabase project at supabase.com.
2. Copy the project URL and anon key from **Project Settings → API**.
3. Copy the service role key (keep secret — never expose client-side).
4. Add to Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Run migrations in order using the Supabase SQL editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_email_to_profiles.sql`
   - `supabase/migrations/003_mail_operations.sql`
6. Confirm tables exist: `profiles`, `customers`, `subscriptions`, `mail_items`, `mail_requests`.
7. Create storage buckets in **Storage**:
   - `mail-envelopes` — private
   - `mail-scans` — private
8. Apply RLS policies (see `supabase/storage-setup.md`).
9. Create the first admin user:
   - Go to **Authentication → Users → Invite user**, enter your email.
   - Accept the invite and set a password.
   - Run this SQL to grant admin role:
     ```sql
     UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
     ```

---

## B. Stripe

1. In the Stripe dashboard, create four products:

   | Product | Type | Price |
   |---------|------|-------|
   | Business Address | Recurring monthly | $29.99/mo |
   | Mail Scanning | Recurring monthly | $9.99/mo |
   | Business Phone Number | Recurring monthly | $9.99/mo |
   | Google Business Profile Setup | One-time | $49.99 |

2. Copy each price ID and add to Vercel env vars:
   - `STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY`
   - `STRIPE_PRICE_MAIL_SCANNING_MONTHLY`
   - `STRIPE_PRICE_BUSINESS_PHONE_MONTHLY`
   - `STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME`

3. Add secret and publishable keys:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

4. Configure the **Customer Portal** (Stripe dashboard → Billing → Customer portal):
   - Enable subscription cancellation.
   - Enable payment method updates.
   - Set business name and branding.

5. Create a webhook endpoint pointing to:
   ```
   https://yourdomain.com/api/stripe/webhook
   ```
   Listen for these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

6. Copy the webhook signing secret and add to Vercel:
   - `STRIPE_WEBHOOK_SECRET`

---

## C. Email (Resend)

1. Create a Resend account at resend.com.
2. Add and verify your sending domain.
3. Copy the API key and add to Vercel:
   - `RESEND_API_KEY`
4. Set the contact form destination:
   - `CONTACT_TO_EMAIL` (defaults to `isabelle@bomacnation.com` if unset)
5. In Supabase **Authentication → Email Templates**, configure the invite email to match your brand.

---

## D. Vercel

1. Connect the GitHub repo to a new Vercel project.
2. Set the framework preset to **Next.js**.
3. Add all environment variables listed in `.env.local.example`.
4. Set `NEXT_PUBLIC_BASE_URL` to your production domain (e.g. `https://mybizmailbox.biz`).
5. Deploy to production.
6. Confirm custom domain is configured and DNS is pointing correctly.
7. Enable **Analytics** (optional) and add `NEXT_PUBLIC_GA_ID` if using Google Analytics.

---

## E. Manual Test Flow

Run through this end-to-end in production (use Stripe test mode first):

1. Visit the homepage — confirm all sections load, no broken links.
2. Click **Get Started** — confirm it goes to `/signup`.
3. Fill in the signup form and click **Continue to checkout**.
4. Complete Stripe test checkout (use card `4242 4242 4242 4242`).
5. Confirm redirect to `/success`.
6. Check Supabase:
   - `profiles` row created with correct email, name, business name.
   - `customers` row created with suite number and address.
   - `subscriptions` row created with `status = active`.
7. Check email — confirm invite email was received.
8. Click invite link → set password → log in.
9. Confirm `/account` dashboard shows suite number, address, and subscription.
10. In Supabase, run `UPDATE profiles SET role = 'admin' WHERE email = '...'`.
11. Navigate to `/admin` — confirm overview loads.
12. Upload a mail envelope scan in **Admin → Upload Mail**.
13. Assign the mail item to the test customer's suite.
14. Return to `/account` — confirm mail item appears in the inbox.
15. Click **Request action** on the mail item — submit a request.
16. In `/admin/requests` — update the request status.
17. Back in `/account` — confirm request status updated.
18. Click **Manage billing** in the account dashboard — confirm Stripe portal opens.
19. Cancel the test subscription in the portal.
20. Confirm `customers.status` updates to `cancelled` in Supabase after webhook fires.

---

## F. Go-Live Checklist

- [ ] All Supabase migrations run
- [ ] Storage buckets created with correct RLS policies
- [ ] First admin user created
- [ ] All four Stripe products and prices created
- [ ] Stripe Customer Portal configured
- [ ] Stripe webhook endpoint live and verified
- [ ] All Vercel env vars set (no blanks)
- [ ] `NEXT_PUBLIC_BASE_URL` matches production domain
- [ ] Custom domain resolves with HTTPS
- [ ] End-to-end test flow completed
- [ ] Stripe switched from test mode to live mode
- [ ] Resend domain verified (or SMTP configured)
- [ ] Contact form sends correctly to `CONTACT_TO_EMAIL`
- [ ] `lib/config/business.ts` contains correct address, phone, email, hours
