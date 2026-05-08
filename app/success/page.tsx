import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';

export const metadata: Metadata = {
  title: "You're all set — My Biz Address",
  description: 'Your My Biz Address account has been started. Check your email for next steps.',
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
        <div className="w-section-inner">
          <div className="w-hero-eyebrow">Order confirmed</div>
          <h1 className="w-hero-title">Your account has been started.</h1>
          <p className="w-hero-sub" style={{ maxWidth: 520, margin: '0 auto 36px' }}>
            Your My Biz Address account has been started. Check your email for your
            new Rockwall, TX business address and onboarding details. If you have
            questions, call us at{' '}
            <a href="tel:+14698934120" style={{ color: '#fff', fontWeight: 700 }}>
              (469) 893-4120
            </a>.
          </p>
          <div className="w-cta-row">
            <a className="w-cta-pill filled" href="/">Back to home</a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
