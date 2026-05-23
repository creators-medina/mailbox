import 'server-only';
import { getResend } from './resend';
import { renderEmailHtml, renderEmailText, type DetailRow } from './mail-event-layout';

const SUBJECT = 'Your mail request has been updated';

const REQUEST_TYPE_LABEL: Record<string, string> = {
  scan: 'Scan', forward: 'Forwarding', pickup: 'Pickup', shred: 'Shred', hold: 'Hold',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
};

export async function sendMailRequestUpdateEmail({
  email,
  requestType,
  status,
  mailSender,
  mailTitle,
  accountUrl,
}: {
  email: string;
  requestType: string;
  status: string;
  mailSender?: string | null;
  mailTitle?: string | null;
  accountUrl: string;
}): Promise<string | null> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('RESEND_FROM_EMAIL is not configured');

  const typeLabel = REQUEST_TYPE_LABEL[requestType] ?? requestType;
  const statusLabel = STATUS_LABEL[status] ?? status;

  const details: DetailRow[] = [
    { label: 'Request', value: `${typeLabel} request` },
    { label: 'Status', value: statusLabel },
  ];
  if (mailSender) details.push({ label: 'Mail from', value: mailSender });
  if (mailTitle)  details.push({ label: 'Description', value: mailTitle });

  const heading = 'Your mail request was updated';
  const paragraphs = [
    `Your ${typeLabel.toLowerCase()} request is now marked “${statusLabel}.” You can review the details in your dashboard.`,
  ];
  const ctaLabel = 'View Request';

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: SUBJECT,
    html: renderEmailHtml({ subject: SUBJECT, heading, paragraphs, details, ctaLabel, ctaUrl: accountUrl }),
    text: renderEmailText({ heading, paragraphs, details, ctaLabel, ctaUrl: accountUrl }),
  });

  if (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Resend send failed: ${msg}`);
  }
  return data?.id ?? null;
}
