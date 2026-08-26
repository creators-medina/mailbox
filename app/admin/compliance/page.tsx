import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { resolveMailboxDisplayName } from '@/lib/mailbox/mailbox-profile';

export const dynamic = 'force-dynamic';

type Filter = 'needs_review' | 'pending_customer' | 'rejected' | 'verified' | 'all';

type ComplianceRow = {
  customer_id: string;
  form_1583_status: string;
  photo_id_status: string;
  form_1583_uploaded_at: string | null;
  photo_id_uploaded_at: string | null;
  verified_at: string | null;
  updated_at: string | null;
};

type ViewRow = ComplianceRow & {
  businessName: string | null;
  email: string | null;
  suite: string | null;
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isReceived(s: string) { return s === 'received'; }
function isRejected(s: string) { return s === 'rejected'; }
function isVerified(s: string) { return s === 'verified'; }
function isWaitingOnCustomer(s: string) { return s === 'pending' || s === 'requested'; }

function matchesFilter(r: ComplianceRow, f: Filter): boolean {
  switch (f) {
    case 'needs_review':
      return isReceived(r.form_1583_status) || isReceived(r.photo_id_status);
    case 'pending_customer':
      return isWaitingOnCustomer(r.form_1583_status) && isWaitingOnCustomer(r.photo_id_status);
    case 'rejected':
      return isRejected(r.form_1583_status) || isRejected(r.photo_id_status);
    case 'verified':
      return isVerified(r.form_1583_status) && isVerified(r.photo_id_status);
    case 'all':
    default:
      return true;
  }
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Needs review',     value: 'needs_review' },
  { label: 'Pending customer', value: 'pending_customer' },
  { label: 'Rejected',         value: 'rejected' },
  { label: 'Verified',         value: 'verified' },
  { label: 'All',              value: 'all' },
];

function statusBadge(s: string): string {
  if (s === 'verified') return 'admin-status-active';
  if (s === 'rejected') return 'admin-status-cancelled';
  if (s === 'received') return 'admin-status-scanned';
  return 'admin-status-pending';
}

export default async function AdminCompliancePage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter: Filter = (FILTERS.find(f => f.value === searchParams.filter)?.value) ?? 'needs_review';
  const admin = createAdminClientAny();

  // Flat fetch (no PostgREST embeds — see /admin/requests notes).
  const { data: compData, error: compErr } = await admin
    .from('customer_compliance')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500);

  console.log('[admin/compliance]', {
    filter,
    count: compData?.length ?? 0,
    error: compErr?.message ?? null,
  });

  const rows = (compData ?? []) as unknown as ComplianceRow[];

  // Bulk-fetch related customers + profiles in JS so a join failure can't hide rows.
  const customerIds = Array.from(new Set(rows.map(r => r.customer_id).filter(Boolean)));
  const { data: custData } = customerIds.length
    ? await admin.from('customers').select('id, suite_number, profile_id, business_name, recipient_name').in('id', customerIds)
    : { data: [] };
  const customers = (custData ?? []) as Array<{
    id: string; suite_number: string | null; profile_id: string | null;
    business_name: string | null; recipient_name: string | null;
  }>;

  const profileIds = Array.from(new Set(customers.map(c => c.profile_id).filter(Boolean))) as string[];
  const { data: profData } = profileIds.length
    ? await admin.from('profiles').select('id, business_name, full_name, email').in('id', profileIds)
    : { data: [] };
  const profiles = (profData ?? []) as Array<{
    id: string; business_name: string | null; full_name: string | null; email: string | null;
  }>;

  const custById = new Map(customers.map(c => [c.id, c]));
  const profById = new Map(profiles.map(p => [p.id, p]));

  const viewRows: ViewRow[] = rows.map(r => {
    const c = custById.get(r.customer_id);
    const p = c?.profile_id ? profById.get(c.profile_id) : undefined;
    return {
      ...r,
      businessName: c ? resolveMailboxDisplayName(c, p) : null,
      email: p?.email || null,
      suite: c?.suite_number ?? null,
    };
  });

  // Counts are computed across the full result set, not just the filtered view.
  const counts = {
    needs_review: rows.filter(r => matchesFilter(r, 'needs_review')).length,
    pending_customer: rows.filter(r => matchesFilter(r, 'pending_customer')).length,
    rejected: rows.filter(r => matchesFilter(r, 'rejected')).length,
    verified: rows.filter(r => matchesFilter(r, 'verified')).length,
    all: rows.length,
  };

  const filtered = viewRows.filter(r => matchesFilter(r, filter));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
          Compliance review
          <span style={{ font: '400 14px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginLeft: 10 }}>
            {filtered.length}
          </span>
        </h1>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <a
              key={f.value}
              href={`/admin/compliance?filter=${f.value}`}
              className={`admin-filter-chip ${filter === f.value ? 'admin-filter-chip-active' : ''}`}
            >
              {f.label}{' '}
              <span style={{ font: '500 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginLeft: 4 }}>
                {counts[f.value]}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <Stat label="Needs review" value={counts.needs_review} color="#C99A5A" />
        <Stat label="Verified"     value={counts.verified}     color="#4ade80" />
        <Stat label="Rejected"     value={counts.rejected}     color="#f87171" />
      </div>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p style={{ padding: 24, font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
            No customers match this filter.
          </p>
        ) : (
          <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Suite</th>
                <th>Form 1583</th>
                <th>Photo ID</th>
                <th>Uploaded</th>
                <th>Verified</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.customer_id}>
                  <td style={{ font: '500 13px/1.3 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.88)' }}>
                    {r.businessName ?? '—'}
                  </td>
                  <td style={{ color: 'var(--c-text-3)', fontSize: 12 }}>{r.email ?? '—'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--c-gold-2,#C99A5A)' }}>{r.suite ?? '—'}</td>
                  <td>
                    <span className={`admin-status-badge ${statusBadge(r.form_1583_status)}`}>
                      {r.form_1583_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status-badge ${statusBadge(r.photo_id_status)}`}>
                      {r.photo_id_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--c-text-3)', fontSize: 12 }}>
                    <div>F: {fmt(r.form_1583_uploaded_at)}</div>
                    <div>ID: {fmt(r.photo_id_uploaded_at)}</div>
                  </td>
                  <td style={{ color: 'var(--c-text-3)', fontSize: 12 }}>{fmt(r.verified_at)}</td>
                  <td>
                    <a
                      href={`/admin/customers/${r.customer_id}#compliance`}
                      className="admin-link"
                      style={{ fontSize: 12 }}
                    >
                      Review ›
                    </a>
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

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="dash-card" style={{ padding: '14px 18px', minWidth: 160 }}>
      <div style={{ font: '500 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ font: '700 24px/1 var(--font-display,sans-serif)', color }}>{value}</div>
    </div>
  );
}
