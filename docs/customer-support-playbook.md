# Customer Support Playbook

Quick answers to common customer issues. Most fixes happen in `/admin` or the
Stripe/Supabase dashboards.

## "I paid but my account says no business address plan"
- The customer is signed in with a different email than they used at checkout.
- Check `/admin/customers` for their checkout email. If found, confirm the email matches their login.
- `/account` self-heals the `profile_id` link on first visit when emails match. If they used a different email, advise them to sign in with the checkout email, or update records.

## "I didn't get my set-password / onboarding email"
- Confirm `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are set and the domain is verified in Resend.
- Resend onboarding by triggering a password reset: customer uses "Forgot password" on `/login`, or admin re-issues via Supabase Auth.
- Links use the `token_hash` flow so email scanners don't burn them; the OTP is consumed only on the explicit "Continue" click.

## "The password reset link is expired"
- Have them request a fresh one from `/login`. Links are single-use; opening twice invalidates them.

## "When will I get my suite number?"
- Assigned automatically at checkout. If missing, set it in `/admin/customers/[id]` (format `Suite201`).

## "How do I view my mail / scans?"
- `/account` → Mail inbox → "View envelope" / "View scan" (links expire after ~10 minutes; just reload for a fresh link).

## "I requested a scan/forward but nothing happened"
- Requests appear in `/admin/requests`. Update the status; the customer is emailed on changes.
- A customer can't open a second request on the same item while one is pending.

## "What do I need for mail authorization?"
- A signed USPS Form 1583 + a valid government photo ID. Admin sends instructions via the customer detail → "Send authorization request".
- Mail is only handled once both are verified.

## "I want to add Mail Scanning / Business Phone / Google Business"
- Self-serve from `/account` → Subscription card → the purchase buttons → Stripe Checkout.
- After payment, the add-on shows Active/Purchased on refresh.

## Billing changes / refunds
- Use the Stripe dashboard. The "Manage billing" button on `/account` opens the Stripe customer portal for the customer to update payment method or cancel.
