import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { resolveMailboxDisplayName } from '@/lib/mailbox/mailbox-profile';
import { getSignedUrl } from '@/lib/storage/signed-url';
import { MAIL_ENVELOPE_BUCKET, MAIL_SCAN_BUCKET } from '@/lib/storage/buckets';
import RequestFulfillment from './RequestFulfillment';
import MailFileLinks from '@/app/admin/components/MailFileLinks';

type RequestRow = {
  id: string;
  request_type: string;
  status: string;
  notes: string | null;
  customerResponse: string | null;
  completedAt: string | null;
  created_at: string;
  mailSender: string | null;
  mailTitle: string | null;
  hasMailItem: boolean;
  mailItemFound: boolean;
  envelopeUrl: string | null;
  scanUrl: string | null;
  suiteNumber: string | null;
  businessName: string | null;
  customerEmail: string | null;
  customerFound: boolean;
};

export const dynamic = 'force-dynamic';

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status ?? 'pending';
  const admin = createAdminClientAny();

  // Simplest possible base query — select('*') returns whatever columns exist,
  // so an un-applied migration (missing column) can never error the query and
  // hide rows. Related customer/profile/mail-item data is joined in JS below and
  // is purely best-effort: a failed lookup never hides a request.
  let query = admin
    .from('mail_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter) as typeof query;
  }
  const { data: requestsData, error } = await query;

  console.log('[admin/requests]', {
    statusFilter,
    count: requestsData?.length ?? 0,
    error: error?.message ?? null,
  });

  const baseRows = (requestsData ?? []) as unknown as Array<{
    id: string;
    request_type: string;
    status: string;
    notes: string | null;
    customer_response?: string | null;
    completed_at?: string | null;
    created_at: string;
    customer_id: string | null;
    mail_item_id: string | null;
  }>;

  const customerIds = Array.from(new Set(baseRows.map(r => r.customer_id).filter(Boolean))) as string[];
  const mailItemIds = Array.from(new Set(baseRows.map(r => r.mail_item_id).filter(Boolean))) as string[];

  // Best-effort related lookups. Avoid selecting customers.email (may not exist
  // pre-015); the email comes from profiles. A failure here never hides rows.
  const [custRes, miRes] = await Promise.all([
    customerIds.length
      ? admin.from('customers').select('id, suite_number, profile_id, business_name, recipient_name').in('id', customerIds)
      : Promise.resolve({ data: [] }),
    mailItemIds.length
      ? admin.from('mail_items').select('id, sender, title, envelope_image_url, scanned_document_url').in('id', mailItemIds)
      : Promise.resolve({ data: [] }),
  ]);

  const customers = (custRes.data ?? []) as Array<{
    id: string; suite_number: string | null; profile_id: string | null;
    business_name: string | null; recipient_name: string | null;
  }>;
  const mailItems = (miRes.data ?? []) as Array<{
    id: string; sender: string | null; title: string | null;
    envelope_image_url: string | null; scanned_document_url: string | null;
  }>;

  // Resolve short-lived signed URLs for each referenced mail item, server-side.
  const fileUrls = new Map<string, { envelopeUrl: string | null; scanUrl: string | null }>();
  await Promise.all(mailItems.map(async (m) => {
    const [envelopeUrl, scanUrl] = await Promise.all([
      m.envelope_image_url ? getSignedUrl(MAIL_ENVELOPE_BUCKET, m.envelope_image_url, 600) : Promise.resolve(null),
      m.scanned_document_url ? getSignedUrl(MAIL_SCAN_BUCKET, m.scanned_document_url, 600) : Promise.resolve(null),
    ]);
    fileUrls.set(m.id, { envelopeUrl, scanUrl });
  }));

  const profileIds = Array.from(new Set(customers.map(c => c.profile_id).filter(Boolean))) as string[];
  const profRes = profileIds.length
    ? await admin.from('profiles').select('id, business_name, full_name, email').in('id', profileIds)
    : { data: [] };
  const profiles = (profRes.data ?? []) as Array<{
    id: string; business_name: string | null; full_name: string | null; email: string | null;
  }>;

  const custById = new Map(customers.map(c => [c.id, c]));
  const miById   = new Map(mailItems.map(m => [m.id, m]));
  const profById = new Map(profiles.map(p => [p.id, p]));

  const requests: RequestRow[] = baseRows.map(r => {
    const c = r.customer_id ? custById.get(r.customer_id) : undefined;
    const p = c?.profile_id ? profById.get(c.profile_id) : undefined;
    const mi = r.mail_item_id ? miById.get(r.mail_item_id) : undefined;
    return {
      id: r.id,
      request_type: r.request_type,
      status: r.status,
      notes: r.notes,
      customerResponse: r.customer_response ?? null,
      completedAt: r.completed_at ?? null,
      created_at: r.created_at,
      mailSender: mi?.sender ?? null,
      mailTitle: mi?.title ?? null,
      hasMailItem: Boolean(r.mail_item_id),
      mailItemFound: Boolean(mi),
      envelopeUrl: r.mail_item_id ? (fileUrls.get(r.mail_item_id)?.envelopeUrl ?? null) : null,
      scanUrl: r.mail_item_id ? (fileUrls.get(r.mail_item_id)?.scanUrl ?? null) : null,
      suiteNumber: c?.suite_number ?? null,
      businessName: c ? resolveMailboxDisplayName(c, p) : null,
      customerEmail: p?.email ?? null,
      customerFound: Boolean(c),
    };
  });

  const STATUS_FILTERS = [
    { label: 'Pending',     value: 'pending' },
    { label: 'In progress', value: 'in_progress' },
    { label: 'Completed',   value: 'completed' },
    { label: 'All',         value: 'all' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
          Mail Requests
          <span style={{ font: '400 14px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginLeft: 10 }}>
            {requests.length}
          </span>
        </h1>

        <div style={{ display: 'flex', gap: 8 }}>
          {STATUS_FILTERS.map(f => (
            <a
              key={f.value}
              href={`/admin/requests?status=${f.value}`}
              className={`admin-filter-chip ${statusFilter === f.value ? 'admin-filter-chip-active' : ''}`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        {requests.length === 0 ? (
          <p style={{ padding: 24, font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
            No requests.
          </p>
        ) : (
          <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Suite</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Mail item</th>
                <th>Files</th>
                <th>Customer notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--c-gold-2,#C99A5A)' }}>
                    {r.suiteNumber ?? '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.customerFound ? (
                      <>
                        <div style={{ color: 'rgba(255,255,255,0.85)' }}>{r.businessName ?? '—'}</div>
                        {r.customerEmail && (
                          <div style={{ color: 'var(--c-text-3)' }}>{r.customerEmail}</div>
                        )}
                      </>
                    ) : (
                      <span style={{ color: 'var(--c-text-3)' }}>Unknown customer</span>
                    )}
                  </td>
                  <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{r.request_type}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12 }}>
                    {r.hasMailItem && !r.mailItemFound
                      ? <span style={{ color: 'var(--c-text-3)' }}>Unknown mail item</span>
                      : (r.mailSender || r.mailTitle || '—')}
                  </td>
                  <td>
                    <MailFileLinks envelopeUrl={r.envelopeUrl} scanUrl={r.scanUrl} />
                  </td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12, maxWidth: 200 }}>
                    <div>{r.notes ?? '—'}</div>
                    {r.customerResponse && (
                      <div style={{ marginTop: 4, color: '#4ade80', fontSize: 11 }}>
                        ↳ {r.customerResponse}
                      </div>
                    )}
                  </td>
                  <td>
                    <RequestFulfillment
                      id={r.id}
                      requestType={r.request_type}
                      current={r.status}
                      customerResponse={r.customerResponse}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
