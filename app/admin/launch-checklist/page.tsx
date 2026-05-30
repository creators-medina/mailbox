import 'server-only';

// Static, admin/staff-only manual launch verification checklist. The
// /admin/launch-check page already runs the automated env/schema/bucket probes;
// this page is the human-driven counterpart for the live behaviors that can
// only be verified by clicking through the real app + inboxes.

export const dynamic = 'force-dynamic';

type Item = { label: string; detail?: string };
type Section = { title: string; intro?: string; items: Item[]; sql?: string };

const SECTIONS: Section[] = [
  {
    title: '1. Environment',
    items: [
      { label: 'Vercel env vars set in Production', detail: 'See docs/production-env-vars.md for the full list.' },
      { label: 'NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_BASE_URL both = https://www.mybizaddress.co' },
      { label: 'Supabase URL + anon key + service-role key configured' },
      { label: 'Resend sender domain verified (RESEND_FROM_EMAIL = a verified @mybizaddress.co address)' },
      { label: 'Stripe webhook endpoint configured', detail: 'Endpoint = /api/stripe/webhook; events = checkout.session.completed, customer.subscription.created/updated/deleted; STRIPE_WEBHOOK_SECRET set.' },
    ],
  },
  {
    title: '2. Supabase',
    intro: 'Run /admin/system for the automated checks. Use the SQL below to spot-check anything red.',
    items: [
      { label: 'Migrations 011–017 applied (in order)' },
      { label: 'mail_item_status enum contains exactly the 6 production values' },
      { label: 'customer_compliance table exists with form_1583_status + photo_id_status' },
      { label: 'Storage buckets mail-envelope-images and mail-scans exist and are private' },
    ],
    sql: `-- Enum values
select enumlabel
from pg_enum
where enumtypid = 'mail_item_status'::regtype
order by enumsortorder;

-- Compliance table columns
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'customer_compliance'
order by ordinal_position;

-- Mail-request optional columns (016)
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'mail_requests'
  and column_name in ('customer_response','admin_notes','completed_at','completed_by','last_status_email_sent_at');

-- Customer columns (015)
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'customers'
  and column_name in ('email','user_id','suite_number','business_address_line');`,
  },
  {
    title: '3. Auth',
    items: [
      { label: 'Onboarding email → set password → land on /account', detail: 'Test with a real inbox (token_hash flow; OTP burns on click).' },
      { label: 'Forgot password → /auth/reset-password → set new password' },
      { label: 'Customer cannot reach /admin (redirects to /account)' },
      { label: 'Admin/staff can reach /admin; customer sees no admin pages' },
      { label: 'Logged-out visits to /account redirect to /login' },
    ],
  },
  {
    title: '4. Customer dashboard',
    items: [
      { label: 'Address card shows suite + full address; "Copy address" works' },
      { label: 'Mail inbox loads (real items or empty state)' },
      { label: 'Per-item actions render: Request scan / Request forwarding / Hold for pickup / Request shred' },
      { label: 'Open request shows "Request pending: …" and blocks duplicates' },
      { label: 'Subscription card shows base plan + add-on flags; add-on buttons appear when inactive' },
      { label: 'Mail authorization card reflects the customer\'s compliance status; not-verified copy clear' },
      { label: 'Onboarding checklist reflects real Form 1583 / Photo ID status' },
    ],
  },
  {
    title: '5. Admin dashboard',
    items: [
      { label: '/admin/customers list loads; search works; row → detail page' },
      { label: 'Suite editor saves Suite201-format values; duplicates rejected (409)' },
      { label: 'Compliance editor saves; "Send authorization request" emails the customer' },
      { label: '/admin/mail/upload uploads envelope + scan to private buckets; tracking field saves' },
      { label: '/admin/mail status dropdown persists (no revert); enum-invalid values impossible (UI restricts)' },
      { label: '/admin/requests lists rows (default Pending; ?status=all shows all)' },
      { label: 'Approve / Deny / Mark in progress each persist; customer-visible note saved' },
      { label: 'On completion, linked mail item status syncs (scan→scanned, forward→forwarded, pickup→picked_up, shred→shredded)' },
    ],
  },
  {
    title: '6. Email (real inbox)',
    intro: 'Confirm each email arrives, looks branded (dark/gold), comes from the verified sender, and has a working CTA.',
    items: [
      { label: 'Onboarding ("Welcome to My Biz Address") arrives; CTA opens /auth/reset-password and works' },
      { label: 'Password reset ("Reset your My Biz Address password") arrives; CTA works' },
      { label: 'New mail received ("New mail received at your My Biz Address") arrives; CTA opens /account?customerEmail=…' },
      { label: 'Scan ready ("Your mail scan is ready") arrives; CTA opens /account (not raw storage path)' },
      { label: 'Mail request updated ("Your mail request has been updated") arrives; customer-visible note appears' },
      { label: 'Compliance request ("Action needed: Complete your My Biz Address mail authorization") arrives' },
      { label: 'No email CTA lands on /admin or a vercel.app URL' },
    ],
  },
  {
    title: '7. Storage',
    items: [
      { label: 'Buckets mail-envelope-images and mail-scans exist and are PRIVATE' },
      { label: 'RLS policies from supabase/storage-setup.md applied' },
      { label: 'Customer /account "View envelope" opens the image via signed URL; expires after ~10 min' },
      { label: 'Admin /admin/mail / /admin/requests / /admin/customers/[id] file links also work' },
      { label: 'View page source / network → links contain a token; no raw bucket paths leaked' },
    ],
  },
  {
    title: '8. Billing',
    intro: 'No live payment required for this checklist — verify routing and UI behavior only.',
    items: [
      { label: 'Billing portal button opens Stripe portal and returns to /account' },
      { label: 'Inactive add-ons show purchase buttons (Mail Scanning, Business Phone, Google Business Setup)' },
      { label: 'Clicking an add-on button redirects to Stripe Checkout (do not complete payment)' },
      { label: '/account?billing=success renders the green banner' },
      { label: '/account?billing=cancelled renders the muted banner' },
    ],
  },
];

export default function AdminLaunchChecklistPage() {
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
          Launch smoke-test checklist
        </h1>
        <p style={{ font: '400 13px/1.55 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '6px 0 0' }}>
          Manually verify each item before announcing. The automated environment/schema/bucket probes live at{' '}
          <a href="/admin/system" className="admin-link">/admin/system</a>.
          This page does not persist state — re-check after each deploy.
        </p>
      </div>

      {SECTIONS.map(section => (
        <div key={section.title} className="dash-card" style={{ marginBottom: 16 }}>
          <span className="dash-card-title">{section.title}</span>
          {section.intro && (
            <p style={{ font: '400 13px/1.55 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '0 0 12px' }}>
              {section.intro}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {section.items.map(item => (
              <label
                key={item.label}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  style={{
                    appearance: 'none',
                    width: 18, height: 18, flexShrink: 0, marginTop: 2,
                    background: 'var(--c-surface-2,#1E2D42)',
                    border: '1px solid #2a3655', borderRadius: 5,
                    cursor: 'pointer',
                  }}
                />
                <span>
                  <span style={{ font: '500 14px/1.4 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.88)' }}>
                    {item.label}
                  </span>
                  {item.detail && (
                    <span style={{ display: 'block', font: '400 12px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginTop: 2 }}>
                      {item.detail}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          {section.sql && (
            <details style={{ marginTop: 14 }}>
              <summary style={{ font: '500 12px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', cursor: 'pointer' }}>
                Copy-paste SQL
              </summary>
              <pre style={{
                marginTop: 8, padding: 12, borderRadius: 8, overflow: 'auto',
                background: 'rgba(0,0,0,0.30)', border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
                font: '400 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
                color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre',
              }}>
                {section.sql}
              </pre>
            </details>
          )}
        </div>
      ))}

      <p style={{ font: '400 12px/1.55 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '12px 0 0' }}>
        Live Stripe payment testing is intentionally excluded from this checklist —
        run that as a one-off live smoke test outside the checklist.
      </p>
    </div>
  );
}
