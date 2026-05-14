import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import ForwardingStatusButton from './ForwardingStatusButton';

type ForwardRow = {
  id:          string;
  status:      string;
  notes:       string | null;
  admin_notes: string | null;
  created_at:  string;
  mail_items: { sender: string | null; title: string | null } | null;
  customers: {
    suite_number: string | null;
    profiles: { business_name: string | null; full_name: string | null; email: string | null } | null;
  } | null;
};

// Parse the human-readable destination block written by /api/forwarding-requests
function parseDest(notes: string | null): {
  name: string; street: string; city: string; country: string; carrier: string; note: string;
} {
  const empty = { name: '—', street: '', city: '', country: '', carrier: '', note: '' };
  if (!notes) return empty;
  const get = (prefix: string) =>
    notes.split('\n').find(l => l.trimStart().startsWith(prefix))
      ?.replace(prefix, '').trim() ?? '';
  const noteMatch = notes.match(/Customer note:\s*([\s\S]+)$/);
  return {
    name:    get('Name:')    || '—',
    street:  get('Street:'),
    city:    get('City:'),
    country: get('Country:'),
    carrier: get('Carrier:'),
    note:    noteMatch ? noteMatch[1].trim() : '',
  };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Map DB status → filter label for the tab bar
const FILTER_TABS = [
  { label: 'Requested', value: 'pending'     },
  { label: 'Queued',    value: 'in_progress' },
  { label: 'Shipped',   value: 'shipped'     },
  { label: 'Delivered', value: 'completed'   },
  { label: 'All',       value: 'all'         },
];

export default async function AdminForwardingPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status ?? 'pending';
  const admin = createAdminClientAny();

  let query = admin
    .from('mail_requests')
    .select(`
      id, status, notes, admin_notes, created_at,
      mail_items(sender, title),
      customers(suite_number, profiles(business_name, full_name, email))
    `)
    .eq('request_type', 'forward')
    .order('created_at', { ascending: false })
    .limit(200);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter) as typeof query;
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as ForwardRow[];

  const customerName = (r: ForwardRow) =>
    r.customers?.profiles?.business_name ||
    r.customers?.profiles?.full_name     ||
    r.customers?.profiles?.email         ||
    '—';

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
          Forwarding Queue
          <span style={{ font: '400 14px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginLeft: 10 }}>
            {rows.length}
          </span>
        </h1>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(f => (
            <a
              key={f.value}
              href={`/admin/forwarding?status=${f.value}`}
              className={`admin-filter-chip ${statusFilter === f.value ? 'admin-filter-chip-active' : ''}`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <svg viewBox="0 0 40 40" width="36" height="36" fill="none"
                 stroke="var(--c-text-3)" strokeWidth="1.5"
                 strokeLinecap="round" strokeLinejoin="round"
                 style={{ marginBottom: 12, opacity: 0.4 }}>
              <rect x="6" y="8" width="28" height="24" rx="3"/>
              <path d="M6 15h28M14 8v7M26 8v7M13 22h4M23 22h4M13 28h4"/>
            </svg>
            <p style={{ font: '500 14px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
              No forwarding requests
              {statusFilter !== 'all' && ` with status "${FILTER_TABS.find(f => f.value === statusFilter)?.label ?? statusFilter}"`}.
            </p>
            {statusFilter !== 'all' && (
              <a href="/admin/forwarding?status=all" style={{
                font: '400 13px/1 var(--font-text,sans-serif)',
                color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none', marginTop: 8, display: 'inline-block',
              }}>
                View all →
              </a>
            )}
          </div>
        ) : (
          <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Suite</th>
                <th>Customer</th>
                <th>Mail item</th>
                <th>Ship to</th>
                <th>Carrier</th>
                <th>Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const dest = parseDest(r.notes);
                return (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {fmt(r.created_at)}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--c-gold-2,#C99A5A)', whiteSpace: 'nowrap' }}>
                      {r.customers?.suite_number ?? '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--c-text-2)', whiteSpace: 'nowrap' }}>
                      {customerName(r)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--c-text-2)' }}>
                      {r.mail_items?.sender ?? r.mail_items?.title ?? '—'}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{dest.name}</div>
                      {dest.city && (
                        <div style={{ color: 'var(--c-text-3)', marginTop: 2 }}>
                          {[dest.city, dest.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--c-text-2)', whiteSpace: 'nowrap' }}>
                      {dest.carrier || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--c-text-2)', maxWidth: 160 }}>
                      {dest.note || r.admin_notes || '—'}
                    </td>
                    <td>
                      <ForwardingStatusButton id={r.id} current={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
