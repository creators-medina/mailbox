import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';

export const metadata: Metadata = {
  title: 'No worries — My Biz Mailbox',
  description: "Your plan wasn't activated. Ready when you are.",
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <>
      <Nav />
      <section
        className="w-section cream tall"
        style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}
      >
        <div className="w-section-inner">
          <h1 className="w-hero-title">No worries.</h1>
          <p className="w-hero-sub">
            Your plan wasn&rsquo;t activated. Whenever you&rsquo;re ready,
            your Rockwall business address is waiting.
          </p>
          <div className="w-cta-row">
            <a className="w-cta-pill filled" href="/#pricing">View plans ›</a>
            <a className="w-cta-pill outline" href="/#contact">Talk to us first</a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
