import Image from 'next/image';

// Premium photographic hero visual. The JPG lives at
// /public/images/hero-desk-scene.jpg. Layout space is reserved via a fixed
// aspect ratio so there's no layout shift.
export function HeroImage() {
  return (
    <div
      className="hero-photo-wrap"
      style={{ position: 'relative', width: '100%', maxWidth: 660, margin: '0 auto' }}
    >
      {/* Animated warm gold glow behind the card (decorative) */}
      <div className="hero-photo-glow" aria-hidden />

      {/* Elevated photo card */}
      <div
        className="hero-photo-card"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 20,
          overflow: 'hidden',
          border: '1px solid rgba(201,154,90,0.26)',
          boxShadow:
            '0 56px 100px -32px rgba(0,0,0,0.78), 0 12px 30px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          background: 'linear-gradient(160deg, #16263c, #0a1626)',
        }}
      >
        <Image
          src="/images/hero-desk-scene.jpg"
          alt="My Biz Address envelopes addressed to a Rockwall business on a desk, beside a laptop showing the online mail dashboard."
          fill
          priority
          sizes="(max-width: 880px) 92vw, 50vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />

        {/* Cinematic tone: a gentle uniform darken so bright envelope area
            reads richer, plus a directional gradient toward the text split
            and bottom for balance/readability. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(7,17,29,0.14), rgba(7,17,29,0.20)), ' +
              'linear-gradient(105deg, rgba(7,17,29,0.55) 0%, rgba(7,17,29,0.12) 30%, transparent 56%), ' +
              'linear-gradient(0deg, rgba(7,17,29,0.50), transparent 40%)',
          }}
        />

        {/* Soft warm light bloom in the upper area */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(40% 38% at 70% 22%, rgba(201,154,90,0.16), transparent 60%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Soft navy vignette around the edges */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 110px rgba(5,12,22,0.62)',
            borderRadius: 20,
          }}
        />
      </div>

      <style>{`
        .hero-photo-card {
          transition: transform .35s cubic-bezier(0.4,0,0.2,1), box-shadow .35s ease;
        }
        .hero-photo-wrap:hover .hero-photo-card {
          transform: translateY(-5px);
          box-shadow: 0 70px 120px -34px rgba(0,0,0,0.82), 0 16px 36px -18px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07);
        }
        .hero-photo-glow {
          position: absolute;
          inset: -12% -9% -5% -9%;
          z-index: 0;
          background: radial-gradient(58% 55% at 60% 40%, rgba(201,154,90,0.34), rgba(201,154,90,0.08) 46%, transparent 70%);
          filter: blur(12px);
          animation: heroGlowPulse 8s ease-in-out infinite;
        }
        @keyframes heroGlowPulse {
          0%, 100% { opacity: 0.72; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-photo-glow { animation: none; }
          .hero-photo-wrap:hover .hero-photo-card { transform: none; }
        }
      `}</style>
    </div>
  );
}
