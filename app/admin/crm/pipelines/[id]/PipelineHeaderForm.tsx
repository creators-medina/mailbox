'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function PipelineHeaderForm({
  pipelineId,
  initialName,
  initialDescription,
}: {
  pipelineId: string;
  initialName: string;
  initialDescription: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = name.trim() !== initialName || description !== initialDescription;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dirty || saving || !name.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/crm/pipelines/${pipelineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setSaving(false);
    if (!res.ok) {
      setError(data?.error || 'Could not save.');
      return;
    }
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="dash-card"
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div>
        <label
          htmlFor="pipe-name"
          style={{
            display: 'block',
            font: '500 11px/1.2 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}
        >
          Name
        </label>
        <input
          id="pipe-name"
          className="admin-search-input"
          style={{ width: '100%', maxWidth: 480 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label
          htmlFor="pipe-desc"
          style={{
            display: 'block',
            font: '500 11px/1.2 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}
        >
          Description
        </label>
        <textarea
          id="pipe-desc"
          rows={2}
          className="admin-search-input"
          style={{ width: '100%', maxWidth: 720, resize: 'vertical' }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="submit"
          className="w-cta-pill filled"
          disabled={!dirty || saving || !name.trim()}
          style={{ border: 'none', padding: '8px 16px', cursor: !dirty || saving ? 'default' : 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {savedAt && !dirty && !error && (
          <span style={{ color: 'var(--c-text-3)', font: '400 12px/1 var(--font-text,sans-serif)' }}>
            Saved.
          </span>
        )}
        {error && (
          <span role="alert" style={{ color: '#fca5a5', font: '400 12px/1 var(--font-text,sans-serif)' }}>
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
