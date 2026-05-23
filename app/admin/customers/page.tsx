import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';

type CustomerRow = {
  id: string;
  suite_number: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; business_name: string | null; email: string | null } | null;
};

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? '';
  const admin = createAdminClientAny();

  let query = admin
    .from('customers')
    .select('id, suite_number, status, created_at, profiles(full_name, business_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);

  // Client-side filter since PostgREST ilike on joined columns is complex
  const { data } = await query;
  let customers = (data ?? []) as unknown as CustomerRow[];

  if (q) {
    const lq = q.toLowerCase();
    customers = customers.filter(c =>
      c.suite_number?.toLowerCase().includes(lq) ||
      c.profiles?.full_name?.toLowerCase().includes(lq) ||
      c.profiles?.business_name?.toLowerCase().includes(lq) ||
      c.profiles?.email?.toLowerCase().includes(lq),
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
          Customers
          <span style={{ font: '400 14px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginLeft: 10 }}>
            {customers.length}
          </span>
        </h1>

        <form method="get" action="/admin/customers">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, suite…"
            className="admin-search-input"
          />
        </form>
      </div>

      <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
        {customers.length === 0 ? (
          <p style={{ padding: 24, font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
            {q ? 'No customers match your search.' : 'No customers yet.'}
          </p>
        ) : (
          <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
            <thead>
              <tr>
                <th>Suite</th>
                <th>Business / Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: 'var(--c-gold-2,#C99A5A)' }}>
                    {c.suite_number ?? '—'}
                  </td>
                  <td>{c.profiles?.business_name || c.profiles?.full_name || '—'}</td>
                  <td style={{ color: 'var(--c-text-2)', fontSize: 12 }}>{c.profiles?.email ?? '—'}</td>
                  <td>
                    <span className={`admin-status-badge admin-status-${c.status}`}>{c.status}</span>
                  </td>
                  <td style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <a href={`/admin/customers/${c.id}`} className="admin-link">View →</a>
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
