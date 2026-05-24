# Admin Operations Guide

For admin/staff using the `/admin` dashboard. All admin pages require a
`profiles.role` of `admin` or `staff`; the rest of the app is customer-facing.

## Customers
- **Find a customer:** `/admin/customers` → search by name/business/email → open the detail page.
- **Detail page (`/admin/customers/[id]`)** shows profile, subscription + add-ons, compliance, mail items, requests, and internal notes.

## Suite assignment
- In the customer detail header, click **Edit** next to the suite.
- Format: `Suite201` (the leading "Suite" is normalized; digits/letters/hyphen after, e.g. `Suite12A`, `Suite-12`).
- Saving updates the suite number and the full business address line. Duplicate suites are rejected.

## Mail authorization (USPS Form 1583) — manual process
1. Collect the signed Form 1583 + a valid government photo ID out of band.
2. On the customer detail **Compliance** card, set **Form 1583** and **Photo ID** statuses (`pending → requested → received → verified`, or `rejected`).
3. Click **Send authorization request** to email the customer instructions (moves pending items to `requested`).
4. When both are **verified**, the timestamp + your name are recorded, and the customer dashboard shows authorized.
> Only process mail for customers showing ✓ verified. Verification is a manual gate; it is not hard-enforced in code yet.

## Mail intake
- `/admin/mail/upload` → select customer (✓ verified / ⚠ not), enter sender, recipient, title, optional tracking, received date → optionally attach envelope image + scan PDF → upload. The customer gets a "new mail received" email.
- `/admin/mail` is the queue: filter by status, change status (e.g. `received → scanned`). Setting `scanned` emails the customer that the scan is ready.
- "View envelope"/"View scan" open short-lived signed URLs (private buckets).

## Requests queue
- `/admin/requests` lists customer scan/forward/pickup/shred requests with suite, customer, mail item, files, and status. Default filter = pending.
- Change status (`pending → in_progress → completed`/`cancelled`). A status change emails the customer.

## Billing visibility
- Customers self-serve add-ons from their dashboard; purchases update the subscription flags via the Stripe webhook.
- For refunds/plan changes, use the Stripe dashboard. Cancelling the base subscription marks the customer cancelled; cancelling an add-on only disables that add-on.
