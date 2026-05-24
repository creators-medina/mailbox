import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClientAny();
  const { data } = await admin
    .from('customers')
    .select('stripe_customer_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  const stripeCustomerId = (data as { stripe_customer_id: string | null } | null)
    ?.stripe_customer_id;

  if (!stripeCustomerId) {
    return Response.json({ error: 'No billing account found' }, { status: 404 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!base) {
    return Response.json({ error: 'Billing return URL is not configured.' }, { status: 503 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${base.replace(/\/$/, '')}/account`,
  });

  return Response.json({ url: session.url });
}
