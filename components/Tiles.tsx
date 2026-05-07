import React from 'react';

interface ProductTileProps {
  theme?: 'dark' | 'light';
  eyebrow?: string;
  title?: React.ReactNode;
  titleAccent?: string;
  sub?: string;
  links?: { label: string; href?: string; arrow?: boolean }[];
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function ProductTile({
  theme = 'light',
  eyebrow,
  title,
  titleAccent,
  sub,
  links = [],
  children,
  style,
}: ProductTileProps) {
  return (
    <div className={`w-tile ${theme}`} style={style}>
      {eyebrow && <div className="w-tile-eyebrow">{eyebrow}</div>}
      {title && (
        <h3 className="w-tile-title">
          {title}
          {titleAccent && <> <span className="accent">{titleAccent}</span></>}
        </h3>
      )}
      {sub && <p className="w-tile-sub">{sub}</p>}
      {links.length > 0 && (
        <div className="w-tile-links">
          {links.map((l, i) => (
            <a key={i} href={l.href ?? '#'}>
              {l.label}{l.arrow !== false ? ' ›' : ''}
            </a>
          ))}
        </div>
      )}
      {children && <div className="w-tile-visual">{children}</div>}
    </div>
  );
}

export function FeatureGrid({
  cols = 2,
  children,
}: {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}) {
  return <div className={`w-tiles cols-${cols}`}>{children}</div>;
}

export function Footer() {
  const cols = [
    {
      h: 'Services',
      items: [
        { label: 'Business address',   href: '#services' },
        { label: 'Package receiving',  href: '#services' },
        { label: 'Mail scanning',      href: '#services' },
        { label: 'Mail forwarding',    href: '#services' },
        { label: 'Notary services',    href: '#services' },
        { label: 'Meeting rooms',      href: '#services' },
      ],
    },
    {
      h: 'Company',
      items: [
        { label: 'About us',   href: '#' },
        { label: 'Contact',    href: '#contact' },
        { label: 'Careers',    href: '#' },
        { label: 'Press',      href: '#' },
      ],
    },
    {
      h: 'Help',
      items: [
        { label: 'FAQ',          href: '#faq' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Pricing',      href: '#pricing' },
        { label: 'Support',      href: '#contact' },
      ],
    },
    {
      h: 'Legal',
      items: [
        { label: 'Privacy policy',   href: '#' },
        { label: 'Terms of service', href: '#' },
        { label: 'Acceptable use',   href: '#' },
        { label: 'Sitemap',          href: '/sitemap.xml' },
      ],
    },
  ];

  return (
    <footer className="w-footer">
      <div className="w-footer-inner">
        {/* Footer logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--c-navy, #1d3557)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 32 32" width="18" height="18" fill="none"
                 stroke="var(--c-sandstone, #d6c1a3)" strokeWidth="1.75"
                 strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="26" height="18" rx="3" />
              <path d="M4 9 L16 18 L28 9" />
            </svg>
          </div>
          <div>
            <div style={{
              font: '700 14px/1.1 var(--font-text, -apple-system, sans-serif)',
              color: '#fff', letterSpacing: '-0.1px',
            }}>
              My Biz Mailbox
            </div>
            <div style={{
              font: '400 12px/1.3 var(--font-text, -apple-system, sans-serif)',
              color: 'rgba(255,255,255,0.45)', marginTop: 2,
            }}>
              802 North Goliad St, Rockwall TX 75087
            </div>
          </div>
        </div>

        <div className="w-footer-cols">
          {cols.map(c => (
            <div key={c.h} className="w-footer-col">
              <h5>{c.h}</h5>
              {c.items.map(item => (
                <a key={item.label} href={item.href}>{item.label}</a>
              ))}
            </div>
          ))}
        </div>

        <div className="w-footer-legal">
          <span>© 2026 My Biz Mailbox. All rights reserved.</span>
          <span>
            <a href="#">Privacy</a>
            {' · '}
            <a href="#">Terms</a>
            {' · '}
            Secured by Stripe
          </span>
        </div>
      </div>
    </footer>
  );
}
