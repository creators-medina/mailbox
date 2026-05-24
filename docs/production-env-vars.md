# Production Environment Variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production).
Values marked **secret** must never be exposed client-side (only `NEXT_PUBLIC_*`
vars reach the browser).

## Supabase
| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret** — server-only admin client |

## App URLs
| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL, e.g. `https://www.mybizaddress.co` — used in email links + dashboard redirects |
| `NEXT_PUBLIC_BASE_URL` | Same canonical URL — used by Stripe checkout/portal redirects |

> Set **both** to `https://www.mybizaddress.co`. The code falls back from one to
> the other, but keep them identical. Never a `*.vercel.app` preview URL.

## Stripe
| Var | Notes |
| --- | --- |
| `STRIPE_SECRET_KEY` | **secret** |
| `STRIPE_WEBHOOK_SECRET` | **secret** — for signature verification |
| `STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY` | base plan price id |
| `STRIPE_PRICE_MAIL_SCANNING_MONTHLY` | recurring add-on |
| `STRIPE_PRICE_BUSINESS_PHONE_MONTHLY` | recurring add-on |
| `STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME` | one-time add-on |

> Add-on purchase routes (`/api/billing/addons/*`) reuse these same price ids.

## Resend (email)
| Var | Notes |
| --- | --- |
| `RESEND_API_KEY` | **secret** |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `My Biz Address <hello@mybizaddress.co>`. Used by onboarding, password reset, mail notifications, compliance request, and the contact form. |

## CRM / contact (optional)
| Var | Notes |
| --- | --- |
| `CONTACT_EMAIL` / `CONTACT_TO_EMAIL` | inbound contact routing |
| `CRM_FROM_EMAIL` / `CRM_REPLY_TO` | CRM outbound email |
| `NEXT_PUBLIC_GA_ID` | Google Analytics (optional) |

## Known risk
`RESEND_FROM_EMAIL`'s domain must be **verified in Resend**. The contact form
falls back to a legacy `@mybizmailbox.biz` sender if `RESEND_FROM_EMAIL` is
unset — confirm the production sender domain is verified to avoid the brand
mismatch (`mybizmailbox.biz` vs `mybizaddress.co`).
