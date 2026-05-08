// Phase 1: static pricing display — no Stripe checkout yet.
// CTA links to #contact. Wire up Stripe in a later phase.

const SIGNUP_URL = 'https://mybizmailbox.coworksapp.com/membership-signup/6953';

const coreFeatures = [
  'Real Rockwall, TX business address',
  'Unique suite number assigned to you',
  'Mail receiving from all carriers',
  'Envelope notifications via email',
  'Online dashboard access',
  'Local pickup available Mon–Sat',
];

const addons = [
  {
    name: 'Mail Scanning',
    price: '+$9.99',
    period: '/mo',
    desc: 'We open and scan the contents of your mail so you can read everything online without driving in.',
  },
  {
    name: 'Business Phone Number',
    price: '+$9.99',
    period: '/mo',
    desc: 'Get a local Rockwall phone number that rings your cell or voicemail. Professional caller ID included.',
  },
  {
    name: 'Google Business Setup',
    price: '$49.99',
    period: ' one-time',
    desc: 'We set up and verify your Google Business Profile using your new address so customers can find you.',
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="w-section light">
      <div className="w-section-inner">
        <span className="section-label">Pricing</span>
        <h2 className="w-hero-title" style={{ fontSize: 48 }}>
          One straightforward plan.
        </h2>
        <p className="w-hero-sub">
          No contracts. No hidden fees. Cancel anytime.
          Add only what your business needs.
        </p>

        {/* Core plan */}
        <div
          className="pricing-card"
          style={{ maxWidth: 520, margin: '48px auto 0', textAlign: 'left' }}
        >
          <div className="pricing-plan-name">Business Address</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <div className="pricing-price">$29.99</div>
            <div className="pricing-period">/month</div>
          </div>
          <p className="pricing-tagline">
            Everything you need to have a professional business address
            in Rockwall, TX and manage your mail online.
          </p>
          <ul className="pricing-features">
            {coreFeatures.map(f => (
              <li key={f}>
                <span className="pricing-check-icon">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
          <a
            className="w-cta-pill filled"
            href={SIGNUP_URL}
            style={{
              display: 'inline-flex', justifyContent: 'center',
              width: '100%', border: 'none',
            }}
          >
            Get started
          </a>
          <p style={{
            font: '400 12px/1.5 var(--font-text,sans-serif)',
            color: 'var(--c-light-text-2,#555)',
            textAlign: 'center', marginTop: 14, marginBottom: 0,
          }}>
            Questions? Call us at{' '}
            <a href="tel:+14698934120" style={{ color: 'var(--c-light-text,#0d0d0d)', fontWeight: 600 }}>
              (469) 893-4120
            </a>
          </p>
        </div>

        {/* Add-ons */}
        <div style={{ marginTop: 64 }}>
          <p style={{
            font: '700 11px/1 var(--font-text,sans-serif)',
            letterSpacing: '0.10em', textTransform: 'uppercase',
            color: 'var(--c-light-text-2,#555)', marginBottom: 28,
          }}>
            Optional add-ons
          </p>
          <div className="w-section dark" style={{ padding: 0 }}>
            <div className="w-tiles cols-3" style={{ maxWidth: 860, margin: '0 auto' }}>
              {addons.map(a => (
                <div key={a.name} className="addon-card">
                  <div className="addon-price">
                    {a.price}
                    <span className="addon-period">{a.period}</span>
                  </div>
                  <div className="addon-name">{a.name}</div>
                  <p className="addon-desc">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
