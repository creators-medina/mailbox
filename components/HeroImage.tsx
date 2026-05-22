import Image from 'next/image';

// Full-bleed cinematic background for the glass-panel hero. Fills .hero-bg
// (absolute inset on desktop, a static banner on mobile). The JPG lives at
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
          objectPosition: '56% 62%',
          // Keep the current warm tone; just a gentle lift (no extra darkening).
          filter: 'brightness(1.08) contrast(0.97) saturate(1.05)',
        }}
      />

      {/* Left readability scrim — darkens behind the glass panel and fades
          smoothly to the right so there's no hard vertical edge. On mobile
          this flips to a top scrim so the banner blends from the copy above. */}
      <div className="hero-bg-scrim" aria-hidden />

      {/* Bottom grounding gradient */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(0deg, rgba(7,17,29,0.50), transparent 42%)',
        }}
      />

      {/* Faint gold glow near the panel seam / CTA area */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(34% 40% at 40% 55%, rgba(201,154,90,0.14), transparent 62%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Soft navy vignette around the hero edges */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 150px rgba(5,12,22,0.6)',
        }}
      />

      {/* Faint film grain */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${GRAIN}")`,
          backgroundSize: '140px 140px',
          opacity: 0.045,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      <style>{`
        .hero-bg-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(7,17,29,0.80) 0%,
            rgba(7,17,29,0.50) 26%,
            rgba(7,17,29,0.14) 50%,
            rgba(7,17,29,0) 72%
          );
        }
        @media (max-width: 900px) {
          .hero-bg-scrim {
            background: linear-gradient(
              to bottom,
              var(--c-bg, #071B2D) 0%,
              rgba(7,17,29,0.45) 8%,
              rgba(7,17,29,0) 26%
            );
          }
        }
      `}</style>
    </>
  );
}
