import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import RequestStatusButton from './RequestStatusButton';

type RequestRow = {
  id: string;
  request_type: string;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  mail_items: { sender: string | null; title: string | null } | null;
  customers: {
    suite_number: string | null;
    profiles: { business_name: string | null; email: string | null } | null;
  } | null;
};

export const dynamic = 'force-dynamic';

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status ?? 'pending';
  const admin = createAdminClientAny();

  let query = admin
    .from('mail_requests')
    .select(`
      id, request_type, status, notes, admin_notes, created_at,
      mail_items(sender, title),
      customers(suite_number, profiles(business_name, email))
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter) as typeof query;
  }

  const { data } = await query;
  const requests = (data ?? []) as unknown as RequestRow[];

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
                <th>Type</th>
                <th>Mail item</th>
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
                    {r.customers?.suite_number ?? '—'}
                  </td>
                  <td style={{ textTransform: 'capitalize', fontWeight: 600 }}>{r.request_type}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12 }}>
                    {r.mail_items?.sender || r.mail_items?.title || '—'}
                  </td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12, maxWidth: 180 }}>{r.notes ?? '—'}</td>
                  <td>
                    <RequestStatusButton id={r.id} current={r.status} />
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
