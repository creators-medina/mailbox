import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';
import PricingSection from '@/components/PricingSection';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'My Biz Address — Professional Business Address in Rockwall, TX',
  description:
    'Receive business mail at a real Rockwall address, get envelope notifications, and manage your mail from anywhere. Starting at $29.99/mo.',
};

/* ── JSON-LD ─────────────────────────────────────────────────────── */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'My Biz Address',
  description: 'Virtual mailbox and professional business address service in Rockwall, TX.',
  url: 'https://mybizmailbox.biz',
  telephone: '+14698934120',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '802 North Goliad Street',
    addressLocality: 'Rockwall',
    addressRegion: 'TX',
    postalCode: '75087',
    addressCountry: 'US',
  },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    opens: '09:00',
    closes: '18:00',
  }],
};

/* ── Dashboard mockup ────────────────────────────────────────────── */
const mailItems = [
  { sender: 'Wells Fargo Business',  desc: 'Account statement',       date: 'Today',  badge: 'New',     cls: 'mock-badge-new' },
  { sender: 'TX Secretary of State', desc: 'Annual report notice',    date: 'Dec 18', badge: 'Held',    cls: 'mock-badge-held' },
  { sender: 'USPS Certified Mail',   desc: 'Package (0.8 lbs)',       date: 'Dec 17', badge: 'Ready',   cls: 'mock-badge-ready' },
  { sender: 'City of Rockwall',      desc: 'Business license renewal',date: 'Dec 15', badge: 'Scanned', cls: 'mock-badge-scanned' },
];

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 16 12" width="14" height="10" fill="none"
         stroke="var(--c-gold-2,#d4aa50)" strokeWidth="1.4"
         strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="14" height="10" rx="1.5"/>
      <path d="M1 3l7 5 7-5"/>
    </svg>
  );
}

function DashboardMockup() {
  return (
    <div className="mock-shell">
      {/* Window chrome dots */}
      <div className="mock-chrome">
        <span className="mock-dot mock-dot-1"/>
        <span className="mock-dot mock-dot-2"/>
        <span className="mock-dot mock-dot-3"/>
      </div>

      {/* App header */}
      <div className="mock-header">
        <div>
          <div className="mock-header-title">My Biz Address</div>
          <div className="mock-header-sub">Dashboard</div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(196,154,60,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: '700 11px/1 var(--font-text,sans-serif)',
          color: 'var(--c-gold-2,#d4aa50)',
        }}>
          MB
        </div>
      </div>

      {/* Address display */}
      <div className="mock-address-block">
        <div>
          <div className="mock-address-text">802 North Goliad St, Suite 247</div>
          <div className="mock-address-text">Rockwall, TX 75087</div>
        </div>
        <div className="mock-active-badge">
          <span className="mock-active-dot"/>
          Active
        </div>
      </div>

      {/* Mail list */}
      <div className="mock-section-header">
        <span className="mock-section-title">Recent mail</span>
        <span className="mock-section-count">4 items</span>
      </div>

      {mailItems.map(item => (
        <div key={item.sender} className="mock-mail-item">
          <div className="mock-envelope"><EnvelopeIcon /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mock-mail-sender">{item.sender}</div>
            <div className="mock-mail-desc">{item.desc}</div>
          </div>
          <div className="mock-mail-right">
            <div className="mock-mail-date">{item.date}</div>
            <span className={`mock-badge ${item.cls}`}>{item.badge}</span>
          </div>
        </div>
      ))}

      {/* Footer bar */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
          4 of 12 items shown
        </span>
        <span style={{
          font: '600 11px/1 var(--font-text,sans-serif)',
          color: 'var(--c-gold-2,#d4aa50)', cursor: 'pointer',
        }}>
          View all →
        </span>
      </div>
    </div>
  );
}

/* ── Shared icon component ───────────────────────────────────────── */
function PropIcon({ children }: { children: React.ReactNode }) {
  return <div className="prop-icon">{children}</div>;
}

const S = { fill: 'none', stroke: 'var(--c-gold-2,#d4aa50)' as string,
  strokeWidth: '1.6', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/* ── FAQ items ───────────────────────────────────────────────────── */
const faqs = [
  {
    q: 'What address will I use?',
    a: '802 North Goliad Street, Rockwall, TX 75087, with a unique suite number assigned to your business. This is a real street address — not a P.O. box — and is accepted for LLC registration, banking, licensing, and Google Business.',
  },
  {
    q: 'Can I use this address for my business?',
    a: 'Yes. The address meets Texas Secretary of State requirements for LLC and business entity registration. You can list it as your principal place of business on state filings, Google, your website, and business cards.',
  },
  {
    q: 'Do you scan my mail?',
    a: 'Basic plans include envelope notifications — we photograph the outside of each piece so you can see who sent it. Full content scanning (opening and photographing the contents) is available as an add-on for $9.99/mo.',
  },
  {
    q: 'Can I pick up mail locally?',
    a: 'Yes. Local pickup is included in every plan. Our Rockwall location is open Monday through Saturday, 9 am to 6 pm. Simply come in with your ID and we\'ll have your items ready.',
  },
  {
    q: 'Can I add a business phone number?',
    a: 'Yes. For $9.99/mo you get a local Rockwall phone number that forwards calls to any number you choose. Voicemail, caller ID, and basic call forwarding are included.',
  },
  {
    q: 'How do I get started?',
    a: 'Click "Get started," choose your plan, and complete the short signup form. You\'ll also need to sign USPS Form 1583 (required by the postal service for all commercial mail services). We\'ll guide you through the whole process — most customers are set up the same day.',
  },
];

/* ─────────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />

      {/* ── 1. Hero ─────────────────────────────────────────────── */}
      <section className="w-section dark tall">
        <div
          className="w-section-inner"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
            textAlign: 'left',
          }}
        >
          {/* Copy */}
          <div>
            <div className="w-hero-eyebrow">Rockwall, TX · Virtual Mailbox</div>
            <h1 className="w-hero-title" style={{ fontSize: 54 }}>
              Your Rockwall business address,&nbsp;online.
            </h1>
            <p className="w-hero-sub" style={{ margin: '0 0 36px', maxWidth: '100%' }}>
              Receive business mail at a real Rockwall address, get envelope
              notifications, and manage your mail from anywhere.
            </p>
            <div className="w-cta-row" style={{ justifyContent: 'flex-start', marginBottom: 20 }}>
              <a className="w-cta-pill filled" href="#pricing">Get your address</a>
              <a className="w-cta-pill outline" href="#how-it-works">View plans ›</a>
            </div>
            <p style={{
              font: '400 13px/1 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)',
            }}>
              Starting at $29.99/mo · No setup fee · Cancel anytime
            </p>
          </div>

          {/* Mockup */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DashboardMockup />
          </div>
        </div>

        {/* Mobile: mockup below copy */}
        <style>{`
          @media (max-width: 880px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-grid > :first-child { text-align: center; }
            .hero-grid .w-cta-row { justify-content: center !important; }
          }
        `}</style>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <section className="w-section medium compact">
        <div className="w-section-inner">
          <div className="stats-bar">
            {[
              { num: '200+',      label: 'Businesses served' },
              { num: 'All carriers', label: 'USPS, UPS, FedEx, Amazon' },
              { num: 'Same day',  label: 'Address activation' },
              { num: 'Mon–Sat',   label: '9 am – 6 pm · Rockwall' },
            ].map(s => (
              <div key={s.label} className="stats-bar-item">
                <span className="stats-bar-num">{s.num}</span>
                <span className="stats-bar-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Value props ──────────────────────────────────────── */}
      <section id="services" className="w-section dark">
        <div className="w-section-inner">
          <span className="section-label">What you get</span>
          <h2 className="w-hero-title" style={{ fontSize: 48 }}>
            A complete business address service.
          </h2>
          <p className="w-hero-sub">
            More than a mailbox. Everything you need to operate with a
            professional address and manage your mail online.
          </p>

          <div className="w-tiles cols-2" style={{ marginTop: 52, textAlign: 'left', maxWidth: 860, margin: '52px auto 0' }}>
            {[
              {
                icon: (
                  <PropIcon>
                    <svg viewBox="0 0 20 20" width="20" height="20" {...S}>
                      <rect x="2" y="3" width="16" height="14" rx="2"/>
                      <path d="M2 7h16M7 7v10"/>
                    </svg>
                  </PropIcon>
                ),
                title: 'Real Rockwall business address',
                body: 'A legitimate street address at 802 North Goliad Street — not a P.O. box. Accepted for LLC registration, banking, licensing, and Google Business listing.',
              },
              {
                icon: (
                  <PropIcon>
                    <svg viewBox="0 0 20 20" width="20" height="20" {...S}>
                      <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z"/>
                      <path d="M2 6l8 5 8-5"/>
                    </svg>
                  </PropIcon>
                ),
                title: 'Envelope notifications',
                body: 'Get an email the moment mail arrives, including a photo of the envelope so you know who sent it — before you ever leave your desk.',
              },
              {
                icon: (
                  <PropIcon>
                    <svg viewBox="0 0 20 20" width="20" height="20" {...S}>
                      <rect x="3" y="2" width="14" height="16" rx="2"/>
                      <path d="M6 7h8M6 10h8M6 13h5"/>
                    </svg>
                  </PropIcon>
                ),
                title: 'Online mail management',
                body: 'View your mail inbox online from any device. Request scanning, forwarding, or shredding for each piece — without making a trip to pick it up.',
              },
              {
                icon: (
                  <PropIcon>
                    <svg viewBox="0 0 20 20" width="20" height="20" {...S}>
                      <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
                    </svg>
                  </PropIcon>
                ),
                title: 'Secure local handling',
                body: 'Your mail is handled by our local Rockwall team, stored securely, and never shared. Pick up in person Mon–Sat or request forwarding to any address.',
              },
            ].map(p => (
              <div key={p.title} className="w-tile dark" style={{ padding: '32px 28px' }}>
                {p.icon}
                <h3 className="w-tile-title" style={{ marginTop: 4 }}>{p.title}</h3>
                <p className="w-tile-sub" style={{ margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="w-section medium">
        <div className="w-section-inner">
          <span className="section-label">Simple process</span>
          <h2 className="w-hero-title" style={{ fontSize: 48 }}>
            Up and running today.
          </h2>
          <p className="w-hero-sub">
            Three steps. Takes less than five minutes. No office visit required to get started.
          </p>

          <div className="w-tiles cols-3" style={{ marginTop: 52, textAlign: 'left' }}>
            {[
              {
                n: '1',
                title: 'Choose your plan',
                body: 'Select the Business Address plan at $29.99/mo and add any optional services — mail scanning, a business phone number, or Google Business setup.',
              },
              {
                n: '2',
                title: 'Get your business address',
                body: 'Receive your unique suite number at 802 North Goliad Street, Rockwall TX 75087. Use it on your LLC filing, bank accounts, business cards, and website.',
              },
              {
                n: '3',
                title: 'Receive and manage mail online',
                body: 'We accept all deliveries and send you an email notification for every piece. View your mail, request scans, or arrange forwarding — all from your dashboard.',
              },
            ].map(s => (
              <div key={s.n} className="w-tile dark" style={{ padding: '36px 28px' }}>
                <div className="step-badge">{s.n}</div>
                <h3 className="w-tile-title">{s.title}</h3>
                <p className="w-tile-sub" style={{ margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Pricing ──────────────────────────────────────────── */}
      <PricingSection />

      {/* ── 5. Trust section ────────────────────────────────────── */}
      <section className="w-section dark">
        <div
          className="w-section-inner"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'start',
            textAlign: 'left',
          }}
        >
          {/* Left: copy */}
          <div>
            <span className="section-label">Why choose us</span>
            <h2 className="w-hero-title" style={{ fontSize: 44, textAlign: 'left', margin: '0 0 20px' }}>
              A local Rockwall team you can trust.
            </h2>
            <p style={{
              font: '400 18px/1.7 var(--font-text,sans-serif)',
              color: 'var(--c-text-2)',
              maxWidth: 440, margin: '0 0 36px',
            }}>
              We&rsquo;re not a national chain or an automated system.
              We&rsquo;re a local business in Rockwall — our team handles
              your mail with care, and we&rsquo;re available by phone when
              you need us.
            </p>
            <a className="w-cta-pill filled" href="#contact">Talk to our team</a>
          </div>

          {/* Right: trust points */}
          <div>
            {[
              {
                icon: (
                  <svg viewBox="0 0 20 20" width="18" height="18" {...S}>
                    <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z"/>
                  </svg>
                ),
                title: 'Local Rockwall team',
                body: 'Our staff is based in Rockwall. When you call, a real person answers. When you visit, we know your name.',
              },
              {
                icon: (
                  <svg viewBox="0 0 20 20" width="18" height="18" {...S}>
                    <path d="M10 2l2.5 5h5.5l-4.5 4 1.5 6L10 14l-5 3 1.5-6L2 7h5.5z"/>
                  </svg>
                ),
                title: 'Secure, private handling',
                body: 'Your mail is stored in a locked facility. We never open or read your mail without your request, and your information is never shared.',
              },
              {
                icon: (
                  <svg viewBox="0 0 20 20" width="18" height="18" {...S}>
                    <rect x="3" y="3" width="14" height="14" rx="3"/>
                    <path d="M7 10l2.5 2.5L14 8"/>
                  </svg>
                ),
                title: 'Professional business presence',
                body: 'A real street address keeps your home private while giving clients, partners, and agencies a credible, permanent location for your business.',
              },
              {
                icon: (
                  <svg viewBox="0 0 20 20" width="18" height="18" {...S}>
                    <circle cx="10" cy="10" r="8"/>
                    <path d="M10 6v4l2.5 2.5"/>
                  </svg>
                ),
                title: 'Privacy-first approach',
                body: 'Your home address stays off state filings, public records, and Google — protecting your family\'s privacy as your business grows.',
              },
            ].map(t => (
              <div key={t.title} className="trust-item">
                <div className="prop-icon" style={{ marginBottom: 0, flexShrink: 0 }}>
                  {t.icon}
                </div>
                <div>
                  <div className="trust-item-title">{t.title}</div>
                  <p className="trust-item-body">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="w-section light">
        <div className="w-section-inner">
          <span className="section-label">FAQ</span>
          <h2 className="w-hero-title" style={{ fontSize: 48 }}>
            Common questions.
          </h2>
          <p className="w-hero-sub">
            Everything you need to know before getting started.
          </p>
          <div className="faq-list">
            {faqs.map(({ q, a }) => (
              <details key={q} className="faq-item">
                <summary>{q}</summary>
                <p className="faq-answer">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Contact ──────────────────────────────────────────── */}
      <section id="contact" className="w-section white">
        <div className="w-section-inner" style={{ textAlign: 'left' }}>
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <span className="section-label">Contact</span>
            <h2 className="w-hero-title" style={{ fontSize: 48 }}>Get in touch.</h2>
            <p className="w-hero-sub">
              Questions about plans, your address, or how things work?
              We&rsquo;re happy to help.
            </p>
          </div>
          <div className="contact-grid">
            {/* Info */}
            <div>
              <p className="contact-info-label">Address</p>
              <p className="contact-info-value">802 North Goliad Street<br />Rockwall, TX 75087</p>
              <p className="contact-info-label">Phone</p>
              <p className="contact-info-value">
                <a href="tel:+14698934120" style={{ color: 'var(--c-light-text,#0d0d0d)', textDecoration: 'none', fontWeight: 700 }}>
                  (469) 893-4120
                </a>
              </p>
              <p className="contact-info-label">Hours</p>
              <p className="contact-info-value">Monday – Saturday<br />9 am – 6 pm</p>
              <a
                href="https://mybizmailbox.coworksapp.com/membership-signup/6953"
                className="w-cta-pill filled"
                style={{ display: 'inline-flex', marginTop: 8 }}
              >
                Get started now ›
              </a>
            </div>
            {/* Form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA strip ───────────────────────────────────────────── */}
      <section className="w-section dark" style={{ padding: '100px 28px' }}>
        <div className="w-section-inner">
          <div className="w-hero-eyebrow">Ready?</div>
          <h2 className="w-hero-title" style={{ fontSize: 52 }}>
            Your Rockwall business address is waiting.
          </h2>
          <p className="w-hero-sub">
            Join over 200 local businesses. Setup takes less than five minutes
            and your address is active the same day.
          </p>
          <div className="w-cta-row">
            <a className="w-cta-pill filled" href="https://mybizmailbox.coworksapp.com/membership-signup/6953">
              Get your address
            </a>
            <a className="w-cta-pill outline" href="#contact">Talk to us first ›</a>
          </div>
          <p style={{
            font: '400 13px/1 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)', marginTop: 24,
          }}>
            802 North Goliad Street · Rockwall, TX 75087 · (469) 893-4120
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
