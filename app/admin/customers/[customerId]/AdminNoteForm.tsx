'use client';
import { useState, useTransition } from 'react';

export default function AdminNoteForm({ customerId }: { customerId: string }) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;

    startTransition(async () => {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, note: note.trim() }),
      });
      if (res.ok) {
        setNote('');
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add an internal note…"
        rows={3}
        className="admin-textarea"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="submit"
          disabled={isPending || !note.trim()}
          className="admin-btn-primary"
        >
          {isPending ? 'Saving…' : 'Save note'}
        </button>
        {saved && (
          <span style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: '#4ade80' }}>
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
