import MailItemActions from '../MailItemActions';
import { mailStatusLabel } from '@/lib/mail/statuses';

export type MailItem = {
  id: string;
  sender: string | null;
  title: string | null;
  status: string;
  received_at: string;
  // Short-lived signed URLs resolved server-side; null when no file exists.
  envelopeUrl: string | null;
  scanUrl: string | null;
  // request_type of an open (pending/in_progress) request, else null.
  pendingRequestType: string | null;
};

const MAIL_STATUS_CLASS: Record<string, string> = {
  received:        'mock-badge-new',
  scanned:         'mock-badge-scanned',
  awaiting_action: 'mock-badge-new',
  forwarded:       'mock-badge-ready',
  picked_up:       'mock-badge-ready',
  shredded:        'mock-badge-held',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MailInboxCard({
  mailItems,
}: {
  mailItems: MailItem[];
}) {
  return (
    <div className="dash-card">
      <span className="dash-card-title">Mail inbox</span>
      {mailItems.length > 0 ? (
        <div>
          {mailItems.map(item => (
            <div key={item.id} className="dash-mail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0, marginTop: 1,
                  background: 'var(--c-surface-2,#1E2D42)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 16 12" width="13" height="10" fill="none"
                       stroke="var(--c-gold-2,#C99A5A)" strokeWidth="1.4"
                       strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="1" width="14" height="10" rx="1.5"/>
                    <path d="M1 3l7 5 7-5"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 13px/1.3 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.88)', marginBottom: 3 }}>
                    {item.sender ?? 'Unknown sender'}
                  </div>
                  {item.title && (
                    <div style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-2)', marginBottom: 3 }}>
                      {item.title}
                    </div>
                  )}
                  <div style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                    {fmt(item.received_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {item.envelopeUrl && (
                    <a
                      href={item.envelopeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ font: '600 11px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', textDecoration: 'none' }}
                    >
                      View envelope ›
                    </a>
                  )}
                  <span className={`mock-badge ${MAIL_STATUS_CLASS[item.status] ?? 'mock-badge-held'}`}>
                    {mailStatusLabel(item.status)}
                  </span>
                </div>
              </div>
              <MailItemActions
                mailItemId={item.id}
                scanUrl={item.scanUrl}
                pendingRequestType={item.pendingRequestType}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <svg viewBox="0 0 40 32" width="44" height="35" fill="none"
               stroke="var(--c-text-3)" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round"
               style={{ marginBottom: 14, opacity: 0.4 }}>
            <rect x="2" y="4" width="36" height="24" rx="3"/>
            <path d="M2 9l18 12 18-12"/>
          </svg>
          <p style={{ font: '600 15px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: 0 }}>
            No mail received yet
          </p>
          <p style={{ font: '400 13px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: '6px auto 0', maxWidth: 320 }}>
            When mail arrives, envelope previews and actions will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
