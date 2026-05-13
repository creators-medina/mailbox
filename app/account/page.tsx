import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { Database } from '@/types/database';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';
import { BUSINESS } from '@/lib/config/business';
import SignOutButton from './SignOutButton';
import MailItemActions from './MailItemActions';
import BillingButton from './BillingButton';
import ForwardingRequestForm from './ForwardingRequestForm';
import type { EligibleItem } from './ForwardingRequestForm';

type ProfileRow      = Database['public']['Tables']['profiles']['Row'];
type CustomerRow     = Database['public']['Tables']['customers']['Row'];
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type MailItemRow     = Database['public']['Tables']['mail_items']['Row'];
type MailRequestRow  = Database['public']['Tables']['mail_requests']['Row'];

type MailItemWithUrls = MailItemRow & {
  envelopeSignedUrl: string | null;
  scanSignedUrl:     string | null;
};

export const metadata: Metadata = {
  title: 'My Account — My Biz Address',
  robots: { index: false, follow: false },
};

const MAIL_STATUS_CLASS: Record<string, string> = {
  received:  'mock-badge-new',
  notified:  'mock-badge-new',
  scanned:   'mock-badge-scanned',
  held:      'mock-badge-held',
  forwarded: 'mock-badge-ready',
  picked_up: 'mock-badge-ready',
  shredded:  'mock-badge-held',
};

const REQUEST_STATUS_CLASS: Record<string, string> = {
  pending:     'mock-badge-new',
  in_progress: 'mock-badge-scanned',
  completed:   'mock-badge-ready',
  cancelled:   'mock-badge-held',
};

const TERMINAL_STATUSES = new Set(['shredded', 'forwarded', 'picked_up']);

async function batchSignUrls(
  admin: ReturnType<typeof createAdminClientAny>,
  bucket: string,
  paths: (string | null)[],
): Promise<Map<string, string>> {
  const valid = paths.filter(Boolean) as string[];
  if (valid.length === 0) return new Map();
  const { data } = await admin.storage.from(bucket).createSignedUrls(valid, 3600);
  const map = new Map<string, string>();
  for (const entry of (data ?? []) as { path: string; signedUrl: string }[]) {
    if (entry.signedUrl) map.set(entry.path, entry.signedUrl);
  }
  return map;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClientAny();

  const { data: profileData } = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = profileData as ProfileRow | null;
  if (profile?.role === 'admin') redirect('/admin');

  const { data: customerData } = await admin.from('customers').select('*').eq('profile_id', user.id).maybeSingle();
  const customer = customerData as CustomerRow | null;

  let subscription: SubscriptionRow | null = null;
  let mailItems: MailItemWithUrls[] = [];
  let mailRequests: MailRequestRow[] = [];

  if (customer?.id) {
    const [sr, mr, rr] = await Promise.all([
      admin.from('subscriptions').select('*').eq('customer_id', customer.id).maybeSingle(),
      admin.from('mail_items').select('*').eq('customer_id', customer.id)
        .order('received_at', { ascending: false }).limit(25),
      admin.from('mail_requests').select('*').eq('customer_id', customer.id)
        .order('created_at', { ascending: false }).limit(10),
    ]);
    subscription        = sr.data  as SubscriptionRow | null;
    const rawItems      = (mr.data ?? []) as MailItemRow[];
    mailRequests        = (rr.data ?? []) as MailRequestRow[];

    const [envelopeMap, scanMap] = await Promise.all([
      batchSignUrls(admin, 'mail-envelopes', rawItems.map(i => i.envelope_image_url)),
      batchSignUrls(admin, 'mail-scans',     rawItems.map(i => i.scanned_document_url)),
    ]);

    mailItems = rawItems.map(item => ({
      ...item,
      envelopeSignedUrl: item.envelope_image_url
        ? (envelopeMap.get(item.envelope_image_url) ?? null) : null,
      scanSignedUrl: item.scanned_document_url
        ? (scanMap.get(item.scanned_document_url) ?? null) : null,
    }));
  }

  // Track the newest active (non-terminal) request per mail item
  const requestsByItemId = new Map<string, MailRequestRow>();
  for (const r of mailRequests) {
    if (r.status !== 'cancelled' && r.status !== 'completed') {
      if (!requestsByItemId.has(r.mail_item_id)) {
        requestsByItemId.set(r.mail_item_id, r);
      }
    }
  }

  // Items eligible for a forwarding request:
  //   • not in a terminal status (already forwarded / shredded / picked up)
  //   • no open (pending or in_progress) forwarding request already exists
  const openForwardItemIds = new Set(
    mailRequests
      .filter(r => r.request_type === 'forward' &&
                   (r.status === 'pending' || r.status === 'in_progress'))
      .map(r => r.mail_item_id),
  );
  const forwardingEligible: EligibleItem[] = mailItems
    .filter(item => !TERMINAL_STATUSES.has(item.status) && !openForwardItemIds.has(item.id))
    .map(item => ({ id: item.id, sender: item.sender, received_at: item.received_at }));

  const displayName = profile?.business_name || profile?.full_name || user.email || 'there';
  const statusKey   = customer?.status ?? 'pending';
  const statusClass = statusKey === 'active'
    ? 'status-pill-active'
    : statusKey === 'cancelled' ? 'status-pill-cancelled' : 'status-pill-pending';
  const dotClass    = statusKey === 'active'
    ? 'status-dot-active'
    : statusKey === 'cancelled' ? 'status-dot-cancelled' : 'status-dot-pending';
  const statusLabel = statusKey === 'active' ? 'Active'
    : statusKey === 'cancelled' ? 'Cancelled' : 'Setting up';

  return (
    <>
      <Nav />
      <section className="w-section dark" style={{ minHeight: '100vh', paddingTop: 96, paddingBottom: 80 }}>
        <div className="w-section-inner" style={{ maxWidth: 900, textAlign: 'left' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="w-hero-eyebrow" style={{ marginBottom: 6 }}>Dashboard</div>
              <h1 style={{ font: '700 28px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
                Welcome back, {displayName}.
              </h1>
            </div>
            <SignOutButton />
          </div>

          {/* Address card */}
          <div className="dash-card" style={{
            marginBottom: 20,
            borderColor: customer?.status === 'active'
              ? 'rgba(74,222,128,0.18)' : 'var(--c-border-2,rgba(255,255,255,0.13))',
          }}>
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
                <span style={{ font: '800 32px/1 var(--font-display,sans-serif)', letterSpacing: '-0.5px', color: 'var(--c-gold-2,#C99A5A)' }}>
                  {customer.suite_number ?? '—'}
                </span>
                <span style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>Address</span>
                <span style={{ font: '500 16px/1.5 var(--font-text,sans-serif)', color: '#fff' }}>
                  {customer.business_address_line ?? BUSINESS.addressFull}
                </span>
                {customer.forwarding_address && (
                  <>
                    <span style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>Forwarding</span>
                    <span style={{ font: '400 14px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>
                      {customer.forwarding_address}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p style={{ font: '400 14px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '10px 0 0' }}>
                Your suite number is being assigned. You&rsquo;ll receive an email once your address is ready — usually within a few hours.
              </p>
            )}
          </div>

          {/* Main grid: mail inbox + sidebar */}
          <div className="dash-grid" style={{ marginBottom: 20 }}>

            {/* Mail inbox */}
            <div className="dash-card">
              <span className="dash-card-title">Mail inbox</span>
              {mailItems.length > 0 ? (
                <div>
                  {mailItems.map(item => {
                    const isTerminal    = TERMINAL_STATUSES.has(item.status);
                    const activeRequest = requestsByItemId.get(item.id);
                    return (
                      <div key={item.id} className="dash-mail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8, flexShrink: 0, marginTop: 1,
                            background: 'var(--c-surface-2,#1E2D42)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg viewBox="0 0 16 12" width="13" height="10" fill="none"
                                 stroke="var(--c-gold-2,#C99A5A)" strokeWidth="1.4"
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

                        {/* Envelope preview and scan download links */}
                        {(item.envelopeSignedUrl || item.scanSignedUrl) && (
                          <div style={{ display: 'flex', gap: 12, marginTop: 8, marginLeft: 46 }}>
                            {item.envelopeSignedUrl && (
                              <a
                                href={item.envelopeSignedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  font: '500 11px/1 var(--font-text,sans-serif)',
                                  color: 'var(--c-text-2)', textDecoration: 'none',
                                }}
                              >
                                <svg viewBox="0 0 12 12" width="11" height="11" fill="none"
                                     stroke="currentColor" strokeWidth="1.4"
                                     strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="1" y="1" width="10" height="10" rx="1.5"/>
                                  <path d="M1 4l5 3.5L11 4"/>
                                </svg>
                                View envelope
                              </a>
                            )}
                            {item.scanSignedUrl && (
                              <a
                                href={item.scanSignedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  font: '500 11px/1 var(--font-text,sans-serif)',
                                  color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none',
                                }}
                              >
                                <svg viewBox="0 0 12 14" width="10" height="12" fill="none"
                                     stroke="currentColor" strokeWidth="1.4"
                                     strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M7 1H3a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V5L7 1z"/>
                                  <path d="M7 1v4h4"/>
                                  <path d="M6 10V7m0 3l-1.5-1.5M6 10l1.5-1.5"/>
                                </svg>
                                Download scan
                              </a>
                            )}
                          </div>
                        )}

                        {/* Action buttons — hidden for terminal statuses or active pending request */}
                        {!isTerminal && !activeRequest && (
                          <MailItemActions mailItemId={item.id} />
                        )}
                        {!isTerminal && activeRequest && (
                          <span style={{
                            font: '400 11px/1 var(--font-text,sans-serif)',
                            color: 'var(--c-text-3)', marginTop: 8, display: 'block',
                          }}>
                            {activeRequest.request_type.replace('_', ' ')} request {activeRequest.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
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

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Subscription card */}
              <div className="dash-card">
                <span className="dash-card-title">Subscription</span>
                <div className="addon-row" style={{ paddingTop: 0 }}>
                  <span className="addon-row-label">Business Address</span>
                  <span style={{ font: '700 14px/1 var(--font-display,sans-serif)', color: '#fff' }}>
                    $29.99<span style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>/mo</span>
                  </span>
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

              {/* Account card */}
              <div className="dash-card">
                <span className="dash-card-title">Account</span>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ font: '500 14px/1.3 var(--font-text,sans-serif)', color: '#fff', marginBottom: 2 }}>
                    {profile?.full_name || profile?.business_name || '—'}
                  </div>
                  <div style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                    {user.email}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a href="/#contact" style={{ font: '500 14px/1.3 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}>
                    Contact support ›
                  </a>
                  {customer?.stripe_customer_id && <BillingButton />}
                </div>
              </div>

            </div>
          </div>

          {/* Recent requests */}
          {mailRequests.length > 0 && (
            <div className="dash-card" style={{ marginBottom: 20 }}>
              <span className="dash-card-title">Recent requests</span>
              <div>
                {mailRequests.map(r => (
                  <div key={r.id} className="dash-mail-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '600 13px/1.3 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.88)', marginBottom: 3, textTransform: 'capitalize' }}>
                        {r.request_type.replace('_', ' ')} request
                      </div>
                      <div style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                        {fmt(r.created_at)}{r.completed_at ? ` · Completed ${fmt(r.completed_at)}` : ''}
                      </div>
                      {r.admin_notes && (
                        <div style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-2)', marginTop: 4 }}>
                          {r.admin_notes}
                        </div>
                      )}
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

          {/* Request forwarding — only shown when customer has a record */}
          {customer && (
            <ForwardingRequestForm items={forwardingEligible} />
          )}

        </div>
      </section>
      <Footer />
    </>
  );
}
