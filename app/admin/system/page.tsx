import 'server-only';
import { runLaunchChecks, type Check } from '@/lib/launch-check';

export const dynamic = 'force-dynamic';

const CATEGORY_LABEL: Record<Check['category'], string> = {
  env: 'Environment variables',
  column: 'Database columns',
  enum: 'mail_item_status enum',
  bucket: 'Storage buckets',
  data: 'Data sanity (warnings)',
};

const CATEGORY_ORDER: Check['category'][] = ['env', 'column', 'enum', 'bucket', 'data'];

function dotColor(item: Check): string {
  if (item.ok) return '#4ade80';                       // green
  if (item.severity === 'warning') return '#fbbf24';   // yellow warning
  return '#f87171';                                    // red required failure
}
function textColor(item: Check): string {
  if (item.ok) return 'var(--c-text-3)';
  return item.severity === 'warning' ? '#fbbf24' : '#f87171';
}
function statusText(item: Check): string {
  if (item.ok) return item.detail ?? 'ok';
  return item.detail ?? (item.severity === 'warning' ? 'warning' : 'missing');
}

export default async function AdminSystemPage() {
  const { ok, checks } = await runLaunchChecks();

  // Group by category for readability.
  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    items: checks.filter(c => c.category === cat),
  })).filter(g => g.items.length > 0);

  const totalOk = checks.filter(c => c.ok).length;
  const requiredFailing = checks.filter(c => !c.ok && c.severity === 'required').length;
  const warningFailing  = checks.filter(c => !c.ok && c.severity === 'warning').length;

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
          {ok
            ? warningFailing > 0 ? `Required OK · ${warningFailing} warning${warningFailing === 1 ? '' : 's'}` : 'All green'
            : `${requiredFailing} required failing · ${totalOk}/${checks.length} passing`}
        </span>
      </div>

      <p style={{ font: '400 13px/1.55 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '0 0 22px' }}>
        Verifies env vars, required Supabase columns, the{' '}
        <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>mail_item_status</code>{' '}
        enum, and the private storage buckets. Yellow rows are warnings that don&rsquo;t block launch. Secrets are never read or returned — only presence is checked.
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
                        background: dotColor(item),
                      }}
                    />
                  </td>
                  <td style={{ font: '500 13px/1.3 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.85)' }}>
                    {item.name}
                    {item.severity === 'warning' && (
                      <span style={{ marginLeft: 8, font: '600 10px/1 var(--font-text,sans-serif)', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fbbf24' }}>
                        warning
                      </span>
                    )}
                  </td>
                  <td style={{ color: textColor(item), fontSize: 12 }}>
                    {statusText(item)}
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
