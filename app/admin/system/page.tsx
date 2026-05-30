import 'server-only';
import { runLaunchChecks, type Check } from '@/lib/launch-check';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<Check['category'], string> = {
  env: 'Environment variables',
  column: 'Database columns',
  enum: 'mail_item_status enum',
  bucket: 'Storage buckets',
};

export default async function AdminSystemPage() {
  const { ok, checks } = await runLaunchChecks();

  // Group by category for readability.
  const grouped = (['env', 'column', 'enum', 'bucket'] as const).map(cat => ({
    cat,
    items: checks.filter(c => c.category === cat),
  }));

  const totalOk = checks.filter(c => c.ok).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
          Launch readiness
        </h1>
        <span
          className={`admin-status-badge admin-status-${ok ? 'active' : 'pending'}`}
          style={{ fontSize: 12 }}
        >
          {ok ? 'All green' : `${totalOk}/${checks.length} passing`}
        </span>
      </div>

      <p style={{ font: '400 13px/1.55 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '0 0 22px' }}>
        Verifies the production environment, required Supabase columns, the
        <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, marginInline: 4 }}>mail_item_status</code>
        enum values, and the private storage buckets. Secrets are never read or returned — only presence is checked.
      </p>

      {grouped.map(({ cat, items }) => (
        <div key={cat} className="dash-card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-border,rgba(255,255,255,0.07))' }}>
            <span className="dash-card-title" style={{ margin: 0 }}>
              {CATEGORY_LABEL[cat]}
              <span style={{ font: '500 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginLeft: 8, letterSpacing: 0 }}>
                ({items.filter(i => i.ok).length}/{items.length})
              </span>
            </span>
          </div>
          <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
            <tbody>
              {items.map(item => (
                <tr key={`${item.category}:${item.name}`}>
                  <td style={{ width: 28, paddingLeft: 18 }}>
                    <span
                      style={{
                        display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
                        background: item.ok ? '#4ade80' : '#f87171',
                      }}
                    />
                  </td>
                  <td style={{ font: '500 13px/1.3 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.85)' }}>
                    {item.name}
                  </td>
                  <td style={{ color: item.ok ? 'var(--c-text-3)' : '#f87171', fontSize: 12 }}>
                    {item.ok ? (item.detail ?? 'ok') : (item.detail ?? 'missing')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
