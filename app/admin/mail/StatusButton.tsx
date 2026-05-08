'use client';
import { useState } from 'react';

const MAIL_STATUSES = ['received','notified','scanned','held','forwarded','picked_up','shredded'];

export default function MailStatusButton({
  itemId,
  currentStatus,
}: {
  itemId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function update(next: string) {
    if (next === status || saving) return;
    setSaving(true);
    const res = await fetch(`/api/admin/mail/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setStatus(next);
    setSaving(false);
  }

  return (
    <select
      value={status}
      onChange={e => update(e.target.value)}
      disabled={saving}
      className="admin-select"
    >
      {MAIL_STATUSES.map(s => (
        <option key={s} value={s}>{s.replace('_', ' ')}</option>
      ))}
    </select>
  );
}
