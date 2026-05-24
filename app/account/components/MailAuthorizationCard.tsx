function badgeClass(status: string) {
  if (status === 'verified') return 'mock-badge-ready';
  if (status === 'rejected') return 'mock-badge-held';
  if (status === 'received' || status === 'requested') return 'mock-badge-scanned';
  return 'mock-badge-held';
}

function label(status: string) {
  switch (status) {
    case 'verified': return 'verified';
    case 'rejected': return 'needs attention';
    case 'received': return 'received';
    case 'requested': return 'requested';
    default: return 'pending';
  }
}

export default function MailAuthorizationCard({
  form1583Status = 'pending',
  photoIdStatus = 'pending',
}: {
  form1583Status?: string;
  photoIdStatus?: string;
}) {
  const verified = form1583Status === 'verified' && photoIdStatus === 'verified';

  return (
    <div className="dash-card">
      <span className="dash-card-title">Mail authorization</span>
      <p style={{ font: '400 13px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '4px 0 14px' }}>
        Federal rules require a signed <strong>USPS Form 1583</strong> and a valid
        photo ID before we can legally receive mail on your behalf.{' '}
        {verified
          ? 'Your authorization is verified — your mailbox is fully active.'
          : 'Mail can be received after your authorization is verified.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className={`mock-badge ${badgeClass(form1583Status)}`}>Form 1583 — {label(form1583Status)}</span>
        <span className={`mock-badge ${badgeClass(photoIdStatus)}`}>Photo ID — {label(photoIdStatus)}</span>
      </div>

      {!verified && (
        <>
          <p style={{ font: '400 12px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '0 0 14px' }}>
            Check your email for instructions if our team has requested your authorization documents.
          </p>
          <a
            href="/#contact"
            className="w-cta-pill outline"
            style={{ display: 'inline-flex', fontSize: 13 }}
          >
            Get help completing Form 1583
          </a>
        </>
      )}
    </div>
  );
}
