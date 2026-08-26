// Mailbox operational identity — the safe-to-edit half of a customer record.
//
// This module is the single place that decides which fields an administrator
// may change when editing a mailbox/suite, and it is deliberately free of any
// I/O so the boundary can be tested directly. Two rules it exists to enforce:
//
//   1. A mailbox edit writes ONLY to operational columns on ONE customers row.
//      It can never reach public.profiles (the person), public.subscriptions,
//      or any Stripe identifier — those are billing identity and are changed
//      only by a deliberate billing action.
//
//   2. An edit is scoped to one mailbox. Two mailboxes owned by the same
//      billing person hold their own business_name/recipient_name/etc., so
//      renaming one cannot alter the other.
//
// Nothing here is server-only: it is pure data validation, imported by the
// admin API route and by tests.

/** Operational columns on public.customers that an admin may edit. */
export const MAILBOX_EDITABLE_FIELDS = [
  'business_name',
  'recipient_name',
  'contact_email',
  'contact_phone',
  'forwarding_address',
] as const;

export type MailboxEditableField = (typeof MAILBOX_EDITABLE_FIELDS)[number];

/**
 * Columns that identify who pays, who logs in, or how a row is linked. A
 * mailbox edit must never write any of these, even if a caller sends them.
 * `email` is here because customers.email still backs account resolution for
 * customers who have never signed in (see resolveCustomer in app/account).
 */
export const BILLING_PROTECTED_FIELDS = [
  'id',
  'profile_id',
  'user_id',
  'email',
  'status',
  'stripe_customer_id',
  'created_at',
] as const;

/** Longest accepted value for any free-text mailbox field. */
export const MAILBOX_FIELD_MAX_LENGTH = 200;
/** Forwarding addresses are multi-line and get more room. */
export const FORWARDING_ADDRESS_MAX_LENGTH = 500;

const MAX_LENGTH: Record<MailboxEditableField, number> = {
  business_name: MAILBOX_FIELD_MAX_LENGTH,
  recipient_name: MAILBOX_FIELD_MAX_LENGTH,
  contact_email: MAILBOX_FIELD_MAX_LENGTH,
  contact_phone: 40,
  forwarding_address: FORWARDING_ADDRESS_MAX_LENGTH,
};

const LABEL: Record<MailboxEditableField, string> = {
  business_name: 'Business name',
  recipient_name: 'Recipient name',
  contact_email: 'Mailbox contact email',
  contact_phone: 'Mailbox contact phone',
  forwarding_address: 'Forwarding address',
};

// Intentionally permissive: staff enter real-world addresses, and rejecting a
// legitimate one is worse than accepting an odd one. We only catch shapes that
// are certainly not an address.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MailboxUpdate = Partial<Record<MailboxEditableField, string | null>>;

export type BuildMailboxUpdateResult =
  | { ok: true; update: MailboxUpdate }
  | { ok: false; error: string };

function isEditableField(key: string): key is MailboxEditableField {
  return (MAILBOX_EDITABLE_FIELDS as readonly string[]).includes(key);
}

/**
 * Turns a raw request body into the exact column set to write to ONE customers
 * row, or an error.
 *
 * - Absent keys are left untouched (partial updates preserve existing values).
 * - An empty/whitespace string clears the field to NULL — that is how an admin
 *   removes a value.
 * - Any key that is not in MAILBOX_EDITABLE_FIELDS is dropped silently, and a
 *   billing-protected key is rejected loudly so a mistake surfaces instead of
 *   being quietly ignored.
 */
export function buildMailboxUpdate(body: unknown): BuildMailboxUpdateResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request body.' };
  }

  const input = body as Record<string, unknown>;

  for (const key of BILLING_PROTECTED_FIELDS) {
    if (key in input) {
      return {
        ok: false,
        error: `"${key}" is billing or account data and cannot be changed from the mailbox editor.`,
      };
    }
  }

  const update: MailboxUpdate = {};

  for (const key of Object.keys(input)) {
    if (!isEditableField(key)) continue;

    const raw = input[key];
    if (raw === undefined) continue;

    if (raw === null) {
      update[key] = null;
      continue;
    }

    if (typeof raw !== 'string') {
      return { ok: false, error: `${LABEL[key]} must be text.` };
    }

    const trimmed = raw.trim();
    if (trimmed === '') {
      update[key] = null;
      continue;
    }

    if (trimmed.length > MAX_LENGTH[key]) {
      return { ok: false, error: `${LABEL[key]} must be ${MAX_LENGTH[key]} characters or fewer.` };
    }

    if (key === 'contact_email' && !EMAIL_RE.test(trimmed)) {
      return { ok: false, error: 'Mailbox contact email must be a valid email address.' };
    }

    update[key] = trimmed;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: 'No editable mailbox fields were provided.' };
  }

  return { ok: true, update };
}

// ── Display resolution ──────────────────────────────────────────────────────

type MailboxSource = {
  business_name?: string | null;
  recipient_name?: string | null;
  suite_number?: string | null;
};

type PersonSource = {
  business_name?: string | null;
  full_name?: string | null;
} | null | undefined;

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return null;
}

/**
 * The name to show for a mailbox, preferring the mailbox's own operational
 * business name and falling back to the legacy person-level values so
 * customers provisioned before migration 020 keep rendering exactly as before.
 */
export function resolveMailboxDisplayName(
  mailbox: MailboxSource,
  person: PersonSource,
): string | null {
  return firstNonEmpty(
    mailbox.business_name,
    person?.business_name,
    mailbox.recipient_name,
    person?.full_name,
  );
}

/** The person/business a piece of mail is addressed to at this mailbox. */
export function resolveMailboxRecipientName(
  mailbox: MailboxSource,
  person: PersonSource,
): string | null {
  return firstNonEmpty(mailbox.recipient_name, person?.full_name);
}
