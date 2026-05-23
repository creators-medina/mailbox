'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type CustomerOption = {
  id: string;
  suite_number: string | null;
  display: string;
};

export default function UploadForm({
  customers,
  defaultCustomerId,
}: {
  customers: CustomerOption[];
  defaultCustomerId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await fetch('/api/admin/mail-items', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setSuccess('Mail item uploaded successfully.');
        form.reset();
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Upload failed');
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>

      {/* Customer select */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Customer *</label>
        <select name="customer_id" required defaultValue={defaultCustomerId ?? ''} className="admin-select">
          <option value="">— Select customer —</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.suite_number ? `${c.suite_number} — ` : ''}{c.display}
            </option>
          ))}
        </select>
      </div>

      {/* Sender */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Sender</label>
        <input name="sender" type="text" placeholder="e.g. IRS, Chase Bank…" className="admin-input" />
      </div>

      {/* Recipient name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Recipient name</label>
        <input name="recipient_name" type="text" placeholder="Name on envelope" className="admin-input" />
      </div>

      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Title / description</label>
        <input name="title" type="text" placeholder="Brief description" className="admin-input" />
      </div>

      {/* Tracking number */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Tracking number (optional)</label>
        <input name="tracking_number" type="text" placeholder="USPS/carrier tracking #" className="admin-input" />
      </div>

      {/* Received at */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Received date</label>
        <input
          name="received_at"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="admin-input"
        />
      </div>

      {/* Envelope image */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Envelope image (JPG/PNG, max 10 MB)</label>
        <input name="envelope" type="file" accept="image/*" className="admin-file-input" />
      </div>

      {/* Scan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Scanned document (PDF, max 50 MB)</label>
        <input name="scan" type="file" accept=".pdf,application/pdf" className="admin-file-input" />
      </div>

      {/* Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="admin-label">Internal notes</label>
        <textarea name="notes" rows={3} placeholder="Staff notes (not shown to customer)" className="admin-textarea" />
      </div>

      {error && (
        <p style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: '#f87171', margin: 0 }}>{error}</p>
      )}
      {success && (
        <p style={{ font: '400 13px/1.4 var(--font-text,sans-serif)', color: '#4ade80', margin: 0 }}>{success}</p>
      )}

      <button type="submit" disabled={isPending} className="admin-btn-primary" style={{ alignSelf: 'flex-start' }}>
        {isPending ? 'Uploading…' : 'Upload mail item'}
      </button>
    </form>
  );
}
