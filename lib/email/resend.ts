import 'server-only';
import { Resend } from 'resend';

// Singleton Resend client. Reads RESEND_API_KEY at call time (never at import)
// so importing this module can't throw during build/static analysis.
let client: Resend | null = null;

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Names only — never log or include the secret value.
    throw new Error('RESEND_API_KEY is not configured');
  }
  if (!client) client = new Resend(key);
  return client;
}
