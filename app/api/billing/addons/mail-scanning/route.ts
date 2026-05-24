import 'server-only';
import { startAddonCheckout } from '@/lib/billing/addons';

export const dynamic = 'force-dynamic';

export async function POST() {
  const result = await startAddonCheckout('mail_scanning');
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ url: result.url });
}
