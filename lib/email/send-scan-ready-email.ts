import 'server-only';
import { getResend } from './resend';
import { renderEmailHtml, renderEmailText, type DetailRow } from './mail-event-layout';

const SUBJECT = 'Your mail scan is ready';

export async function sendScanReadyEmail({
  email,
  sender,
  title,
  receivedDate,
  // Always link to /account — private storage paths are never exposed in email.
  accountUrl,
}: {
  email: string;
  sender?: string | null;
  title?: string | null;
  receivedDate: string;
  accountUrl: string;
}): Promise<string | null> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('RESEND_FROM_EMAIL is not configured');

  const details: DetailRow[] = [];
  if (sender) details.push({ label: 'From', value: sender });
  if (title)  details.push({ label: 'Description', value: title });
  details.push({ label: 'Received', value: receivedDate });

  const heading = 'Your scan is ready';
  const paragraphs = [
    'We’ve scanned a piece of your mail. Sign in to your dashboard to view and download it securely.',
  ];
  const ctaLabel = 'View Scan';

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
