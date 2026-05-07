import type { Metadata } from 'next';
import { Nav, PromoStrip } from '@/components/Nav';
import { FeatureGrid, ProductTile, Footer } from '@/components/Tiles';
import PricingSection from '@/components/PricingSection';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'My Biz Mailbox — Professional Business Address in Rockwall, TX',
  description:
    'Get a real street address in Rockwall, TX for your LLC, packages, and business mail. Protect your home privacy and build instant credibility. Plans from $29/mo.',
};

/* ─── JSON-LD ─────────────────────────────────────────────────── */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'My Biz Mailbox',
  description:
    'Professional business mailbox and address services in Rockwall, TX. Real street address for your LLC, packages, and mail.',
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
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  priceRange: '$$',
};

/* ─── Hero address card visual ────────────────────────────────── */
function AddressCardVisual() {
  return (
    <div className="address-card">
      <div className="address-card-logo-row">
        <div className="address-card-logo-mark">
          <svg viewBox="0 0 32 32" fill="none" strokeWidth="1.75"
               strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
            <rect x="3" y="7" width="26" height="18" rx="3"/>
            <path d="M4 9 L16 18 L28 9"/>
          </svg>
        </div>
        <div>
          <div className="address-card-biz-name">Your Business Name Here</div>
          <div className="address-card-biz-type">LLC · Rockwall, TX</div>
        </div>
      </div>

      <div className="address-card-divider" />

      <div style={{ marginBottom: 16 }}>
        <div className="address-card-label">Business address</div>
        <div className="address-card-value">
          802 North Goliad Street<br />
          Rockwall, TX  75087
        </div>
      </div>

      <div>
        <div className="address-card-label">For use on</div>
        <div className="address-card-value" style={{ fontSize: 13, color: 'var(--c-gray-text,#6b7280)' }}>
          State filings · Business cards · Google listing · Contracts
        </div>
      </div>

      <div className="address-card-badge">
        <span className="address-card-badge-dot" />
        <span className="address-card-badge-text">Active — mail ready</span>
      </div>
    </div>
  );
}

/* ─── Service icons ───────────────────────────────────────────── */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div className="feature-icon-wrap">{children}</div>
  );
}

const iconStroke = { fill: 'none', stroke: 'var(--c-navy,#1d3557)', strokeWidth: '1.6',
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function IconAddress()  { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></svg></Icon>; }
function IconPackage()  { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><path d="M3 9l9-5 9 5v11l-9 5-9-5V9z"/><path d="M12 4v16M3 9l9 5 9-5"/></svg></Icon>; }
function IconScan()     { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h6M8 16h4"/></svg></Icon>; }
function IconKey()      { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><circle cx="9" cy="12" r="4"/><path d="M13 12h8M17 10v4"/></svg></Icon>; }
function IconStamp()    { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><rect x="6" y="3" width="12" height="10" rx="2"/><path d="M4 19h16M8 13v6M16 13v6"/></svg></Icon>; }
function IconRoom()     { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M8 6V4M16 6V4"/></svg></Icon>; }
function IconPrivacy()  { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><path d="M12 3L4 7v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V7z"/><path d="M9 12l2 2 4-4"/></svg></Icon>; }
function IconBell()     { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><path d="M6 10a6 6 0 0112 0v4l2 2H4l2-2v-4"/><path d="M10 18a2 2 0 004 0"/></svg></Icon>; }
function IconCheck()    { return <Icon><svg viewBox="0 0 24 24" width="20" height="20" {...iconStroke}><path d="M20 6L9 17l-5-5"/></svg></Icon>; }

/* ─── FAQ data ────────────────────────────────────────────────── */
const faqs = [
  {
    q: 'What is a business mailbox service?',
    a: 'A business mailbox gives your company a real street address — not a P.O. box — where you can receive mail and packages. It also provides a stable, professional address you can use for LLC registration, Google Business listings, business cards, and client contracts.',
  },
  {
    q: 'Can I use this address to register my LLC in Texas?',
    a: 'Yes. Our address at 802 North Goliad Street, Rockwall TX 75087 meets Texas Secretary of State requirements for LLC registration and can serve as your registered agent address or principal place of business.',
  },
  {
    q: 'How does mail forwarding work?',
    a: 'We scan the exterior of each piece of mail and send you an email notification. You can then request forwarding to any address worldwide, request a scan of the contents, or hold it for in-person pickup. Forwarding is billed separately based on weight and destination.',
  },
  {
    q: 'What carriers do you accept packages from?',
    a: 'We accept deliveries from all major carriers — USPS, UPS, FedEx, Amazon Logistics, DHL, and most regional carriers. If it ships to a street address, we can receive it.',
  },
  {
    q: 'How quickly will I be notified when mail arrives?',
    a: 'You receive an email notification as soon as your mail or package is checked in — typically within a few hours of arrival during business hours. Notifications include an exterior scan so you can identify the sender without visiting.',
  },
  {
    q: 'What are your hours?',
    a: 'Our Rockwall location is open Monday through Saturday, 9 am to 6 pm. Executive plan members have 24/7 key-fob access to the mailbox area for after-hours pickup.',
  },
  {
    q: "What happens to my packages if I can't come in?",
    a: 'We hold packages securely on-site for up to 30 days at no extra charge. After 30 days a small storage fee applies. You can request forwarding at any time if pickup is not convenient.',
  },
  {
    q: 'Where exactly are you located in Rockwall, TX?',
    a: 'We are at 802 North Goliad Street, Rockwall, TX 75087 — just minutes from I-30 and the Rockwall town center, with ample parking on site.',
  },
];

/* ─── Business types ──────────────────────────────────────────── */
const bizTypes = [
  'Contractors', 'Realtors', 'Attorneys', 'Insurance agents',
  'Mortgage brokers', 'eCommerce sellers', 'Consultants',
  'Home-based businesses', 'Sole proprietors', 'LLCs',
  'Financial advisors', 'Freelancers',
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Promo strip */}
      <PromoStrip />

      {/* Nav */}
      <Nav />

      {/* ─── 1. Hero ─────────────────────────────────────────────── */}
      <section className="w-section navy tall">
        <div className="w-section-inner" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', textAlign: 'left' }}>
          {/* Left: copy */}
          <div>
            <div className="w-hero-eyebrow">Rockwall, TX · Est. 2024</div>
            <h1 className="w-hero-title" style={{ fontSize: 52, marginBottom: 20 }}>
              Give your business a professional Rockwall address.
            </h1>
            <p className="w-hero-sub" style={{ margin: '0 0 36px', maxWidth: '100%' }}>
              A real street address at 802 North Goliad Street —
              for your LLC filings, business cards, packages, and Google listing.
              Keep your home address private and look established from day one.
            </p>
            <div className="w-cta-row" style={{ justifyContent: 'flex-start' }}>
              <a className="w-cta-pill filled" href="#pricing">Reserve your address</a>
              <a className="w-cta-pill outline" href="#how-it-works">See how it works ›</a>
            </div>
            <p style={{ font: '400 13px/1.5 var(--font-text,-apple-system,sans-serif)', color: 'rgba(255,255,255,0.45)', marginTop: 20 }}>
              No setup fee · Same-day activation · Cancel anytime
            </p>
          </div>
          {/* Right: address card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <AddressCardVisual />
          </div>
        </div>
      </section>

      {/* ─── Trust stats bar ─────────────────────────────────────── */}
      <section className="w-section white compact">
        <div className="w-section-inner">
          <div className="stats-bar">
            {[
              { num: '200+',      label: 'Rockwall businesses served' },
              { num: 'All',       label: 'Major carriers accepted' },
              { num: 'Same day',  label: 'Activation after signup' },
              { num: 'Mon–Sat',   label: '9 am – 6 pm open hours' },
            ].map(s => (
              <div key={s.label} className="stats-bar-item">
                <span className="stats-bar-num">{s.num}</span>
                <span className="stats-bar-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. Built for Local Business Owners ──────────────────── */}
      <section className="w-section cream">
        <div className="w-section-inner">
          <span className="section-label">Who we serve</span>
          <h2 className="w-hero-title" style={{ fontSize: 46 }}>
            Built for Rockwall&rsquo;s working professionals.
          </h2>
          <p className="w-hero-sub">
            Whether you&rsquo;re an independent contractor, a licensed professional, or a
            growing LLC — a professional address builds credibility from day one.
          </p>
          <div className="biz-type-grid">
            {bizTypes.map(t => (
              <div key={t} className="biz-type-chip">
                <span className="biz-type-chip-dot" />
                {t}
              </div>
            ))}
          </div>

          {/* Callout box */}
          <div className="callout-box">
            <div className="callout-box-title">
              Your home address is public record. Your business address doesn&rsquo;t have to be.
            </div>
            <p className="callout-box-body">
              When you register an LLC in Texas, your address becomes visible on the Secretary of
              State&rsquo;s public records. Using a professional address at My Biz Mailbox keeps
              your personal information private while giving your business a legitimate, permanent home.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 3. Why businesses choose us ─────────────────────────── */}
      <section id="services" className="w-section white">
        <div className="w-section-inner">
          <span className="section-label">Why My Biz Mailbox</span>
          <h2 className="w-hero-title" style={{ fontSize: 46 }}>
            Everything a professional address should be.
          </h2>
          <p className="w-hero-sub">
            We handle your mail, packages, and business identity so you can focus
            on running your business — not watching your front porch.
          </p>

          {/* 3-col feature grid */}
          <div className="w-tiles cols-3" style={{ marginTop: 52, textAlign: 'left' }}>
            {[
              {
                icon: <IconAddress />,
                title: 'Real street address',
                body: 'Not a P.O. box. A legitimate street address accepted by the state of Texas for LLC registration, banking, and licensing.',
              },
              {
                icon: <IconPrivacy />,
                title: 'Home privacy protected',
                body: 'Keep your personal address off state records, Google, and your business cards. Your home stays out of public view.',
              },
              {
                icon: <IconPackage />,
                title: 'Packages from every carrier',
                body: 'USPS, UPS, FedEx, Amazon, DHL — we accept deliveries from all major carriers and sign on your behalf.',
              },
              {
                icon: <IconBell />,
                title: 'Instant email alerts',
                body: 'Get notified the moment your mail or package arrives — with an exterior scan so you know who it&rsquo;s from before you drive in.',
              },
              {
                icon: <IconScan />,
                title: 'Mail scanning & forwarding',
                body: 'Request a digital scan of any piece of mail, or have it forwarded to any address — nationwide or international.',
              },
              {
                icon: <IconCheck />,
                title: 'Same-day activation',
                body: 'Sign up online, complete your USPS Form 1583, and your address is active the same business day.',
              },
            ].map(f => (
              <div key={f.title} className="w-tile light" style={{ padding: '32px 28px' }}>
                {f.icon}
                <h3 className="w-tile-title" style={{ marginTop: 16 }}>{f.title}</h3>
                <p className="w-tile-sub" style={{ margin: 0 }}
                   dangerouslySetInnerHTML={{ __html: f.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="w-section navy">
        <div className="w-section-inner">
          <span className="section-label">Simple process</span>
          <h2 className="w-hero-title" style={{ fontSize: 46 }}>
            Up and running today.
          </h2>
          <p className="w-hero-sub">
            Three steps. Takes less than five minutes. No office visit required.
          </p>

          <div className="w-tiles cols-3" style={{ marginTop: 52 }}>
            {[
              {
                num: '1',
                title: 'Choose a plan',
                body: 'Pick the plan that fits your mail volume. Upgrade or downgrade anytime — no contracts.',
              },
              {
                num: '2',
                title: 'Set your address',
                body: 'Use 802 North Goliad Street, Rockwall TX 75087 on your LLC filing, business accounts, website, and shipping labels.',
              },
              {
                num: '3',
                title: 'Receive mail & packages',
                body: 'We sign for everything, send you instant email notifications, and hold your items securely until you&rsquo;re ready.',
              },
            ].map(s => (
              <div key={s.num} className="w-tile dark" style={{ padding: '40px 32px' }}>
                <div className="step-number">{s.num}.</div>
                <h3 className="w-tile-title">{s.title}</h3>
                <p className="w-tile-sub" dangerouslySetInnerHTML={{ __html: s.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Trust / Reviews section ──────────────────────────── */}
      <section className="w-section cream">
        <div className="w-section-inner">
          <span className="section-label">Reviews</span>
          <h2 className="w-hero-title" style={{ fontSize: 46 }}>
            Trusted by Rockwall businesses.
          </h2>
          <p className="w-hero-sub">
            From contractors to consultants — local business owners rely on
            My Biz Mailbox for their professional address.
          </p>

          <div className="w-tiles cols-3" style={{ marginTop: 52 }}>
            {[
              {
                quote: 'Separating my home address from my LLC registration was the best decision I made when I started out. My Biz Mailbox made the switch completely painless — same-day setup and I never missed a piece of mail.',
                name: 'Marcus R.',
                role: 'Commercial real estate consultant · Rockwall, TX',
              },
              {
                quote: 'I run an e-commerce brand and ship dozens of packages a week. The instant notifications and professional receiving process have saved me hours. My clients see a real Rockwall address — not my garage.',
                name: 'Diane T.',
                role: 'eCommerce retailer · Rowlett, TX',
              },
              {
                quote: 'As a licensed financial advisor, my business address appears on every document I file. Having a professional Rockwall address gives my clients confidence, and the notary service on site is a huge bonus.',
                name: 'Priya S.',
                role: 'Independent financial advisor · Forney, TX',
              },
            ].map(r => (
              <div key={r.name} className="review-card">
                <div className="review-stars">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="review-star">★</span>
                  ))}
                </div>
                <p className="review-quote">&ldquo;{r.quote}&rdquo;</p>
                <div>
                  <div className="review-author-name">{r.name}</div>
                  <div className="review-author-role">{r.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Pricing ───────────────────────────────────────────── */}
      <PricingSection
        starterPriceId={process.env.STRIPE_STARTER_PRICE_ID ?? ''}
        proPriceId={process.env.STRIPE_PRO_PRICE_ID ?? ''}
        execPriceId={process.env.STRIPE_EXEC_PRICE_ID ?? ''}
      />

      {/* ─── 6. Stop using your home address ─────────────────────── */}
      <section className="w-section white">
        <div className="w-section-inner">
          <span className="section-label">Why it matters</span>
          <h2 className="w-hero-title" style={{ fontSize: 46 }}>
            Stop using your home address for business.
          </h2>
          <p className="w-hero-sub">
            It&rsquo;s not just about appearances. It&rsquo;s about protecting your family,
            your privacy, and your professional reputation.
          </p>

          <div className="w-tiles cols-2" style={{ marginTop: 52, maxWidth: 800, margin: '52px auto 0' }}>
            {[
              {
                icon: <IconPrivacy />,
                title: 'Your home address is public record',
                body: 'Texas LLC filings are publicly searchable. Clients, competitors, and anyone with an internet connection can find your home address if you list it as your business address.',
              },
              {
                icon: <IconCheck />,
                title: 'A real address builds instant credibility',
                body: 'A street address on a business card or Google listing signals permanence and legitimacy. Clients and partners take you more seriously when your address is a real commercial location.',
              },
              {
                icon: <IconStamp />,
                title: 'Banks and agencies require it',
                body: 'Many banks, licensing boards, and government agencies require a non-residential business address. A P.O. box often isn&rsquo;t acceptable — a real street address always is.',
              },
              {
                icon: <IconPackage />,
                title: 'Never miss a delivery again',
                body: 'Packages left on your porch can be stolen, damaged, or missed. We sign for everything, check it in within hours, and notify you immediately — every carrier, every time.',
              },
            ].map(f => (
              <div key={f.title} className="w-tile light" style={{ padding: '32px 28px' }}>
                {f.icon}
                <h3 className="w-tile-title" style={{ marginTop: 16 }}>{f.title}</h3>
                <p className="w-tile-sub" style={{ margin: 0 }}
                   dangerouslySetInnerHTML={{ __html: f.body }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services detail ──────────────────────────────────────── */}
      <section className="w-section cream">
        <div className="w-section-inner">
          <span className="section-label">All services</span>
          <h2 className="w-hero-title" style={{ fontSize: 46 }}>
            More than a mailbox.
          </h2>
          <p className="w-hero-sub">
            My Biz Mailbox is a full business address service — with every feature
            a professional needs to operate with confidence.
          </p>

          <div className="w-tiles cols-3" style={{ marginTop: 52 }}>
            {[
              { icon: <IconAddress />, title: 'Business street address', eyebrow: 'Identity', sub: 'A permanent, real street address accepted for LLC filing, banking, licensing, and Google Business.' },
              { icon: <IconPackage />, title: 'Package receiving', eyebrow: 'Packages', sub: 'We accept deliveries from all carriers, sign on your behalf, and check them in the same day.' },
              { icon: <IconScan />,    title: 'Mail scanning & forwarding', eyebrow: 'Mail', sub: 'Request a digital scan or forward any piece of mail to any address, anywhere in the world.' },
              { icon: <IconKey />,     title: '24/7 mailbox access', eyebrow: 'Access', sub: 'Executive members get round-the-clock key-fob access for after-hours pickup on your schedule.' },
              { icon: <IconStamp />,   title: 'Notary services', eyebrow: 'Documents', sub: 'A certified notary is on site during business hours — no appointment required for most documents.' },
              { icon: <IconRoom />,    title: 'Meeting room access', eyebrow: 'Space', sub: 'Book a private conference room by the hour for client meetings, closings, or focused work.' },
            ].map(s => (
              <ProductTile
                key={s.title}
                theme="light"
                eyebrow={s.eyebrow}
                title={s.title}
                sub={s.sub}
              >
                {s.icon}
              </ProductTile>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SEO content ──────────────────────────────────────────── */}
      <section className="w-section white">
        <div className="w-section-inner">
          <span className="section-label">Local expertise</span>
          <h2 className="w-hero-title" style={{ fontSize: 40 }}>
            Why Rockwall, TX businesses choose My Biz Mailbox.
          </h2>
          <div className="seo-body">
            <p>
              Running a small business, LLC, or sole proprietorship in Texas comes with one
              persistent challenge: your official address follows you everywhere — state
              registrations, bank accounts, Google Business listings, and client-facing
              materials. Using a home address works until it doesn&rsquo;t, exposing your
              personal residence to public records and making it harder to maintain a
              professional image as your company grows. My Biz Mailbox gives Rockwall-area
              businesses a legitimate street address at 802 North Goliad Street that meets
              Texas Secretary of State requirements and serves as a stable anchor for all
              your business correspondence.
            </p>
            <p>
              For remote workers, freelancers, and home-based businesses across the greater
              DFW metroplex — from Rowlett and Garland to Forney and Greenville — a Rockwall
              address signals stability to clients and partners without requiring you to lease
              expensive office space. Whether you&rsquo;re a consultant billing Fortune 500
              clients, a product company shipping from a warehouse, or a licensed professional
              who needs a compliant address for your state board filings, we have a plan sized
              to match.
            </p>
            <p>
              Package receiving is a core part of what we do. We accept deliveries from every
              major carrier — USPS, UPS, FedEx, Amazon, DHL, and regional services — and
              check them in the same day they arrive. You get an email notification with an
              exterior scan so you always know what has landed and when. Packages are held
              securely on site for up to 30 days, and Executive members can pick them up any
              time day or night.
            </p>
            <p>
              The Dallas–Fort Worth area is one of the fastest-growing business corridors in
              the country, and Rockwall sits at its eastern edge — close to the metro,
              distinct enough to stand out. As your company scales, My Biz Mailbox scales
              with you: add mail scanning, upgrade your mail volume, or book our on-site
              meeting rooms when you need a professional space to close a deal.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────── */}
      <section id="faq" className="w-section cream">
        <div className="w-section-inner">
          <span className="section-label">FAQ</span>
          <h2 className="w-hero-title" style={{ fontSize: 46 }}>
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

      {/* ─── Contact ──────────────────────────────────────────────── */}
      <section id="contact" className="w-section white">
        <div className="w-section-inner" style={{ textAlign: 'left' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">Contact</span>
            <h2 className="w-hero-title" style={{ fontSize: 46 }}>Get in touch.</h2>
            <p className="w-hero-sub">
              Questions about plans, services, or your specific situation?
              We&rsquo;re here to help.
            </p>
          </div>
          <div className="contact-grid">
            {/* Left: info */}
            <div>
              <p className="contact-info-label">Address</p>
              <p className="contact-info-value">802 North Goliad Street<br />Rockwall, TX 75087</p>
              <p className="contact-info-label">Phone</p>
              <p className="contact-info-value">
                <a href="tel:+14698934120" style={{ color: 'var(--c-navy,#1d3557)', textDecoration: 'none', fontWeight: 600 }}>
                  (469) 893-4120
                </a>
              </p>
              <p className="contact-info-label">Hours</p>
              <p className="contact-info-value">Mon–Sat, 9 am–6 pm</p>
              <p className="contact-info-label">Sign up online</p>
              <p className="contact-info-value" style={{ marginBottom: 0 }}>
                <a
                  href="https://mybizmailbox.coworksapp.com/membership-signup/6953"
                  className="w-cta-pill filled"
                  style={{ display: 'inline-flex', marginTop: 6 }}
                >
                  Reserve your address ›
                </a>
              </p>
            </div>
            {/* Right: form */}
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. Strong CTA footer ─────────────────────────────────── */}
      <section className="w-section navy" style={{ padding: '100px 28px' }}>
        <div className="w-section-inner">
          <div className="w-hero-eyebrow">Ready to get started?</div>
          <h2 className="w-hero-title" style={{ fontSize: 52 }}>
            Your Rockwall business address is waiting.
          </h2>
          <p className="w-hero-sub">
            Join over 200 local businesses that have made the switch.
            Setup takes less than five minutes — your address is active the same day.
          </p>
          <div className="w-cta-row" style={{ marginTop: 8 }}>
            <a className="w-cta-pill filled" href="#pricing">
              Reserve your address
            </a>
            <a className="w-cta-pill outline" href="#contact">
              Talk to us first ›
            </a>
          </div>
          <p style={{ font: '400 13px/1.5 var(--font-text,-apple-system,sans-serif)', color: 'rgba(255,255,255,0.38)', marginTop: 24 }}>
            802 North Goliad Street · Rockwall, TX 75087 · (469) 893-4120
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}
