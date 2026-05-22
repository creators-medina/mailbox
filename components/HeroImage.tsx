import Image from 'next/image';

// Cinematic photo panel for the atmospheric split hero. Fills .hero-photo
// (which bleeds ~10–15% under the copy on desktop). The JPG lives at
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
        sizes="(max-width: 900px) 100vw, 60vw"
        style={{
          objectFit: 'cover',
          objectPosition: '50% 48%',
          // Lift shadows / warm it slightly without over-brightening.
          filter: 'brightness(1.1) contrast(0.96) saturate(1.05)',
        }}
      />

      {/* Gentle navy darken so it stays cinematic and blends with the page */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, rgba(7,27,45,0.34), transparent 40%), ' +
            'linear-gradient(160deg, rgba(7,27,45,0.16), transparent 42%)',
        }}
      />

      {/* Warm edge light along the bottom-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(50% 46% at 82% 84%, rgba(201,154,90,0.16), transparent 60%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Wide, soft edge fade into the page background. On desktop this ramps
          across the photo's left side so it bleeds under the copy while
          keeping text readable; on mobile it fades from the top. */}
      <div className="hero-img-fade" aria-hidden />

      {/* Faint film grain (premium finishing detail) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${GRAIN}")`,
          backgroundSize: '140px 140px',
          opacity: 0.05,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      {/* Faint vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 120px rgba(5,12,22,0.5)',
        }}
      />

      <style>{`
        .hero-img-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            var(--c-bg, #071B2D) 0%,
            var(--c-bg, #071B2D) 11%,
            rgba(7,27,45,0.82) 26%,
            rgba(7,27,45,0.32) 42%,
            rgba(7,27,45,0) 58%
          );
        }
        @media (max-width: 900px) {
          .hero-img-fade {
            background: linear-gradient(
              to bottom,
              var(--c-bg, #071B2D) 0%,
              rgba(7,27,45,0.45) 7%,
              rgba(7,27,45,0) 24%
            );
          }
        }
      `}</style>
    </>
  );
}
