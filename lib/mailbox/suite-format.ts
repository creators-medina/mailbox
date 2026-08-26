// Suite number formatting and validation, shared by the admin suite editor and
// its API route so the two can never disagree about what is acceptable.
//
// WHY THIS EXISTS
// ───────────────
// Two suite formats are live in production at once:
//
//   • MB1001   — what provisioning generates (lib/mailbox/suite.ts, using
//                BUSINESS.suitePrefix + suiteStartNum)
//   • Suite201 — what staff type when assigning by hand
//
// The editor and route previously validated only /^Suite[0-9A-Za-z-]{1,10}$/,
// which rejects the generated format. An admin opening the suite editor on an
// auto-provisioned customer could not save the value already sitting in the
// field — they had to rename the customer onto the Suite… scheme to save at
// all. buildCustomerAddress() in lib/config/business.ts already renders both
// correctly, so only validation was out of step.
//
// Both shapes are accepted here. Nothing that was valid before became invalid.
//
// This module deliberately imports nothing: the generated prefix is passed in
// by the caller (from BUSINESS.suitePrefix) rather than imported, which keeps
// it a pure function of its arguments and directly testable.

/** "Suite" followed by 1–10 letters, digits, or hyphens. e.g. Suite201, Suite12A */
const SUITE_LABEL_RE = /^Suite[0-9A-Za-z-]{1,10}$/;

/** Escapes a configured prefix for safe use inside a RegExp. */
function escape(prefix: string): string {
  return prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Human-readable description of both accepted shapes, for error messages. */
export function suiteFormatHint(prefix: string): string {
  return `Suite must look like Suite201 or ${prefix}1001.`;
}

/**
 * Canonicalises the capitalisation of a recognised prefix and trims
 * surrounding whitespace. The remainder is preserved exactly as entered, so
 * Suite12a and Suite12A stay distinct values.
 *
 * "suite201" → "Suite201"  ·  "mb1001" → "MB1001"  ·  "Suite-12" → "Suite-12"
 */
export function normalizeSuiteNumber(input: unknown, prefix: string): string {
  const raw = (typeof input === 'string' ? input : '').trim();
  if (raw === '') return '';

  // Leading "suite" → canonical "Suite". Unchanged from the previous behaviour.
  if (/^suite/i.test(raw)) return raw.replace(/^suite/i, 'Suite');

  // Leading configured prefix followed by digits → canonical prefix casing.
  // The digit lookahead matters: without it "mbxyz" would be coerced into a
  // prefixed value instead of staying invalid.
  const generatedPrefix = new RegExp(`^${escape(prefix)}(?=[0-9])`, 'i');
  if (generatedPrefix.test(raw)) return raw.replace(generatedPrefix, prefix);

  return raw;
}

/** True when an already-normalized value is one of the two accepted shapes. */
export function isValidSuiteNumber(value: string, prefix: string): boolean {
  // The digit bound rejects a run long enough to be a data-entry accident
  // rather than a suite number.
  const generated = new RegExp(`^${escape(prefix)}[0-9]{1,15}$`);
  return SUITE_LABEL_RE.test(value) || generated.test(value);
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
