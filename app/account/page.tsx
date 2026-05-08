import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';

export const metadata: Metadata = {
  title: 'My Account — My Biz Address',
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <Nav />
      <section
        className="w-section dark"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 80 }}
      >
        <div className="w-section-inner" style={{ maxWidth: 700 }}>
          <div className="w-hero-eyebrow" style={{ marginBottom: 10 }}>My Account</div>
          <h1 className="w-hero-title" style={{ fontSize: 42, marginBottom: 16 }}>
            Your mailbox dashboard is coming next.
          </h1>
          <p style={{
            font: '400 18px/1.7 var(--font-text,sans-serif)',
            color: 'var(--c-text-2)', maxWidth: 500, marginBottom: 40,
          }}>
            You&rsquo;re signed in as <strong style={{ color: '#fff' }}>{user.email}</strong>.
            Your full dashboard — mail inbox, scan requests, address details, and billing — will be
            available here in the next phase.
          </p>

          <div style={{
            background: 'var(--c-surface,#1a1a1a)',
            border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
            borderRadius: 16, padding: '28px 32px', maxWidth: 480,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <p style={{ font: '700 11px/1 var(--font-text,sans-serif)', letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--c-text-2)', margin: 0 }}>
              Coming in Phase 4
            </p>
            {[
              'Mail inbox with envelope images',
              'Scan, forward, and pickup requests',
              'Address details and suite number',
              'Subscription and billing management',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--c-gold,#c49a3c)', flexShrink: 0,
                }} />
                <span style={{ font: '400 15px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          <div className="w-cta-row" style={{ justifyContent: 'flex-start', marginTop: 40 }}>
            <a className="w-cta-pill outline" href="/">Back to home</a>
            {/* TODO Phase 4: wire up sign-out button */}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
