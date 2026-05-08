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
        <a className="w-nav-logo" href="/">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75"
               strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 7l10 7 10-7"/>
          </svg>
          <span className="w-nav-logo-text">My Biz Address</span>
        </a>

        <div className="w-nav-links">
          {links.map(l => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </div>

        <div className="w-nav-right">
          <a
            className="w-cta-pill filled"
            href="/signup"
            style={{ fontSize: 13, padding: '9px 20px' }}
          >
            Get your address
          </a>
        </div>
      </div>
    </nav>
  );
}
