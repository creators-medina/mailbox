'use client';
import { useState, useTransition } from 'react';

const STATUSES = ['received','notified','scanned','held','forwarded','picked_up','shredded'] as const;

export default function MailStatusButton({ id, current }: { id: string; current: string }) {
  const [status, setStatus]     = useState(current);
  const [open, setOpen]         = useState(false);
  const [isPending, startTransition] = useTransition();

  function choose(next: string) {
    setOpen(false);
    if (next === status) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/mail-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) setStatus(next);
    });
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        className={`admin-status-badge admin-status-${status}`}
        style={{ cursor: 'pointer', border: 'none', background: 'inherit' }}
      >
        {isPending ? '…' : status.replace('_',' ')} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 10, marginTop: 4,
          background: 'var(--c-surface,#162032)',
          border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
          borderRadius: 8, overflow: 'hidden', minWidth: 130,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => choose(s)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 14px',
                font: '500 12px/1.2 var(--font-text,sans-serif)',
                color: s === status ? 'var(--c-gold-2,#C99A5A)' : 'var(--c-text-2)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
