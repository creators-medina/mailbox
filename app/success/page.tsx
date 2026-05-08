import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';

export const metadata: Metadata = {
  title: "You're all set — My Biz Address",
  description: 'Your My Biz Address subscription is active. Check your email for next steps.',
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
          <h1 className="w-hero-title">You&rsquo;re all set.</h1>
          <p className="w-hero-sub">
            Welcome to My Biz Address. Check your email for activation instructions
            and your new Rockwall, TX business address.
          </p>
          <div className="w-cta-row">
            <a className="w-cta-pill filled" href="/">Back to home ›</a>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
