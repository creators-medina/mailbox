import 'server-only';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type DetailRow = { label: string; value: string };

type LayoutInput = {
  subject: string;
  heading: string;
  paragraphs: string[];
  details: DetailRow[];
  ctaLabel: string;
  ctaUrl: string;
};

// Shared dark/gold My Biz Address email shell, matching the onboarding/reset
// templates. Inputs are escaped here, so callers pass raw strings.
export function renderEmailHtml({ subject, heading, paragraphs, details, ctaLabel, ctaUrl }: LayoutInput): string {
  const safeHeading = escapeHtml(heading);
  const safeUrl = escapeHtml(ctaUrl);
  const safeCta = escapeHtml(ctaLabel);

  const paraHtml = paragraphs
    .map(p => `<p style="margin:0 0 16px;color:rgba(245,240,232,0.78);font-size:15px;line-height:1.65;">${escapeHtml(p)}</p>`)
    .join('');

  const detailHtml = details.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;">
        ${details.map((d, i) => `
        <tr>
          <td style="padding:11px 16px;color:rgba(245,240,232,0.5);font-size:13px;${i < details.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06);' : ''}width:38%;">${escapeHtml(d.label)}</td>
          <td style="padding:11px 16px;color:#ffffff;font-size:14px;font-weight:600;${i < details.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.06);' : ''}">${escapeHtml(d.value)}</td>
        </tr>`).join('')}
      </table>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark light" />
    <title>${escapeHtml(subject)}</title>
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
                <h1 style="margin:0 0 14px;color:#ffffff;font-size:23px;line-height:1.25;font-weight:700;">${safeHeading}</h1>
                ${paraHtml}
                ${detailHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" bgcolor="#C99A5A" style="border-radius:10px;">
                      <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 28px;color:#1a1206;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">${safeCta}</a>
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
                  <a href="${safeUrl}" target="_blank" style="color:#C99A5A;text-decoration:underline;">${safeUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px 28px;border-top:1px solid rgba(255,255,255,0.07);">
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

export function renderEmailText({ heading, paragraphs, details, ctaLabel, ctaUrl }: Omit<LayoutInput, 'subject'>): string {
  const lines: string[] = [heading, ''];
  for (const p of paragraphs) { lines.push(p, ''); }
  for (const d of details) { lines.push(`${d.label}: ${d.value}`); }
  if (details.length) lines.push('');
  lines.push(`${ctaLabel}:`, ctaUrl, '', '— The My Biz Address Team');
  return lines.join('\n');
}
