import 'server-only';
import { notFound } from 'next/navigation';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { getSignedUrl } from '@/lib/storage/signed-url';
import { MAIL_ENVELOPE_BUCKET, MAIL_SCAN_BUCKET, COMPLIANCE_DOCUMENTS_BUCKET } from '@/lib/storage/buckets';
import AdminNoteForm from './AdminNoteForm';
import SuiteEditor from './SuiteEditor';
import ComplianceEditor from './ComplianceEditor';
import MailStatusButton from '@/app/admin/mail/MailStatusButton';
import MailFileLinks from '@/app/admin/components/MailFileLinks';

type MailItem = {
  id: string;
  sender: string | null;
  title: string | null;
  status: string;
  received_at: string;
  envelope_image_url: string | null;
  scanned_document_url: string | null;
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

  const [subRes, mailRes, requestRes, notesRes, complianceRes] = await Promise.all([
    admin.from('subscriptions')
      .select('status, mail_scanning_enabled, business_phone_enabled, google_business_setup_purchased, current_period_end')
      .eq('customer_id', params.customerId)
      .maybeSingle(),
    admin.from('mail_items')
      .select('id, sender, title, status, received_at, envelope_image_url, scanned_document_url')
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
    admin.from('customer_compliance')
      .select('form_1583_status, photo_id_status, form_1583_file_path, photo_id_file_path, form_1583_uploaded_at, photo_id_uploaded_at, rejected_reason, form_1583_rejected_reason, photo_id_rejected_reason, reviewed_at, reviewed_by, verified_at, verified_by, notes')
      .eq('customer_id', params.customerId)
      .maybeSingle(),
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

  // Short-lived signed URLs for each mail item's envelope/scan, server-side.
  const fileUrls = new Map<string, { envelopeUrl: string | null; scanUrl: string | null }>();
  await Promise.all(mailItems.map(async (m) => {
    const [envelopeUrl, scanUrl] = await Promise.all([
      m.envelope_image_url ? getSignedUrl(MAIL_ENVELOPE_BUCKET, m.envelope_image_url, 600) : Promise.resolve(null),
      m.scanned_document_url ? getSignedUrl(MAIL_SCAN_BUCKET, m.scanned_document_url, 600) : Promise.resolve(null),
    ]);
    fileUrls.set(m.id, { envelopeUrl, scanUrl });
  }));
  const compliance = complianceRes.data as {
    form_1583_status: string;
    photo_id_status: string;
    form_1583_file_path: string | null;
    photo_id_file_path: string | null;
    form_1583_uploaded_at: string | null;
    photo_id_uploaded_at: string | null;
    rejected_reason: string | null;
    form_1583_rejected_reason: string | null;
    photo_id_rejected_reason: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    verified_at: string | null;
    verified_by: string | null;
    notes: string | null;
  } | null;

  // Resolve verified_by + reviewed_by → human labels (best-effort).
  async function profileLabel(id: string | null | undefined): Promise<string | null> {
    if (!id) return null;
    const { data } = await admin.from('profiles').select('full_name, email').eq('id', id).maybeSingle();
    const v = data as { full_name: string | null; email: string | null } | null;
    return v?.full_name || v?.email || 'staff';
  }
  const [verifiedByLabel, reviewedByLabel] = await Promise.all([
    profileLabel(compliance?.verified_by),
    profileLabel(compliance?.reviewed_by),
  ]);

  // Short-lived signed URLs for the customer-uploaded documents. Server-only.
  const [form1583Url, photoIdUrl] = await Promise.all([
    compliance?.form_1583_file_path
      ? getSignedUrl(COMPLIANCE_DOCUMENTS_BUCKET, compliance.form_1583_file_path, 600)
      : Promise.resolve(null),
    compliance?.photo_id_file_path
      ? getSignedUrl(COMPLIANCE_DOCUMENTS_BUCKET, compliance.photo_id_file_path, 600)
      : Promise.resolve(null),
  ]);

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

      {/* ── Compliance ────────────────────────────────────────────────────────── */}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <span className="dash-card-title">Mail authorization (Form 1583)</span>
        <p style={{ font: '400 12px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '0 0 18px' }}>
          Verify the signed USPS Form 1583 and a valid photo ID before processing this customer&rsquo;s mail.
        </p>
        <ComplianceEditor
          customerId={customer.id}
          initialForm1583={compliance?.form_1583_status ?? 'pending'}
          initialPhotoId={compliance?.photo_id_status ?? 'pending'}
          initialNotes={compliance?.notes ?? ''}
          initialForm1583RejectedReason={
            compliance?.form_1583_rejected_reason
              ?? (compliance?.form_1583_status === 'rejected' ? (compliance?.rejected_reason ?? '') : '')
          }
          initialPhotoIdRejectedReason={
            compliance?.photo_id_rejected_reason
              ?? (compliance?.photo_id_status === 'rejected' ? (compliance?.rejected_reason ?? '') : '')
          }
          form1583UploadedAt={compliance?.form_1583_uploaded_at ?? null}
          photoIdUploadedAt={compliance?.photo_id_uploaded_at ?? null}
          form1583Url={form1583Url}
          photoIdUrl={photoIdUrl}
          reviewedAt={compliance?.reviewed_at ?? null}
          reviewedByLabel={reviewedByLabel}
          verifiedAt={compliance?.verified_at ?? null}
          verifiedByLabel={verifiedByLabel}
        />
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
              <tr><th>Received</th><th>Sender</th><th>Title</th><th>Files</th><th>Status</th></tr>
            </thead>
            <tbody>
              {mailItems.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>{fmt(m.received_at)}</td>
                  <td>{m.sender ?? '—'}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12 }}>{m.title ?? '—'}</td>
                  <td>
                    <MailFileLinks
                      envelopeUrl={fileUrls.get(m.id)?.envelopeUrl ?? null}
                      scanUrl={fileUrls.get(m.id)?.scanUrl ?? null}
                    />
                  </td>
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
