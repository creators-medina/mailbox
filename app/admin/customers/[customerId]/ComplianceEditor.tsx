'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const STATUSES = ['pending', 'requested', 'received', 'verified', 'rejected'] as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ComplianceEditor({
  customerId,
  initialForm1583,
  initialPhotoId,
  initialNotes,
  verifiedAt,
  verifiedByLabel,
}: {
  customerId: string;
  initialForm1583: string;
  initialPhotoId: string;
  initialNotes: string;
  verifiedAt: string | null;
  verifiedByLabel: string | null;
}) {
  const router = useRouter();
  const [form1583, setForm1583] = useState(initialForm1583);
  const [photoId, setPhotoId] = useState(initialPhotoId);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [sendMsg, setSendMsg] = useState('');
  const [sendErr, setSendErr] = useState('');
  const [isSending, startSending] = useTransition();

  const bothVerified = form1583 === 'verified' && photoId === 'verified';

  function sendRequest() {
    setSendMsg('');
    setSendErr('');
    startSending(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/send-compliance-request`, {
          method: 'POST',
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setSendErr(data.error || 'Could not send the request.');
          return;
        }
        setSendMsg('Authorization request emailed.');
        router.refresh();
      } catch {
        setSendErr('Network error. Please try again.');
      }
    });
  }

  function save() {
    setError('');
    setSuccess('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/compliance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form_1583_status: form1583, photo_id_status: photoId, notes }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error || 'Could not update compliance status.');
          return;
        }
        setSuccess('Compliance status saved.');
        router.refresh();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="admin-label">USPS Form 1583</label>
          <select className="admin-select" value={form1583} onChange={e => setForm1583(e.target.value)} disabled={isPending}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="admin-label">Photo ID</label>
          <select className="admin-select" value={photoId} onChange={e => setPhotoId(e.target.value)} disabled={isPending}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Compliance notes (internal)</label>
        <textarea
          className="admin-textarea"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. ID expired, awaiting notarized form…"
          disabled={isPending}
        />
      </div>

      <div style={{
        font: '400 12px/1.5 var(--font-text,sans-serif)',
        color: bothVerified ? '#4ade80' : 'var(--c-gold-2,#C99A5A)',
      }}>
        {bothVerified
          ? (verifiedAt ? `Verified ${fmt(verifiedAt)}${verifiedByLabel ? ` by ${verifiedByLabel}` : ''}.` : 'Both items verified — save to record verification.')
          : 'Not yet authorized for mail handling. Both items must be verified.'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="admin-btn-primary" onClick={save} disabled={isPending} style={{ alignSelf: 'flex-start' }}>
          {isPending ? 'Saving…' : 'Save compliance'}
        </button>
        {success && <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: '#4ade80' }}>{success}</span>}
        {error && <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: '#f87171' }}>{error}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid var(--c-border,rgba(255,255,255,0.07))' }}>
        <button
          type="button"
          onClick={sendRequest}
          disabled={isSending}
          style={{
            font: '600 13px/1 var(--font-text,sans-serif)',
            color: 'var(--c-gold-2,#C99A5A)',
            background: 'rgba(181,138,82,0.10)',
            border: '1px solid rgba(181,138,82,0.28)',
            borderRadius: 100, padding: '9px 16px',
            cursor: isSending ? 'default' : 'pointer', opacity: isSending ? 0.6 : 1,
          }}
        >
          {isSending ? 'Sending…' : 'Send authorization request'}
        </button>
        {sendMsg && <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: '#4ade80' }}>{sendMsg}</span>}
        {sendErr && <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: '#f87171' }}>{sendErr}</span>}
      </div>
    </div>
  );
}
