import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';
import SignOutButton from './SignOutButton';
import AddressCard from './components/AddressCard';
import OnboardingChecklist, { type ChecklistItem } from './components/OnboardingChecklist';
import MailInboxCard from './components/MailInboxCard';
import SubscriptionCard from './components/SubscriptionCard';
import MailAuthorizationCard from './components/MailAuthorizationCard';
import QuickActionsCard from './components/QuickActionsCard';

type ProfileRow      = Database['public']['Tables']['profiles']['Row'];
type CustomerRow     = Database['public']['Tables']['customers']['Row'];
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type MailItemRow     = Database['public']['Tables']['mail_items']['Row'];
type MailRequestRow  = Database['public']['Tables']['mail_requests']['Row'];

export const metadata: Metadata = {
  title: 'My Account — My Biz Address',
  robots: { index: false, follow: false },
};

const REQUEST_STATUS_CLASS: Record<string, string> = {
  pending:     'mock-badge-new',
  in_progress: 'mock-badge-scanned',
  completed:   'mock-badge-ready',
  cancelled:   'mock-badge-held',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Use the service-role client for lookups so RLS can't hide a customer
  // whose profile_id was never linked. This is a server component — the
  // service-role key is never sent to the browser.
  const admin = createAdminClientAny();

  const profileRes = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = profileRes.data as ProfileRow | null;

  // Admins and staff don't have a customer portal — send them to the admin shell.
  if (profile?.role === 'admin' || profile?.role === 'staff') {
    redirect('/admin');
  }

  // Resolve the customer for this signed-in user, tolerant of how the row was
  // linked: profile_id, user_id (if that column exists), or matching email.
  const { customer, matchedBy } = await resolveCustomer(admin, user.id, user.email ?? null);

  // Self-heal: if we matched by something other than profile_id, link the row
  // to this user so future loads (and RLS-based reads) resolve directly.
  if (customer && matchedBy !== 'profile_id' && (customer as CustomerRow).profile_id !== user.id) {
    await admin.from('customers').update({ profile_id: user.id }).eq('id', (customer as CustomerRow).id);
    (customer as CustomerRow).profile_id = user.id;
  }

  // Safe diagnostics — ids/booleans only, no secrets.
  console.log('[account] lookup', {
    userId: user.id,
    email: user.email,
    customerFound: !!customer,
    matchedBy,
    customerId: customer ? (customer as CustomerRow).id : null,
  });

  // Orphan / unpaid users: no customer record at all → show the start-a-plan page.
  if (!customer) {
    return <NoPlan />;
  }

  const c = customer as CustomerRow;

  let subscription: SubscriptionRow | null = null;
  let mailItems: MailItemRow[] = [];
  let mailRequests: MailRequestRow[] = [];

  const [sr, mr, rr] = await Promise.all([
    admin.from('subscriptions').select('*').eq('customer_id', c.id)
      .order('created_at', { ascending: false }).limit(1),
    admin.from('mail_items').select('*').eq('customer_id', c.id)
      .order('received_at', { ascending: false }).limit(10),
    admin.from('mail_requests').select('*').eq('customer_id', c.id)
      .order('created_at', { ascending: false }).limit(5),
  ]);
  subscription = ((sr.data ?? [])[0] ?? null) as SubscriptionRow | null;
  mailItems    = (mr.data ?? []) as MailItemRow[];
  mailRequests = (rr.data ?? []) as MailRequestRow[];

  console.log('[account] subscription', {
    subscriptionFound: !!subscription,
    customerStatus: c.status,
    subscriptionStatus: subscription?.status ?? null,
  });

  // Treat the mailbox as active when the customer is active OR there's an
  // active/trialing subscription.
  const isActive =
    c.status === 'active' ||
    (subscription ? ['active', 'trialing'].includes(subscription.status) : false);

  const displayName = profile?.business_name
    || (profile?.full_name ? profile.full_name.split(' ')[0] : null)
    || user.email
    || 'there';
  const statusKey   = isActive ? 'active' : (c.status ?? 'pending');
  const statusClass = statusKey === 'active'    ? 'status-pill-active'
    : statusKey === 'cancelled' ? 'status-pill-cancelled'
    : 'status-pill-pending';
  const dotClass    = statusKey === 'active'    ? 'status-dot-active'
    : statusKey === 'cancelled' ? 'status-dot-cancelled'
    : 'status-dot-pending';
  const statusLabel = statusKey === 'active'    ? 'Active'
    : statusKey === 'cancelled' ? 'Cancelled'
    : 'Setting up';

  const checklist: ChecklistItem[] = [
    { label: 'Account activated', status: 'done', note: 'Your password is set and you can sign in.' },
    {
      label: 'Business address assigned',
      status: c.suite_number ? 'done' : 'pending',
      note: c.suite_number ? undefined : 'We’re assigning your suite number now.',
    },
    {
      label: 'USPS Form 1583 signed',
      status: 'pending',
      note: 'Required before we can legally receive mail on your behalf.',
    },
    {
      label: 'Photo ID verified',
      status: 'pending',
      note: 'A valid government photo ID is required to authorize mail handling.',
    },
  ];
  if (subscription?.mail_scanning_enabled) {
    checklist.push({ label: 'Mail scanning active', status: 'done' });
  }
  if (subscription?.business_phone_enabled) {
    checklist.push({ label: 'Business phone active', status: 'done' });
  }
  if (subscription?.google_business_setup_purchased) {
    checklist.push({ label: 'Google Business setup purchased', status: 'done' });
  }

  return (
    <>
      <Nav />
      <section className="w-section dark" style={{ minHeight: '100vh', paddingTop: 96, paddingBottom: 80 }}>
        <div className="w-section-inner" style={{ maxWidth: 900, textAlign: 'left' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="w-hero-eyebrow" style={{ marginBottom: 6 }}>Dashboard</div>
              <h1 style={{ font: '700 28px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
                Welcome back, {displayName}.
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className={`status-pill ${statusClass}`}>
                <span className={`status-dot ${dotClass}`} />
                {statusLabel}
              </span>
              <SignOutButton />
            </div>
          </div>

          <AddressCard
            suiteNumber={c.suite_number}
            addressLine={c.business_address_line}
          />

          <OnboardingChecklist items={checklist} />

          <div className="dash-grid" style={{ marginBottom: 20 }}>

            <MailInboxCard mailItems={mailItems} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <SubscriptionCard
                subscription={subscription}
                hasStripeCustomer={Boolean(c.stripe_customer_id)}
              />
              <MailAuthorizationCard />
              <QuickActionsCard />
            </div>
          </div>

          {mailRequests.length > 0 && (
            <div className="dash-card" style={{ marginBottom: 20 }}>
              <span className="dash-card-title">Recent requests</span>
              <div>
                {mailRequests.map(r => (
                  <div key={r.id} className="dash-mail-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '600 13px/1.3 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.88)', marginBottom: 3, textTransform: 'capitalize' }}>
                        {r.request_type} request
                      </div>
                      <div style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                        {fmt(r.created_at)}
                      </div>
                    </div>
                    <span className={`mock-badge ${REQUEST_STATUS_CLASS[r.status] ?? 'mock-badge-held'}`}
                          style={{ flexShrink: 0 }}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </>
  );
}

// Resolve a customer for the signed-in user, tolerant of how the row is
// linked. Order: profile_id → user_id (if the column exists) → email
// (case-insensitive exact). Uses the service-role client (RLS bypassed).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveCustomer(admin: any, userId: string, email: string | null): Promise<{
  customer: CustomerRow | null;
  matchedBy: 'profile_id' | 'user_id' | 'email' | null;
}> {
  // 1) profile_id
  {
    const { data } = await admin.from('customers').select('*').eq('profile_id', userId).maybeSingle();
    if (data) return { customer: data as CustomerRow, matchedBy: 'profile_id' };
  }
  // 2) user_id — column may not exist in this schema; ignore errors.
  {
    const { data, error } = await admin.from('customers').select('*').eq('user_id', userId).maybeSingle();
    if (!error && data) return { customer: data as CustomerRow, matchedBy: 'user_id' };
  }
  // 3) email (case-insensitive, verified exact in JS to avoid ilike wildcards).
  if (email) {
    const { data } = await admin.from('customers').select('*').ilike('email', email).limit(2);
    const rows = (data ?? []) as Array<CustomerRow & { email?: string | null }>;
    const match = rows.find((r) => (r.email ?? '').toLowerCase() === email.toLowerCase());
    if (match) return { customer: match as CustomerRow, matchedBy: 'email' };
  }
  return { customer: null, matchedBy: null };
}

function NoPlan() {
  return (
    <>
      <Nav />
      <section
        className="w-section dark"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 96, paddingBottom: 80 }}
      >
        <div className="w-section-inner" style={{ maxWidth: 560, textAlign: 'center' }}>
          <div className="w-hero-eyebrow" style={{ marginBottom: 10 }}>Account</div>
          <h1 style={{ font: '700 30px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: '0 0 14px' }}>
            Your account isn&rsquo;t connected to a mailbox plan yet.
          </h1>
          <p
            style={{
              font: '400 16px/1.65 var(--font-text,sans-serif)',
              color: 'var(--c-text-2)',
              margin: '0 auto 32px',
              maxWidth: 460,
            }}
          >
            You&rsquo;re signed in, but we don&rsquo;t have an active business
            address plan on file for this email. Choose a plan to get your
            Rockwall address and start receiving mail.
          </p>
          <div className="w-cta-row" style={{ justifyContent: 'center', marginBottom: 20 }}>
            <a className="w-cta-pill filled" href="/signup">Get your address</a>
            <a className="w-cta-pill outline" href="/#pricing">View plans ›</a>
          </div>
          <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '0 0 18px' }}>
            Already paid and seeing this? Make sure you used the same email at
            checkout, or <a href="/#contact" style={{ color: 'var(--c-gold-2,#C99A5A)' }}>contact us</a> and we&rsquo;ll sort it out.
          </p>
          <SignOutButton />
        </div>
      </section>
      <Footer />
    </>
  );
}
