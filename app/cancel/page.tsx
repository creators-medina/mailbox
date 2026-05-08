import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';

export const metadata: Metadata = {
  title: 'Checkout cancelled — My Biz Address',
  description: "Your checkout was cancelled. Ready when you are.",
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <>
      <Nav />
      <section
        className="w-section light"
        style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}
      >
        <div className="w-section-inner">
          <h1 className="w-hero-title">No worries.</h1>
          <p className="w-hero-sub" style={{ maxWidth: 480, margin: '0 auto 36px' }}>
            Your checkout was cancelled and nothing was charged. Whenever
            you&rsquo;re ready, your Rockwall business address is waiting.
          </p>
          <div className="w-cta-row">
            <a className="w-cta-pill filled" href="/signup">Return to signup ›</a>
            <a className="w-cta-pill outline" href="/#contact">Talk to us first</a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
