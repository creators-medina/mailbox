// Canonical mail item statuses. Must match the production `mail_item_status`
// enum (see migration 017, which adds any missing labels idempotently).
export const MAIL_ITEM_STATUSES = [
  'received',
  'notified',
  'scanned',
  'held',
  'forwarded',
  'picked_up',
  'shredded',
] as const;

export type MailItemStatus = (typeof MAIL_ITEM_STATUSES)[number];

export function isMailItemStatus(v: unknown): v is MailItemStatus {
  return typeof v === 'string' && (MAIL_ITEM_STATUSES as readonly string[]).includes(v);
}
