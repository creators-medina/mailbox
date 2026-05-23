import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { sendPasswordResetEmail } from '@/lib/email/send-password-reset-email';

export const dynamic = 'force-dynamic';

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Branded password-reset request. ALWAYS returns { ok: true } regardless of
// whether the account exists, so the response can't be used to enumerate
// users. The branded email is sent via Resend; we never use Supabase's
// default reset sender. Errors are logged server-side only (no tokens/secrets).
export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    // Still generic — don't reveal parsing details.
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
    const admin = createAdminClientAny();
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${appUrl}/auth/callback?email=${encodeURIComponent(email)}`,
      },
    });

    // No such user (or any generateLink error) → stay generic, send nothing.
    if (error) {
      console.warn(`[reset] generateLink did not produce a link for a request (user may not exist)`);
      return Response.json({ ok: true });
    }

    const actionLink: string | undefined =
      data?.properties?.action_link ?? (data as { action_link?: string } | null)?.action_link;
    if (!actionLink) {
      console.warn('[reset] generateLink returned no action_link');
      return Response.json({ ok: true });
    }

    const id = await sendPasswordResetEmail({ email, resetUrl: actionLink });
    console.log(`[reset] password reset email sent (id ${id ?? 'n/a'})`);
  } catch (err) {
    // Never surface details to the client.
    console.error('[reset] failed to issue password reset:', err);
  }

  return Response.json({ ok: true });
}
