'use client';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const MAX_BYTES = 20 * 1024 * 1024;

type Status = string;

function statusLabel(status: Status): string {
  switch (status) {
    case 'verified': return 'Verified';
    case 'rejected': return 'Needs attention';
    case 'received': return 'Received — awaiting review';
    case 'requested': return 'Requested';
    default: return 'Not uploaded';
  }
}
function statusColor(status: Status): string {
  if (status === 'verified') return '#4ade80';
  if (status === 'rejected') return '#f87171';
  if (status === 'received' || status === 'requested') return 'var(--c-gold-2,#C99A5A)';
  return 'var(--c-text-3)';
}

export default function ComplianceUploadCard({
  form1583Status,
  photoIdStatus,
  form1583Uploaded,
  photoIdUploaded,
  form1583RejectedReason,
  photoIdRejectedReason,
  legacyRejectedReason,
}: {
  form1583Status: string;
  photoIdStatus: string;
  form1583Uploaded: boolean;
  photoIdUploaded: boolean;
  form1583RejectedReason: string | null;
  photoIdRejectedReason: string | null;
  legacyRejectedReason: string | null;
}) {
  // Per-document reason wins; the legacy shared reason is only shown as a
  // fallback when the document is rejected but has no specific reason yet.
  const form1583Reason =
    (form1583RejectedReason && form1583RejectedReason.trim())
      || (form1583Status === 'rejected' ? (legacyRejectedReason ?? null) : null);
  const photoIdReason =
    (photoIdRejectedReason && photoIdRejectedReason.trim())
      || (photoIdStatus === 'rejected' ? (legacyRejectedReason ?? null) : null);
  const router = useRouter();
  const formRef = useRef<HTMLInputElement>(null);
  const idRef   = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const form1583Locked = form1583Status === 'verified';
  const photoIdLocked  = photoIdStatus === 'verified';

  function pickedFile(input: HTMLInputElement | null): File | null {
    return input?.files?.[0] ?? null;
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formFile = pickedFile(formRef.current);
    const idFile   = pickedFile(idRef.current);
    if (!formFile && !idFile) {
      setError('Choose a file to upload.');
      return;
    }
    for (const f of [formFile, idFile]) {
      if (f && f.size > MAX_BYTES) {
        setError('Each file must be 20 MB or smaller.');
        return;
      }
    }

    const fd = new FormData();
    if (formFile && !form1583Locked) fd.append('form_1583', formFile);
    if (idFile && !photoIdLocked)    fd.append('photo_id',  idFile);
    if (!fd.has('form_1583') && !fd.has('photo_id')) {
      setError('Nothing to upload.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/compliance/upload', { method: 'POST', body: fd });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Upload failed. Please try again.');
          return;
        }
        setSuccess('Thanks — your documents have been received. We’ll email you once they’re verified.');
        if (formRef.current) formRef.current.value = '';
        if (idRef.current) idRef.current.value = '';
        router.refresh();
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  const bothVerified = form1583Locked && photoIdLocked;

  return (
    <div className="dash-card">
      <span className="dash-card-title">Upload authorization documents</span>

      {bothVerified ? (
        <p style={{ font: '400 13px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: 0 }}>
          Your Form 1583 and photo ID are verified — no further action needed.
        </p>
      ) : (
        <>
          <p style={{ font: '400 13px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '0 0 14px' }}>
            Upload your signed USPS Form 1583 and a valid government-issued photo ID.
            Files are stored privately and only visible to our compliance team.
            PDF or image (JPG/PNG), up to 20 MB each.
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field
              label="USPS Form 1583"
              status={form1583Status}
              uploaded={form1583Uploaded}
              locked={form1583Locked}
              rejectedReason={form1583Reason}
              inputRef={formRef}
              disabled={isPending}
            />
            <Field
              label="Photo ID"
              status={photoIdStatus}
              uploaded={photoIdUploaded}
              locked={photoIdLocked}
              rejectedReason={photoIdReason}
              inputRef={idRef}
              disabled={isPending}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={isPending || (form1583Locked && photoIdLocked)}
                style={{
                  font: '600 13px/1 var(--font-text,sans-serif)',
                  color: '#1a1206',
                  background: 'var(--c-gold-2,#C99A5A)',
                  border: 'none', borderRadius: 100,
                  padding: '10px 18px',
                  cursor: isPending ? 'default' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? 'Uploading…' : 'Submit documents'}
              </button>
              {success && (
                <span style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: '#4ade80' }}>{success}</span>
              )}
              {error && (
                <span style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: '#f87171' }}>{error}</span>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}

function Field({
  label, status, uploaded, locked, rejectedReason, inputRef, disabled,
}: {
  label: string;
  status: Status;
  uploaded: boolean;
  locked: boolean;
  rejectedReason: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  disabled: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ font: '600 13px/1.2 var(--font-text,sans-serif)', color: 'rgba(255,255,255,0.88)' }}>{label}</span>
        <span style={{ font: '500 11px/1 var(--font-text,sans-serif)', color: statusColor(status) }}>
          {statusLabel(status)}{uploaded && status !== 'verified' && ' · file on file'}
        </span>
      </div>
      {rejectedReason && (
        <div style={{
          padding: '8px 10px', borderRadius: 6,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)',
          font: '400 12px/1.5 var(--font-text,sans-serif)', color: '#f87171',
        }}>
          <strong>Needs attention:</strong> {rejectedReason}
        </div>
      )}
      {locked ? (
        <span style={{ font: '400 12px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
          Verified — no further upload needed. Contact support to replace this document.
        </span>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          disabled={disabled}
          className="ds-dark-input"
          style={{ font: '400 12px/1.3 var(--font-text,sans-serif)', padding: 8 }}
        />
      )}
    </div>
  );
}
