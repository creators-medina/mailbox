// Person-level identity — the half of a customer record that belongs to the
// human being, not to any one mailbox.
//
// Companion to lib/mailbox/mailbox-profile.ts, which owns the mailbox half.
// The two are deliberately separate modules writing to separate tables:
//
//   profiles.full_name        → the person. One row per auth user, so a change
//                               is visible on every mailbox that person owns.
//                               That is correct: it is the same person.
//   customers.business_name   → the mailbox. Per suite, so renaming Suite 122
//                               can never touch Suite 123. Owned solely by
//                               mailbox-profile.ts — never written here.
//
// Like its companion this module has no I/O, so the boundary it enforces can be
// tested directly rather than inferred from the route.

/** The only column on public.profiles an admin may edit from the admin panel. */
export const PERSON_EDITABLE_FIELDS = ['full_name'] as const;

export type PersonEditableField = (typeof PERSON_EDITABLE_FIELDS)[number];

/**
 * Fields that must never be written through this path, each rejected for its
 * own reason rather than merely omitted:
 *
 *   business_name  — belongs to the mailbox. Writing it here would put business
 *                    identity back on the person and reintroduce the exact
 *                    cross-mailbox contamination Phase 1 removed.
 *   email          — the login identity. Changing it here would desynchronise
 *                    profiles.email from auth.users and could lock a customer
 *                    out of their own account.
 *   role           — privilege escalation.
 *   phone          — the account phone, deliberately read-only in the admin UI.
 *   id             — the auth user id; the row's identity.
 *   stripe_customer_id / stripe_subscription_id / status
 *                  — billing. Not columns on profiles at all, listed so a
 *                    caller that sends them is refused rather than silently
 *                    ignored.
 */
export const PERSON_PROTECTED_FIELDS = [
  'id',
  'email',
  'role',
  'phone',
  'business_name',
  'status',
  'stripe_customer_id',
  'stripe_subscription_id',
  'created_at',
] as const;

/** Longest accepted full name. */
export const FULL_NAME_MAX_LENGTH = 120;

export type PersonUpdate = Partial<Record<PersonEditableField, string | null>>;

export type BuildPersonUpdateResult =
  | { ok: true; update: PersonUpdate }
  | { ok: false; error: string };

function isEditableField(key: string): key is PersonEditableField {
  return (PERSON_EDITABLE_FIELDS as readonly string[]).includes(key);
}

/**
 * Turns a raw request body into the exact column set to write to ONE profiles
 * row, or an error.
 *
 * - An empty or whitespace-only string clears the name to NULL, which is how an
 *   admin removes a value.
 * - A protected field in the body is rejected with a 400-worthy message rather
 *   than dropped, so a mistake surfaces instead of appearing to succeed.
 * - Any other unrecognised key is ignored.
 */
export function buildPersonUpdate(body: unknown): BuildPersonUpdateResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request body.' };
  }

  const input = body as Record<string, unknown>;

  for (const key of PERSON_PROTECTED_FIELDS) {
    if (key in input) {
      return {
        ok: false,
        error: `"${key}" cannot be changed from the account holder editor.`,
      };
    }
  }

  const update: PersonUpdate = {};

  for (const key of Object.keys(input)) {
    if (!isEditableField(key)) continue;

    const raw = input[key];
    if (raw === undefined) continue;

    if (raw === null) {
      update[key] = null;
      continue;
    }

    if (typeof raw !== 'string') {
      return { ok: false, error: 'Full name must be text.' };
    }

    const trimmed = raw.trim();
    if (trimmed === '') {
      update[key] = null;
      continue;
    }

    if (trimmed.length > FULL_NAME_MAX_LENGTH) {
      return { ok: false, error: `Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.` };
    }

    update[key] = trimmed;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: 'No editable account holder fields were provided.' };
  }

  return { ok: true, update };
}
