export function Nav() {
  const links = [
    { label: 'Services',     href: '/#services' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Pricing',      href: '/#pricing' },
    { label: 'FAQ',          href: '/#faq' },
    { label: 'Contact',      href: '/#contact' },
  ];

  return (
    <nav className="w-nav">
      <div className="w-nav-inner">
        <a className="w-nav-logo" href="/">
          <div style={{
            width: 30, height: 30,
            background: 'rgba(181,138,82,0.12)',
            border: '1.5px solid var(--c-gold, #B58A52)',
            borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '700 11px/1 var(--font-display, sans-serif)',
            color: 'var(--c-gold, #B58A52)',
            letterSpacing: '-0.2px',
            flexShrink: 0,
          }}>MB</div>
          <span className="w-nav-logo-text">My Biz Address</span>
        </a>

        <div className="w-nav-links">
          {links.map(l => (
            <a key={l.label} href={l.href}>{l.label}</a>
          ))}
        </div>

        <div className="w-nav-right">
          <a
            href="/login"
            style={{
              font: '500 13px/1 var(--font-text,sans-serif)',
              color: 'var(--c-text-2,rgba(248,250,252,0.60))',
              textDecoration: 'none', marginRight: 16,
            }}
          >
            Login
          </a>
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
