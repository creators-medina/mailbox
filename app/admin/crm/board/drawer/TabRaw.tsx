'use client';

import type { Lead } from '@/lib/crm/types';

export default function TabRaw({ lead }: { lead: Lead }) {
  const submission = lead.raw_submission as Record<string, unknown> | null;
  if (!submission) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '24px 8px',
          border: '1px dashed var(--c-border,rgba(255,255,255,0.1))',
          borderRadius: 8,
          color: 'var(--c-text-3)',
          font: '400 12px/1.5 var(--font-text,sans-serif)',
        }}
      >
        No raw submission payload. This lead was created manually.
      </div>
    );
  }
  return (
    <pre
      style={{
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        borderRadius: 6,
        padding: 12,
        font: '400 11px/1.5 ui-monospace, monospace',
        color: 'var(--c-text-2)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 0,
        overflowX: 'auto',
      }}
    >
      {JSON.stringify(submission, null, 2)}
    </pre>
  );
}
