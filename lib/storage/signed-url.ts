import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const admin = createAdminClientAny();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) {
    // Safe: bucket + message only, never the service-role key.
    console.error(`[storage] signed URL failed for bucket ${bucket}:`, error.message);
    return null;
  }
  return (data as { signedUrl: string } | null)?.signedUrl ?? null;
}
