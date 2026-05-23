import 'server-only';
import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth/require-staff';

export const metadata: Metadata = {
  title: 'Admin — My Biz Address',
  robots: { index: false, follow: false },
};

const NAV_LINKS = [
  { label: 'Overview',    href: '/admin' },
  { label: 'Customers',   href: '/admin/customers' },
  { label: 'Mail Queue',  href: '/admin/mail' },
  { label: 'Requests',    href: '/admin/requests' },
  { label: 'Upload Mail', href: '/admin/mail/upload' },
  { label: 'CRM Board',     href: '/admin/crm/board' },
  { label: 'CRM Pipelines', href: '/admin/crm/pipelines' },
  { label: 'CRM Templates', href: '/admin/crm/templates' },
];

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--c-bg,#071B2D)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <nav style={{
        width: 220, flexShrink: 0,
        background: 'var(--c-surface,#162032)',
        borderRight: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        }}>
          <a
            href="/"
            style={{
              font: '500 12px/1 var(--font-text,sans-serif)',
              color: 'var(--c-text-3,rgba(255,255,255,0.35))',
              textDecoration: 'none', display: 'block', marginBottom: 10,
            }}
          >
            ← Back to site
          </a>
          <div style={{
            font: '700 13px/1 var(--font-display,sans-serif)',
            color: 'var(--c-gold-2,#C99A5A)',
          }}>
            Admin Panel
          </div>
        </div>

        <div style={{ padding: '8px 0', flex: 1 }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'block',
                padding: '10px 20px',
                font: '500 13px/1.3 var(--font-text,sans-serif)',
                color: 'var(--c-text-2,rgba(255,255,255,0.60))',
                textDecoration: 'none',
                transition: 'color 120ms ease',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '40px 48px', minWidth: 0, color: '#fff' }}>
        {children}
      </main>
    </div>
  );
}
