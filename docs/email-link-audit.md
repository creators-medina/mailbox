# Email Link & Branding Audit

Snapshot of every email the app sends, the sender it uses, its subject, and
where its CTA points. Verified against `mybizaddress.co` as the canonical
domain and `My Biz Address` as the only brand name shown to customers.

> All customer-facing emails set `from = process.env.RESEND_FROM_EMAIL` and
> throw if it is missing — there is no customer-facing email that falls back
> to a non-`mybizaddress.co` sender. Configure `RESEND_FROM_EMAIL` to
> `My Biz Address <hello@mybizaddress.co>` (or another verified
> `@mybizaddress.co` address) in production.

## Customer-facing emails

| Email type | Sender (env) | Subject | CTA destination | Notes |
| --- | --- | --- | --- | --- |
| Onboarding (set password) | `RESEND_FROM_EMAIL` | Welcome to My Biz Address | `${NEXT_PUBLIC_APP_URL}/auth/reset-password?email=…&type=recovery&token_hash=…` | token_hash flow; scanner-safe (OTP consumed only on user click). Copy no longer claims the address is "now active" — adds explicit note that mail handling begins after Form 1583 + ID verification. |
| Password reset | `RESEND_FROM_EMAIL` | Reset your My Biz Address password | `${NEXT_PUBLIC_APP_URL}/auth/reset-password?email=…&type=recovery&token_hash=…` | Generic `{ ok: true }` response prevents email enumeration. |
| New mail received | `RESEND_FROM_EMAIL` | New mail received at your My Biz Address | `${NEXT_PUBLIC_APP_URL}/account?customerEmail=…` | Includes the customer email param so an admin who clicks the link sees a "sign in as the customer" notice instead of bouncing to `/admin`. |
| Scan ready | `RESEND_FROM_EMAIL` | Your mail scan is ready | `${NEXT_PUBLIC_APP_URL}/account?customerEmail=…` | Never exposes raw storage paths — links to `/account` only. |
| Mail request updated | `RESEND_FROM_EMAIL` | Your mail request has been updated | `${NEXT_PUBLIC_APP_URL}/account?customerEmail=…` | Includes the staff-written customer response in the body. Stamps `last_status_email_sent_at`. |
| Compliance request (Form 1583 + ID) | `RESEND_FROM_EMAIL` | Action needed: Complete your My Biz Address mail authorization | `${NEXT_PUBLIC_APP_URL}/account` | Sent by admin/staff from the customer detail page. Body references `BUSINESS.email` for support replies. |

## Admin / lead emails

| Email type | Sender | Subject | Destination | Notes |
| --- | --- | --- | --- | --- |
| Contact form (inbound lead) | `RESEND_FROM_EMAIL` → falls back to `My Biz Address <hello@mybizaddress.co>` | dynamic per submission | Internal address (`CONTACT_TO_EMAIL` / `DEFAULT_TO`) | Customer never sees this email; falls back to the canonical brand if `RESEND_FROM_EMAIL` is unset. |
| CRM outbound | `RESEND_FROM_EMAIL`/`CRM_FROM_EMAIL` → falls back to `My Biz Address <hello@mybizaddress.co>` | template-controlled | lead's email | Staff-driven; uses the same canonical fallback. |

## URL / brand verification

- **No `vercel.app` or preview-deployment URLs** anywhere in customer email bodies — every link is built from `NEXT_PUBLIC_APP_URL` (with `NEXT_PUBLIC_BASE_URL` as a fallback inside `notify-mail`).
- **No `/admin/*` links** appear in any customer-facing email. The only `/admin` reference inside `lib/email/notify-mail.ts` is the comment "never `/admin`."
- **No `mybizmailbox.biz`** references remain in customer-visible surfaces (config, contact, CRM). Legal pages (`/privacy`, `/terms`) retain historical brand text per legal review — those are out of scope for this pass.

## Required env

| Var | Value (production) |
| --- | --- |
| `RESEND_API_KEY` | Resend production key |
| `RESEND_FROM_EMAIL` | `My Biz Address <hello@mybizaddress.co>` (or any verified `@mybizaddress.co` address) |
| `NEXT_PUBLIC_APP_URL` | `https://www.mybizaddress.co` |
| `NEXT_PUBLIC_BASE_URL` | `https://www.mybizaddress.co` |

## Remaining risks

- **Resend sender domain must be verified.** Until `mybizaddress.co` (and the
  specific `hello@`/`info@` mailbox if Resend requires it) is verified,
  outbound mail will either bounce or land in spam regardless of code.
- **Legal pages** (`/privacy`, `/terms`) still mention the old brand in
  historical context; those should be replaced once legal copy is re-reviewed.
- The `BUSINESS.email` shown inside the compliance request email body is now
  `info@mybizaddress.co` — make sure that inbox is actually monitored, or
  point it at the support inbox you want customers replying to.
