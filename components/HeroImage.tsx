import Image from 'next/image';

// Full-bleed cinematic background for the hero. Fills .hero-bg (absolute
// inset on desktop, a static banner on mobile). The JPG lives at
// /public/images/hero-desk-scene.jpg.
const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export function HeroImage() {
  return (
    <>
      <Image
        src="/images/hero-desk-scene.jpg"
        alt="My Biz Address envelopes addressed to a Rockwall business on a desk, beside a coffee mug and a laptop showing the online mail dashboard."
        fill
        priority
        sizes="100vw"
        style={{
          objectFit: 'cover',
          objectPosition: '62% 55%',
          filter: 'brightness(1.06) contrast(0.97) saturate(1.04)',
        }}
      />

      {/* Strong left navy blend so the copy reads on the background with no
          card — fades smoothly into the photo on the right (no hard edge).
          On mobile this becomes a top fade for the banner. */}
      <div className="hero-bg-blend" aria-hidden />

      {/* Soft top fade (blends into the nav) + bottom grounding vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(7,17,29,0.45), transparent 13%), ' +
            'linear-gradient(0deg, rgba(7,17,29,0.52), transparent 40%)',
        }}
      />

      {/* Soft navy vignette around the edges */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 150px rgba(5,12,22,0.55)',
        }}
      />

      {/* Faint film grain (very subtle) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${GRAIN}")`,
          backgroundSize: '140px 140px',
          opacity: 0.04,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        .hero-bg-blend {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            var(--c-bg, #071B2D) 0%,
            rgba(7,27,45,0.94) 16%,
            rgba(7,27,45,0.64) 34%,
            rgba(7,27,45,0.26) 52%,
            rgba(7,27,45,0) 66%
          );
        }
        @media (max-width: 900px) {
          .hero-bg-blend {
            background: linear-gradient(
              to bottom,
              var(--c-bg, #071B2D) 0%,
              rgba(7,27,45,0.45) 8%,
              rgba(7,27,45,0) 26%
            );
          }
        }
      `}</style>
    </>
  );
}
