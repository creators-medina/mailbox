'use client';

import { useState, FormEvent } from 'react';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Tiles';
import { SHORT_ADDRESS } from '@/lib/config/business';

type Addons = {
  mailScanning: boolean;
  businessPhone: boolean;
  googleBusinessSetup: boolean;
};

const BASE_MONTHLY = 29.99;

const ADDON_INFO = [
  {
    key: 'mailScanning' as keyof Addons,
    name: 'Mail Scanning',
    price: '+$9.99',
    period: '/mo',
    monthly: 9.99,
    oneTime: 0,
    desc: 'We open and scan your mail contents so you can read everything online without driving in.',
  },
  {
    key: 'businessPhone' as keyof Addons,
    name: 'Business Phone Number',
    price: '+$9.99',
    period: '/mo',
    monthly: 9.99,
    oneTime: 0,
    desc: 'A local Rockwall number that rings your cell. Professional caller ID included.',
  },
  {
    key: 'googleBusinessSetup' as keyof Addons,
    name: 'Google Business Profile Setup',
    price: '$49.99',
    period: ' one-time',
    monthly: 0,
    oneTime: 49.99,
    desc: 'We set up and verify your Google Business Profile using your new address.',
  },
] as const;

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', businessName: '', email: '', phone: '' });
  const [addons, setAddons] = useState<Addons>({
    mailScanning: false,
    businessPhone: false,
    googleBusinessSetup: false,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function setField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  function toggleAddon(key: keyof Addons) {
    setAddons(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const monthlyTotal =
    BASE_MONTHLY +
    ADDON_INFO.filter(a => addons[a.key]).reduce((sum, a) => sum + a.monthly, 0);
  const oneTimeTotal =
    ADDON_INFO.filter(a => addons[a.key]).reduce((sum, a) => sum + a.oneTime, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, addons }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Failed to start checkout');
      }
      window.location.href = data.url;
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <Nav />

      <section className="w-section dark" style={{ minHeight: '100vh', paddingTop: 112, paddingBottom: 80 }}>
        <div className="w-section-inner" style={{ maxWidth: 1020, textAlign: 'left' }}>

          <div className="w-hero-eyebrow" style={{ marginBottom: 10 }}>Get your address</div>
          <h1 className="w-hero-title" style={{ fontSize: 42, marginBottom: 12 }}>
            Start your My Biz Address plan.
          </h1>
          <p style={{
            font: '400 17px/1.6 var(--font-text,sans-serif)',
            color: 'var(--c-text-2)', maxWidth: 480, marginBottom: 52,
          }}>
            Fill in your info, pick any add-ons, and proceed to secure checkout.
            Your address is active the same day.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="signup-grid">

              {/* ── Left: personal info ──────────────────────────── */}
              <div>
                <p className="signup-section-label">Your information</p>

                <div className="ds-field">
                  <label className="ds-dark-label" htmlFor="s-name">Full name</label>
                  <input id="s-name" className="ds-dark-input" type="text"
                    placeholder="Jane Smith"
                    value={form.name} onChange={setField('name')} required />
                </div>
                <div className="ds-field">
                  <label className="ds-dark-label" htmlFor="s-biz">Business name</label>
                  <input id="s-biz" className="ds-dark-input" type="text"
                    placeholder="Smith Consulting LLC"
                    value={form.businessName} onChange={setField('businessName')} required />
                </div>
                <div className="ds-field">
                  <label className="ds-dark-label" htmlFor="s-email">Email address</label>
                  <input id="s-email" className="ds-dark-input" type="email"
                    placeholder="jane@smithconsulting.com"
                    value={form.email} onChange={setField('email')} required />
                </div>
                <div className="ds-field">
                  <label className="ds-dark-label" htmlFor="s-phone">
                    Phone <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>(optional)</span>
                  </label>
                  <input id="s-phone" className="ds-dark-input" type="tel"
                    placeholder="(469) 000-0000"
                    value={form.phone} onChange={setField('phone')} />
                </div>

                {/* Mobile: error + submit below fields */}
                <div className="signup-mobile-only" style={{ marginTop: 32 }}>
                  {status === 'error' && (
                    <p style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: '#f87171', marginBottom: 14 }}>
                      {errorMsg}
                    </p>
                  )}
                  <button
                    className="w-cta-pill filled"
                    type="submit"
                    disabled={status === 'loading'}
                    style={{ border: 'none', cursor: status === 'loading' ? 'default' : 'pointer', width: '100%', justifyContent: 'center' }}
                  >
                    {status === 'loading' ? 'Redirecting to checkout…' : 'Continue to checkout →'}
                  </button>
                </div>
              </div>

              {/* ── Right: plan + add-ons + summary ─────────────── */}
              <div>
                {/* Base plan (always included) */}
                <p className="signup-section-label">Your plan</p>
                <div style={{
                  background: 'var(--c-surface,#1a1a1a)',
                  border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
                  borderRadius: 14, padding: '18px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 20,
                }}>
                  <div>
                    <div style={{ font: '700 15px/1.2 var(--font-display,sans-serif)', color: '#fff' }}>
                      Business Address
                    </div>
                    <div style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-2)', marginTop: 3 }}>
                      {SHORT_ADDRESS}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <span style={{ font: '800 20px/1 var(--font-display,sans-serif)', color: '#fff' }}>$29.99</span>
                    <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>/mo</span>
                  </div>
                </div>

                {/* Add-on selection */}
                <p className="signup-section-label" style={{ marginBottom: 12 }}>Optional add-ons</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {ADDON_INFO.map(a => (
                    <div
                      key={a.key}
                      className={`addon-select-card${addons[a.key] ? ' selected' : ''}`}
                      onClick={() => toggleAddon(a.key)}
                      role="checkbox"
                      aria-checked={addons[a.key]}
                      tabIndex={0}
                      onKeyDown={ev => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); toggleAddon(a.key); } }}
                    >
                      <div className={`addon-select-check${addons[a.key] ? ' checked' : ''}`}>
                        {addons[a.key] && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="#0d0d0d" strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                          <span style={{ font: '700 14px/1.3 var(--font-display,sans-serif)', color: '#fff' }}>
                            {a.name}
                          </span>
                          <span style={{ font: '700 14px/1 var(--font-display,sans-serif)', color: 'var(--c-gold-2,#d4aa50)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {a.price}
                            <span style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>{a.period}</span>
                          </span>
                        </div>
                        <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '5px 0 0' }}>
                          {a.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order total */}
                <div style={{
                  background: 'var(--c-surface,#1a1a1a)',
                  border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
                  borderRadius: 14, padding: '20px 20px 24px',
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 12, borderBottom: '1px solid var(--c-border,rgba(255,255,255,0.07))' }}>
                    <span style={{ font: '600 13px/1 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>Monthly total</span>
                    <span style={{ font: '800 22px/1 var(--font-display,sans-serif)', color: '#fff' }}>
                      ${monthlyTotal.toFixed(2)}
                      <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>/mo</span>
                    </span>
                  </div>
                  {oneTimeTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 }}>
                      <span style={{ font: '400 13px/1 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>One-time setup fee</span>
                      <span style={{ font: '600 15px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#d4aa50)' }}>
                        ${oneTimeTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Desktop error + submit */}
                <div className="signup-desktop-only">
                  {status === 'error' && (
                    <p style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: '#f87171', marginBottom: 14 }}>
                      {errorMsg}
                    </p>
                  )}
                  <button
                    className="w-cta-pill filled"
                    type="submit"
                    disabled={status === 'loading'}
                    style={{ border: 'none', cursor: status === 'loading' ? 'default' : 'pointer', width: '100%', justifyContent: 'center' }}
                  >
                    {status === 'loading' ? 'Redirecting to checkout…' : 'Continue to checkout →'}
                  </button>
                  <p style={{ font: '400 12px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', textAlign: 'center', marginTop: 14 }}>
                    No contracts · Cancel anytime · Secure checkout via Stripe
                  </p>
                </div>
              </div>

            </div>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}
