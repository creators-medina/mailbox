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
        { label: 'Privacy Policy',   href: '#' },
        { label: 'Terms of Service', href: '#' },
      ],
    },
  ];

  return (
    <footer className="w-footer">
      <div className="w-footer-inner">
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
               stroke="var(--c-gold, #B88746)" strokeWidth="1.75"
               strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 7l10 7 10-7"/>
          </svg>
          <div>
            <div style={{
              font: '700 14px/1.1 var(--font-text, sans-serif)',
              color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.1px',
            }}>
              My Biz Address
            </div>
            <div style={{
              font: '400 12px/1.3 var(--font-text, sans-serif)',
              color: 'rgba(255,255,255,0.35)', marginTop: 3,
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
            <a href="#">Privacy Policy</a>
            {' · '}
            <a href="#">Terms of Service</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
