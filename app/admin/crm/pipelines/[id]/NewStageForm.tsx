'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EAB308', '#F97316',
  '#10B981', '#EF4444', '#06B6D4', '#6B7280',
];

export default function NewStageForm({ pipelineId }: { pipelineId: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [isClosed, setIsClosed] = useState(false);
  const [closeType, setCloseType] = useState<'won' | 'lost' | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/crm/stages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pipeline_id: pipelineId,
        name: name.trim(),
        color,
        is_closed: isClosed,
        close_type: isClosed && closeType ? closeType : null,
      }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setSaving(false);
    if (!res.ok) {
      setError(data?.error || 'Could not create stage.');
      return;
    }
    setName('');
    setColor('#6B7280');
    setIsClosed(false);
    setCloseType('');
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="dash-card"
      style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}
    >
      <div style={{ flex: '1 1 200px', minWidth: 200 }}>
        <label
          htmlFor="new-stage-name"
          style={{
            display: 'block',
            font: '500 11px/1.2 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}
        >
          New stage name
        </label>
        <input
          id="new-stage-name"
          className="admin-search-input"
          style={{ width: '100%' }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Demo Scheduled"
          required
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            font: '500 11px/1.2 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 6,
          }}
        >
          Color
        </label>
        <div style={{ display: 'flex', gap: 4 }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Pick color ${c}`}
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: c,
                border: color === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Custom color"
            style={{
              width: 22,
              height: 22,
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          font: '400 12px/1 var(--font-text,sans-serif)',
          color: 'var(--c-text-2)',
        }}
      >
        <input
          type="checkbox"
          checked={isClosed}
          onChange={(e) => {
            setIsClosed(e.target.checked);
            if (!e.target.checked) setCloseType('');
          }}
        />
        Closed stage
      </label>

      {isClosed && (
        <select
          className="admin-select"
          value={closeType}
          onChange={(e) => setCloseType(e.target.value as 'won' | 'lost' | '')}
        >
          <option value="">— close type —</option>
          <option value="won">won</option>
          <option value="lost">lost</option>
        </select>
      )}

      <button
        type="submit"
        className="w-cta-pill filled"
        disabled={saving || !name.trim()}
        style={{ border: 'none', padding: '8px 16px', cursor: saving ? 'default' : 'pointer' }}
      >
        {saving ? 'Adding…' : 'Add stage'}
      </button>

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
