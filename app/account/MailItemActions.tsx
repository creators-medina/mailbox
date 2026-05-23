'use client';
import { useState, useTransition } from 'react';

const ACTIONS = [
  { type: 'scan',    label: 'Request scan',       icon: '📄' },
  { type: 'forward', label: 'Request forwarding',  icon: '📦' },
  { type: 'pickup',  label: 'Hold for pickup',     icon: '🏠' },
  { type: 'shred',   label: 'Request shred',       icon: '🗑️' },
] as const;

export default function MailItemActions({
  mailItemId,
  hasPendingRequest = false,
}: {
  mailItemId: string;
  hasPendingRequest?: boolean;
}) {
  const [done, setDone]              = useState<string | null>(null);
  const [error, setError]            = useState('');
  const [isPending, startTransition] = useTransition();

  function request(type: string) {
    if (isPending || done) return;
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/mail-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail_item_id: mailItemId, request_type: type }),
      });
      if (res.ok) {
        setDone(type);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Request failed');
      }
    });
  }

  if (done) {
    return (
      <span style={{ font: '500 11px/1 var(--font-text,sans-serif)', color: '#4ade80' }}>
        Requested ✓
      </span>
    );
  }

  if (hasPendingRequest) {
    return (
      <span style={{ display: 'inline-block', font: '500 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginTop: 8 }}>
        Request pending — our team is on it.
      </span>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {ACTIONS.map(a => (
          <button
            key={a.type}
            onClick={() => request(a.type)}
            disabled={isPending}
            title={a.label}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6,
              font: '500 11px/1.2 var(--font-text,sans-serif)',
              color: 'var(--c-text-2)',
              background: 'var(--c-surface-2,#222)',
              border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.5 : 1,
              transition: 'border-color 120ms ease',
            }}
          >
            <span style={{ fontSize: 12 }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
      {error && (
        <p style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: '#f87171', margin: '6px 0 0' }}>{error}</p>
      )}
    </div>
  );
}
