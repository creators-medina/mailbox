export function PromoStrip() {
  return (
    <div className="w-promo">
      <div className="w-promo-inner">
        <strong>Now open in Rockwall, TX.</strong>{' '}
        Professional business addresses for local entrepreneurs.
        <a href="#pricing">Reserve yours ›</a>
      </div>
    </div>
  );
}

export function Nav() {
  const links = [
    { label: 'Services',     href: '#services' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Pricing',      href: '#pricing' },
    { label: 'FAQ',          href: '#faq' },
    { label: 'Contact',      href: '#contact' },
  ];

  return (
    <nav className="w-nav">
      <div className="w-nav-inner">
        {/* Logo */}
        <a className="w-nav-logo" href="/">
          <svg viewBox="0 0 32 32" fill="none" strokeWidth="1.75"
               strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
            <rect x="3" y="7" width="26" height="18" rx="3" />
            <path d="M4 9 L16 18 L28 9" />
            <circle cx="24.5" cy="10.5" r="2.5" fill="currentColor" stroke="none" />
          </svg>
          <span className="w-nav-logo-text">My Biz Mailbox</span>
        </a>

        {/* Links */}
        <div className="w-nav-links">
          {links.map(l => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </div>

        {/* CTA */}
        <div className="w-nav-right">
          <a
            className="w-cta-pill filled"
            href="#pricing"
            style={{ fontSize: 14, padding: '9px 20px' }}
          >
            Reserve your address
          </a>
        </div>
      </div>
    </nav>
  );
}
