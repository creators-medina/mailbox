export default function MailAuthorizationCard() {
  return (
    <div className="dash-card">
      <span className="dash-card-title">Mail authorization</span>
      <p style={{ font: '400 13px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '4px 0 14px' }}>
        Federal rules require a signed <strong>USPS Form 1583</strong> and a valid
        photo ID before we can legally receive mail on your behalf. Our team will
        guide you through it — it only takes a few minutes.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className="mock-badge mock-badge-held">Form 1583 — pending</span>
        <span className="mock-badge mock-badge-held">Photo ID — pending</span>
      </div>

      <a
        href="/#contact"
        className="w-cta-pill outline"
        style={{ display: 'inline-flex', fontSize: 13 }}
      >
        Get help completing Form 1583
      </a>
    </div>
  );
}
