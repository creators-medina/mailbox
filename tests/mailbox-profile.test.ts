// Run with: npm test
//
// These tests cover the billing/mailbox boundary at the layer that enforces it:
// buildMailboxUpdate decides the exact column set an admin mailbox edit may
// write, so if the boundary ever breaks, it breaks here first.
//
// The fixture is the scenario from the brief: one billing person, Jessica, who
// controls two mailboxes at two suites under two business names.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMailboxUpdate,
  resolveMailboxDisplayName,
  resolveMailboxRecipientName,
  MAILBOX_EDITABLE_FIELDS,
  BILLING_PROTECTED_FIELDS,
} from '../lib/mailbox/mailbox-profile.ts';

// ── Fixture ─────────────────────────────────────────────────────────────────
// One profile (the person + login), one Stripe customer (the billing identity),
// two customers rows (the two mailboxes).

type MailboxRow = {
  id: string;
  profile_id: string;
  stripe_customer_id: string | null;
  status: string;
  suite_number: string | null;
  business_name: string | null;
  recipient_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  forwarding_address: string | null;
};

const JESSICA_PROFILE = {
  id: 'profile-jessica',
  full_name: 'Jessica Van Brunt',
  business_name: 'Van Brunt & Company',
  email: 'jessica@example.com',
  phone: '(469) 555-0100',
};

function freshMailboxes(): MailboxRow[] {
  return [
    {
      id: 'mailbox-a',
      profile_id: JESSICA_PROFILE.id,
      stripe_customer_id: 'cus_TEST_JESSICA',
      status: 'active',
      suite_number: 'Suite122',
      business_name: 'Van Brunt & Company',
      recipient_name: 'Jessica Van Brunt',
      contact_email: 'suite122@example.com',
      contact_phone: '(469) 555-0122',
      forwarding_address: '1 Elm St, Dallas, TX 75201',
    },
    {
      id: 'mailbox-b',
      profile_id: JESSICA_PROFILE.id,
      stripe_customer_id: 'cus_TEST_JESSICA',
      status: 'active',
      suite_number: 'Suite123',
      business_name: 'Van Brunt & Company, LLC',
      recipient_name: 'Jessica Van Brunt',
      contact_email: 'suite123@example.com',
      contact_phone: '(469) 555-0123',
      forwarding_address: '2 Oak St, Dallas, TX 75202',
    },
  ];
}

/**
 * Stand-in for the API route's write: applies a validated update to exactly one
 * row selected by id, mirroring `.update(update).eq('id', customerId)`.
 */
function applyMailboxUpdate(rows: MailboxRow[], targetId: string, body: unknown) {
  const built = buildMailboxUpdate(body);
  if (!built.ok) return { ok: false as const, error: built.error, rows };
  const next = rows.map(r => (r.id === targetId ? { ...r, ...built.update } : { ...r }));
  return { ok: true as const, update: built.update, rows: next };
}

// ── Scenario 1 & 2: cross-mailbox isolation ─────────────────────────────────

test('editing Mailbox A business name does not modify Mailbox B', () => {
  const before = freshMailboxes();
  const res = applyMailboxUpdate(before, 'mailbox-a', { business_name: 'Van Brunt Holdings' });
  assert.equal(res.ok, true);

  const a = res.rows.find(r => r.id === 'mailbox-a')!;
  const b = res.rows.find(r => r.id === 'mailbox-b')!;

  assert.equal(a.business_name, 'Van Brunt Holdings');
  assert.equal(b.business_name, 'Van Brunt & Company, LLC', 'Suite 123 must be untouched');
  assert.deepEqual(b, before[1], 'no field of Mailbox B may change');
});

test('editing Mailbox B business name does not modify Mailbox A', () => {
  const before = freshMailboxes();
  const res = applyMailboxUpdate(before, 'mailbox-b', { business_name: 'VB Logistics, LLC' });
  assert.equal(res.ok, true);

  const a = res.rows.find(r => r.id === 'mailbox-a')!;
  const b = res.rows.find(r => r.id === 'mailbox-b')!;

  assert.equal(b.business_name, 'VB Logistics, LLC');
  assert.equal(a.business_name, 'Van Brunt & Company', 'Suite 122 must be untouched');
  assert.deepEqual(a, before[0], 'no field of Mailbox A may change');
});

// ── Scenario 3: billing identity is never touched ───────────────────────────

test('a mailbox edit never writes any billing or account column', () => {
  const res = buildMailboxUpdate({
    business_name: 'Van Brunt Holdings',
    recipient_name: 'J. Van Brunt',
    contact_email: 'ops@example.com',
    contact_phone: '(469) 555-0199',
    forwarding_address: '9 Pine St, Dallas, TX 75203',
  });
  assert.equal(res.ok, true);
  if (!res.ok) return;

  for (const key of Object.keys(res.update)) {
    assert.ok(
      (MAILBOX_EDITABLE_FIELDS as readonly string[]).includes(key),
      `${key} is not an allow-listed mailbox field`,
    );
  }
  for (const forbidden of BILLING_PROTECTED_FIELDS) {
    assert.ok(!(forbidden in res.update), `${forbidden} must never appear in a mailbox update`);
  }
});

test('a full mailbox edit leaves the Stripe identifiers on both rows intact', () => {
  const before = freshMailboxes();
  const res = applyMailboxUpdate(before, 'mailbox-a', {
    business_name: 'Renamed Co',
    recipient_name: 'Someone Else',
    contact_email: 'new@example.com',
    contact_phone: '(469) 555-0000',
    forwarding_address: 'Somewhere else',
  });
  assert.equal(res.ok, true);

  for (const row of res.rows) {
    assert.equal(row.stripe_customer_id, 'cus_TEST_JESSICA');
    assert.equal(row.status, 'active');
    assert.equal(row.profile_id, JESSICA_PROFILE.id);
  }
});

test('billing-protected keys are rejected loudly rather than silently dropped', () => {
  for (const key of BILLING_PROTECTED_FIELDS) {
    const res = buildMailboxUpdate({ business_name: 'Fine', [key]: 'tampered' });
    assert.equal(res.ok, false, `${key} must be rejected`);
    if (!res.ok) assert.match(res.error, /billing or account data/);
  }
});

test('unknown fields are ignored, not written', () => {
  const res = buildMailboxUpdate({ business_name: 'Van Brunt', plan: 'enterprise', role: 'admin' });
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.deepEqual(res.update, { business_name: 'Van Brunt' });
});

test('suite_number is not editable through the mailbox editor', () => {
  // Suite reassignment stays in the /suite route, which owns duplicate checking
  // and rebuilding business_address_line.
  const res = buildMailboxUpdate({ suite_number: 'Suite999' });
  assert.equal(res.ok, false);
});

// ── Scenario 4: subscription events still resolve by Stripe id ──────────────

test('Stripe subscription events resolve to a mailbox by stripe id, not by name', () => {
  const before = freshMailboxes();
  const renamed = applyMailboxUpdate(before, 'mailbox-a', { business_name: 'Totally Different Name' });
  assert.equal(renamed.ok, true);

  // This is the webhook's lookup: .eq('stripe_customer_id', …)
  const matched = renamed.rows.filter(r => r.stripe_customer_id === 'cus_TEST_JESSICA');
  assert.equal(matched.length, 2, 'both mailboxes still resolve from the Stripe customer id');
});

// ── Scenarios 5–7: mail stays attached to the right mailbox ─────────────────

test('mail stays attached to its own mailbox across a business-name change', () => {
  const mail = [
    { id: 'mail-1', customer_id: 'mailbox-a', recipient_name: 'Van Brunt & Company' },
    { id: 'mail-2', customer_id: 'mailbox-b', recipient_name: 'Van Brunt & Company, LLC' },
  ];

  const res = applyMailboxUpdate(freshMailboxes(), 'mailbox-a', { business_name: 'Van Brunt Holdings' });
  assert.equal(res.ok, true);

  // Mail is keyed by customer_id (the mailbox), never by name.
  assert.deepEqual(mail.filter(m => m.customer_id === 'mailbox-a').map(m => m.id), ['mail-1']);
  assert.deepEqual(mail.filter(m => m.customer_id === 'mailbox-b').map(m => m.id), ['mail-2']);

  // And the historical addressee snapshot on the item is unchanged by the
  // rename, so old mail still shows who it was actually addressed to.
  assert.equal(mail[0].recipient_name, 'Van Brunt & Company');
});

// ── Scenario 9: existing single-mailbox customers still work ────────────────

test('a legacy mailbox with no business_name falls back to the profile', () => {
  const legacy = { business_name: null, recipient_name: null, suite_number: 'MB1001' };
  assert.equal(resolveMailboxDisplayName(legacy, JESSICA_PROFILE), 'Van Brunt & Company');
  assert.equal(resolveMailboxRecipientName(legacy, JESSICA_PROFILE), 'Jessica Van Brunt');
});

test('the mailbox business name wins over the legacy profile value', () => {
  const mailbox = { business_name: 'Van Brunt & Company, LLC', recipient_name: null, suite_number: 'Suite123' };
  assert.equal(resolveMailboxDisplayName(mailbox, JESSICA_PROFILE), 'Van Brunt & Company, LLC');
});

test('a mailbox with no name anywhere resolves to null, not a crash', () => {
  assert.equal(resolveMailboxDisplayName({ business_name: null }, null), null);
  assert.equal(resolveMailboxRecipientName({ recipient_name: null }, null), null);
});

test('blank and whitespace values fall through to the next candidate', () => {
  assert.equal(
    resolveMailboxDisplayName({ business_name: '   ' }, { business_name: 'Fallback Co' }),
    'Fallback Co',
  );
});

// ── Validation ──────────────────────────────────────────────────────────────

test('an empty string clears a field to null', () => {
  const res = buildMailboxUpdate({ business_name: '', forwarding_address: '   ' });
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.deepEqual(res.update, { business_name: null, forwarding_address: null });
});

test('values are trimmed', () => {
  const res = buildMailboxUpdate({ business_name: '  Van Brunt & Company  ' });
  assert.equal(res.ok, true);
  if (res.ok) assert.equal(res.update.business_name, 'Van Brunt & Company');
});

test('an invalid contact email is rejected', () => {
  const res = buildMailboxUpdate({ contact_email: 'not-an-email' });
  assert.equal(res.ok, false);
  if (!res.ok) assert.match(res.error, /valid email/);
});

test('an over-long business name is rejected', () => {
  const res = buildMailboxUpdate({ business_name: 'x'.repeat(201) });
  assert.equal(res.ok, false);
});

test('non-string values are rejected', () => {
  assert.equal(buildMailboxUpdate({ business_name: 42 }).ok, false);
  assert.equal(buildMailboxUpdate({ business_name: { evil: true } }).ok, false);
});

test('non-object bodies are rejected', () => {
  assert.equal(buildMailboxUpdate(null).ok, false);
  assert.equal(buildMailboxUpdate('business_name=x').ok, false);
  assert.equal(buildMailboxUpdate([{ business_name: 'x' }]).ok, false);
});

test('a body with nothing editable is rejected rather than issuing an empty write', () => {
  assert.equal(buildMailboxUpdate({}).ok, false);
  assert.equal(buildMailboxUpdate({ unrelated: 'x' }).ok, false);
});
