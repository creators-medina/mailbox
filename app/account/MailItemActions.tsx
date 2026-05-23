'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type RequestType = 'scan' | 'forward' | 'pickup' | 'shred';

// Customer-friendly labels for the pending-status line.
const REQUEST_LABEL: Record<string, string> = {
  scan: 'Scan request',
  forward: 'Forwarding request',
  pickup: 'Hold for pickup',
  shred: 'Shred request',
};

// Optional note prompts per action (task 8).
const NOTE_CONFIG: Partial<Record<RequestType, { label: string; placeholder: string }>> = {
  forward: { label: 'Forwarding address', placeholder: 'Where should we forward this? (street, city, state, ZIP)' },
  pickup:  { label: 'Pickup note (optional)', placeholder: 'Anything we should know for pickup?' },
  shred:   { label: 'Shred note (optional)', placeholder: 'Confirm you want this securely shredded' },
};

const chipStyle = (disabled: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', borderRadius: 6,
  font: '500 11px/1.2 var(--font-text,sans-serif)',
  color: 'var(--c-text-2)',
  background: 'var(--c-surface-2,#222)',
  border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  transition: 'border-color 120ms ease',
});

export default function MailItemActions({
  mailItemId,
  scanUrl = null,
  pendingRequestType = null,
}: {
  mailItemId: string;
  scanUrl?: string | null;
  pendingRequestType?: string | null;
}) {
  const router = useRouter();
  const [done, setDone] = useState<RequestType | null>(null);
  const [error, setError] = useState('');
  const [activeNote, setActiveNote] = useState<RequestType | null>(null);
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit(type: RequestType, noteValue?: string) {
    if (isPending || done) return;
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/mail-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mail_item_id: mailItemId, request_type: type, notes: noteValue }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.ok) {
          setDone(type);
          setActiveNote(null);
          setNote('');
          router.refresh();
        } else {
          setError(data.error ?? 'Request failed');
        }
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  function onAction(type: RequestType) {
    if (NOTE_CONFIG[type]) {
      setActiveNote(type);
      setNote('');
      setError('');
    } else {
      submit(type);
    }
  }

  // Already has an open request — no duplicate actions allowed.
  if (pendingRequestType) {
    return (
      <span style={{ display: 'inline-block', font: '500 11px/1.4 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', marginTop: 8 }}>
        Request pending: {REQUEST_LABEL[pendingRequestType] ?? pendingRequestType}
      </span>
    );
  }

  if (done) {
    return (
      <span style={{ font: '500 11px/1 var(--font-text,sans-serif)', color: '#4ade80', display: 'inline-block', marginTop: 8 }}>
        {REQUEST_LABEL[done] ?? 'Request'} submitted ✓
      </span>
    );
  }

  // Note-entry step for forward / pickup / shred.
  if (activeNote) {
    const cfg = NOTE_CONFIG[activeNote]!;
    return (
      <div style={{ marginTop: 8, width: '100%' }}>
        <label style={{ font: '500 11px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-2)', display: 'block', marginBottom: 4 }}>
          {REQUEST_LABEL[activeNote]} — {cfg.label}
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={cfg.placeholder}
          rows={2}
          disabled={isPending}
          style={{
            width: '100%', resize: 'vertical',
            padding: '6px 9px', borderRadius: 6,
            font: '400 12px/1.4 var(--font-text,sans-serif)',
            color: '#fff', background: 'var(--c-surface-2,#1E2D42)',
            border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            onClick={() => submit(activeNote, note)}
            disabled={isPending || (activeNote === 'forward' && !note.trim())}
            style={chipStyle(isPending || (activeNote === 'forward' && !note.trim()))}
          >
            {isPending ? 'Submitting…' : 'Confirm'}
          </button>
          <button onClick={() => { setActiveNote(null); setNote(''); }} disabled={isPending} style={chipStyle(isPending)}>
            Cancel
          </button>
        </div>
        {error && <p style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: '#f87171', margin: '6px 0 0' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {scanUrl ? (
          <a href={scanUrl} target="_blank" rel="noopener noreferrer" style={chipStyle(false)}>
            📄 View scan
          </a>
        ) : (
          <button onClick={() => onAction('scan')} disabled={isPending} style={chipStyle(isPending)}>
            📄 Request scan
          </button>
        )}
        <button onClick={() => onAction('forward')} disabled={isPending} style={chipStyle(isPending)}>
          📦 {scanUrl ? 'Forward' : 'Forward unopened'}
        </button>
        <button onClick={() => onAction('pickup')} disabled={isPending} style={chipStyle(isPending)}>
          🏠 Hold for pickup
        </button>
        <button onClick={() => onAction('shred')} disabled={isPending} style={chipStyle(isPending)}>
          🗑️ Shred
        </button>
      </div>
      {error && <p style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: '#f87171', margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
}
