// Run with: npm test
//
// Covers the admin-editable Full Name (person-level) alongside the Phase 1
// Business Name (mailbox-level), and the boundary between them:
//
//   • Full Name writes profiles.full_name and is shared across every mailbox
//     that person owns — correct, because it is the same person.
//   • Business Name writes customers.business_name and is per-suite — renaming
//     Suite 122 can never touch Suite 123.
//
// The fixture is Jessica: one person, one Stripe customer, two mailboxes.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPersonUpdate,
  PERSON_EDITABLE_FIELDS,
  PERSON_PROTECTED_FIELDS,
  FULL_NAME_MAX_LENGTH,
} from '../lib/mailbox/person-profile.ts';
import {
  buildMailboxUpdate,
  resolveMailboxDisplayName,
} from '../lib/mailbox/mailbox-profile.ts';

// ── Fixture ─────────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
};

type MailboxRow = {
  id: string;
  profile_id: string;
  stripe_customer_id: string | null;
  status: string;
  suite_number: string | null;
  business_name: string | null;
  recipient_name: string | null;
};

type World = { profiles: ProfileRow[]; mailboxes: MailboxRow[] };

function jessica(): World {
  return {
    profiles: [{
      id: 'profile-jessica',
      full_name: 'Jessica Van Brunt',
      business_name: 'Van Brunt & Company',   // legacy pre-020 value
      email: 'jessica@example.com',
      phone: '(469) 555-0100',
      role: 'customer',
    }],
    mailboxes: [
      {
        id: 'mailbox-a', profile_id: 'profile-jessica',
        stripe_customer_id: 'cus_TEST_JESSICA', status: 'active',
        suite_number: 'Suite122',
        business_name: 'Van Brunt & Company', recipient_name: 'Jessica Van Brunt',
      },
      {
        id: 'mailbox-b', profile_id: 'profile-jessica',
        stripe_customer_id: 'cus_TEST_JESSICA', status: 'active',
        suite_number: 'Suite123',
        business_name: 'Van Brunt & Company, LLC', recipient_name: 'Jessica Van Brunt',
      },
    ],
  };
}

/**
 * Stand-in for PATCH .../person: validate, resolve the profile through the
 * mailbox, then update exactly that profiles row — mirroring the route's
 * lookup of customers.profile_id followed by `.eq('id', profileId)`.
 */
function adminEditsPerson(world: World, viaMailboxId: string, body: unknown) {
  const built = buildPersonUpdate(body);
  if (!built.ok) return { ok: false as const, error: built.error, world };

  const mailbox = world.mailboxes.find(m => m.id === viaMailboxId);
  if (!mailbox) return { ok: false as const, error: 'Mailbox not found.', world };

  return {
    ok: true as const,
    world: {
      profiles: world.profiles.map(p =>
        p.id === mailbox.profile_id ? { ...p, ...built.update } : { ...p }),
      mailboxes: world.mailboxes.map(m => ({ ...m })),
    },
  };
}

/** Stand-in for the Phase 1 PATCH .../mailbox route. */
function adminEditsMailbox(world: World, mailboxId: string, body: unknown) {
  const built = buildMailboxUpdate(body);
  if (!built.ok) return { ok: false as const, error: built.error, world };

  return {
    ok: true as const,
    world: {
      profiles: world.profiles.map(p => ({ ...p })),
      mailboxes: world.mailboxes.map(m =>
        m.id === mailboxId ? { ...m, ...built.update } : { ...m }),
    },
  };
}

/** What the admin customer list / detail header renders for a mailbox. */
function adminDashboardName(world: World, mailboxId: string): string | null {
  const m = world.mailboxes.find(x => x.id === mailboxId)!;
  const p = world.profiles.find(x => x.id === m.profile_id) ?? null;
  return resolveMailboxDisplayName(m, p);
}

/** What /account greets the customer with, mirroring app/account/page.tsx. */
function customerDashboardName(world: World, mailboxId: string): string | null {
  const m = world.mailboxes.find(x => x.id === mailboxId)!;
  const p = world.profiles.find(x => x.id === m.profile_id) ?? null;
  return resolveMailboxDisplayName(m, p)
    || (p?.full_name ? p.full_name.split(' ')[0] : null);
}

/** What the admin "Account holder" row renders. */
function adminAccountHolder(world: World, mailboxId: string): string | null {
  const m = world.mailboxes.find(x => x.id === mailboxId)!;
  return world.profiles.find(x => x.id === m.profile_id)?.full_name ?? null;
}

// ── 1. Admin can change Full Name ──────────────────────────────────────────

test('an admin can update the account holder full name', () => {
  const res = adminEditsPerson(jessica(), 'mailbox-a', { full_name: 'Jessica Van Brunt-Reyes' });
  assert.equal(res.ok, true);
  assert.equal(res.world.profiles[0].full_name, 'Jessica Van Brunt-Reyes');
});

test('a full name is trimmed, and an empty value clears it', () => {
  const trimmed = buildPersonUpdate({ full_name: '  Jessica Van Brunt  ' });
  assert.equal(trimmed.ok, true);
  if (trimmed.ok) assert.equal(trimmed.update.full_name, 'Jessica Van Brunt');

  const cleared = buildPersonUpdate({ full_name: '   ' });
  assert.equal(cleared.ok, true);
  if (cleared.ok) assert.equal(cleared.update.full_name, null);
});

// ── 2. Admin can change Business Name via the Phase 1 editor ───────────────

test('the Phase 1 mailbox editor still updates business name', () => {
  const res = adminEditsMailbox(jessica(), 'mailbox-a', { business_name: 'Van Brunt Holdings' });
  assert.equal(res.ok, true);
  assert.equal(res.world.mailboxes.find(m => m.id === 'mailbox-a')!.business_name, 'Van Brunt Holdings');
});

test('the Phase 1 mailbox editor still accepts its other operational fields', () => {
  // Explicitly guards against this change narrowing Phase 1's capabilities.
  const res = buildMailboxUpdate({
    recipient_name: 'J. Van Brunt',
    contact_email: 'ops@example.com',
    contact_phone: '(469) 555-0199',
    forwarding_address: '9 Pine St, Dallas, TX 75203',
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(Object.keys(res.update).sort(),
      ['contact_email', 'contact_phone', 'forwarding_address', 'recipient_name']);
  }
});

// ── 3 & 5. New values appear on the Admin dashboard ────────────────────────

test('a new full name appears on the admin dashboard', () => {
  const res = adminEditsPerson(jessica(), 'mailbox-a', { full_name: 'Jessica Van Brunt-Reyes' });
  assert.equal(res.ok, true);
  assert.equal(adminAccountHolder(res.world, 'mailbox-a'), 'Jessica Van Brunt-Reyes');
});

test('a new business name appears on the admin dashboard for that mailbox only', () => {
  const res = adminEditsMailbox(jessica(), 'mailbox-a', { business_name: 'Van Brunt Holdings' });
  assert.equal(res.ok, true);
  assert.equal(adminDashboardName(res.world, 'mailbox-a'), 'Van Brunt Holdings');
  assert.equal(adminDashboardName(res.world, 'mailbox-b'), 'Van Brunt & Company, LLC');
});

// ── 4 & 6. New values appear on the Customer dashboard ─────────────────────

test('a new business name appears on the customer dashboard', () => {
  const before = jessica();
  assert.equal(customerDashboardName(before, 'mailbox-a'), 'Van Brunt & Company');

  const res = adminEditsMailbox(before, 'mailbox-a', { business_name: 'Van Brunt Holdings' });
  assert.equal(res.ok, true);
  assert.equal(customerDashboardName(res.world, 'mailbox-a'), 'Van Brunt Holdings');
});

test('the customer dashboard no longer reads the legacy profile business name', () => {
  // Regression guard for the bug this change fixes: /account previously read
  // profile.business_name, so a mailbox rename was invisible to the customer.
  const world = jessica();
  world.mailboxes[0].business_name = 'Mailbox-Level Name';
  world.profiles[0].business_name = 'Stale Profile Name';
  assert.equal(customerDashboardName(world, 'mailbox-a'), 'Mailbox-Level Name');
});

test('a new full name reaches the customer dashboard where the app shows a name', () => {
  // The greeting prefers the business name; the person's name is the fallback
  // when no business name exists anywhere.
  const world = jessica();
  world.mailboxes[0].business_name = null;
  world.mailboxes[0].recipient_name = null;
  world.profiles[0].business_name = null;

  const res = adminEditsPerson(world, 'mailbox-a', { full_name: 'Jessica Van Brunt-Reyes' });
  assert.equal(res.ok, true);
  assert.equal(customerDashboardName(res.world, 'mailbox-a'), 'Jessica Van Brunt-Reyes');
});

test('a legacy mailbox with no business name still falls back to the profile value', () => {
  const world = jessica();
  world.mailboxes[0].business_name = null;
  assert.equal(customerDashboardName(world, 'mailbox-a'), 'Van Brunt & Company');
  assert.equal(adminDashboardName(world, 'mailbox-a'), 'Van Brunt & Company');
});

// ── 7. Business name stays isolated to its mailbox ─────────────────────────

test('changing Suite 122 business name does not change Suite 123', () => {
  const before = jessica();
  const res = adminEditsMailbox(before, 'mailbox-a', { business_name: 'Van Brunt Holdings' });
  assert.equal(res.ok, true);
  assert.deepEqual(res.world.mailboxes.find(m => m.id === 'mailbox-b'), before.mailboxes[1]);
});

test('changing Suite 123 business name does not change Suite 122', () => {
  const before = jessica();
  const res = adminEditsMailbox(before, 'mailbox-b', { business_name: 'VB Logistics, LLC' });
  assert.equal(res.ok, true);
  assert.deepEqual(res.world.mailboxes.find(m => m.id === 'mailbox-a'), before.mailboxes[0]);
});

test('a business name edit never writes to the person', () => {
  const before = jessica();
  const res = adminEditsMailbox(before, 'mailbox-a', { business_name: 'Van Brunt Holdings' });
  assert.equal(res.ok, true);
  assert.deepEqual(res.world.profiles, before.profiles);
});

// ── Full name is shared across the person's mailboxes, by design ───────────

test('a full name change is visible from both of the person\'s mailboxes', () => {
  const res = adminEditsPerson(jessica(), 'mailbox-a', { full_name: 'Jessica Van Brunt-Reyes' });
  assert.equal(res.ok, true);
  assert.equal(adminAccountHolder(res.world, 'mailbox-a'), 'Jessica Van Brunt-Reyes');
  assert.equal(adminAccountHolder(res.world, 'mailbox-b'), 'Jessica Van Brunt-Reyes');
});

test('a full name change leaves both mailboxes\' business names alone', () => {
  const before = jessica();
  const res = adminEditsPerson(before, 'mailbox-a', { full_name: 'Someone Else' });
  assert.equal(res.ok, true);
  assert.deepEqual(res.world.mailboxes, before.mailboxes);
});

test('a full name change does not touch the other person when two people exist', () => {
  const world = jessica();
  world.profiles.push({
    id: 'profile-other', full_name: 'Marcus Webb', business_name: 'Webb Supply',
    email: 'marcus@example.com', phone: null, role: 'customer',
  });
  world.mailboxes.push({
    id: 'mailbox-c', profile_id: 'profile-other',
    stripe_customer_id: 'cus_TEST_MARCUS', status: 'active',
    suite_number: 'Suite124', business_name: 'Webb Supply', recipient_name: 'Marcus Webb',
  });

  const res = adminEditsPerson(world, 'mailbox-a', { full_name: 'Jessica Van Brunt-Reyes' });
  assert.equal(res.ok, true);
  assert.equal(res.world.profiles.find(p => p.id === 'profile-other')!.full_name, 'Marcus Webb');
});

// ── 8. Email cannot be changed through this endpoint ───────────────────────

test('email is rejected by the full name endpoint', () => {
  const res = buildPersonUpdate({ full_name: 'Jessica', email: 'attacker@example.com' });
  assert.equal(res.ok, false);
  if (!res.ok) assert.match(res.error, /cannot be changed/);
});

test('an email-only body writes nothing', () => {
  assert.equal(buildPersonUpdate({ email: 'attacker@example.com' }).ok, false);
});

// ── 9. Stripe and billing identifiers cannot be changed ────────────────────

test('stripe and billing fields are rejected by the full name endpoint', () => {
  for (const key of ['stripe_customer_id', 'stripe_subscription_id', 'status']) {
    const res = buildPersonUpdate({ full_name: 'Jessica', [key]: 'tampered' });
    assert.equal(res.ok, false, `${key} must be rejected`);
  }
});

test('every protected field is rejected loudly, not silently dropped', () => {
  for (const key of PERSON_PROTECTED_FIELDS) {
    const res = buildPersonUpdate({ full_name: 'Jessica', [key]: 'tampered' });
    assert.equal(res.ok, false, `${key} must be rejected`);
  }
});

test('role cannot be escalated through the full name endpoint', () => {
  const res = buildPersonUpdate({ full_name: 'Jessica', role: 'admin' });
  assert.equal(res.ok, false);
});

test('business name is rejected — it must not go back onto the person', () => {
  const res = buildPersonUpdate({ business_name: 'Van Brunt Holdings' });
  assert.equal(res.ok, false);
  if (!res.ok) assert.match(res.error, /business_name/);
});

test('the account phone stays read-only', () => {
  assert.equal(buildPersonUpdate({ phone: '(469) 555-0000' }).ok, false);
});

// ── Allow-list integrity ───────────────────────────────────────────────────

test('only full_name is ever written', () => {
  const res = buildPersonUpdate({
    full_name: 'Jessica', suite_number: 'Suite999', forwarding_address: 'x', nickname: 'Jess',
  });
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.deepEqual(res.update, { full_name: 'Jessica' });
  for (const key of Object.keys(res.update)) {
    assert.ok((PERSON_EDITABLE_FIELDS as readonly string[]).includes(key));
  }
});

test('the two editors write to disjoint field sets', () => {
  const person = buildPersonUpdate({ full_name: 'Jessica' });
  const mailbox = buildMailboxUpdate({ business_name: 'Van Brunt Holdings' });
  assert.equal(person.ok, true);
  assert.equal(mailbox.ok, true);
  if (!person.ok || !mailbox.ok) return;

  const overlap = Object.keys(person.update).filter(k => k in mailbox.update);
  assert.deepEqual(overlap, [], 'person and mailbox updates must not share columns');
});

// ── Validation ─────────────────────────────────────────────────────────────

test('an over-long full name is rejected', () => {
  assert.equal(buildPersonUpdate({ full_name: 'x'.repeat(FULL_NAME_MAX_LENGTH + 1) }).ok, false);
  assert.equal(buildPersonUpdate({ full_name: 'x'.repeat(FULL_NAME_MAX_LENGTH) }).ok, true);
});

test('non-string values are rejected', () => {
  assert.equal(buildPersonUpdate({ full_name: 42 }).ok, false);
  assert.equal(buildPersonUpdate({ full_name: { evil: true } }).ok, false);
});

test('non-object bodies are rejected', () => {
  assert.equal(buildPersonUpdate(null).ok, false);
  assert.equal(buildPersonUpdate('full_name=x').ok, false);
  assert.equal(buildPersonUpdate([{ full_name: 'x' }]).ok, false);
});

test('a body with nothing editable is rejected rather than issuing an empty write', () => {
  assert.equal(buildPersonUpdate({}).ok, false);
  assert.equal(buildPersonUpdate({ unrelated: 'x' }).ok, false);
});
