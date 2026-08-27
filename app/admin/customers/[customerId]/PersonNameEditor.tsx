'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Edits the account holder's name (profiles.full_name) for the person who owns
// the mailbox being viewed. Because a person is shared across every mailbox
// they own, this change is visible on all of them — which is correct: it is the
// same person. The business name is per-mailbox and is edited separately, in
// the Mailbox & business details card.
//
// Inline single-field editor, same shape as SuiteEditor, so the Billing &
// account card keeps its existing layout.
export default function PersonNameEditor({
  customerId,
  currentName,
}: {
  customerId: string;
  currentName: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  function open() {
    setValue(currentName ?? '');
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

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/person`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: value }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error || 'Could not update the account holder. Please try again.');
          return;
        }
        setSuccess('Account holder updated.');
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
        <span>{currentName?.trim() || '—'}</span>
        <button
          type="button"
          className="admin-link"
          onClick={open}
          style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
        >
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
          placeholder="Jessica Van Brunt"
          autoFocus
          disabled={isPending}
          style={{ maxWidth: 220 }}
        />
        <button type="submit" className="admin-btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="admin-link"
          onClick={cancel}
          disabled={isPending}
          style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: 'none' }}
        >
          Cancel
        </button>
      </div>
      <span style={{ font: '400 11px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
        The person&rsquo;s name. Shared across every mailbox they own. Billing in Stripe is not changed.
      </span>
      {error && (
        <span role="alert" style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: '#f87171' }}>
          {error}
        </span>
      )}
    </form>
  );
}
