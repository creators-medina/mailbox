// Run with: npm test
//
// The mailbox number is shown and saved as "#" + number (#201). These tests pin:
//
//   1. Admin input is accepted as a number with or without "#", and the "#" is
//      never doubled (122 → #122, #122 → #122).
//   2. Every legacy stored shape (Suite201, MB1001, 201, #201) still displays
//      correctly as #201 / #1001 — existing customers are not migrated.
//   3. Duplicate checks treat every spelling of one number as the same number.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSuiteNumber as normalizeRaw,
  isValidSuiteNumber as isValidRaw,
  parseSuiteNumber as parseRaw,
  formatMailboxNumber as formatRaw,
  mailboxNumberVariants as variantsRaw,
  suiteFormatHint,
} from '../lib/mailbox/suite-format.ts';

// The prefix the app is configured with (lib/config/business.ts:suitePrefix).
// Passed explicitly so the module under test stays free of imports.
const PREFIX = 'MB';
const normalizeSuiteNumber = (v: unknown) => normalizeRaw(v, PREFIX);
const isValidSuiteNumber = (v: string) => isValidRaw(v, PREFIX);
const parseSuiteNumber = (v: unknown) => parseRaw(v, PREFIX);
const formatMailboxNumber = (v: unknown) => formatRaw(v, PREFIX);
const mailboxNumberVariants = (v: string) => variantsRaw(v, PREFIX);
const SUITE_FORMAT_HINT = suiteFormatHint(PREFIX);

// ── Admin input ─────────────────────────────────────────────────────────────

test('a number with or without # saves as #number, never ##', () => {
  const cases: Array<[string, string]> = [
    ['122', '#122'], ['#122', '#122'],
    ['201', '#201'], ['#201', '#201'],
    ['1001', '#1001'], ['#1001', '#1001'],
    ['305', '#305'], ['#412', '#412'],
    [' 305 ', '#305'], ['# 412', '#412'], ['##412', '#412'],
  ];
  for (const [input, expected] of cases) {
    const parsed = parseSuiteNumber(input);
    assert.equal(parsed.ok, true, `${input} must be valid`);
    if (parsed.ok) assert.equal(parsed.suiteNumber, expected, `${input} → ${expected}`);
  }
});

test('non-numeric input is rejected', () => {
  for (const input of ['', '   ', '#', 'abc', '#abc', '12A', '20 1', 'Room201', '#-12', '12.5']) {
    assert.equal(parseSuiteNumber(input).ok, false, `${input} must be invalid`);
  }
});

test('a digit run too long to be a real mailbox number is rejected, not truncated', () => {
  assert.equal(parseSuiteNumber('9'.repeat(15)).ok, true);
  assert.equal(parseSuiteNumber('9'.repeat(16)).ok, false);
});

test('non-string input is handled without throwing', () => {
  for (const input of [null, undefined, 42, {}, [], true]) {
    assert.equal(normalizeSuiteNumber(input), '');
    assert.equal(parseSuiteNumber(input).ok, false);
  }
});

test('isValidSuiteNumber operates on already-normalized values', () => {
  assert.equal(isValidSuiteNumber('#201'), true);
  assert.equal(isValidSuiteNumber('201'), false, 'raw input must be normalized first');
  assert.equal(isValidSuiteNumber('Suite201'), false);
});

test('the error message describes the # format and never says Suite', () => {
  assert.doesNotMatch(SUITE_FORMAT_HINT, /suite/i);
  assert.doesNotMatch(SUITE_FORMAT_HINT, /MB1001/);
  assert.match(SUITE_FORMAT_HINT, /#201/);
  const parsed = parseSuiteNumber('nonsense');
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.equal(parsed.error, SUITE_FORMAT_HINT);
});

// ── Existing data: every legacy stored shape displays as #number ────────────

test('legacy stored values display as #number without being rewritten', () => {
  const cases: Array<[string, string]> = [
    ['Suite122', '#122'], ['Suite201', '#201'], ['suite201', '#201'],
    ['Suite 201', '#201'], ['Suite #201', '#201'],
    ['MB1001', '#1001'], ['mb1001', '#1001'],
    ['122', '#122'], ['#122', '#122'], [' #122 ', '#122'],
    ['Suite12A', '#12A'],
  ];
  for (const [stored, expected] of cases) {
    assert.equal(formatMailboxNumber(stored), expected, `${stored} → ${expected}`);
  }
});

test('no displayed value ever contains Suite, MB, or a doubled #', () => {
  for (const stored of ['Suite122', 'MB1001', '#412', '412', 'Suite #7']) {
    const shown = formatMailboxNumber(stored)!;
    assert.doesNotMatch(shown, /suite/i);
    assert.doesNotMatch(shown, /^#?MB/i);
    assert.doesNotMatch(shown, /##/);
  }
});

test('an unassigned mailbox has no display value', () => {
  for (const stored of [null, undefined, '', '   ']) {
    assert.equal(formatMailboxNumber(stored), null);
  }
});

test('the generated prefix is only stripped when digits follow it', () => {
  assert.equal(formatMailboxNumber('MBxyz'), '#MBxyz');
});

// ── Duplicate detection across spellings ──────────────────────────────────

test('every spelling of one number is treated as the same number', () => {
  const v = mailboxNumberVariants('#201');
  for (const spelling of ['#201', '201', 'Suite201', 'Suite 201', 'Suite #201', 'MB201']) {
    assert.ok(v.includes(spelling), `${spelling} must count as #201`);
  }
  const g = mailboxNumberVariants('MB1042');
  for (const spelling of ['MB1042', '#1042', '1042', 'Suite1042']) {
    assert.ok(g.includes(spelling), `${spelling} must count as MB1042`);
  }
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
 * `.in('suite_number', variants).neq('id', …)` check followed by `.eq('id', …)`.
 */
function applySuiteChange(rows: MailboxRow[], targetId: string, input: unknown) {
  const parsed = parseSuiteNumber(input);
  if (!parsed.ok) return { ok: false as const, error: parsed.error, rows };

  const taken = mailboxNumberVariants(parsed.suiteNumber);
  const clash = rows.find(r => r.id !== targetId && r.suite_number !== null && taken.includes(r.suite_number));
  if (clash) return { ok: false as const, error: 'This mailbox number is already assigned.', rows };

  return {
    ok: true as const,
    rows: rows.map(r => (r.id === targetId ? { ...r, suite_number: parsed.suiteNumber } : { ...r })),
  };
}

test('changing Mailbox A suite leaves Mailbox B untouched', () => {
  const before = jessicaMailboxes();
  const res = applySuiteChange(before, 'mailbox-a', '130');
  assert.equal(res.ok, true);

  assert.equal(res.rows.find(r => r.id === 'mailbox-a')!.suite_number, '#130');
  assert.deepEqual(res.rows.find(r => r.id === 'mailbox-b'), before[1]);
});

test('changing Mailbox B suite leaves Mailbox A untouched', () => {
  const before = jessicaMailboxes();
  const res = applySuiteChange(before, 'mailbox-b', '#1001');
  assert.equal(res.ok, true);

  assert.equal(res.rows.find(r => r.id === 'mailbox-b')!.suite_number, '#1001');
  assert.deepEqual(res.rows.find(r => r.id === 'mailbox-a'), before[0]);
});

test('a suite change never alters Stripe identifiers or business names', () => {
  const res = applySuiteChange(jessicaMailboxes(), 'mailbox-a', '#130');
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
  // Mailbox B is stored in the legacy form Suite123; #123 and 123 are the same number.
  for (const input of ['123', '#123']) {
    const res = applySuiteChange(before, 'mailbox-a', input);
    assert.equal(res.ok, false, `${input} must clash with Suite123`);
    assert.deepEqual(res.rows, before, 'a rejected change must write nothing');
  }
  const res = applySuiteChange(before, 'mailbox-a', '#123');
  assert.equal(res.ok, false);
  assert.deepEqual(res.rows, before, 'a rejected change must write nothing');
});

test('re-saving a mailbox its own current suite is allowed', () => {
  // The duplicate check excludes the row being edited, so an admin opening the
  // editor and saving without changing anything must not hit a 409.
  const res = applySuiteChange(jessicaMailboxes(), 'mailbox-a', '122');
  assert.equal(res.ok, true);
});

test('an auto-provisioned mailbox can be re-saved with its generated suite', () => {
  // A customer provisioned as MB1001 whose admin opens the editor (which shows
  // 1001) and saves without changing it.
  const rows: MailboxRow[] = [{
    id: 'mailbox-legacy',
    profile_id: 'profile-legacy',
    stripe_customer_id: 'cus_TEST_LEGACY',
    suite_number: 'MB1001',
    business_name: 'Legacy Co',
  }];
  const res = applySuiteChange(rows, 'mailbox-legacy', '1001');
  assert.equal(res.ok, true);
  assert.equal(res.rows[0].suite_number, '#1001');
});
