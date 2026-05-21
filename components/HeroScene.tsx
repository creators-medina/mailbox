import React from 'react';

// Premium, hand-built hero visual: a staged "business mail" scene rendered as
// vector + CSS in the brand palette (no external/stock image, no network, no
// layout shift). Decorative only — the meaningful hero content lives in the
// copy beside it, so this is aria-hidden.
//
// To swap in a real generated photo later: drop it in /public/assets and
// replace the inner <div className="hero-scene-art"> with a next/image fill.
export function HeroScene() {
  return (
    <div
      aria-hidden
      className="hero-scene"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        aspectRatio: '5 / 4',
        margin: '0 auto',
      }}
    >
      {/* Warm gold glow behind the scene for depth */}
      <div
        style={{
          position: 'absolute',
          inset: '-8% -6% -2% -6%',
          background:
            'radial-gradient(60% 55% at 62% 38%, rgba(201,154,90,0.30), rgba(201,154,90,0.07) 45%, transparent 70%)',
          filter: 'blur(8px)',
          zIndex: 0,
        }}
      />

      {/* Scene card */}
      <div
        className="hero-scene-art"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 20,
          overflow: 'hidden',
          background:
            'linear-gradient(160deg, #16263c 0%, #0e1d31 55%, #0a1626 100%)',
          border: '1px solid rgba(201,154,90,0.18)',
          boxShadow:
            '0 40px 80px -30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Blurred dashboard hint, upper-left background */}
        <div
          style={{
            position: 'absolute',
            top: '11%',
            left: '8%',
            width: '46%',
            height: '34%',
            borderRadius: 12,
            background: 'linear-gradient(150deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
            border: '1px solid rgba(255,255,255,0.06)',
            filter: 'blur(1.5px)',
            opacity: 0.85,
            padding: 14,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ width: '40%', height: 6, borderRadius: 3, background: 'rgba(201,154,90,0.55)', marginBottom: 12 }} />
          {[0.85, 0.6, 0.7].map((w, i) => (
            <div key={i} style={{ width: `${w * 100}%`, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.12)', marginBottom: 9 }} />
          ))}
        </div>

        {/* Desk surface */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '34%',
            background: 'linear-gradient(180deg, rgba(20,33,52,0) 0%, rgba(8,18,30,0.9) 40%, #07111d 100%)',
            borderTop: '1px solid rgba(201,154,90,0.12)',
          }}
        />

        {/* Coffee mug, lower-right, with MB monogram */}
        <div
          style={{
            position: 'absolute',
            right: '11%',
            bottom: '16%',
            width: '20%',
            zIndex: 3,
          }}
        >
          <svg viewBox="0 0 80 78" width="100%" height="auto" style={{ display: 'block', filter: 'drop-shadow(0 14px 18px rgba(0,0,0,0.5))' }}>
            <defs>
              <linearGradient id="mug" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#21344e" />
                <stop offset="1" stopColor="#0d1c2e" />
              </linearGradient>
            </defs>
            <ellipse cx="38" cy="74" rx="26" ry="4" fill="rgba(0,0,0,0.45)" />
            <path d="M58 26h8a10 10 0 0 1 0 20h-8" fill="none" stroke="#1b2c43" strokeWidth="5" />
            <rect x="12" y="22" width="48" height="50" rx="9" fill="url(#mug)" stroke="rgba(201,154,90,0.30)" strokeWidth="1.2" />
            <ellipse cx="36" cy="24" rx="24" ry="6" fill="#0b1a2b" stroke="rgba(201,154,90,0.25)" strokeWidth="1" />
            <text x="36" y="54" textAnchor="middle" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" fill="#C99A5A" letterSpacing="1">MB</text>
            {/* steam */}
            <path d="M30 16c-3-4 3-6 0-11M42 16c-3-4 3-6 0-11" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Stack of addressed envelopes, center-front */}
        <div
          style={{
            position: 'absolute',
            left: '14%',
            bottom: '20%',
            width: '60%',
            zIndex: 2,
          }}
        >
          {/* back envelopes (offset for a stacked look) */}
          <Envelope offset={20} tone="#1a2c44" />
          <Envelope offset={10} tone="#21344e" />
          {/* front, fully branded + addressed */}
          <FrontEnvelope />
        </div>
      </div>
    </div>
  );
}

function Envelope({ offset, tone }: { offset: number; tone: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: offset,
        top: offset * 0.7,
        width: '100%',
        aspectRatio: '16 / 10',
        borderRadius: 8,
        background: `linear-gradient(160deg, ${tone}, #0e1d31)`,
        border: '1px solid rgba(201,154,90,0.16)',
        boxShadow: '0 16px 30px -12px rgba(0,0,0,0.55)',
      }}
    />
  );
}

function FrontEnvelope() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 10',
        borderRadius: 8,
        background: 'linear-gradient(155deg, #f6efe2 0%, #ece1cc 100%)',
        boxShadow: '0 26px 44px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.6)',
        padding: '11% 9%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* return brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '7%' }}>
        <span
          style={{
            width: 18, height: 18, borderRadius: 4,
            background: 'rgba(181,138,82,0.16)',
            border: '1.5px solid #B58A52',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '700 8px/1 Georgia, serif', color: '#9c6f3a',
          }}
        >
          MB
        </span>
        <span style={{ font: '700 9px/1 Georgia, serif', color: '#6b5536', letterSpacing: '0.5px' }}>
          MY BIZ ADDRESS
        </span>
      </div>

      {/* addressee lines */}
      <div style={{ marginLeft: '32%' }}>
        {['58%', '74%', '46%'].map((w, i) => (
          <div key={i} style={{ width: w, height: 6, borderRadius: 3, background: i === 0 ? '#7c623c' : 'rgba(60,46,26,0.45)', marginBottom: 8 }} />
        ))}
      </div>

      {/* gold wax-seal monogram */}
      <div
        style={{
          position: 'absolute',
          right: '8%',
          bottom: '12%',
          width: 34, height: 34, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #d9ad6f, #b07f3f 70%)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: '700 12px/1 Georgia, serif', color: '#5e3f17',
        }}
      >
        MB
      </div>

      {/* subtle stamp */}
      <div
        style={{
          position: 'absolute', right: '8%', top: '12%',
          width: 26, height: 30, borderRadius: 2,
          border: '1.5px dashed rgba(122,96,58,0.5)',
          background: 'rgba(201,154,90,0.12)',
        }}
      />
    </div>
  );
}
