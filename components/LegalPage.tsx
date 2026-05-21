import React from 'react';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';

// Shared layout + typography for legal/policy pages so /privacy and /terms
// stay visually consistent with the dark/navy/gold design system.
export function LegalPage({
  eyebrow = 'Legal',
  title,
  updated,
  children,
}: {
  eyebrow?: string;
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <section className="w-section dark" style={{ minHeight: '100vh', paddingTop: 104, paddingBottom: 80 }}>
        <div className="w-section-inner" style={{ maxWidth: 760, textAlign: 'left' }}>
          <div className="w-hero-eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>
          <h1 style={{ font: '700 36px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: '0 0 10px' }}>
            {title}
          </h1>
          {updated && (
            <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '0 0 36px' }}>
              Last updated: {updated}
            </p>
          )}
          <div style={{ font: '400 15px/1.75 var(--font-text,sans-serif)', color: 'var(--c-text-2,rgba(255,255,255,0.72))' }}>
            {children}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ font: '700 20px/1.3 var(--font-display,sans-serif)', color: '#fff', margin: '36px 0 12px' }}>
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ font: '600 15px/1.4 var(--font-display,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', margin: '22px 0 6px' }}>
      {children}
    </h3>
  );
}

export function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ margin: '0 0 14px', ...style }}>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul style={{ margin: '0 0 16px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</ul>;
}

export function LI({ children }: { children: React.ReactNode }) {
  return <li style={{ paddingLeft: 4 }}>{children}</li>;
}

// Muted callout used to flag items that need legal/business review.
export function ReviewNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(181,138,82,0.08)',
        border: '1px solid rgba(181,138,82,0.22)',
        borderRadius: 12,
        padding: '14px 18px',
        margin: '0 0 20px',
        font: '400 13px/1.6 var(--font-text,sans-serif)',
        color: 'var(--c-text-3,rgba(255,255,255,0.55))',
      }}
    >
      {children}
    </div>
  );
}

export function MailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} style={{ color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}>
      {email}
    </a>
  );
}
