'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const SUITE_RE = /^MB\d{4,6}$/;

export default function SuiteEditor({
  customerId,
  currentSuite,
}: {
  customerId: string;
  currentSuite: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentSuite ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  function open() {
    setValue(currentSuite ?? '');
    setError('');
    setSuccess('');
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError('');
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const suiteNumber = value.trim().toUpperCase();
    if (!SUITE_RE.test(suiteNumber)) {
      setError('Suite number must look like MB1001.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/suite`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suiteNumber }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error || 'Could not update the suite. Please try again.');
          return;
        }
        setSuccess('Suite updated successfully.');
        setEditing(false);
        router.refresh();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ font: '600 16px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)' }}>
          {currentSuite ?? '—'}
        </span>
        <button type="button" className="admin-link" onClick={open} style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
          Edit
        </button>
        {success && (
          <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: '#4ade80' }}>
            {success}
          </span>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <input
          className="ds-dark-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="MB1001"
          autoFocus
          disabled={isPending}
          style={{ maxWidth: 160 }}
        />
        <button type="submit" className="admin-btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="admin-link" onClick={cancel} disabled={isPending} style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: 'none' }}>
          Cancel
        </button>
      </div>
      {error && (
        <span role="alert" style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: '#f87171' }}>
          {error}
        </span>
      )}
    </form>
  );
}
