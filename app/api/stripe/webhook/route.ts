import 'server-only';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { assignSuiteNumber } from '@/lib/mailbox/suite';
import type { Database } from '@/types/database';

type ProfileRow  = Database['public']['Tables']['profiles']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');

  if (!sig) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    // Return 500 so Stripe retries — all handlers use upsert for idempotency
    return Response.json({ error: 'Handler error' }, { status: 500 });
  }

  return Response.json({ received: true });
}

// ── checkout.session.completed ─────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const email = session.customer_email ?? session.customer_details?.email ?? '';
  if (!email) {
    console.error('[webhook] checkout.session.completed has no email:', session.id);
    return;
  }

  const meta = session.metadata ?? {};
  const fullName = meta.customer_name ?? '';
  const businessName = meta.business_name ?? '';
  const phone = meta.phone ?? '';
  const mailScanning = meta.addon_mail_scanning === 'true';
  const businessPhone = meta.addon_business_phone === 'true';
  const googleBusiness = meta.addon_google_business === 'true';
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
  const stripeSubId = typeof session.subscription === 'string' ? session.subscription : null;

  const admin = createAdminClientAny();

  // 1. Find or create Supabase Auth user ─────────────────────────────────────
  let userId: string;

  const existingProfileRes = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  const existingProfile = existingProfileRes.data as Pick<ProfileRow, 'id'> | null;

  if (existingProfile) {
    // Existing account — use their ID
    userId = existingProfile.id;
  } else {
    // New customer — invite them to set a password.
    // Supabase sends a "You've been invited" email with a magic link.
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
      email,
      { data: { full_name: fullName, business_name: businessName } },
    );
    if (inviteErr || !inviteData?.user) {
      throw new Error(`Failed to invite user ${email}: ${inviteErr?.message}`);
    }
    userId = inviteData.user.id;
  }

  // 2. Upsert profile ─────────────────────────────────────────────────────────
  const { error: profileErr } = await admin.from('profiles').upsert(
    { id: userId, email, full_name: fullName, business_name: businessName, phone, role: 'customer' },
    { onConflict: 'id' },
  );
  if (profileErr) throw new Error(`Profile upsert failed: ${profileErr.message}`);

  // 3. Find or create customer record ────────────────────────────────────────
  let customerId: string;

  const existingCustomerRes = await admin
    .from('customers')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();
  const existingCustomer = existingCustomerRes.data as Pick<CustomerRow, 'id'> | null;

  if (existingCustomer) {
    customerId = existingCustomer.id;
    await admin
      .from('customers')
      .update({ stripe_customer_id: stripeCustomerId, status: 'active' })
      .eq('id', customerId);
  } else {
    const suiteNumber = await assignSuiteNumber();
    const addressLine = `802 North Goliad Street, Suite ${suiteNumber}, Rockwall, TX 75087`;

    const newCustomerRes = await admin
      .from('customers')
      .insert({
        profile_id: userId,
        stripe_customer_id: stripeCustomerId,
        status: 'active',
        suite_number: suiteNumber,
        business_address_line: addressLine,
      })
      .select('id')
      .single();
    const newCustomer = newCustomerRes.data as Pick<CustomerRow, 'id'> | null;

    if (newCustomerRes.error || !newCustomer) {
      throw new Error(`Customer insert failed: ${newCustomerRes.error?.message}`);
    }
    customerId = newCustomer.id;
  }

  // 4. Upsert subscription ────────────────────────────────────────────────────
  if (stripeSubId) {
    const { error: subErr } = await admin.from('subscriptions').upsert(
      {
        customer_id: customerId,
        stripe_subscription_id: stripeSubId,
        status: 'active',
        mail_scanning_enabled: mailScanning,
        business_phone_enabled: businessPhone,
        google_business_setup_purchased: googleBusiness,
      },
      { onConflict: 'stripe_subscription_id' },
    );
    if (subErr) throw new Error(`Subscription upsert failed: ${subErr.message}`);
  }

  console.log(`[webhook] checkout.session.completed → customer ${customerId} (${email})`);
}

// ── customer.subscription.created / updated ────────────────────────────────

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : null;
  if (!stripeCustomerId) return;

  const admin = createAdminClientAny();

  const customerRes = await admin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  const customer = customerRes.data as Pick<CustomerRow, 'id'> | null;

  if (!customer) {
    // Customer not in DB yet — checkout.session.completed will create it
    return;
  }

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  await admin.from('subscriptions').upsert(
    {
      customer_id: customer.id,
      stripe_subscription_id: sub.id,
      status: mapSubStatus(sub.status),
      current_period_end: periodEnd,
    },
    { onConflict: 'stripe_subscription_id' },
  );

  const custStatus = ['active', 'trialing'].includes(sub.status)
    ? 'active'
    : sub.status === 'canceled'
    ? 'cancelled'
    : 'suspended';

  await admin.from('customers').update({ status: custStatus }).eq('id', customer.id);
}

// ── customer.subscription.deleted ─────────────────────────────────────────

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const admin = createAdminClientAny();

  await admin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', sub.id);

  const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : null;
  if (stripeCustomerId) {
    await admin
      .from('customers')
      .update({ status: 'cancelled' })
      .eq('stripe_customer_id', stripeCustomerId);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function mapSubStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case 'active':             return 'active';
    case 'trialing':           return 'trialing';
    case 'past_due':           return 'past_due';
    case 'unpaid':             return 'unpaid';
    case 'canceled':           return 'cancelled';
    case 'incomplete':         return 'past_due';
    case 'incomplete_expired': return 'cancelled';
    case 'paused':             return 'past_due';
    default:                   return 'past_due';
  }
}
