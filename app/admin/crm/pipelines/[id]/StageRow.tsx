'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Stage } from '@/lib/crm/types';

const BTN: React.CSSProperties = {
  font: '500 12px/1 var(--font-text,sans-serif)',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
  background: 'transparent',
  color: 'var(--c-text-2,rgba(255,255,255,0.7))',
  cursor: 'pointer',
};

export default function StageRow({
  stage,
  isFirst,
  isLast,
}: {
  stage: Stage;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color);
  const [isClosed, setIsClosed] = useState(stage.is_closed);
  const [closeType, setCloseType] = useState<'won' | 'lost' | ''>(
    stage.close_type ?? '',
  );
  const [busy, setBusy] = useState(false);

  async function call(input: RequestInfo, init?: RequestInit) {
    if (busy) return false;
    setBusy(true);
    const res = await fetch(input, init);
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(data?.error || 'Action failed.');
      return false;
    }
    router.refresh();
    return true;
  }

  function reorder(direction: 'up' | 'down') {
    return call('/api/admin/crm/stages/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: stage.id, direction }),
    });
  }

  function patch(body: Record<string, unknown>) {
    return call(`/api/admin/crm/stages/${stage.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async function save() {
    if (!name.trim()) return;
    const ok = await patch({
      name: name.trim(),
      color,
      is_closed: isClosed,
      close_type: isClosed && closeType ? closeType : null,
    });
    if (ok) setEditing(false);
  }

  async function hardDelete() {
    if (!confirm(`Delete stage "${stage.name}" permanently? Future leads referencing it would lose this stage.`)) return;
    await call(`/api/admin/crm/stages/${stage.id}`, { method: 'DELETE' });
  }

  if (stage.is_archived) {
    return (
      <tr style={{ opacity: 0.6 }}>
        <td>
          <span
            style={{
              display: 'inline-block',
              width: 18,
              height: 18,
              borderRadius: 4,
              background: stage.color,
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          />
        </td>
        <td>{stage.name}</td>
        <td style={{ color: 'var(--c-text-3)', fontSize: 12 }}>{stage.slug}</td>
        <td style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button style={BTN} disabled={busy} onClick={() => patch({ is_archived: false })}>
              Restore
            </button>
            <button
              style={{ ...BTN, color: '#fca5a5', borderColor: 'rgba(252,165,165,0.3)' }}
              disabled={busy}
              onClick={hardDelete}
            >
              Delete forever
            </button>
          </div>
        </td>
      </tr>
    );
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={7} style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '4px 0' }}>
            <input
              className="admin-search-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: 220 }}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: 28,
                height: 28,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
            />
            <label
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
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
              Closed
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
            <button style={BTN} disabled={busy || !name.trim()} onClick={save}>
              Save
            </button>
            <button
              style={BTN}
              disabled={busy}
              onClick={() => {
                setEditing(false);
                setName(stage.name);
                setColor(stage.color);
                setIsClosed(stage.is_closed);
                setCloseType(stage.close_type ?? '');
              }}
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={{ color: 'var(--c-text-3)' }}>{stage.order_index}</td>
      <td>
        <span
          style={{
            display: 'inline-block',
            width: 18,
            height: 18,
            borderRadius: 4,
            background: stage.color,
            border: '1px solid rgba(255,255,255,0.15)',
            verticalAlign: 'middle',
          }}
        />
      </td>
      <td style={{ fontWeight: 600 }}>{stage.name}</td>
      <td style={{ color: 'var(--c-text-3)', fontSize: 12 }}>{stage.slug}</td>
      <td>{stage.is_closed ? 'yes' : '—'}</td>
      <td style={{ color: 'var(--c-text-2)' }}>{stage.close_type ?? '—'}</td>
      <td>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button style={BTN} disabled={busy || isFirst} onClick={() => reorder('up')} title="Move up">↑</button>
          <button style={BTN} disabled={busy || isLast} onClick={() => reorder('down')} title="Move down">↓</button>
          <button style={BTN} disabled={busy} onClick={() => setEditing(true)}>Edit</button>
          <button style={BTN} disabled={busy} onClick={() => patch({ is_archived: true })}>Archive</button>
        </div>
      </td>
    </tr>
  );
}
