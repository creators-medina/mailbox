'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type MailboxFields = {
  business_name: string;
  recipient_name: string;
  contact_email: string;
  contact_phone: string;
  forwarding_address: string;
};

const FIELDS: Array<{
  key: keyof MailboxFields;
  label: string;
  placeholder: string;
  hint?: string;
  multiline?: boolean;
}> = [
  {
    key: 'business_name',
    label: 'Business name',
    placeholder: 'Van Brunt & Company',
    hint: 'Shown on this suite only. Does not change the billing name in Stripe.',
  },
  {
    key: 'recipient_name',
    label: 'Recipient name',
    placeholder: 'Jessica Van Brunt',
    hint: 'Who mail at this suite is addressed to.',
  },
  {
    key: 'contact_email',
    label: 'Mailbox contact email',
    placeholder: 'ops@example.com',
    hint: 'Operational contact for this suite. Not the login or billing email.',
  },
  {
    key: 'contact_phone',
    label: 'Mailbox contact phone',
    placeholder: '(469) 555-0134',
  },
  {
    key: 'forwarding_address',
    label: 'Forwarding address',
    placeholder: '123 Main St, Dallas, TX 75201',
    multiline: true,
  },
];

// Edits the operational identity of one mailbox/suite. Every save PATCHes
// /api/admin/customers/[id]/mailbox, which writes only to this customers row
// and never to billing data. Suite reassignment is a separate control.
export default function MailboxProfileEditor({
  customerId,
  suiteNumber,
  initial,
}: {
  customerId: string;
  suiteNumber: string | null;
  initial: MailboxFields;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<MailboxFields>(initial);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  function open() {
    setValues(initial);
    setError('');
    setSuccess('');
    setEditing(true);
  }

  function cancel() {
    setValues(initial);
    setError('');
    setEditing(false);
  }

  function set(key: keyof MailboxFields, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/mailbox`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error || 'Could not update the mailbox. Please try again.');
          return;
        }
        setSuccess('Mailbox details updated. Billing was not changed.');
        setEditing(false);
        router.refresh();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  if (!editing) {
    return (
      <div>
        <dl className="admin-dl">
          {FIELDS.map(f => (
            <div key={f.key} style={{ display: 'contents' }}>
              <dt>{f.label}</dt>
              <dd style={f.multiline ? { fontSize: 12, whiteSpace: 'pre-wrap' } : undefined}>
                {initial[f.key].trim() || '—'}
              </dd>
            </div>
          ))}
        </dl>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-link"
            onClick={open}
            style={{ fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            Edit mailbox details
          </button>
          {success && (
            <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: '#4ade80' }}>
              {success}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ font: '400 12px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', margin: 0 }}>
        Editing{' '}
        <strong style={{ color: 'var(--c-gold-2,#C99A5A)' }}>{suiteNumber ?? 'this mailbox'}</strong>
        {' '}only. Other mailboxes on this account and all billing data are unaffected.
      </p>

      {FIELDS.map(f => (
        <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ font: '500 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>
            {f.label}
          </span>
          {f.multiline ? (
            <textarea
              className="ds-dark-input"
              value={values[f.key]}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              disabled={isPending}
              rows={2}
              style={{ resize: 'vertical' }}
            />
          ) : (
            <input
              className="ds-dark-input"
              value={values[f.key]}
              onChange={e => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              disabled={isPending}
            />
          )}
          {f.hint && (
            <span style={{ font: '400 11px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
              {f.hint}
            </span>
          )}
        </label>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="submit" className="admin-btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save mailbox details'}
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

      {error && (
        <span role="alert" style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: '#f87171' }}>
          {error}
        </span>
      )}
    </form>
  );
}
