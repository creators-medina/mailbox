import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe';

// Add-on catalog. Reuses the existing price env vars already wired into
// /api/checkout (do NOT hardcode price IDs). `flag` is the subscriptions
// column the webhook flips on a successful purchase.
export const ADDONS = {
  mail_scanning: {
    priceEnv: 'STRIPE_PRICE_MAIL_SCANNING_MONTHLY',
    mode: 'subscription' as const,
    flag: 'mail_scanning_enabled' as const,
    label: 'Mail Scanning',
  },
  business_phone: {
    priceEnv: 'STRIPE_PRICE_BUSINESS_PHONE_MONTHLY',
    mode: 'subscription' as const,
    flag: 'business_phone_enabled' as const,
    label: 'Business Phone',
  },
  google_business: {
    priceEnv: 'STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME',
    mode: 'payment' as const,
    flag: 'google_business_setup_purchased' as const,
    label: 'Google Business Setup',
  },
} as const;

export type AddonKey = keyof typeof ADDONS;

type Result = { ok: true; url: string } | { ok: false; status: number; error: string };

// Authenticated-customer-only: starts a Stripe Checkout Session for one add-on.
// Reuses the customer's stripe_customer_id (creating one if missing). Never
// exposes the Stripe secret to the client.
export async function startAddonCheckout(addonKey: AddonKey): Promise<Result> {
  const addon = ADDONS[addonKey];

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: 'Unauthorized' };

  if (!process.env.STRIPE_SECRET_KEY) {
    return { ok: false, status: 503, error: 'Billing is not configured.' };
  }
  const priceId = process.env[addon.priceEnv];
  if (!priceId) {
    console.error(`[addon] missing price env ${addon.priceEnv}`);
    return { ok: false, status: 503, error: 'This add-on is not available right now.' };
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!base) {
    console.error('[addon] NEXT_PUBLIC_BASE_URL not set');
    return { ok: false, status: 503, error: 'Unable to start checkout.' };
  }

  const admin = createAdminClientAny();
  const { data: custData } = await admin
    .from('customers')
    .select('id, stripe_customer_id')
    .eq('profile_id', user.id)
    .maybeSingle();
  const customer = custData as { id: string; stripe_customer_id: string | null } | null;
  if (!customer) {
    return { ok: false, status: 404, error: 'No customer account found.' };
  }

  const stripe = getStripe();

  // Reuse the existing Stripe customer, or create one and persist it.
  let stripeCustomerId = customer.stripe_customer_id;
  if (!stripeCustomerId) {
    const created = await stripe.customers.create({ email: user.email ?? undefined });
    stripeCustomerId = created.id;
    await admin.from('customers').update({ stripe_customer_id: stripeCustomerId }).eq('id', customer.id);
  }

  const metadata = {
    purchase_type: 'addon',
    addon: addonKey,
    customer_db_id: customer.id,
  };

  const session = await stripe.checkout.sessions.create({
    mode: addon.mode,
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/account?billing=success`,
    cancel_url: `${base}/account?billing=cancelled`,
    metadata,
    ...(addon.mode === 'subscription' ? { subscription_data: { metadata } } : {}),
    ...(addon.mode === 'payment' ? { payment_intent_data: { metadata } } : {}),
  });

  if (!session.url) {
    return { ok: false, status: 500, error: 'Could not start checkout.' };
  }
  return { ok: true, url: session.url };
}
