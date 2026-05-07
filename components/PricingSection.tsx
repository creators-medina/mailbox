'use client';

import { useState } from 'react';

interface Plan {
  name: string;
  price: string;
  priceId: string;
  tagline: string;
  features: string[];
  featured?: boolean;
}

interface PricingSectionProps {
  starterPriceId: string;
  proPriceId: string;
  execPriceId: string;
}

export default function PricingSection({
  starterPriceId,
  proPriceId,
  execPriceId,
}: PricingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      name: 'Starter',
      price: '$29',
      priceId: starterPriceId,
      tagline: 'Everything you need to get a professional address.',
      features: [
        'Real street address in Rockwall, TX',
        'Mail receiving from all carriers',
        'Email notifications on arrival',
        'Hold up to 30 days',
      ],
    },
    {
      name: 'Professional',
      price: '$49',
      priceId: proPriceId,
      tagline: 'The most popular choice for growing businesses.',
      features: [
        'Everything in Starter',
        'Mail scanning on request',
        'Package handling & sign-for',
        '30 mail items per month',
        'Digital mail archive',
      ],
      featured: true,
    },
    {
      name: 'Executive',
      price: '$99',
      priceId: execPriceId,
      tagline: 'Full-service for established professionals.',
      features: [
        'Everything in Professional',
        'Unlimited mail items',
        '24/7 key-fob access',
        'Notary services included',
        'Meeting room access',
      ],
    },
  ];

  async function handleSubscribe(priceId: string, planName: string) {
    if (!priceId) {
      alert('This plan is not configured yet. Please contact us to subscribe.');
      return;
    }
    setLoading(planName);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL');
      }
    } catch {
      alert('Something went wrong. Please try again or call (469) 893-4120.');
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="w-section cream">
      <div className="w-section-inner">
        <span className="section-label">Pricing</span>
        <h2 className="w-hero-title" style={{ fontSize: 48 }}>
          Simple, transparent pricing.
        </h2>
        <p className="w-hero-sub">
          No setup fees. No contracts. Cancel anytime.
          Your professional address is ready the same day.
        </p>

        <div className="w-tiles cols-3" style={{ marginTop: 48, alignItems: 'stretch' }}>
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`pricing-card${plan.featured ? ' featured' : ''}`}
            >
              {plan.featured && (
                <span className="pricing-popular-badge">Most popular</span>
              )}
              <div className="pricing-plan-name">{plan.name}</div>
              <div className="pricing-price">{plan.price}</div>
              <div className="pricing-period">per month, billed monthly</div>
              <p style={{
                font: '400 14px/1.6 var(--font-text,-apple-system,sans-serif)',
                color: 'var(--c-gray-text,#6b7280)',
                margin: '0 0 20px',
              }}>
                {plan.tagline}
              </p>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {plan.features.map(f => (
                  <li key={f}>
                    <span className="pricing-check">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4 l3 3 5-6" stroke={plan.featured ? '#fdfcf9' : '#1d3557'}
                              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className="w-cta-pill filled"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  border: 'none',
                  marginTop: 'auto',
                  cursor: loading === plan.name ? 'default' : 'pointer',
                  opacity: loading === plan.name ? 0.7 : 1,
                }}
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={loading === plan.name}
              >
                {loading === plan.name ? 'Redirecting...' : 'Reserve your address'}
              </button>
            </div>
          ))}
        </div>

        <p style={{
          font: '400 13px/1.5 var(--font-text,-apple-system,sans-serif)',
          color: 'var(--c-gray-text,#6b7280)',
          marginTop: 28,
        }}>
          Questions? Call us at{' '}
          <a href="tel:+14698934120" style={{ color: 'var(--c-navy,#1d3557)', fontWeight: 600 }}>
            (469) 893-4120
          </a>{' '}
          — we&rsquo;re happy to help you choose.
        </p>
      </div>
    </section>
  );
}
