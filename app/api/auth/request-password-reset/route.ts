import 'server-only';
import { generateRecoveryLink } from '@/lib/supabase/admin-auth';
import { sendPasswordResetEmail } from '@/lib/email/send-password-reset-email';

export const dynamic = 'force-dynamic';

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Branded password-reset request. ALWAYS returns { ok: true } regardless of
// whether the account exists, so the response can't be used to enumerate
// users. We email a token_hash link to /auth/reset-password (which only
// verifies the OTP on an explicit user click) so email scanners/prefetchers
// can't consume the one-time token on delivery (the otp_expired bug).
export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: true });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !isEmail(email)) {
    return Response.json({ ok: true });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error('[reset] NEXT_PUBLIC_APP_URL not configured — cannot build reset link');
    return Response.json({ ok: true });
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('[reset] Resend not configured (RESEND_API_KEY / RESEND_FROM_EMAIL) — skipping send');
    return Response.json({ ok: true });
  }

  try {
    const result = await generateRecoveryLink(email, `${appUrl}/auth/reset-password`);

    let resetUrl: string;
    if (result.tokenHash) {
      // Preferred: our own URL; the OTP is only consumed when the user clicks
      // "Continue" on the reset page, so scanners can't burn it on delivery.
      resetUrl =
        `${appUrl}/auth/reset-password` +
        `?email=${encodeURIComponent(email)}` +
        `&type=recovery` +
        `&token_hash=${encodeURIComponent(result.tokenHash)}`;
    } else if (result.actionLink) {
      // Fallback: no token_hash exposed — send Supabase's action_link. (Still
      // susceptible to scanner prefetch; see notes.)
      console.warn('[reset] token_hash unavailable — falling back to action_link');
      resetUrl = result.actionLink;
    } else {
      console.warn('[reset] generateLink produced neither token_hash nor action_link');
      return Response.json({ ok: true });
    }

    const id = await sendPasswordResetEmail({ email, resetUrl });
    console.log(`[reset] password reset email sent (id ${id ?? 'n/a'})`);
  } catch (err) {
    // Generic to the client; user may simply not exist.
    console.warn('[reset] could not issue reset (user may not exist):', err instanceof Error ? err.message : 'unknown');
  }

  return Response.json({ ok: true });
}

