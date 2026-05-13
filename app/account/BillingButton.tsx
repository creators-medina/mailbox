'use client';
import { useState, useTransition } from 'react';

export default function BillingButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function open() {
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        window.location.href = url;
      } else {
        setError('Could not open billing portal. Try again later.');
      }
    });
  }

  return (
    <div>
      <button
        onClick={open}
        disabled={isPending}
        style={{
          font: '500 14px/1.3 var(--font-text,sans-serif)',
          color: 'var(--c-gold-2,#C99A5A)',
          background: 'none', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
          padding: 0, opacity: isPending ? 0.6 : 1, textDecoration: 'none',
        }}
      >
        {isPending ? 'Opening…' : 'Manage billing →'}
      </button>
      {error && (
        <p style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: '#f87171', margin: '6px 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
}
