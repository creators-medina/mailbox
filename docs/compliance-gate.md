# Compliance Gate — Enforcement Rules

A customer is considered **authorized** for mail handling only when **both**
USPS Form 1583 and the photo ID are verified by staff:

```
customer_compliance.form_1583_status = 'verified'
AND
customer_compliance.photo_id_status   = 'verified'
```

Any other status combination — including a missing `customer_compliance` row —
is **not authorized**.

## What is gated

| Action | Gate behavior | Where |
| --- | --- | --- |
| Create a `mail_items` row (admin mail intake) | **403** "Customer authorization is not verified." | `POST /api/admin/mail-items` |
| Complete a scan request | **403** if not authorized | `PATCH /api/admin/mail-requests/[id]` |
| Complete a forward request | **403** if not authorized | same |
| Complete a pickup request | **403** if not authorized | same |
| Complete a shred request | **Allowed** (safe disposal of mail already in our possession) | same |
| Cancel a request (status → cancelled) | **Allowed** (unblocking) | same |
| Move a request to `pending` / `in_progress` | **Allowed** (admin can triage before verifying) | same |

## What is NOT gated (deliberate)

- Reading mail items / requests in `/admin` views (so staff can see backlog).
- Viewing the customer detail page or compliance card.
- Sending the compliance request email or updating compliance status itself.
- Customer-side dashboard rendering — `/account` shows the existing
  verification-needed banner and never claims the address is "Active" until
  verified (Phase 6c).

## Defense in depth

- Server-side helper `lib/compliance/isCustomerAuthorized.ts` is the single
  source of truth. All gated routes call it. No bypass from the client.
- The upload form (`/admin/mail/upload`) disables Submit when the selected
  customer isn't verified and shows
  "Mail cannot be processed until Form 1583 and ID are verified." But UI
  disabling is **advisory**; the API rejects regardless.
- Service-role client only used server-side. Customer-side never sees
  compliance file paths, only statuses.

## Test checklist

1. Customer with no `customer_compliance` row → admin tries to upload mail →
   API returns 403; UI Submit is disabled.
2. Customer with `form_1583_status = received, photo_id_status = received`
   (uploaded but unverified) → still 403 from mail intake; still 403 when
   completing a scan/forward/pickup request.
3. Admin marks **only Form 1583 verified** → still 403.
4. Admin marks **both verified** → mail intake succeeds; scan/forward/pickup
   completions succeed.
5. With a verified customer, complete a forward request → mail item status
   syncs to `forwarded` and the customer is notified.
6. With an unverified customer who somehow has a mail item from before the
   gate was enabled (legacy data) → completing scan/forward/pickup is blocked
   with 403; completing **shred** still succeeds (safe disposal).
7. Cancel a request on an unverified customer → succeeds (cancel is not
   gated).
8. Verified customer is later downgraded (admin sets Form 1583 to rejected) →
   subsequent mail intake and scan/forward/pickup completions are blocked
   again.
9. Direct POST to `/api/admin/mail-items` with a verified-looking JSON body
   but for an unverified customer (no UI hint) → 403; logs include the auth
   denial.
10. `npm run build` → green.

## Operational note

If a customer reports mail blocked because their compliance is pending, the
admin must complete verification (Form 1583 + ID) on `/admin/customers/[id]`
or `/admin/compliance` before any handling can proceed. There is intentionally
no per-action override.
