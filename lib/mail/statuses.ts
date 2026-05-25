// Canonical mail item statuses — must match the production `mail_item_status`
// enum EXACTLY. Production has these six values (no `notified`, no `held`).
export const MAIL_ITEM_STATUSES = [
  'received',
  'scanned',
  'awaiting_action',
  'forwarded',
  'picked_up',
  'shredded',
] as const;

export type MailItemStatus = (typeof MAIL_ITEM_STATUSES)[number];

export const MAIL_ITEM_STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  scanned: 'Scanned',
  awaiting_action: 'Awaiting action',
  forwarded: 'Forwarded',
  picked_up: 'Picked up',
  shredded: 'Shredded',
};

export function mailStatusLabel(status: string): string {
  return MAIL_ITEM_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function isMailItemStatus(v: unknown): v is MailItemStatus {
  return typeof v === 'string' && (MAIL_ITEM_STATUSES as readonly string[]).includes(v);
}
