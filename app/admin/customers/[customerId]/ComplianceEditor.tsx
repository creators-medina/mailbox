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
  initialForm1583RejectedReason,
  initialPhotoIdRejectedReason,
  form1583UploadedAt,
  photoIdUploadedAt,
  form1583Url,
  photoIdUrl,
  reviewedAt,
  reviewedByLabel,
  verifiedAt,
  verifiedByLabel,
}: {
  customerId: string;
  initialForm1583: string;
  initialPhotoId: string;
  initialNotes: string;
  initialForm1583RejectedReason: string;
  initialPhotoIdRejectedReason: string;
  form1583UploadedAt: string | null;
  photoIdUploadedAt: string | null;
  form1583Url: string | null;
  photoIdUrl: string | null;
  reviewedAt: string | null;
  reviewedByLabel: string | null;
  verifiedAt: string | null;
  verifiedByLabel: string | null;
}) {
  const router = useRouter();
  const [form1583, setForm1583] = useState(initialForm1583);
  const [photoId, setPhotoId] = useState(initialPhotoId);
  const [notes, setNotes] = useState(initialNotes);
  const [form1583Reason, setForm1583Reason] = useState(initialForm1583RejectedReason);
  const [photoIdReason, setPhotoIdReason]   = useState(initialPhotoIdRejectedReason);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [sendMsg, setSendMsg] = useState('');
  const [sendErr, setSendErr] = useState('');
  const [isSending, startSending] = useTransition();

  const bothVerified = form1583 === 'verified' && photoId === 'verified';

  function patch(payload: Record<string, unknown>, optimistic?: () => void) {
    setError('');
    setSuccess('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/compliance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error || 'Could not update compliance status.');
          return;
        }
        optimistic?.();
        setSuccess('Compliance status saved.');
        router.refresh();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  function save() {
    patch({
      form_1583_status: form1583,
      photo_id_status: photoId,
      notes,
      form_1583_rejected_reason: form1583Reason,
      photo_id_rejected_reason: photoIdReason,
    });
  }

  function verifyOne(which: 'form_1583' | 'photo_id') {
    const key = which === 'form_1583' ? 'form_1583_status' : 'photo_id_status';
    patch({ [key]: 'verified' }, () => {
      if (which === 'form_1583') { setForm1583('verified'); setForm1583Reason(''); }
      else { setPhotoId('verified'); setPhotoIdReason(''); }
    });
  }

  function rejectOne(which: 'form_1583' | 'photo_id') {
    const reason = which === 'form_1583' ? form1583Reason : photoIdReason;
    if (!reason.trim()) {
      setError(`Add a ${which === 'form_1583' ? 'Form 1583' : 'Photo ID'} rejection reason — the customer will see it.`);
      return;
    }
    const statusKey = which === 'form_1583' ? 'form_1583_status' : 'photo_id_status';
    const reasonKey = which === 'form_1583' ? 'form_1583_rejected_reason' : 'photo_id_rejected_reason';
    patch({ [statusKey]: 'rejected', [reasonKey]: reason }, () => {
      if (which === 'form_1583') setForm1583('rejected');
      else setPhotoId('rejected');
    });
  }

  function sendRequest() {
    setSendMsg('');
    setSendErr('');
    startSending(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customerId}/send-compliance-request`, { method: 'POST' });
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <DocCard
          title="USPS Form 1583"
          status={form1583}
          uploadedAt={form1583UploadedAt}
          viewUrl={form1583Url}
          onStatusChange={setForm1583}
          onVerify={() => verifyOne('form_1583')}
          onReject={() => rejectOne('form_1583')}
          disabled={isPending}
        />
        <DocCard
          title="Photo ID"
          status={photoId}
          uploadedAt={photoIdUploadedAt}
          viewUrl={photoIdUrl}
          onStatusChange={setPhotoId}
          onVerify={() => verifyOne('photo_id')}
          onReject={() => rejectOne('photo_id')}
          disabled={isPending}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="admin-label">Form 1583 rejection reason (shown to customer)</label>
          <textarea
            className="admin-textarea"
            rows={2}
            value={form1583Reason}
            onChange={e => setForm1583Reason(e.target.value)}
            placeholder="e.g. Signature is missing on page 2 — please re-sign and re-upload."
            disabled={isPending}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label className="admin-label">Photo ID rejection reason (shown to customer)</label>
          <textarea
            className="admin-textarea"
            rows={2}
            value={photoIdReason}
            onChange={e => setPhotoIdReason(e.target.value)}
            placeholder="e.g. ID image is too blurry to read — please re-upload."
            disabled={isPending}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Compliance notes (internal, not shown to customer)</label>
        <textarea
          className="admin-textarea"
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Notarized form expired — awaiting reissue."
          disabled={isPending}
        />
      </div>

      <div style={{
        font: '400 12px/1.6 var(--font-text,sans-serif)',
        color: bothVerified ? '#4ade80' : 'var(--c-gold-2,#C99A5A)',
      }}>
        {bothVerified
          ? (verifiedAt
              ? `Verified ${fmt(verifiedAt)}${verifiedByLabel ? ` by ${verifiedByLabel}` : ''}.`
              : 'Both items verified — save to record verification.')
          : 'Not yet authorized for mail handling. Both items must be verified.'}
        {reviewedAt && (
          <div style={{ color: 'var(--c-text-3)', marginTop: 4 }}>
            Last reviewed {fmt(reviewedAt)}{reviewedByLabel ? ` by ${reviewedByLabel}` : ''}.
          </div>
        )}
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

function DocCard({
  title, status, uploadedAt, viewUrl, onStatusChange, onVerify, onReject, disabled,
}: {
  title: string;
  status: string;
  uploadedAt: string | null;
  viewUrl: string | null;
  onStatusChange: (s: string) => void;
  onVerify: () => void;
  onReject: () => void;
  disabled: boolean;
}) {
  const uploaded = Boolean(uploadedAt);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 10, border: '1px solid var(--c-border-2,rgba(255,255,255,0.13))' }}>
      <span style={{ font: '600 13px/1 var(--font-text,sans-serif)', color: '#fff' }}>{title}</span>
      <select className="admin-select" value={status} onChange={e => onStatusChange(e.target.value)} disabled={disabled}>
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <div style={{ font: '400 11px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
        {uploaded ? `Uploaded ${fmt(uploadedAt!)}` : 'Not uploaded'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, alignItems: 'center' }}>
        {viewUrl ? (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ font: '600 11px/1 var(--font-text,sans-serif)', color: 'var(--c-gold-2,#C99A5A)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(201,154,90,0.45)', textDecoration: 'none' }}
          >
            View {title} ›
          </a>
        ) : uploaded ? (
          <span style={{ font: '500 11px/1.3 var(--font-text,sans-serif)', color: '#f87171', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(248,113,113,0.30)', background: 'rgba(248,113,113,0.08)' }}>
            File uploaded — link unavailable
          </span>
        ) : null}
        <button
          type="button"
          onClick={onVerify}
          disabled={disabled || !uploaded || status === 'verified'}
          title={!uploaded ? 'Customer has not uploaded this document yet.' : status === 'verified' ? 'Already verified.' : ''}
          style={{
            font: '600 11px/1 var(--font-text,sans-serif)', color: '#4ade80',
            background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.30)',
            borderRadius: 6, padding: '6px 10px',
            cursor: disabled || !uploaded || status === 'verified' ? 'not-allowed' : 'pointer',
            opacity: disabled || !uploaded || status === 'verified' ? 0.5 : 1,
          }}
        >
          Verify
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={disabled || status === 'rejected'}
          style={{
            font: '600 11px/1 var(--font-text,sans-serif)', color: '#f87171',
            background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.30)',
            borderRadius: 6, padding: '6px 10px',
            cursor: disabled || status === 'rejected' ? 'not-allowed' : 'pointer',
            opacity: disabled || status === 'rejected' ? 0.5 : 1,
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
