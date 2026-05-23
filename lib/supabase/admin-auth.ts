import 'server-only';
import { createAdminClientAny } from './admin';

// Generates a Supabase "recovery" link the customer can use to set their
// password after a paid checkout. We use the recovery flow (not invite) so it
// works whether the auth user was just created or already existed.
export async function generatePasswordSetupLink(email: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  const admin = createAdminClientAny();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  if (error) {
    throw new Error(`generateLink failed: ${error.message}`);
  }

  // supabase-js returns the URL at data.properties.action_link.
  const actionLink: string | undefined =
    data?.properties?.action_link ?? (data as { action_link?: string } | null)?.action_link;

  if (!actionLink) {
    throw new Error('generateLink returned no action_link');
  }
  return actionLink;
}
