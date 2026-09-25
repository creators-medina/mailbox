// Mailbox number formatting and validation, shared by the admin mailbox-number
// editor, its API route, and every screen/email that displays the number, so
// they can never disagree about what is acceptable or how it looks.
//
// CANONICAL FORM
// ──────────────
// A mailbox number is shown to people as "#" followed by the number: #201.
// New admin saves are stored in that same form.
//
// Older rows are NOT migrated. The customers.suite_number column may still hold
// any of the shapes that were live before this change:
//
//   • MB1001    — what provisioning generates (lib/mailbox/suite.ts, using
//                 BUSINESS.suitePrefix + suiteStartNum)
//   • Suite201  — what staff used to type when assigning by hand
//   • 201 / #201
//
// formatMailboxNumber() renders all of them as #1001 / #201, so existing
// customers display correctly without any data being rewritten.
//
// This module deliberately imports nothing: the generated prefix is passed in
// by the caller (from BUSINESS.suitePrefix) rather than imported, which keeps
// it a pure function of its arguments and directly testable.

/** Canonical stored/displayed shape: "#" followed by 1–15 digits. */
const MAILBOX_NUMBER_RE = /^#[0-9]{1,15}$/;

/** Escapes a configured prefix for safe use inside a RegExp. */
function escape(prefix: string): string {
  return prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes any leading label — "Suite", the generated prefix (only when digits
 * follow it), "#", and surrounding whitespace — returning the bare identifier.
 *
 * "Suite201" → "201"  ·  "MB1001" → "1001"  ·  "#122" → "122"  ·  "Suite #7" → "7"
 */
function stripMailboxLabel(raw: string, prefix: string): string {
  const label = new RegExp(`^(?:suite|${escape(prefix)}(?=[0-9])|#|\\s)+`, 'i');
  return raw.trim().replace(label, '').trim();
}

/**
 * Display form of a stored mailbox number, e.g. "#201". Handles every legacy
 * stored shape (Suite201, MB1001, 201, #201) and never doubles the "#".
 * Returns null when there is no number.
 */
export function formatMailboxNumber(value: unknown, prefix: string): string | null {
  const raw = (typeof value === 'string' ? value : '').trim();
  if (raw === '') return null;
  const bare = stripMailboxLabel(raw, prefix);
  return bare === '' ? raw : `#${bare}`;
}

/**
 * Every stored spelling that refers to the same mailbox number as `value`.
 * Used for duplicate checks, because older rows may hold Suite201 or MB201
 * while new saves hold #201.
 */
export function mailboxNumberVariants(value: string, prefix: string): string[] {
  const bare = stripMailboxLabel(value, prefix);
  if (bare === '') return [value];
  return Array.from(new Set([
    value,
    `#${bare}`,
    bare,
    `Suite${bare}`,
    `Suite ${bare}`,
    `Suite #${bare}`,
    `${prefix}${bare}`,
  ]));
}

/** Human-readable description of the accepted input, for error messages. */
export function suiteFormatHint(_prefix?: string): string {
  return 'Mailbox number must be a number, like 201 or #201.';
}

/**
 * Canonicalises admin input to "#<number>". A leading "#" is optional and is
 * never doubled; surrounding whitespace is trimmed.
 *
 * "122" → "#122"  ·  "#122" → "#122"  ·  " 201 " → "#201"
 */
export function normalizeSuiteNumber(input: unknown, prefix: string): string {
  return formatMailboxNumber(input, prefix) ?? '';
}

/** True when an already-normalized value is a valid mailbox number (#201). */
export function isValidSuiteNumber(value: string, _prefix?: string): boolean {
  // The digit bound rejects a run long enough to be a data-entry accident
  // rather than a mailbox number.
  return MAILBOX_NUMBER_RE.test(value);
}

/**
 * Normalise and validate in one step.
 * Returns the canonical value, or an error string suitable for display.
 */
export function parseSuiteNumber(input: unknown, prefix: string):
  | { ok: true; suiteNumber: string }
  | { ok: false; error: string } {
  const suiteNumber = normalizeSuiteNumber(input, prefix);
  if (!isValidSuiteNumber(suiteNumber, prefix)) {
    return { ok: false, error: suiteFormatHint(prefix) };
  }
  return { ok: true, suiteNumber };
}
