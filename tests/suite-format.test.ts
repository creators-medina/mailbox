// Run with: npm test
//
// Phase 2 covers suite integrity. These tests pin the two things that changed:
//
//   1. Suite validation now accepts BOTH live production formats — the
//      generated MB1001 and the hand-assigned Suite201 — where it previously
//      rejected the one the system itself produces.
//   2. Nothing that was valid under the old rule became invalid. The old rule
//      is reproduced verbatim below and asserted against, so a future edit that
//      narrows the format fails here rather than in production.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSuiteNumber as normalizeRaw,
  isValidSuiteNumber as isValidRaw,
  parseSuiteNumber as parseRaw,
  suiteFormatHint,
} from '../lib/mailbox/suite-format.ts';

// The prefix the app is configured with (lib/config/business.ts:suitePrefix).
// Passed explicitly so the module under test stays free of imports.
const PREFIX = 'MB';
const normalizeSuiteNumber = (v: unknown) => normalizeRaw(v, PREFIX);
const isValidSuiteNumber = (v: string) => isValidRaw(v, PREFIX);
const parseSuiteNumber = (v: unknown) => parseRaw(v, PREFIX);
const SUITE_FORMAT_HINT = suiteFormatHint(PREFIX);

/** The exact regex the editor and route enforced before Phase 2. */
const LEGACY_SUITE_RE = /^Suite[0-9A-Za-z-]{1,10}$/;
/** The exact normalization they applied before Phase 2. */
const legacyNormalize = (v: string) => v.trim().replace(/^suite/i, 'Suite');

// ── Regression guard: no previously valid suite may become invalid ──────────

const LEGACY_VALID = [
  'Suite201', 'Suite1', 'Suite12A', 'Suite-12', 'SuiteA', 'Suite1234567890',
  'suite201', ' Suite201 ', 'SUITE201',
];

test('every suite valid under the old rule is still valid', () => {
  for (const input of LEGACY_VALID) {
    const legacy = legacyNormalize(input);
    assert.ok(LEGACY_SUITE_RE.test(legacy), `fixture ${input} should be legacy-valid`);

    const parsed = parseSuiteNumber(input);
    assert.equal(parsed.ok, true, `${input} must remain valid`);
    if (parsed.ok) {
      assert.equal(parsed.suiteNumber, legacy, `${input} must normalize identically to before`);
    }
  }
});

test('every suite invalid under the old rule is still invalid, unless it is the generated format', () => {
  const stillInvalid = [
    '', '   ', 'Suite', '201', 'Suite12345678901', 'Suite 201',
    'Suite_12', 'Room201', 'Suite!', 'MB', 'MB', 'MBxyz',
  ];
  for (const input of stillInvalid) {
    assert.equal(parseSuiteNumber(input).ok, false, `${input} must stay invalid`);
  }
});

// ── The fix: the generated format is now accepted ──────────────────────────

test('the generated MB format is accepted', () => {
  for (const input of ['MB1001', 'MB1042', 'MB1', 'MB999999999999999']) {
    const parsed = parseSuiteNumber(input);
    assert.equal(parsed.ok, true, `${input} must be valid`);
    if (parsed.ok) assert.equal(parsed.suiteNumber, input);
  }
});

test('the generated format was rejected by the old rule — this is the bug being fixed', () => {
  assert.equal(LEGACY_SUITE_RE.test(legacyNormalize('MB1001')), false);
  assert.equal(parseSuiteNumber('MB1001').ok, true);
});

test('generated-prefix casing is canonicalised', () => {
  for (const input of ['mb1001', 'Mb1001', 'mB1001', ' mb1001 ']) {
    const parsed = parseSuiteNumber(input);
    assert.equal(parsed.ok, true, `${input} must be valid`);
    if (parsed.ok) assert.equal(parsed.suiteNumber, 'MB1001');
  }
});

test('the prefix is only canonicalised when digits follow it', () => {
  // "MBxyz" is not a suite number, so it stays invalid rather than being
  // coerced into one.
  assert.equal(parseSuiteNumber('mbxyz').ok, false);
  assert.equal(normalizeSuiteNumber('mbxyz'), 'mbxyz');
});

test('a digit run too long to be a real suite is rejected, not truncated', () => {
  assert.equal(parseSuiteNumber('MB' + '9'.repeat(16)).ok, false);
});

// ── Normalization details ──────────────────────────────────────────────────

test('surrounding whitespace is trimmed', () => {
  assert.equal(normalizeSuiteNumber('  Suite201  '), 'Suite201');
  assert.equal(normalizeSuiteNumber('\tMB1001\n'), 'MB1001');
});

test('the remainder after the prefix is preserved exactly', () => {
  // Suite12a and Suite12A are different suites and must not be merged.
  assert.equal(normalizeSuiteNumber('suite12a'), 'Suite12a');
  assert.equal(normalizeSuiteNumber('suite12A'), 'Suite12A');
});

test('non-string input is handled without throwing', () => {
  for (const input of [null, undefined, 42, {}, [], true]) {
    assert.equal(normalizeSuiteNumber(input), '');
    assert.equal(parseSuiteNumber(input).ok, false);
  }
});

test('isValidSuiteNumber operates on already-normalized values', () => {
  assert.equal(isValidSuiteNumber('Suite201'), true);
  assert.equal(isValidSuiteNumber('MB1001'), true);
  assert.equal(isValidSuiteNumber('suite201'), false, 'raw input must be normalized first');
});

test('the error message names both accepted formats', () => {
  assert.match(SUITE_FORMAT_HINT, /Suite201/);
  assert.match(SUITE_FORMAT_HINT, /MB1001/);
  const parsed = parseSuiteNumber('nonsense');
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.equal(parsed.error, SUITE_FORMAT_HINT);
});

// ── Multi-mailbox: suite edits stay scoped to one mailbox ──────────────────
// Phase 1 proved mailbox field edits are scoped. Suite assignment is a separate
// write path, so the same guarantee is asserted for it here with the same
// two-mailbox fixture.

type MailboxRow = {
  id: string;
  profile_id: string;
  stripe_customer_id: string | null;
  suite_number: string | null;
  business_name: string | null;
};

function jessicaMailboxes(): MailboxRow[] {
  return [
    {
      id: 'mailbox-a',
      profile_id: 'profile-jessica',
      stripe_customer_id: 'cus_TEST_JESSICA',
      suite_number: 'Suite122',
      business_name: 'Van Brunt & Company',
    },
    {
      id: 'mailbox-b',
      profile_id: 'profile-jessica',
      stripe_customer_id: 'cus_TEST_JESSICA',
      suite_number: 'Suite123',
      business_name: 'Van Brunt & Company, LLC',
    },
  ];
}

/**
 * Stand-in for the suite route's write: validate, reject a duplicate, then
 * update exactly one row selected by id — mirroring the route's
 * `.eq('suite_number', …).neq('id', …)` check followed by `.eq('id', …)`.
 */
function applySuiteChange(rows: MailboxRow[], targetId: string, input: unknown) {
  const parsed = parseSuiteNumber(input);
  if (!parsed.ok) return { ok: false as const, error: parsed.error, rows };

  const clash = rows.find(r => r.id !== targetId && r.suite_number === parsed.suiteNumber);
  if (clash) return { ok: false as const, error: 'This suite number is already assigned.', rows };

  return {
    ok: true as const,
    rows: rows.map(r => (r.id === targetId ? { ...r, suite_number: parsed.suiteNumber } : { ...r })),
  };
}

test('changing Mailbox A suite leaves Mailbox B untouched', () => {
  const before = jessicaMailboxes();
  const res = applySuiteChange(before, 'mailbox-a', 'Suite130');
  assert.equal(res.ok, true);

  assert.equal(res.rows.find(r => r.id === 'mailbox-a')!.suite_number, 'Suite130');
  assert.deepEqual(res.rows.find(r => r.id === 'mailbox-b'), before[1]);
});

test('changing Mailbox B suite leaves Mailbox A untouched', () => {
  const before = jessicaMailboxes();
  const res = applySuiteChange(before, 'mailbox-b', 'MB1001');
  assert.equal(res.ok, true);

  assert.equal(res.rows.find(r => r.id === 'mailbox-b')!.suite_number, 'MB1001');
  assert.deepEqual(res.rows.find(r => r.id === 'mailbox-a'), before[0]);
});

test('a suite change never alters Stripe identifiers or business names', () => {
  const res = applySuiteChange(jessicaMailboxes(), 'mailbox-a', 'Suite130');
  assert.equal(res.ok, true);
  for (const row of res.rows) {
    assert.equal(row.stripe_customer_id, 'cus_TEST_JESSICA');
    assert.equal(row.profile_id, 'profile-jessica');
  }
  assert.equal(res.rows.find(r => r.id === 'mailbox-a')!.business_name, 'Van Brunt & Company');
  assert.equal(res.rows.find(r => r.id === 'mailbox-b')!.business_name, 'Van Brunt & Company, LLC');
});

test('one mailbox cannot take a suite another mailbox already holds', () => {
  const before = jessicaMailboxes();
  const res = applySuiteChange(before, 'mailbox-a', 'Suite123');
  assert.equal(res.ok, false);
  assert.deepEqual(res.rows, before, 'a rejected change must write nothing');
});

test('re-saving a mailbox its own current suite is allowed', () => {
  // The duplicate check excludes the row being edited, so an admin opening the
  // editor and saving without changing anything must not hit a 409.
  const res = applySuiteChange(jessicaMailboxes(), 'mailbox-a', 'Suite122');
  assert.equal(res.ok, true);
});

test('an auto-provisioned mailbox can be re-saved with its generated suite', () => {
  // The exact case the old validation broke: a customer provisioned as MB1001
  // whose admin opens the suite editor and saves.
  const rows: MailboxRow[] = [{
    id: 'mailbox-legacy',
    profile_id: 'profile-legacy',
    stripe_customer_id: 'cus_TEST_LEGACY',
    suite_number: 'MB1001',
    business_name: 'Legacy Co',
  }];
  const res = applySuiteChange(rows, 'mailbox-legacy', 'MB1001');
  assert.equal(res.ok, true);
  assert.equal(res.rows[0].suite_number, 'MB1001');
});
