'use client';
import { useState, useTransition } from 'react';

// Five-stage forwarding workflow
const STAGES = [
  { value: 'pending',     label: 'Requested' },
  { value: 'in_progress', label: 'Queued'     },
  { value: 'shipped',     label: 'Shipped'    },
  { value: 'completed',   label: 'Delivered'  },
  { value: 'cancelled',   label: 'Canceled'   },
] as const;

type StageValue = (typeof STAGES)[number]['value'];

export default function ForwardingStatusButton({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const [status, setStatus]          = useState<string>(current);
  const [open, setOpen]              = useState(false);
  const [isPending, startTransition] = useTransition();

  function choose(next: StageValue) {
    setOpen(false);
    if (next === status) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) setStatus(next);
    });
  }

  const currentStage = STAGES.find(s => s.value === status);
  const label = currentStage?.label ?? status.replace('_', ' ');

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        className={`admin-status-badge admin-status-${status}`}
        style={{ cursor: isPending ? 'not-allowed' : 'pointer', border: 'none', background: 'inherit' }}
      >
        {isPending ? '…' : label} ▾
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 20, marginTop: 4,
          background: 'var(--c-surface,#162032)',
          border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
          borderRadius: 8, overflow: 'hidden', minWidth: 130,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {STAGES.map(s => (
            <button
              key={s.value}
              onClick={() => choose(s.value)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 14px',
                font: '500 12px/1.2 var(--font-text,sans-serif)',
                color: s.value === status ? 'var(--c-gold-2,#C99A5A)' : 'var(--c-text-2)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
