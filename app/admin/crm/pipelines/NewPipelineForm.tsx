'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPipelineForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/crm/pipelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setSaving(false);
    if (!res.ok) {
      setError(data?.error || 'Could not create pipeline.');
      return;
    }
    setName('');
    setDescription('');
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="dash-card"
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, flexWrap: 'wrap' }}
    >
      <div style={{ flex: '1 1 220px', minWidth: 220 }}>
        <label
          htmlFor="new-pipeline-name"
          style={{
            display: 'block',
            font: '500 11px/1.2 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}
        >
          New pipeline name
        </label>
        <input
          id="new-pipeline-name"
          className="admin-search-input"
          style={{ width: '100%' }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Renewal Pipeline"
          required
        />
      </div>
      <div style={{ flex: '2 1 320px', minWidth: 240 }}>
        <label
          htmlFor="new-pipeline-desc"
          style={{
            display: 'block',
            font: '500 11px/1.2 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}
        >
          Description (optional)
        </label>
        <input
          id="new-pipeline-desc"
          className="admin-search-input"
          style={{ width: '100%' }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this pipeline is for"
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <button
          type="submit"
          className="w-cta-pill filled"
          disabled={saving || !name.trim()}
          style={{ border: 'none', cursor: saving ? 'default' : 'pointer', padding: '10px 18px' }}
        >
          {saving ? 'Creating…' : 'Add pipeline'}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          style={{
            flexBasis: '100%',
            margin: 0,
            color: '#fca5a5',
            font: '400 12px/1.4 var(--font-text,sans-serif)',
          }}
        >
          {error}
        </p>
      )}
    </form>
  );
}
