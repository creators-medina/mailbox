# Full Customer Journey — Live Production Test

Walk through every step below, in order, against `https://www.mybizaddress.co`
with a real low-value Stripe charge (or a real production test plan / coupon if
you have one). **No automation runs payments for you.** This is a human script.

Before starting, hit **`/admin/system`** as an admin/staff user and confirm all
required checks are green. Yellow warnings are OK to proceed.

---

## 0. Pre-flight (5 min)

- [ ] All env vars set in Vercel (see `docs/production-env-vars.md`).
- [ ] Migrations 011–019 applied in Supabase (re-verify on `/admin/system`).
- [ ] Buckets `mail-envelope-images`, `mail-scans`, `compliance-documents` exist and are **private**, with the RLS from `supabase/storage-setup.md`.
- [ ] `RESEND_FROM_EMAIL` is a verified `@mybizaddress.co` address.
- [ ] Stripe webhook → `/api/stripe/webhook`, `STRIPE_WEBHOOK_SECRET` set, events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`.

You'll need: a fresh real inbox you control, a real card (your own, low-value), a sample PDF or photo of a Form 1583, a photo ID image.

---

## 1. Public homepage
- Open `https://www.mybizaddress.co` in a private/incognito window.
- **Expected:** Hero loads, pricing visible ($29.99/mo base + add-ons), nav works, no console errors, links to `/signup` and `/login` work.

## 2. Checkout with real payment
- From `/signup`, choose a plan + any add-ons, fill the form with your real email/business name, proceed to Stripe Checkout.
- Pay with your real card. **This is the only step that costs money. Refund yourself afterwards in Stripe.**
- **Expected:** Redirect to `/success`; Stripe dashboard shows the charge.

## 3. Customer receives onboarding email
- Check the inbox for subject **"Welcome to My Biz Address"**.
- **Expected:** Branded dark/gold layout, sender is your verified `@mybizaddress.co` address, body says the account is set up (not "now active"), notes that mail handling begins after verification. CTA goes to `…/auth/reset-password?email=…&token_hash=…` (NOT `vercel.app`, NOT `/admin`).

## 4. Customer sets password
- Click the email CTA. On `/auth/reset-password`, click **Continue**, then set a password (≥ 8 chars).
- **Expected:** Lands on `/account` automatically; status pill says "Verification needed" (NOT "Active").

## 5. Customer logs into /account
- Sign out, then sign back in via `/login` with your new password.
- **Expected:** `/account` loads; shows suite + address; top banner reads "Verification needed: Mail handling begins after Form 1583 and ID verification are complete."

## 6. Customer uploads Form 1583
- In the "Upload authorization documents" card, choose your Form 1583 PDF for the **USPS Form 1583** input, click **Submit documents**.
- **Expected:** Success message "Thanks — your documents have been received…"; Form 1583 row now says "Received — awaiting review · file on file"; Photo ID still "Not uploaded".

## 7. Customer uploads Photo ID
- Repeat with a Photo ID image for the **Photo ID** input.
- **Expected:** Photo ID row now says "Received — awaiting review · file on file".

## 8. Admin sees customer in /admin/compliance
- Sign out, sign in as an admin/staff user, open `/admin/compliance`.
- Default filter is **Needs review**.
- **Expected:** Your test customer appears in the table with both statuses = received, the upload dates populated, **Review ›** link visible.

## 9. Admin opens customer detail
- Click **Review ›** → lands on `/admin/customers/[id]` and scrolls to the Compliance section.
- **Expected:** "Mail authorization (Form 1583)" card with two document tiles, each showing "Uploaded {date}" and a per-document view link.

## 10. Admin views uploaded Form 1583 and Photo ID
- Click **View USPS Form 1583 ›** — opens the file in a new tab.
- Click **View Photo ID ›** — opens the file.
- **Expected:** Both files render. URLs contain a token (signed); they expire ~10 min. No raw bucket path is visible in the link.
- If a file shows "**File uploaded — link unavailable**", check Vercel logs for `[admin/compliance-file-url]` to diagnose (bucket missing, wrong RLS, etc.).

## 11. Admin verifies both documents
- Click **Verify** on Form 1583 → DocCard reflects verified.
- Click **Verify** on Photo ID → both verified; Compliance footer shows "Verified {date} by {your name}".
- Confirm in Vercel logs: `[admin/compliance-api] { …, authorized: true, reason: 'ok_via_…' }`.
- **Expected:** Save succeeds. **No 403.**

## 12. Customer dashboard changes to verified
- Sign out, sign in as the customer, open `/account`.
- **Expected:** Top banner gone; status pill says **Active**; getting-started checklist shows Form 1583 + Photo ID as **Done**; authorization card says "fully active". The upload card collapses to "no further action needed".

## 13. Admin uploads a mail item
- As admin, go to `/admin/mail/upload`.
- Pick the verified customer (Submit is enabled now), enter sender + title + received date; optionally attach an envelope image and a scan PDF.
- **Expected:** "Mail item uploaded successfully"; the customer's status shows ✓ in the dropdown.
- Confirm in Supabase: a row appears in `public.mail_items`.

## 14. Customer sees the mail item
- As customer, refresh `/account`.
- **Expected:** Mail inbox shows the item with sender, title, date, status badge, **View envelope** link (if attached). If a scan was uploaded too: **View scan** in the action row.

## 15. Customer requests an action
- Click **Request scan** (or Forward / Hold / Shred). For Forward, enter a forwarding address; for Hold/Shred, an optional note.
- **Expected:** Form submits; the item now says **Request pending: {type}** and the action buttons collapse. Duplicate attempts → 409 friendly message.

## 16. Admin sees the request in /admin/requests
- As admin, open `/admin/requests` (default filter "Pending").
- **Expected:** The new request row shows suite, customer business/email, type, mail item, file links, status badge.

## 17. Admin approves or denies with a customer-visible note
- Click **Approve request**. Type the customer-visible note (pre-filled suggestion is fine) + an optional internal note + tracking (for forward).
- **Expected:** Click **Confirm approve** → row shows **completed**; the customer-visible note appears below the customer notes column. For Approve: the linked mail item's status syncs (`scan→scanned`, `forward→forwarded`, `pickup→picked_up`, `shred→shredded`).
- Or click **Deny request** with a reason → row shows **cancelled**.

## 18. Customer sees the request update
- As customer, refresh `/account`.
- **Expected:** Recent Requests card shows the request as Completed (with date) or Cancelled. The customer-visible note appears under it. Internal admin notes are **not** shown.

## 19. Customer receives the follow-up email
- Check the inbox: subject **"Your mail request has been updated"**.
- **Expected:** Branded, includes request type + new status + the customer-visible note; CTA is `https://www.mybizaddress.co/account?customerEmail=…`. No `/admin` link, no `vercel.app`.

## 20. Billing portal opens
- On `/account`, click **Manage billing**.
- **Expected:** Stripe billing portal opens for this customer. Close it and return to `/account`.

## 21. Add-on checkout buttons route correctly
- For an inactive add-on (e.g., **Add Mail Scanning**), click the button.
- **Expected:** Redirect to Stripe Checkout for the recurring add-on price. **Do not complete payment** — close/cancel. You should land on `/account?billing=cancelled` with the muted banner.

---

## After the test (cleanup + sign-off)

- [ ] Refund or void the test charge in the Stripe dashboard.
- [ ] Optionally delete or anonymize the test `customer_compliance` row in Supabase.
- [ ] Re-check `/admin/system` — confirm zero required failures.
- [ ] Re-check Vercel logs for any unhandled errors during the run.

If every step matches Expected and `/admin/system` is green/yellow only, the
app is ready for soft launch.
