import 'server-only';
import { getResend } from './resend';
import { renderEmailHtml, renderEmailText, type DetailRow } from './mail-event-layout';
import { BUSINESS } from '@/lib/config/business';

const SUBJECT = 'Action needed: Complete your My Biz Address mail authorization';

export async function sendComplianceRequestEmail({
  email,
  businessName,
  accountUrl,
}: {
  email: string;
  businessName?: string | null;
  accountUrl: string;
}): Promise<string | null> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('RESEND_FROM_EMAIL is not configured');

  const greeting = (businessName ?? '').trim() || 'Hello';
  const heading = 'Complete your mail authorization';
  const paragraphs = [
    `${greeting} — to start receiving and handling mail at your My Biz Address, federal USPS rules require a signed Form 1583 and a valid photo ID on file. It only takes a few minutes and our team is here to help.`,
    'Once we have your completed Form 1583 and a government-issued photo ID, we can begin accepting and processing your mail right away.',
    `Questions? Just reply to this email or reach us at ${BUSINESS.email}.`,
  ];

  const details: DetailRow[] = [
    { label: 'Required', value: 'Signed USPS Form 1583' },
    { label: 'Required', value: 'Valid government photo ID' },
  ];

  const ctaLabel = 'Complete mail authorization';

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
