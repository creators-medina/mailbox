import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import MailStatusButton from './MailStatusButton';

type MailItem = {
  id: string;
  sender: string | null;
  title: string | null;
  status: string;
  received_at: string;
  customers: { suite_number: string | null; profiles: { email: string | null; business_name: string | null } | null } | null;
};

export const dynamic = 'force-dynamic';

export default async function AdminMailQueuePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status ?? '';
  const admin = createAdminClientAny();

  let query = admin
    .from('mail_items')
    .select(`
      id, sender, title, status, received_at,
      customers(suite_number, profiles(email, business_name))
    `)
    .order('received_at', { ascending: false })
    .limit(100);

  if (statusFilter) {
    query = query.eq('status', statusFilter) as typeof query;
  }

  const { data } = await query;
  const items = (data ?? []) as unknown as MailItem[];

  const STATUS_OPTIONS = ['', 'received','notified','scanned','held','forwarded','picked_up','shredded'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
          Mail Queue
          <span style={{ font: '400 14px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginLeft: 10 }}>
            {items.length}
          </span>
        </h1>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => (
            <a
              key={s || 'all'}
              href={s ? `/admin/mail?status=${s}` : '/admin/mail'}
              className={`admin-filter-chip ${statusFilter === s ? 'admin-filter-chip-active' : ''}`}
            >
              {s || 'All'}
            </a>
          ))}
        </div>
      </div>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        {items.length === 0 ? (
          <p style={{ padding: 24, font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
            No mail items.
          </p>
        ) : (
          <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
            <thead>
              <tr>
                <th>Received</th>
                <th>Suite</th>
                <th>Sender</th>
                <th>Title</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(m.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--c-gold-2,#C99A5A)' }}>
                    {m.customers?.suite_number ?? '—'}
                  </td>
                  <td>{m.sender ?? '—'}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12 }}>{m.title ?? '—'}</td>
                  <td>
                    <MailStatusButton id={m.id} current={m.status} />
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
