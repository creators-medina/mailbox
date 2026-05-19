# My Biz Address — QA Test Plan

Use Stripe test mode for all payment-related tests.
Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

---

## 1. Homepage CTAs

| Test | Expected |
|------|----------|
| Click **Get Started** (hero) | Navigates to `/signup` |
| Click **See pricing** | Scrolls to pricing section |
| Click **Contact** nav link | Scrolls to contact form |
| Click **Sign in** nav link | Navigates to `/login` |
| Submit contact form with valid data | Success message shown, email received at `CONTACT_TO_EMAIL` (defaults to `isabelle@bomacnation.com`) |
| Submit contact form with missing fields | Validation error shown, no email sent |
| All footer links | No broken 404s |

---

## 2. Signup page

| Test | Expected |
|------|----------|
| Load `/signup` | Form renders with base plan ($29.99/mo) pre-selected |
| Toggle Mail Scanning add-on | Monthly total increases to $39.98/mo |
| Toggle Business Phone add-on | Monthly total increases to $39.98/mo |
| Toggle Google Business Setup add-on | One-time fee of $49.99 appears |
| Select all three add-ons | Monthly total = $49.97/mo, one-time = $49.99 |
| Submit form with missing required fields | Browser validation prevents submit |
| Submit valid form | Redirects to Stripe checkout |
| Stripe checkout URL includes correct metadata | Verify in Stripe dashboard: `customer_name`, `business_name`, `addon_*` fields |

---

## 3. Stripe checkout

| Test | Expected |
|------|----------|
| Complete payment with test card | Redirects to `/success` |
| Click cancel / back in Stripe checkout | Redirects to `/cancel` |
| `/cancel` page | Shows "No worries" message and link back to `/signup` |
| `/success` page | Shows confirmation steps and sign-in link |

---

## 4. Webhook fulfillment

After a completed checkout, verify in Supabase:

| Check | Expected |
|-------|----------|
| `profiles` row | `email`, `full_name`, `business_name`, `role = 'customer'` |
| `customers` row | `suite_number` assigned (e.g. `MB1001`), `status = 'active'`, `business_address_line` populated |
| `subscriptions` row | `status = 'active'`, add-on flags match what was selected |
| Invite email | New user receives Supabase invite email |
| Existing user checkout | No duplicate profile/customer created; existing record updated |

---

## 5. Authentication

| Test | Expected |
|------|----------|
| Visit `/account` when logged out | Redirects to `/login` |
| Visit `/admin` when logged out | Redirects to `/login` |
| Log in with valid credentials | Redirects to `/account` |
| Log in with invalid credentials | Error message shown |
| Sign out button | Clears session, redirects to `/` |
| Accept invite link → set password → log in | Successfully lands on `/account` |

---

## 6. Customer dashboard (`/account`)

| Test | Expected |
|------|----------|
| Suite number displayed | Shows assigned suite (e.g. `MB1001`) |
| Business address displayed | Shows full address line |
| Status pill | Shows `Active` in green for active customer |
| Subscription card | Shows plan, add-on status, renewal date |
| Mail inbox — no mail | Empty state: "No mail received yet" |
| Mail inbox — with mail | Mail items listed with sender, date, status badge |
| Requests — no requests | Section hidden |
| Requests — with requests | Requests listed with type, date, status badge |
| Manage billing button | Only visible when `stripe_customer_id` is set |
| Manage billing click | Opens Stripe Customer Portal |

---

## 7. Admin access protection

| Test | Expected |
|------|----------|
| `/admin` as non-admin customer | Redirects to `/login` or returns 403 |
| `/admin/customers` as non-admin | Redirects to `/login` or returns 403 |
| `POST /api/admin/mail-items` without admin session | Returns 401 or 403 |
| `POST /api/admin/notes` without admin session | Returns 401 or 403 |
| `PATCH /api/admin/mail/:id/status` without admin session | Returns 401 or 403 |
| `PATCH /api/admin/requests/:id/status` without admin session | Returns 401 or 403 |

---

## 8. Admin panel

| Test | Expected |
|------|----------|
| `/admin` overview | Stats cards show counts; recent signups table |
| `/admin/customers` — empty | "No customers yet" message |
| `/admin/customers` — with data | Table shows suite, name, email, status, joined date |
| Customer search | Filters results by name, email, or suite |
| Click customer row | Opens `/admin/customers/[id]` detail page |
| Customer detail page | Shows full profile, subscription info, mail items, requests |
| Add admin note | Note saved and displayed on page |

---

## 9. Mail upload

| Test | Expected |
|------|----------|
| `/admin/mail/upload` — select customer | Suite number dropdown populates |
| Upload envelope image | File uploaded to `mail-envelopes` Supabase bucket |
| Upload scan image | File uploaded to `mail-scans` Supabase bucket |
| Submit without required fields | Validation error shown |
| Successful upload | Success message shown; mail item appears in `/admin/mail` |
| Signed URLs for images | Images load in admin and customer views (not public URLs) |

---

## 10. Customer mail requests

| Test | Expected |
|------|----------|
| `POST /api/mail-requests` without session | Returns 401 |
| Submit request as logged-in customer | Request created with `status = 'pending'` |
| Duplicate request type on same item | Returns error or prevents duplicate |
| Admin views pending requests | Appears in `/admin/requests` |
| Admin updates status to `completed` | `completed_at` timestamp set; customer sees updated status |

---

## 11. Billing portal

| Test | Expected |
|------|----------|
| `POST /api/billing/portal` without session | Returns 401 |
| `POST /api/billing/portal` — no `stripe_customer_id` | Returns 404 with clear error |
| Valid request | Returns Stripe portal URL; redirect works |
| Cancel subscription in portal | Stripe fires `customer.subscription.deleted`; `customers.status` updates to `cancelled` |

---

## 12. Error states

| Test | Expected |
|------|----------|
| Stripe checkout API fails | User sees friendly error on `/signup`, not a raw stack trace |
| Webhook with missing email | Logged to console; returns 200 (no retry needed) |
| Admin mail upload — storage error | Error message shown in UI |
| Contact form — Resend API down | User sees "Failed to send message" error |

---

## 13. Mobile responsiveness

Check on viewport 375 px (iPhone SE) and 768 px (iPad):

| Page | Check |
|------|-------|
| Homepage | Hero, features, pricing, FAQ, contact all readable |
| `/signup` | Form stacks vertically; add-on cards full-width |
| `/account` | Dashboard cards stack; mail list readable |
| `/admin` | Sidebar collapses or wraps; tables scroll horizontally |
| `/admin/mail/upload` | Form fields full-width; file inputs usable |
