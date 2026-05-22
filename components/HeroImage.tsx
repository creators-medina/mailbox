import Image from 'next/image';

// Premium photographic hero visual. The actual JPG is supplied separately at
// /public/images/hero-desk-scene.jpg — this component is fully wired so the
// hero renders correctly the moment that file exists. Until then the layout
// space is still reserved (fixed aspect ratio), so there's no layout shift.
export function HeroImage() {
  return (
    <div
      className="hero-photo-wrap"
      style={{ position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto' }}
    >
      {/* Animated warm glow behind the card (decorative) */}
      <div className="hero-photo-glow" aria-hidden />

      {/* Elevated photo card */}
      <div
        className="hero-photo-card"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 18,
          overflow: 'hidden',
          border: '1px solid rgba(201,154,90,0.20)',
          boxShadow:
            '0 40px 80px -28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          background: 'linear-gradient(160deg, #16263c, #0a1626)',
        }}
      >
        <Image
          src="/images/hero-desk-scene.jpg"
          alt="My Biz Address envelopes addressed to a Rockwall business on a desk, beside a laptop showing the online mail dashboard."
          fill
          priority
          sizes="(max-width: 880px) 92vw, 46vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />

        {/* Dark gradient toward the text split + bottom for readability/balance */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(105deg, rgba(7,17,29,0.55) 0%, rgba(7,17,29,0.12) 30%, transparent 55%), linear-gradient(0deg, rgba(7,17,29,0.45), transparent 38%)',
          }}
        />

        {/* Soft vignette around the edges */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 90px rgba(0,0,0,0.55)',
            borderRadius: 18,
          }}
        />
      </div>

      <style>{`
        .hero-photo-glow {
          position: absolute;
          inset: -10% -8% -4% -8%;
          z-index: 0;
          background: radial-gradient(58% 55% at 60% 40%, rgba(201,154,90,0.32), rgba(201,154,90,0.08) 45%, transparent 70%);
          filter: blur(10px);
          animation: heroGlowPulse 7s ease-in-out infinite;
        }
        @keyframes heroGlowPulse {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-photo-glow { animation: none; }
        }
      `}</style>
    </div>
  );
}
