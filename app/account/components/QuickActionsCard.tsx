// Standalone scan / forwarding / pickup requests are tied to a specific piece
// of mail (see /api/mail-requests, which requires a mail_item_id), so there is
// no working standalone endpoint yet — those render as "Coming soon". Contact
// support is a real link.

function ComingSoonAction({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="dash-action-btn" title="Coming soon">
      {icon}
      <span>{label}</span>
      <span style={{ font: '600 9px/1 var(--font-text,sans-serif)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--c-text-3)' }}>
        Coming soon
      </span>
    </div>
  );
}

const iconStroke = 'var(--c-gold-2,#C99A5A)';

export default function QuickActionsCard() {
  return (
    <div className="dash-card">
      <span className="dash-card-title">Quick actions</span>
      <div className="dash-actions-grid">
        <ComingSoonAction
          label="Request scan"
          icon={
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke={iconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="12" height="14" rx="1.5" /><path d="M7 7h6M7 10h6M7 13h4" />
            </svg>
          }
        />
        <ComingSoonAction
          label="Request forwarding"
          icon={
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke={iconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="5" width="15" height="11" rx="1.5" /><path d="M2.5 7l7.5 5 7.5-5" />
            </svg>
          }
        />
        <ComingSoonAction
          label="Schedule pickup"
          icon={
            <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke={iconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l7-5 7 5v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M8 17v-5h4v5" />
            </svg>
          }
        />
        <a
          href="/#contact"
          className="dash-action-btn"
          style={{ opacity: 1, cursor: 'pointer', textDecoration: 'none', color: 'var(--c-text-2)' }}
        >
          <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke={iconStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z" />
            <path d="M3.5 5l6.5 5 6.5-5" />
          </svg>
          <span style={{ color: '#fff' }}>Contact support</span>
        </a>
      </div>
    </div>
  );
}
