import 'server-only';
import { getResend } from './resend';
import { renderEmailHtml, renderEmailText, type DetailRow } from './mail-event-layout';

const SUBJECT = 'New mail received at your My Biz Address';

export async function sendMailReceivedEmail({
  email,
  businessName,
  suiteNumber,
  sender,
  title,
  receivedDate,
  accountUrl,
}: {
  email: string;
  businessName?: string | null;
  suiteNumber?: string | null;
  sender?: string | null;
  title?: string | null;
  receivedDate: string;
  accountUrl: string;
}): Promise<string | null> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('RESEND_FROM_EMAIL is not configured');

  const details: DetailRow[] = [];
  if (suiteNumber) details.push({ label: 'Suite', value: suiteNumber });
  if (sender)      details.push({ label: 'From', value: sender });
  if (title)       details.push({ label: 'Description', value: title });
  details.push({ label: 'Received', value: receivedDate });

  const heading = 'You have new mail';
  const paragraphs = [
    `${(businessName ?? '').trim() || 'Hello'} — a new piece of mail has arrived at your My Biz Address and is ready to view in your dashboard.`,
  ];
  const ctaLabel = 'View Mail in Dashboard';

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
