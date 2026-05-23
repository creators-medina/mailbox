// Helpful customer links — no broken/coming-soon actions. Per-mail-item actions
// (scan/forward/hold/shred) live on each item in the Mail inbox card.

const iconStroke = 'var(--c-gold-2,#C99A5A)';

function LinkTile({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="dash-action-btn"
      style={{ opacity: 1, cursor: 'pointer', textDecoration: 'none', color: 'var(--c-text-2)' }}
    >
      {icon}
      <span style={{ color: '#fff' }}>{label}</span>
    </a>
  );
}

export default function QuickActionsCard() {
  return (
    <div className="dash-card">
      <span className="dash-card-title">Quick links</span>
      <div className="dash-actions-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <LinkTile
          href="/#contact"
          label="Contact support"
          icon={
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke={iconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z" />
              <path d="M3.5 5l6.5 5 6.5-5" />
            </svg>
          }
        />
        <LinkTile
          href="/#pricing"
          label="Pricing & add-ons"
          icon={
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke={iconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3v14M6 6.5h6a2 2 0 0 1 0 4H8a2 2 0 0 0 0 4h6" />
            </svg>
          }
        />
        <LinkTile
          href="/#contact"
          label="Mail authorization help"
          icon={
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke={iconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 2l6 2.5v5c0 3.5-2.5 6.5-6 8-3.5-1.5-6-4.5-6-8v-5z" />
              <path d="M7.5 10l1.8 1.8L13 8" />
            </svg>
          }
        />
      </div>
    </div>
  );
}
