'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  pipelineId: string;
  isDefault: boolean;
  isFirst: boolean;
  isLast: boolean;
  isArchived?: boolean;
};

const BTN: React.CSSProperties = {
  font: '500 12px/1 var(--font-text,sans-serif)',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
  background: 'transparent',
  color: 'var(--c-text-2,rgba(255,255,255,0.7))',
  cursor: 'pointer',
};

export default function PipelineRowActions({
  pipelineId,
  isDefault,
  isFirst,
  isLast,
  isArchived = false,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function call(input: RequestInfo, init?: RequestInit) {
    if (busy) return;
    setBusy(true);
    const res = await fetch(input, init);
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(data?.error || 'Action failed.');
      return;
    }
    router.refresh();
  }

  function patch(body: Record<string, unknown>) {
    return call(`/api/admin/crm/pipelines/${pipelineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function reorder(direction: 'up' | 'down') {
    return call('/api/admin/crm/pipelines/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pipelineId, direction }),
    });
  }

  async function hardDelete() {
    if (!confirm('Delete this pipeline permanently? Stages will be deleted too. This cannot be undone.')) return;
    await call(`/api/admin/crm/pipelines/${pipelineId}`, { method: 'DELETE' });
  }

  if (isArchived) {
    return (
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
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      <button
        style={BTN}
        disabled={busy || isFirst}
        onClick={() => reorder('up')}
        title="Move up"
      >
        ↑
      </button>
      <button
        style={BTN}
        disabled={busy || isLast}
        onClick={() => reorder('down')}
        title="Move down"
      >
        ↓
      </button>
      {!isDefault && (
        <button style={BTN} disabled={busy} onClick={() => patch({ is_default: true })}>
          Make default
        </button>
      )}
      <button style={BTN} disabled={busy} onClick={() => patch({ is_archived: true })}>
        Archive
      </button>
    </div>
  );
}
