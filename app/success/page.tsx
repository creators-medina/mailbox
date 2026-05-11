import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';
import { BUSINESS } from '@/lib/config/business';

export const metadata: Metadata = {
  title: 'Payment received — My Biz Address',
  description: 'Your payment was received. Check your email for your Rockwall business address.',
  robots: { index: false, follow: false },
};

export default function SuccessPage() {
  return (
    <>
      <Nav />
      <section
        className="w-section dark"
        style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}
      >
        <div className="w-section-inner" style={{ maxWidth: 560 }}>
          <div className="w-hero-eyebrow">Payment received</div>
          <h1 className="w-hero-title" style={{ fontSize: 44 }}>
            You&rsquo;re almost set.
          </h1>
          <p className="w-hero-sub" style={{ maxWidth: 500, margin: '0 auto 16px' }}>
            Your payment was received and your Rockwall business address is being set up.
          </p>

          <div style={{
            background: 'var(--c-surface,#1a1a1a)',
            border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
            borderRadius: 14, padding: '20px 24px',
            maxWidth: 460, margin: '0 auto 36px', textAlign: 'left',
          }}>
            {[
              'Check your email — we\'ll send your suite number and address details.',
              'You\'ll receive a separate email to create your account login.',
              'Once you log in, your mail dashboard will be ready.',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--c-border,rgba(255,255,255,0.07))' : 'none' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(196,154,60,0.15)',
                  border: '1px solid rgba(196,154,60,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: '700 11px/1 var(--font-text,sans-serif)',
                  color: 'var(--c-gold-2,#d4aa50)', flexShrink: 0, marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <span style={{ font: '400 14px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="w-cta-row">
            <a className="w-cta-pill filled" href="/login">Sign in to your account</a>
            <a className="w-cta-pill outline" href="/#contact">Contact support</a>
          </div>
          <p style={{
            font: '400 13px/1.5 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)', marginTop: 20,
          }}>
            Questions? Call{' '}
            <a href={`tel:${BUSINESS.phoneE164}`} style={{ color: 'var(--c-text-2)', textDecoration: 'none', fontWeight: 600 }}>
              {BUSINESS.phone}
            </a>
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
