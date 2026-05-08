import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';
import SignOutButton from './SignOutButton';

type ProfileRow      = Database['public']['Tables']['profiles']['Row'];
type CustomerRow     = Database['public']['Tables']['customers']['Row'];
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type MailItemRow     = Database['public']['Tables']['mail_items']['Row'];

export const metadata: Metadata = {
  title: 'My Account — My Biz Address',
  robots: { index: false, follow: false },
};

const MAIL_STATUS_CLASS: Record<string, string> = {
  received: 'mock-badge-new',
  notified:  'mock-badge-new',
  scanned:   'mock-badge-scanned',
  held:      'mock-badge-held',
  forwarded: 'mock-badge-ready',
  picked_up: 'mock-badge-ready',
  shredded:  'mock-badge-held',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch all data in parallel
  const [profileRes, customerRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('customers').select('*').eq('profile_id', user.id).maybeSingle(),
  ]);

  const profile = profileRes.data as ProfileRow | null;
  const customer = customerRes.data as CustomerRow | null;

  let subscription: SubscriptionRow | null = null;
  let mailItems: MailItemRow[] = [];

  const customerId = customer?.id ?? null;
  if (customerId) {
    const [sr, mr] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('customer_id', customerId).maybeSingle(),
      supabase.from('mail_items').select('*').eq('customer_id', customerId)
        .order('received_at', { ascending: false }).limit(10),
    ]);
    subscription = sr.data as SubscriptionRow | null;
    mailItems = (mr.data ?? []) as MailItemRow[];
  }

  const displayName = profile?.business_name || profile?.full_name || user.email || 'there';
  const statusKey = customer?.status ?? 'pending';
  const statusClass = statusKey === 'active' ? 'status-pill-active'
    : statusKey === 'cancelled' ? 'status-pill-cancelled'
    : 'status-pill-pending';
  const dotClass = statusKey === 'active' ? 'status-dot-active'
    : statusKey === 'cancelled' ? 'status-dot-cancelled'
    : 'status-dot-pending';
  const statusLabel = statusKey === 'active' ? 'Active'
    : statusKey === 'cancelled' ? 'Cancelled'
    : 'Setting up';

  return (
    <>
      <Nav />
      <section className="w-section dark" style={{ minHeight: '100vh', paddingTop: 96, paddingBottom: 80 }}>
        <div className="w-section-inner" style={{ maxWidth: 900, textAlign: 'left' }}>

          {/* ── Header row ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="w-hero-eyebrow" style={{ marginBottom: 6 }}>Dashboard</div>
              <h1 style={{ font: '700 28px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
                Welcome back, {displayName}.
              </h1>
            </div>
            <SignOutButton />
          </div>

          {/* ── A. Address card ────────────────────────────────────── */}
          <div className="dash-card" style={{ marginBottom: 20, borderColor: customer?.status === 'active' ? 'rgba(74,222,128,0.18)' : 'var(--c-border-2,rgba(255,255,255,0.13))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: customer ? 20 : 0 }}>
              <span className="dash-card-title" style={{ margin: 0 }}>Your business address</span>
              <span className={`status-pill ${statusClass}`}>
                <span className={`status-dot ${dotClass}`} />
                {statusLabel}
              </span>
            </div>

            {customer ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 20px', alignItems: 'start' }}>
                <span style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)', paddingTop: 3 }}>Suite</span>
                <span style={{ font: '800 32px/1 var(--font-display,sans-serif)', letterSpacing: '-0.5px', color: 'var(--c-gold-2,#d4aa50)' }}>
                  {customer.suite_number ?? '—'}
                </span>
                <span style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>Address</span>
                <span style={{ font: '500 16px/1.5 var(--font-text,sans-serif)', color: '#fff' }}>
                  {customer.business_address_line ?? '802 North Goliad Street, Rockwall, TX 75087'}
                </span>
              </div>
            ) : (
              <p style={{ font: '400 14px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '10px 0 0' }}>
                Your suite number is being assigned. You&rsquo;ll receive an email once your address is ready — usually within a few hours.
              </p>
            )}
          </div>

          {/* ── Main 2-col grid ────────────────────────────────────── */}
          <div className="dash-grid" style={{ marginBottom: 20 }}>

            {/* ── C. Mail feed ──────────────────────────────────────── */}
            <div className="dash-card">
              <span className="dash-card-title">Mail inbox</span>
              {mailItems.length > 0 ? (
                <div>
                  {mailItems.map(item => (
                    <div key={item.id} className="dash-mail-item">
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0, marginTop: 1,
                        background: 'var(--c-surface-2,#222)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg viewBox="0 0 16 12" width="13" height="10" fill="none"
                             stroke="var(--c-gold-2,#d4aa50)" strokeWidth="1.4"
                             strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="1" width="14" height="10" rx="1.5"/>
                          <path d="M1 3l7 5 7-5"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: '600 13px/1.3 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.88)', marginBottom: 3 }}>
                          {item.sender ?? 'Unknown sender'}
                        </div>
                        <div style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                          {fmt(item.received_at)}
                        </div>
                      </div>
                      <span className={`mock-badge ${MAIL_STATUS_CLASS[item.status] ?? 'mock-badge-held'}`}
                            style={{ flexShrink: 0 }}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <svg viewBox="0 0 40 32" width="40" height="32" fill="none"
                       stroke="var(--c-text-3)" strokeWidth="1.5"
                       strokeLinecap="round" strokeLinejoin="round"
                       style={{ marginBottom: 12, opacity: 0.4 }}>
                    <rect x="2" y="4" width="36" height="24" rx="3"/>
                    <path d="M2 9l18 12 18-12"/>
                  </svg>
                  <p style={{ font: '500 14px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
                    No mail received yet.
                  </p>
                  <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '6px 0 0', opacity: 0.7 }}>
                    Envelope images will appear here when mail arrives.
                  </p>
                </div>
              )}
            </div>

            {/* ── Right column ─────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ── B. Subscription card ──────────────────────────── */}
              <div className="dash-card">
                <span className="dash-card-title">Subscription</span>
                <div className="addon-row" style={{ paddingTop: 0 }}>
                  <span className="addon-row-label">Business Address</span>
                  <span style={{ font: '700 14px/1 var(--font-display,sans-serif)', color: '#fff' }}>$29.99<span style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>/mo</span></span>
                </div>
                {subscription ? (
                  <>
                    <div className="addon-row">
                      <span className="addon-row-label">Mail Scanning</span>
                      {subscription.mail_scanning_enabled
                        ? <span className="addon-active">Active</span>
                        : <span className="addon-inactive">Not active</span>}
                    </div>
                    <div className="addon-row">
                      <span className="addon-row-label">Business Phone</span>
                      {subscription.business_phone_enabled
                        ? <span className="addon-active">Active</span>
                        : <span className="addon-inactive">Not active</span>}
                    </div>
                    <div className="addon-row">
                      <span className="addon-row-label">Google Business Setup</span>
                      {subscription.google_business_setup_purchased
                        ? <span className="addon-active">Purchased</span>
                        : <span className="addon-inactive">Not purchased</span>}
                    </div>
                    {subscription.current_period_end && (
                      <p style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '14px 0 0' }}>
                        Renews {fmt(subscription.current_period_end)}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '8px 0 0' }}>
                    Subscription details will appear here after setup completes.
                  </p>
                )}
              </div>

              {/* ── Account links ─────────────────────────────────── */}
              <div className="dash-card">
                <span className="dash-card-title">Account</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a href="/#contact" style={{ font: '500 14px/1.3 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#d4aa50)', textDecoration: 'none' }}>
                    Contact support ›
                  </a>
                  <span style={{ font: '400 13px/1.3 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                    Manage billing — coming in Phase 5
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ── D. Request actions ─────────────────────────────────── */}
          <div className="dash-card">
            <span className="dash-card-title">Mail actions</span>
            <div className="dash-actions-grid">
              {[
                { label: 'Request scan', icon: '📄' },
                { label: 'Request forwarding', icon: '📦' },
                { label: 'Hold for pickup', icon: '🏠' },
                { label: 'Request shred', icon: '🗑️' },
              ].map(a => (
                <div key={a.label} className="dash-action-btn" title="Coming in Phase 5">
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <span>{a.label}</span>
                  <span style={{ font: '400 10px/1 var(--font-text,sans-serif)', opacity: 0.6 }}>Phase 5</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
      <Footer />
    </>
  );
}
