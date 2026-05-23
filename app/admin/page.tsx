import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const admin = createAdminClientAny();

  const [activeRes, mailRes, requestRes, recentCustomers] = await Promise.all([
    admin.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('mail_items').select('id', { count: 'exact', head: true })
      .gte('received_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    admin.from('mail_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('customers')
      .select('id, suite_number, status, created_at, profiles(full_name, business_name, email)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: 'Active customers',    value: activeRes.count  ?? 0 },
    { label: 'Mail items (30 days)', value: mailRes.count    ?? 0 },
    { label: 'Pending requests',    value: requestRes.count ?? 0 },
  ];

  type RecentCustomer = {
    id: string;
    suite_number: string | null;
    status: string;
    created_at: string;
    profiles: { full_name: string | null; business_name: string | null; email: string | null } | null;
  };
  const customers = (recentCustomers.data ?? []) as unknown as RecentCustomer[];

  return (
    <div>
      <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: '0 0 32px' }}>
        Overview
      </h1>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
        {stats.map(s => (
          <div key={s.label} className="dash-card">
            <div style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginBottom: 10 }}>
              {s.label}
            </div>
            <div style={{ font: '700 40px/1 var(--font-display,sans-serif)', color: '#fff' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick links ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
        {[
          { label: 'View all customers →', href: '/admin/customers' },
          { label: 'Mail queue →',          href: '/admin/mail' },
          { label: 'Pending requests →',    href: '/admin/requests' },
          { label: 'Upload mail →',         href: '/admin/mail/upload' },
        ].map(l => (
          <a key={l.href} href={l.href} className="admin-btn-link">{l.label}</a>
        ))}
      </div>

      {/* ── Recent signups ────────────────────────────────────────────────────── */}
      <div className="dash-card">
        <span className="dash-card-title">Recent signups</span>
        {customers.length === 0 ? (
          <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
            No customers yet.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Suite</th>
                <th>Name / Business</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <a href={`/admin/customers/${c.id}`} style={{ color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}>
                      {c.suite_number ?? '—'}
                    </a>
                  </td>
                  <td>{c.profiles?.business_name || c.profiles?.full_name || '—'}</td>
                  <td style={{ color: 'var(--c-text-2)' }}>{c.profiles?.email ?? '—'}</td>
                  <td>
                    <span className={`admin-status-badge admin-status-${c.status}`}>{c.status}</span>
                  </td>
                  <td style={{ color: 'var(--c-text-3)', whiteSpace: 'nowrap' }}>
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
