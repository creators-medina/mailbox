// Presentational only — receives already-signed, short-lived URLs (resolved
// server-side). Renders nothing when neither file exists.
export default function MailFileLinks({
  envelopeUrl,
  scanUrl,
}: {
  envelopeUrl: string | null;
  scanUrl: string | null;
}) {
  if (!envelopeUrl && !scanUrl) return <span style={{ color: 'var(--c-text-3)', fontSize: 12 }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}>
      {envelopeUrl && (
        <a href={envelopeUrl} target="_blank" rel="noopener noreferrer"
           style={{ font: '600 12px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}>
          View envelope ›
        </a>
      )}
      {scanUrl && (
        <a href={scanUrl} target="_blank" rel="noopener noreferrer"
           style={{ font: '600 12px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}>
          View scan ›
        </a>
      )}
    </span>
  );
}
