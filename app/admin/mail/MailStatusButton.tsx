'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MAIL_ITEM_STATUSES } from '@/lib/mail/statuses';

const label = (s: string) => s.replace('_', ' ');

export default function MailStatusButton({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    if (menu) { setMenu(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    // Fixed positioning escapes the table/card `overflow: hidden` clipping.
    setMenu({ top: r.bottom + 4, left: r.left });
  }

  function choose(next: string) {
    setMenu(null);
    if (next === status) return;
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/mail-items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
        if (res.ok) {
          setStatus(data.status ?? next);
          router.refresh();
        } else {
          setError(data.error ?? 'Could not update status.');
        }
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={toggle}
        disabled={isPending}
        className={`admin-status-badge admin-status-${status}`}
        style={{ cursor: 'pointer', border: 'none', background: 'inherit' }}
      >
        {isPending ? '…' : label(status)} ▾
      </button>

      {menu && (
        <>
          {/* click-away backdrop */}
          <div
            onClick={() => setMenu(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 60 }}
          />
          <div
            style={{
              position: 'fixed', top: menu.top, left: menu.left, zIndex: 61,
              minWidth: 180,
              background: 'var(--c-surface,#162032)',
              border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
              padding: 4,
            }}
          >
            {MAIL_ITEM_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => choose(s)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 12px', borderRadius: 7,
                  font: '500 13px/1.2 var(--font-text,sans-serif)',
                  textTransform: 'capitalize',
                  color: s === status ? 'var(--c-gold-2,#C99A5A)' : 'rgba(255,255,255,0.82)',
                  background: s === status ? 'rgba(181,138,82,0.10)' : 'none',
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {label(s)}
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, font: '400 11px/1.3 var(--font-text,sans-serif)', color: '#f87171', whiteSpace: 'nowrap', zIndex: 11 }}>
          {error}
        </div>
      )}
    </div>
  );
}
