import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';
import PricingSection from '@/components/PricingSection';
import ContactForm from '@/components/ContactForm';
import { BUSINESS } from '@/lib/config/business';

export const metadata: Metadata = {
  title: 'My Biz Address — Professional Business Address in Rockwall, TX',
  description:
    'Get a real Rockwall, TX business address, receive mail securely, and manage it all online. Starting at $29.99/mo. No contracts.',
};

/* ── JSON-LD ────────────────────────────────────────────────────────────────── */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: BUSINESS.brandName,
  description: 'Professional business address and mail receiving service in Rockwall, TX.',
  url: BUSINESS.websiteUrl,
  telephone: BUSINESS.phoneE164,
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.addressStreet,
    addressLocality: BUSINESS.addressCity,
    addressRegion: BUSINESS.addressState,
    postalCode: BUSINESS.addressZip,
    addressCountry: 'US',
  },
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    opens: BUSINESS.hoursOpen,
    closes: BUSINESS.hoursClose,
  }],
};

/* ── Dashboard mockup ────────────────────────────────────────────────────────────────── */
const mailItems = [
  {
    sender: 'Wells Fargo Business',
    desc: 'Account statement · Letter',
    date: 'Today',
    badge: 'New',
    cls: 'mock-badge-new',
    actions: ['Open & scan', 'Forward'],
  },
  {
    sender: 'TX Secretary of State',
    desc: 'Annual report notice · Letter',
    date: 'Dec 18',
    badge: 'Held',
    cls: 'mock-badge-held',
    actions: [],
  },
  {
    sender: 'USPS Certified Mail',
    desc: 'Package · 0.8 lbs',
    date: 'Dec 17',
    badge: 'Ready',
    cls: 'mock-badge-ready',
    actions: ['Hold for pickup'],
  },
  {
    sender: 'City of Rockwall',
    desc: 'Business license renewal',
    date: 'Dec 15',
    badge: 'Scanned',
    cls: 'mock-badge-scanned',
    actions: [],
  },
];

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 16 12" width="13" height="10" fill="none"
         stroke="var(--c-gold-2,#C99A5A)" strokeWidth="1.4"
         strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="14" height="10" rx="1.5"/>
      <path d="M1 3l7 5 7-5"/>
    </svg>
  );
}

function DashboardMockup() {
  return (
    <div className="mock-shell">
      <div className="mock-chrome">
        <span className="mock-dot mock-dot-1"/>
        <span className="mock-dot mock-dot-2"/>
        <span className="mock-dot mock-dot-3"/>
        <span style={{ marginLeft: 10, font: '400 10px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
          My Biz Address · Mailbox dashboard
        </span>
      </div>

      <div className="mock-header">
        <div>
          <div className="mock-header-title">My Biz Address</div>
          <div className="mock-header-sub">Mail dashboard</div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(181,138,82,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: '700 11px/1 var(--font-text,sans-serif)',
          color: 'var(--c-gold-2,#C99A5A)',
        }}>
          MB
        </div>
      </div>

      <div className="mock-address-block">
        <div>
          <div className="mock-address-text" style={{ fontWeight: 600, marginBottom: 2 }}>Suite 247</div>
          <div className="mock-address-text">802 N Goliad St · Rockwall, TX 75087</div>
        </div>
        <div className="mock-active-badge">
          <span className="mock-active-dot"/>
          Active
        </div>
      </div>

      <div className="mock-section-header">
        <span className="mock-section-title">Recent mail</span>
        <span className="mock-section-count">4 items</span>
      </div>

      {mailItems.map(item => (
        <div key={item.sender} className="mock-mail-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
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
          {item.actions.length > 0 && (
            <div className="mock-actions">
              {item.actions.map(a => (
                <span key={a} className="mock-action-chip">{a}</span>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--c-border,rgba(255,255,255,0.08))',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
          4 of 12 items shown
        </span>
        <span style={{ font: '600 11px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', cursor: 'pointer' }}>
          View all →
        </span>
      </div>
    </div>
  );
}

function PropIcon({ children }: { children: React.ReactNode }) {
  return <div className="prop-icon">{children}</div>;
}

const S = { fill: 'none', stroke: 'var(--c-gold-2,#C99A5A)' as string,
  strokeWidth: '1.6', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

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
    a: 'Basic plans include envelope notifications — we photograph the outside of each piece so you know who sent it before leaving your desk. Full content scanning (opening and photographing the contents) is available as an add-on for $9.99/mo.',
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

const audiences = [
  'LLC Owners',
  'Consultants',
  'Contractors',
  'Real Estate Investors',
  'Attorneys',
  'CPAs',
  'Remote Businesses',
  'Home-Based Businesses',
  'E-Commerce Sellers',
  'Property Managers',
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Nav />

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <section className="w-section dark tall">
        <div
          className="w-section-inner hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
            textAlign: 'left',
          }}
        >
          <div>
            <div className="w-hero-eyebrow">Rockwall, TX · Mail Receiving Service</div>
            <h1 className="w-hero-title" style={{ fontSize: 54 }}>
              A professional Rockwall business address.
            </h1>
            <p className="w-hero-sub" style={{ margin: '0 0 32px', maxWidth: '100%' }}>
              Get a real Rockwall business address, receive mail securely,
              and manage it online from anywhere.
            </p>
            <div className="w-cta-row" style={{ justifyContent: 'flex-start', marginBottom: 20 }}>
              <a className="w-cta-pill filled" href="/signup">Get your address</a>
              <a className="w-cta-pill outline" href="/#pricing">View plans ›</a>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
              {[
                'Real Rockwall address',
                'Secure mail handling',
                'Local pickup available',
              ].map(t => (
                <span key={t} style={{
                  font: '500 12px/1 var(--font-text,sans-serif)',
                  color: 'var(--c-text-3)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--c-gold,#B58A52)',
                    display: 'inline-block', flexShrink: 0,
                  }}/>
                  {t}
                </span>
              ))}
            </div>
            <p style={{
              font: '400 12px/1 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)', marginTop: 16,
            }}>
              Starting at $29.99/mo · No contracts · Cancel anytime
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <DashboardMockup />
          </div>
        </div>

        <style>{`
          @media (max-width: 880px) {
            .hero-grid { grid-template-columns: 1fr !important; }
            .hero-grid > :first-child { text-align: center; }
            .hero-grid .w-cta-row { justify-content: center !important; }
            .hero-grid > :first-child > div:last-of-type { justify-content: center; }
          }
        `}</style>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="w-section medium compact">
        <div className="w-section-inner">
          <div className="stats-bar">
            {[
              { num: 'Real address', label: 'Not a P.O. box' },
              { num: 'All carriers', label: 'USPS, UPS, FedEx, Amazon' },
              { num: 'Locally run',  label: 'Rockwall, TX team' },
              { num: 'Mon–Sat',      label: '9 am – 6 pm · Rockwall' },
            ].map(s => (
              <div key={s.label} className="stats-bar-item">
                <span className="stats-bar-num">{s.num}</span>
                <span className="stats-bar-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Value props ────────────────────────────────────────────────────────── */}
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
                body: 'View your mail from any device. Request scanning, forwarding, or shredding for each piece — scan, forward, or hold without making a trip.',
              },
              {
                icon: (
                  <PropIcon>
                    <svg viewBox="0 0 20 20" width="20" height="20" {...S}>
                      <rect x="3" y="3" width="14" height="14" rx="3"/>
                      <path d="M7 10l2.5 2.5L14 8"/>
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

      {/* ── 3. How it works ────────────────────────────────────────────────────────── */}
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
                body: 'We accept all deliveries and notify you for every piece. View your mail, request scans, or arrange forwarding — all from your online dashboard.',
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

      {/* ── 3.5 Who It’s For ───────────────────────────────────────────────────────── */}
      <section className="w-section light">
        <div className="w-section-inner">
          <span className="section-label">Who it&rsquo;s for</span>
          <h2 className="w-hero-title" style={{ fontSize: 44 }}>
            Built for Rockwall business owners.
          </h2>
          <p className="w-hero-sub">
            Perfect for local businesses that need a professional address
            without renting an office.
          </p>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10,
            justifyContent: 'center', marginTop: 40,
          }}>
            {audiences.map(a => (
              <span key={a} style={{
                font: '500 14px/1.3 var(--font-text,sans-serif)',
                color: 'var(--c-light-text,#1F2937)',
                background: '#fff',
                border: '1px solid var(--c-light-border,rgba(0,0,0,0.09))',
                borderRadius: 'var(--r-lg,16px)',
                padding: '12px 22px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>{a}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Pricing ─────────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── 5. Trust section ────────────────────────────────────────────────────────── */}
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
          <div>
            <span className="section-label">Why choose us</span>
            <h2 className="w-hero-title" style={{ fontSize: 44, textAlign: 'left', margin: '0 0 20px' }}>
              Local handling.<br />Professional presence.
            </h2>
            <p style={{
              font: '400 18px/1.75 var(--font-text,sans-serif)',
              color: 'var(--c-text-2)',
              maxWidth: 440, margin: '0 0 36px',
            }}>
              We&rsquo;re a local Rockwall business — our team handles
              your mail with care, and we&rsquo;re here when you need us.
            </p>
            <a className="w-cta-pill filled" href="#contact">Talk to our team</a>
          </div>

          <div>
            {[
              {
                icon: (
                  <svg viewBox="0 0 20 20" width="18" height="18" {...S}>
                    <path d="M10 2c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z"/>
                    <path d="M10 6v4l2.5 2.5"/>
                  </svg>
                ),
                title: 'Your mail is handled by a local team.',
                body: 'Our Rockwall staff handles every piece personally. When you call or visit, you\'re working with the same people who manage your mail.',
              },
              {
                icon: (
                  <svg viewBox="0 0 20 20" width="18" height="18" {...S}>
                    <path d="M3 9l7-7 7 7v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/>
                    <path d="M8 19V12h4v7"/>
                  </svg>
                ),
                title: 'Your home address stays private.',
                body: 'Keep your home off state filings, public records, and Google — protecting your family\'s privacy as your business grows.',
              },
              {
                icon: (
                  <svg viewBox="0 0 20 20" width="18" height="18" {...S}>
                    <rect x="3" y="3" width="14" height="14" rx="3"/>
                    <path d="M7 10l2.5 2.5L14 8"/>
                  </svg>
                ),
                title: 'Your business looks established from day one.',
                body: 'A real street address gives clients, banks, and agencies a credible location they can verify and trust.',
              },
              {
                icon: (
                  <svg viewBox="0 0 20 20" width="18" height="18" {...S}>
                    <path d="M10 2l2.5 5h5.5l-4.5 4 1.5 6L10 14l-5 3 1.5-6L2 7h5.5z"/>
                  </svg>
                ),
                title: 'Secure mail storage.',
                body: 'Your mail is held in a locked facility. We never open or read it without your request, and your information is never shared.',
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

      {/* ── 6. FAQ ─────────────────────────────────────────────────────────── */}
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

      {/* ── 7. Contact ─────────────────────────────────────────────────────────── */}
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
            <div>
              <p className="contact-info-label">Address</p>
              <p className="contact-info-value">{BUSINESS.addressLine1}<br />{BUSINESS.addressLine2}</p>
              <p className="contact-info-label">Phone</p>
              <p className="contact-info-value">
                <a href={`tel:${BUSINESS.phoneE164}`} style={{ color: 'var(--c-light-text,#1F2937)', textDecoration: 'none', fontWeight: 700 }}>
                  {BUSINESS.phone}
                </a>
              </p>
              <p className="contact-info-label">Hours</p>
              <p className="contact-info-value">{BUSINESS.hoursLong.replace(', ', '\n').split('\n').map((l, i) => <span key={i}>{l}{i === 0 ? <br /> : ''}</span>)}</p>
              <a
                href="/signup"
                className="w-cta-pill filled"
                style={{ display: 'inline-flex', marginTop: 8 }}
              >
                Get started now ›
              </a>
            </div>
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA strip ─────────────────────────────────────────────────────────── */}
      <section className="w-section dark" style={{ padding: '100px 28px' }}>
        <div className="w-section-inner">
          <div className="w-hero-eyebrow">Ready to get started?</div>
          <h2 className="w-hero-title" style={{ fontSize: 52 }}>
            Your Rockwall business address is waiting.
          </h2>
          <p className="w-hero-sub">
            Sign up online in minutes and choose your plan. After checkout
            we&rsquo;ll assign your suite and walk you through USPS Form 1583 —
            the one postal step required before we can receive your mail.
          </p>
          <div className="w-cta-row">
            <a className="w-cta-pill filled" href="/signup">
              Get your address
            </a>
            <a className="w-cta-pill outline" href="#contact">Talk to us first ›</a>
          </div>
          <p style={{
            font: '400 13px/1 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)', marginTop: 24,
          }}>
            {BUSINESS.addressFull} · {BUSINESS.phone}
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
