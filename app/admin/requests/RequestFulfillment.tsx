'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Suggested customer-visible note per request type, shown when completing.
const RESPONSE_SUGGESTION: Record<string, string> = {
  scan: 'Your scan has been uploaded to your dashboard.',
  forward: 'Your mail was forwarded to the address you provided.',
  pickup: 'Your mail is being held for pickup.',
  shred: 'Your mail was securely shredded.',
};

const badgeClass = (s: string) => `admin-status-badge admin-status-${s}`;

export default function RequestFulfillment({
  id,
  requestType,
  current,
  customerResponse,
}: {
  id: string;
  requestType: string;
  current: string;
  customerResponse: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [formOpen, setFormOpen] = useState(false);
  const [staffNote, setStaffNote] = useState('');
  const [response, setResponse] = useState(customerResponse ?? RESPONSE_SUGGESTION[requestType] ?? '');
  const [tracking, setTracking] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function patch(payload: Record<string, unknown>, onDone?: () => void) {
    setError('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/mail-requests/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; request?: { status?: string } };
        if (!res.ok) { setError(data.error ?? 'Update failed.'); return; }
        if (data.request?.status) setStatus(data.request.status);
        onDone?.();
        router.refresh();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  if (status === 'completed' || status === 'cancelled') {
    return <span className={badgeClass(status)}>{status.replace('_', ' ')}</span>;
  }

  if (formOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
        <textarea
          className="admin-textarea" rows={2} value={response}
          onChange={e => setResponse(e.target.value)} placeholder="Customer-visible note" disabled={isPending}
        />
        <textarea
          className="admin-textarea" rows={2} value={staffNote}
          onChange={e => setStaffNote(e.target.value)} placeholder="Internal staff note (not shown to customer)" disabled={isPending}
        />
        {requestType === 'forward' && (
          <input
            className="admin-input" value={tracking} onChange={e => setTracking(e.target.value)}
            placeholder="Tracking number (optional)" disabled={isPending}
          />
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="admin-btn-primary"
            disabled={isPending}
            onClick={() => patch(
              { status: 'completed', staff_note: staffNote, customer_response: response, tracking_number: tracking },
              () => setFormOpen(false),
            )}
          >
            {isPending ? 'Saving…' : 'Confirm complete'}
          </button>
          <button className="admin-btn-secondary" disabled={isPending} onClick={() => setFormOpen(false)}>Cancel</button>
        </div>
        {error && <span style={{ font: '400 11px/1.3 var(--font-text,sans-serif)', color: '#f87171' }}>{error}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span className={badgeClass(status)}>{status.replace('_', ' ')}</span>
      {status === 'pending' && (
        <button className="admin-link" style={btn} disabled={isPending} onClick={() => patch({ status: 'in_progress' })}>
          Start
        </button>
      )}
      <button className="admin-link" style={btn} disabled={isPending} onClick={() => setFormOpen(true)}>
        Complete
      </button>
      <button className="admin-link" style={{ ...btn, color: '#f87171' }} disabled={isPending} onClick={() => patch({ status: 'cancelled' })}>
        Cancel
      </button>
      {error && <span style={{ font: '400 11px/1.3 var(--font-text,sans-serif)', color: '#f87171' }}>{error}</span>}
    </div>
  );
}

const btn: React.CSSProperties = {
  fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', padding: 0,
};
