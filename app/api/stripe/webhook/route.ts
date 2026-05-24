import 'server-only';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { assignSuiteNumber, buildCustomerAddress } from '@/lib/mailbox/suite';
import { generateRecoveryLink } from '@/lib/supabase/admin-auth';
import { sendOnboardingEmail } from '@/lib/email/send-onboarding-email';
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
  const meta = session.metadata ?? {};

  // Add-on purchase by an existing customer (Phase 5g) — flip the flag on their
  // existing subscription row and stop. Do NOT re-provision user/profile/suite.
  if (meta.purchase_type === 'addon') {
    await handleAddonPurchase(session, meta);
    return;
  }

  const email = session.customer_email ?? session.customer_details?.email ?? '';
  if (!email) {
    console.error('[webhook] checkout.session.completed has no email:', session.id);
    return;
  }

  const fullName = meta.customer_name ?? '';
  const businessName = meta.business_name ?? '';
  const phone = meta.phone ?? '';
  const mailScanning = meta.addon_mail_scanning === 'true';
  const businessPhone = meta.addon_business_phone === 'true';
  const googleBusiness = meta.addon_google_business === 'true';
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
  const stripeSubId = typeof session.subscription === 'string' ? session.subscription : null;

  console.log(`[webhook] checkout.session.completed → provisioning ${email} (session ${session.id})`);

  const admin = createAdminClientAny();

  // 1. Idempotently resolve or create the Supabase Auth user. Provisioning
  //    must NEVER depend on sending an email (no inviteUserByEmail here), so a
  //    missing/misconfigured SMTP can't block a paid customer's account. The
  //    onboarding email is sent separately (Phase 3) and is non-fatal.
  const userId = await resolveOrCreateUserId(admin, email, { fullName, businessName });

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
    const addressLine = buildCustomerAddress(suiteNumber);

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

  console.log(`[webhook] provisioned customer ${customerId} for ${email} (user ${userId})`);

  // Onboarding email — strictly non-fatal. Runs only after provisioning
  // succeeds; any failure is logged and swallowed so the webhook still 200s.
  await sendOnboardingEmailSafe(email, fullName);
}

// ── Add-on purchase (Phase 5g) ─────────────────────────────────────────────

const ADDON_FLAG: Record<string, 'mail_scanning_enabled' | 'business_phone_enabled' | 'google_business_setup_purchased'> = {
  mail_scanning: 'mail_scanning_enabled',
  business_phone: 'business_phone_enabled',
  google_business: 'google_business_setup_purchased',
};

// Flips the purchased add-on flag on the customer's existing subscription row.
// Resolves the customer from metadata (our DB id) or the Stripe customer id.
async function handleAddonPurchase(
  session: Stripe.Checkout.Session,
  meta: Record<string, string>,
) {
  const addon = meta.addon ?? '';
  const flag = ADDON_FLAG[addon];
  if (!flag) {
    console.error('[webhook] addon purchase with unknown addon:', addon, session.id);
    return;
  }

  const admin = createAdminClientAny();
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;

  // Resolve the customer row.
  let customerId = meta.customer_db_id || '';
  if (!customerId && stripeCustomerId) {
    const { data } = await admin
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();
    customerId = (data as { id: string } | null)?.id ?? '';
  }
  if (!customerId) {
    console.error('[webhook] addon purchase could not resolve customer:', session.id);
    return;
  }

  // Update the customer's most-recent subscription row; create one if none.
  const { data: subRow } = await admin
    .from('subscriptions')
    .select('id')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subRow) {
    const { error } = await admin
      .from('subscriptions')
      .update({ [flag]: true })
      .eq('id', (subRow as { id: string }).id);
    if (error) throw new Error(`Addon flag update failed: ${error.message}`);
  } else {
    const { error } = await admin
      .from('subscriptions')
      .insert({ customer_id: customerId, status: 'active', [flag]: true });
    if (error) throw new Error(`Addon subscription insert failed: ${error.message}`);
  }

  console.log(`[webhook] addon ${addon} → ${flag}=true for customer ${customerId}`);
}

// Best-effort onboarding email. Never throws — provisioning has already
// succeeded by the time this runs, and Stripe must receive a 200.
async function sendOnboardingEmailSafe(email: string, fullName: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[webhook] RESEND_API_KEY not set — skipping onboarding email');
    return;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.warn('[webhook] NEXT_PUBLIC_APP_URL not set — skipping onboarding email');
    return;
  }
  const firstName = fullName.trim().split(/\s+/)[0] || null;
  try {
    // token_hash flow (same as forgot-password): the OTP is only consumed when
    // the user clicks "Set Your Password" on /auth/reset-password, so email
    // scanners/prefetchers can't burn the link on delivery (otp_expired).
    const { tokenHash, actionLink } = await generateRecoveryLink(
      email,
      `${appUrl}/auth/reset-password`,
    );

    let loginUrl: string;
    if (tokenHash) {
      loginUrl =
        `${appUrl}/auth/reset-password` +
        `?email=${encodeURIComponent(email)}` +
        `&type=recovery` +
        `&token_hash=${encodeURIComponent(tokenHash)}`;
    } else if (actionLink) {
      console.warn('[webhook] token_hash unavailable — falling back to action_link');
      loginUrl = actionLink;
    } else {
      console.warn('[webhook] generateRecoveryLink produced no link — skipping onboarding email');
      return;
    }

    const id = await sendOnboardingEmail({ email, firstName, loginUrl });
    console.log(`[webhook] onboarding email sent to ${email} (id ${id ?? 'n/a'})`);
  } catch (err) {
    console.error(`[webhook] onboarding email failed for ${email}:`, err);
  }
}

// ── Auth user resolution (idempotent, email-independent) ────────────────────

// Returns the auth.users id for `email`, creating the user if needed.
// Order: (1) reuse the id from an existing profile, (2) create a confirmed
// user WITHOUT sending any email, (3) if the email already exists in
// auth.users (orphaned — no profile), find and reuse that id. This removes
// the old failure mode where a leftover auth user with no profile 500'd the
// webhook on every retry.
async function resolveOrCreateUserId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  email: string,
  meta: { fullName: string; businessName: string },
): Promise<string> {
  // 1) Fast path — existing profile by email.
  const existing = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
  const existingId = (existing.data as Pick<ProfileRow, 'id'> | null)?.id;
  if (existingId) return existingId;

  // 2) Create the auth user. email_confirm: true so they're active immediately;
  //    no invite/confirmation email is sent (set-password link comes in Phase 3).
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: meta.fullName, business_name: meta.businessName },
  });
  const createdId = created?.data?.user?.id as string | undefined;
  if (createdId) return createdId;

  // 3) Creation failed — most likely the email already exists in auth.users
  //    without a profile. Find that user and reuse it (self-heal).
  console.warn(
    `[webhook] createUser failed for ${email} (${created?.error?.message ?? 'unknown'}); searching existing auth users`,
  );
  const foundId = await findAuthUserIdByEmail(admin, email);
  if (foundId) return foundId;

  throw new Error(
    `Could not resolve or create auth user for ${email}: ${created?.error?.message ?? 'unknown error'}`,
  );
}

// Paginate auth.users to find a user id by email (case-insensitive). Only hit
// on the rare conflict path, so the linear scan is acceptable at launch scale.
async function findAuthUserIdByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  email: string,
): Promise<string | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = (data?.users ?? []) as { id: string; email?: string | null }[];
    if (error || users.length === 0) break;
    const match = users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (match) return match.id;
    if (users.length < 200) break;
  }
  return null;
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

  // Add-on purchases (Phase 5g) create their own Stripe subscription. We keep a
  // single subscriptions row per customer, so don't insert a duplicate row for a
  // secondary (add-on) subscription — its flag is set in handleAddonPurchase.
  const existingRes = await admin
    .from('subscriptions')
    .select('id, stripe_subscription_id')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const existing = existingRes.data as { id: string; stripe_subscription_id: string | null } | null;
  const basePrice = process.env.STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY;
  const priceIds = (sub.items?.data ?? []).map(i => i.price?.id).filter(Boolean) as string[];
  const isPrimary = !existing
    || existing.stripe_subscription_id === sub.id
    || (!!basePrice && priceIds.includes(basePrice));
  if (!isPrimary) {
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
  const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : null;

  // Is this a tracked (primary) subscription row, or a secondary add-on sub?
  const { data: rowData } = await admin
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();
  const trackedRow = rowData as { id: string } | null;

  if (trackedRow) {
    // Primary subscription cancelled → cancel the row and the customer.
    await admin.from('subscriptions').update({ status: 'cancelled' }).eq('stripe_subscription_id', sub.id);
    if (stripeCustomerId) {
      await admin.from('customers').update({ status: 'cancelled' }).eq('stripe_customer_id', stripeCustomerId);
    }
    return;
  }

  // No tracked row → this is an add-on subscription. Turn off its flag on the
  // customer's primary subscription row; do NOT cancel the whole customer.
  if (!stripeCustomerId) return;
  const flag = addonFlagForSub(sub);
  if (!flag) return;

  const { data: cust } = await admin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  const customerId = (cust as { id: string } | null)?.id;
  if (!customerId) return;

  const { data: primary } = await admin
    .from('subscriptions')
    .select('id')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const primaryId = (primary as { id: string } | null)?.id;
  if (primaryId) {
    await admin.from('subscriptions').update({ [flag]: false }).eq('id', primaryId);
    console.log(`[webhook] add-on cancelled → ${flag}=false for customer ${customerId}`);
  }
}

// Maps a subscription's recurring add-on price back to its flag column.
function addonFlagForSub(sub: Stripe.Subscription): 'mail_scanning_enabled' | 'business_phone_enabled' | null {
  const priceIds = (sub.items?.data ?? []).map(i => i.price?.id).filter(Boolean) as string[];
  if (process.env.STRIPE_PRICE_MAIL_SCANNING_MONTHLY && priceIds.includes(process.env.STRIPE_PRICE_MAIL_SCANNING_MONTHLY)) {
    return 'mail_scanning_enabled';
  }
  if (process.env.STRIPE_PRICE_BUSINESS_PHONE_MONTHLY && priceIds.includes(process.env.STRIPE_PRICE_BUSINESS_PHONE_MONTHLY)) {
    return 'business_phone_enabled';
  }
  return null;
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
