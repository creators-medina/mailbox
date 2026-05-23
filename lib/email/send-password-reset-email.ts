import 'server-only';
import { getResend } from './resend';

const SUBJECT = 'Reset your My Biz Address password';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}): Promise<string | null> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error('RESEND_FROM_EMAIL is not configured');
  }

  const resend = getResend();
  const safeUrl = escapeHtml(resetUrl);

  const { data, error } = await resend.emails.send({
    from,
    to: email,
    subject: SUBJECT,
    html: renderHtml(safeUrl),
    text: renderText(resetUrl),
  });

  if (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Resend send failed: ${msg}`);
  }
  return data?.id ?? null;
}

function renderText(url: string): string {
  return [
    'Reset your My Biz Address password',
    '',
    'We received a request to reset the password for your My Biz Address account.',
    '',
    'Reset your password:',
    url,
    '',
    'If the button does not work, copy and paste the link above into your browser.',
    '',
    "If you didn't request this, you can safely ignore this email — your password",
    'will not change.',
    '',
    '— The My Biz Address Team',
  ].join('\n');
}

function renderHtml(url: string): string {
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
            <tr>
              <td style="padding:16px 32px 8px;">
                <h1 style="margin:0 0 14px;color:#ffffff;font-size:24px;line-height:1.25;font-weight:700;">Reset your password</h1>
                <p style="margin:0 0 22px;color:rgba(245,240,232,0.78);font-size:15px;line-height:1.65;">
                  We received a request to reset the password for your My Biz Address account. Click the button below to choose a new password.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" bgcolor="#C99A5A" style="border-radius:10px;">
                      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;color:#1a1206;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">Reset Password</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
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
            <tr>
              <td style="padding:24px 32px 28px;border-top:1px solid rgba(255,255,255,0.07);">
                <p style="margin:18px 0 0;color:rgba(245,240,232,0.4);font-size:12px;line-height:1.6;">
                  If you didn't request this, you can safely ignore this email — your password will not change.<br/>
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
