import Image from 'next/image';

// Full-bleed cinematic photo panel for the split-screen hero. It fills its
// positioned parent (.hero-split-right) — no card/border. The JPG lives at
// /public/images/hero-desk-scene.jpg.
export function HeroImage() {
  return (
    <>
      <Image
        src="/images/hero-desk-scene.jpg"
        alt="My Biz Address envelopes addressed to a Rockwall business on a desk, beside a laptop showing the online mail dashboard."
        fill
        priority
        sizes="(max-width: 900px) 100vw, 52vw"
        style={{ objectFit: 'cover', objectPosition: '50% 50%' }}
      />

      {/* Navy darken so the photo blends into the dark page */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(0deg, rgba(7,27,45,0.45), transparent 42%), ' +
            'linear-gradient(160deg, rgba(7,27,45,0.22), transparent 45%)',
        }}
      />

      {/* Edge fade into the page background (left edge on desktop, top on mobile) */}
      <div className="hero-img-fade" aria-hidden />

      {/* Subtle warm gold glow where the image meets the text */}
      <div
        aria-hidden
        className="hero-img-seam"
        style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}
      />

      <style>{`
        .hero-img-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            var(--c-bg, #071B2D) 0%,
            rgba(7,27,45,0.55) 9%,
            rgba(7,27,45,0) 30%
          );
        }
        .hero-img-seam {
          background: linear-gradient(
            to right,
            rgba(201,154,90,0.12),
            rgba(201,154,90,0) 45%
          );
        }
        @media (max-width: 900px) {
          /* image sits below the text — fade from the top instead of the left */
          .hero-img-fade {
            background: linear-gradient(
              to bottom,
              var(--c-bg, #071B2D) 0%,
              rgba(7,27,45,0.45) 7%,
              rgba(7,27,45,0) 22%
            );
          }
          .hero-img-seam { display: none; }
        }
      `}</style>
    </>
  );
}
