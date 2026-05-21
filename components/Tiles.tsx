import React from 'react';
import { BUSINESS } from '@/lib/config/business';

interface ProductTileProps {
  theme?: 'dark' | 'light';
  eyebrow?: string;
  title?: React.ReactNode;
  sub?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function ProductTile({ theme = 'dark', eyebrow, title, sub, children, style }: ProductTileProps) {
  return (
    <div className={`w-tile ${theme}`} style={style}>
      {eyebrow && <div className="w-tile-eyebrow">{eyebrow}</div>}
      {title && <h3 className="w-tile-title">{title}</h3>}
      {sub && <p className="w-tile-sub">{sub}</p>}
      {children && <div className="w-tile-visual">{children}</div>}
    </div>
  );
}

export function FeatureGrid({ cols = 3, children }: { cols?: 2 | 3 | 4; children: React.ReactNode }) {
  return <div className={`w-tiles cols-${cols}`}>{children}</div>;
}

export function Footer() {
  const cols = [
    {
      h: 'Services',
      items: [
        { label: 'Business Address',          href: '/#services' },
        { label: 'Mail Scanning',             href: '/#services' },
        { label: 'Business Phone Number',     href: '/#services' },
        { label: 'Google Business Setup',     href: '/#services' },
      ],
    },
    {
      h: 'Company',
      items: [
        { label: 'About',   href: '#' },
        { label: 'Contact', href: '/#contact' },
        { label: 'Careers', href: '#' },
      ],
    },
    {
      h: 'Help',
      items: [
        { label: 'FAQ',          href: '/#faq' },
        { label: 'How it works', href: '/#how-it-works' },
        { label: 'Pricing',      href: '/#pricing' },
        { label: 'Contact us',   href: '/#contact' },
      ],
    },
    {
      h: 'Legal',
      items: [
        { label: 'Privacy Policy',   href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Contact',          href: '/#contact' },
      ],
    },
    {
      h: 'Account',
      items: [
        { label: 'Sign in',          href: '/login' },
        { label: 'Get your address', href: '/signup' },
      ],
    },
  ];

  return (
    <footer className="w-footer">
      <div className="w-footer-inner">
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
          <div style={{
            width: 28, height: 28,
            background: 'rgba(181,138,82,0.12)',
            border: '1.5px solid var(--c-gold, #B58A52)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '700 10px/1 var(--font-display, sans-serif)',
            color: 'var(--c-gold, #B58A52)',
            letterSpacing: '-0.2px',
            flexShrink: 0,
          }}>MB</div>
          <div>
            <div style={{
              font: '700 14px/1.1 var(--font-text, sans-serif)',
              color: 'rgba(248,250,252,0.88)', letterSpacing: '-0.1px',
            }}>
              My Biz Address
            </div>
            <div style={{
              font: '400 12px/1.3 var(--font-text, sans-serif)',
              color: 'rgba(248,250,252,0.35)', marginTop: 3,
            }}>
              {BUSINESS.addressStreet} · {BUSINESS.addressCity}, {BUSINESS.addressState} {BUSINESS.addressZip}
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
          <span>© 2026 My Biz Address. All rights reserved.</span>
          <span>
            <a href="/privacy">Privacy Policy</a>
            {' · '}
            <a href="/terms">Terms of Service</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
