import 'server-only';
import { getResend } from './resend';

const SUBJECT = 'Welcome to My Biz Address';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendOnboardingEmail({
  email,
  firstName,
  loginUrl,
}: {
  email: string;
  firstName?: string | null;
  loginUrl: string;
}): Promise<string | null> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }

  const resend = getResend();
  const name = (firstName ?? '').trim() || 'there';
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(loginUrl);

  const html = renderHtml(safeName, safeUrl);
  const text = renderText(name, loginUrl);

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: SUBJECT,
    html,
    text,
  });

  if (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Resend send failed: ${msg}`);
  }
  return data?.id ?? null;
}

function renderText(name: string, url: string): string {
  return [
    `Welcome to My Biz Address, ${name}!`,
    '',
    'Your virtual Rockwall business address is now active. Set your password to',
    'access your dashboard, view incoming mail, and manage scans, forwarding,',
    'and pickups online.',
    '',
    'Set your password:',
    url,
    '',
    'If the button in the email does not work, copy and paste the link above',
    'into your browser.',
    '',
    '— The My Biz Address Team',
  ].join('\n');
}

function renderHtml(name: string, url: string): string {
  // Table-based, inline-styled, dark-themed email for broad client support.
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <title>${SUBJECT}</title>
  </head>
  <body style="margin:0;padding:0;background:#050f1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050f1a;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#0b1a2b;border:1px solid rgba(201,154,90,0.22);border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <!-- Header -->
            <tr>
              <td style="padding:28px 32px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:34px;height:34px;background:rgba(181,138,82,0.14);border:1.5px solid #B58A52;border-radius:8px;text-align:center;color:#C99A5A;font-weight:700;font-size:12px;line-height:34px;">MB</td>
                    <td style="padding-left:12px;color:#f5f0e8;font-weight:700;font-size:16px;">My Biz Address</td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:16px 32px 8px;">
                <h1 style="margin:0 0 14px;color:#ffffff;font-size:24px;line-height:1.25;font-weight:700;">Welcome, ${name}.</h1>
                <p style="margin:0 0 16px;color:rgba(245,240,232,0.78);font-size:15px;line-height:1.65;">
                  Your virtual <strong style="color:#fff;">Rockwall business address</strong> is now active. Set your password to access your dashboard, where you can:
                </p>
                <ul style="margin:0 0 22px;padding-left:20px;color:rgba(245,240,232,0.78);font-size:15px;line-height:1.7;">
                  <li>View incoming mail with envelope photos</li>
                  <li>Request scans, forwarding, or local pickup</li>
                  <li>Manage your plan and account online</li>
                </ul>
              </td>
            </tr>
            <!-- CTA -->
            <tr>
              <td style="padding:0 32px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" bgcolor="#C99A5A" style="border-radius:10px;">
                      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;color:#1a1206;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">Set Your Password</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Fallback URL -->
            <tr>
              <td style="padding:18px 32px 0;">
                <p style="margin:0 0 6px;color:rgba(245,240,232,0.45);font-size:12px;line-height:1.5;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.5;">
                  <a href="${url}" target="_blank" style="color:#C99A5A;text-decoration:underline;">${url}</a>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:26px 32px 28px;border-top:1px solid rgba(255,255,255,0.07);margin-top:20px;">
                <p style="margin:18px 0 0;color:rgba(245,240,232,0.4);font-size:12px;line-height:1.6;">
                  Questions? Just reply to this email and our Rockwall team will help.<br/>
                  — The My Biz Address Team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
