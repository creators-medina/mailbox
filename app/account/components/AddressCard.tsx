'use client';

import { useState } from 'react';

export default function AddressCard({
  suiteNumber,
  addressLine,
}: {
  suiteNumber: string | null;
  addressLine: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const hasSuite = Boolean(suiteNumber);

  // The address line already includes the suite; fall back to a sensible
  // single-line value if it's missing.
  const fullAddress = addressLine ?? '';

  async function copy() {
    if (!fullAddress) return;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <div className="dash-card" style={{ marginBottom: 20 }}>
      <span className="dash-card-title">Your business address</span>

      {hasSuite ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 20px', alignItems: 'start' }}>
            <span style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)', paddingTop: 3 }}>Suite</span>
            <span style={{ font: '800 32px/1 var(--font-display,sans-serif)', letterSpacing: '-0.5px', color: 'var(--c-gold-2,#C99A5A)' }}>
              {suiteNumber}
            </span>
            <span style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>Address</span>
            <span style={{ font: '500 16px/1.5 var(--font-text,sans-serif)', color: '#fff' }}>
              {fullAddress}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={copy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 100,
                font: '600 13px/1 var(--font-text,sans-serif)',
                color: copied ? '#4ade80' : 'var(--c-gold-2,#C99A5A)',
                background: copied ? 'rgba(74,222,128,0.10)' : 'rgba(181,138,82,0.10)',
                border: `1px solid ${copied ? 'rgba(74,222,128,0.30)' : 'rgba(181,138,82,0.28)'}`,
                cursor: 'pointer', transition: 'all 130ms ease',
              }}
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8.5l3.5 3.5L13 4" />
                  </svg>
                  Address copied
                </>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="5" width="9" height="9" rx="1.5" />
                    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
                  </svg>
                  Copy address
                </>
              )}
            </button>
          </div>

          <p style={{ font: '400 13px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '16px 0 0' }}>
            Use this address for business mail, filings, vendors, and correspondence.
          </p>
        </>
      ) : (
        <div>
          <span style={{ font: '700 22px/1.2 var(--font-display,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', display: 'block', marginBottom: 8 }}>
            Suite pending assignment
          </span>
          <p style={{ font: '400 14px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: 0 }}>
            Your suite number is being assigned. You&rsquo;ll receive an email once your
            business address is ready — usually within a few hours.
          </p>
        </div>
      )}
    </div>
  );
}
