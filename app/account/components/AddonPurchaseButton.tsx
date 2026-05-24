'use client';
import { useState, useTransition } from 'react';

// Posts to an add-on checkout route and redirects to the returned Stripe URL.
export default function AddonPurchaseButton({
  endpoint,
  label,
}: {
  endpoint: string;
  label: string;
}) {
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function buy() {
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(endpoint, { method: 'POST' });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        }
        setError(data.error ?? 'Could not start checkout.');
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={buy}
        disabled={isPending}
        style={{
          font: '600 12px/1 var(--font-text,sans-serif)',
          color: 'var(--c-gold-2,#C99A5A)',
          background: 'rgba(181,138,82,0.10)',
          border: '1px solid rgba(181,138,82,0.28)',
          borderRadius: 100, padding: '6px 12px',
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Starting…' : label}
      </button>
      {error && (
        <span style={{ font: '400 11px/1.3 var(--font-text,sans-serif)', color: '#f87171' }}>{error}</span>
      )}
    </span>
  );
}
