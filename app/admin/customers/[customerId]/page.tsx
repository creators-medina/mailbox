import 'server-only';
import { notFound } from 'next/navigation';
import { createAdminClientAny } from '@/lib/supabase/admin';
import AdminNoteForm from './AdminNoteForm';
import SuiteEditor from './SuiteEditor';
import MailStatusButton from '@/app/admin/mail/MailStatusButton';

type MailItem = {
  id: string;
  sender: string | null;
  title: string | null;
  status: string;
  received_at: string;
};
type MailRequest = {
  id: string;
  request_type: string;
  status: string;
  notes: string | null;
  created_at: string;
};
type AdminNote = {
  id: string;
  note: string;
  created_at: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({
  params,
}: {
  params: { customerId: string };
}) {
  const admin = createAdminClientAny();

  const { data: custData } = await admin
    .from('customers')
    .select(`
      id, suite_number, status, business_address_line, forwarding_address,
      stripe_customer_id, created_at,
      profiles(id, full_name, business_name, email, phone, role)
    `)
    .eq('id', params.customerId)
    .single();

  if (!custData) notFound();

  const customer = custData as unknown as {
    id: string;
    suite_number: string | null;
    status: string;
    business_address_line: string | null;
    forwarding_address: string | null;
    stripe_customer_id: string | null;
    created_at: string;
    profiles: {
      id: string;
      full_name: string | null;
      business_name: string | null;
      email: string | null;
      phone: string | null;
      role: string;
    } | null;
  };

  const [subRes, mailRes, requestRes, notesRes] = await Promise.all([
    admin.from('subscriptions')
      .select('status, mail_scanning_enabled, business_phone_enabled, google_business_setup_purchased, current_period_end')
      .eq('customer_id', params.customerId)
      .maybeSingle(),
    admin.from('mail_items')
      .select('id, sender, title, status, received_at')
      .eq('customer_id', params.customerId)
      .order('received_at', { ascending: false })
      .limit(20),
    admin.from('mail_requests')
      .select('id, request_type, status, notes, created_at')
      .eq('customer_id', params.customerId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin.from('admin_notes')
      .select('id, note, created_at')
      .eq('customer_id', params.customerId)
      .order('created_at', { ascending: false }),
  ]);

  const sub = subRes.data as {
    status: string;
    mail_scanning_enabled: boolean;
    business_phone_enabled: boolean;
    google_business_setup_purchased: boolean;
    current_period_end: string | null;
  } | null;
  const mailItems  = (mailRes.data ?? [])    as MailItem[];
  const requests   = (requestRes.data ?? []) as MailRequest[];
  const adminNotes = (notesRes.data ?? [])   as AdminNote[];

  const p = customer.profiles;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <a href="/admin/customers" style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', textDecoration: 'none' }}>
          ← All customers
        </a>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: '8px 0 0' }}>
          {p?.business_name || p?.full_name || 'Customer'}
          <span style={{ font: '500 16px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', marginLeft: 12 }}>
            {customer.suite_number ?? '—'}
          </span>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── Profile ───────────────────────────────────────────────────────── */}
        <div className="dash-card">
          <span className="dash-card-title">Profile</span>
          <dl className="admin-dl">
            <dt>Email</dt>       <dd>{p?.email ?? '—'}</dd>
            <dt>Full name</dt>   <dd>{p?.full_name ?? '—'}</dd>
            <dt>Business</dt>    <dd>{p?.business_name ?? '—'}</dd>
            <dt>Phone</dt>       <dd>{p?.phone ?? '—'}</dd>
            <dt>Suite</dt>       <dd><SuiteEditor customerId={customer.id} currentSuite={customer.suite_number} /></dd>
            <dt>Address</dt>     <dd style={{ fontSize: 12 }}>{customer.business_address_line ?? '—'}</dd>
            <dt>Forwarding</dt>  <dd style={{ fontSize: 12 }}>{customer.forwarding_address ?? '—'}</dd>
            <dt>Status</dt>
            <dd><span className={`admin-status-badge admin-status-${customer.status}`}>{customer.status}</span></dd>
            <dt>Customer since</dt> <dd>{fmt(customer.created_at)}</dd>
          </dl>
        </div>

        {/* ── Subscription ────────────────────────────────────────────────────── */}
        <div className="dash-card">
          <span className="dash-card-title">Subscription</span>
          {sub ? (
            <dl className="admin-dl">
              <dt>Status</dt>
              <dd><span className={`admin-status-badge admin-status-${sub.status}`}>{sub.status}</span></dd>
              <dt>Mail scanning</dt>
              <dd>{sub.mail_scanning_enabled ? '✓ Active' : '—'}</dd>
              <dt>Business phone</dt>
              <dd>{sub.business_phone_enabled ? '✓ Active' : '—'}</dd>
              <dt>Google Business</dt>
              <dd>{sub.google_business_setup_purchased ? '✓ Purchased' : '—'}</dd>
              {sub.current_period_end && (
                <>
                  <dt>Renews</dt>
                  <dd>{fmt(sub.current_period_end)}</dd>
                </>
              )}
            </dl>
          ) : (
            <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
              No subscription yet.
            </p>
          )}
        </div>
      </div>

      {/* ── Mail items ────────────────────────────────────────────────────────── */}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="dash-card-title" style={{ margin: 0 }}>Mail items</span>
          <a href={`/admin/mail/upload?customer_id=${customer.id}`} className="admin-link" style={{ fontSize: 12 }}>
            + Add mail
          </a>
        </div>
        <p style={{ font: '400 12px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '0 0 14px' }}>
          Only process mail once this customer&rsquo;s USPS Form 1583 and photo ID are verified.
        </p>
        {mailItems.length === 0 ? (
          <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>No mail yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Received</th><th>Sender</th><th>Title</th><th>Status</th></tr>
            </thead>
            <tbody>
              {mailItems.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>{fmt(m.received_at)}</td>
                  <td>{m.sender ?? '—'}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12 }}>{m.title ?? '—'}</td>
                  <td><MailStatusButton id={m.id} current={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Requests ────────────────────────────────────────────────────────────── */}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <span className="dash-card-title">Mail requests</span>
        {requests.length === 0 ? (
          <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>No requests.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>{fmt(r.created_at)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.request_type}</td>
                  <td><span className={`admin-status-badge admin-status-${r.status}`}>{r.status.replace('_',' ')}</span></td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12 }}>{r.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Admin notes ─────────────────────────────────────────────────────────── */}
      <div className="dash-card">
        <span className="dash-card-title">Internal notes</span>
        <div style={{ marginBottom: 20 }}>
          <AdminNoteForm customerId={customer.id} />
        </div>
        {adminNotes.length === 0 ? (
          <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>No notes yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {adminNotes.map(n => (
              <div key={n.id} style={{
                padding: '12px 14px',
                background: 'var(--c-surface-2,#222)',
                borderRadius: 8,
                border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
              }}>
                <div style={{ font: '400 13px/1.6 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.82)', marginBottom: 6 }}>
                  {n.note}
                </div>
                <div style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                  {fmt(n.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
