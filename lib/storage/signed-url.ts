import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const admin = createAdminClientAny();
  const { data } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  return (data as { signedUrl: string } | null)?.signedUrl ?? null;
}
