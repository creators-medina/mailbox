'use client';

import { useEffect, useState } from 'react';
import type { Lead, Stage } from '@/lib/crm/types';

type Props = {
  open: boolean;
  lead: Lead | null;
  stage: Stage | null;
  stages: Stage[];
  onClose: () => void;
  onUpdated: () => void;
};

const FIELD_LABEL: React.CSSProperties = {
  display: 'block',
  font: '500 11px/1.2 var(--font-text,sans-serif)',
  color: 'var(--c-text-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
};

export default function LeadDrawer({ open, lead, stage, stages, onClose, onUpdated }: Props) {
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes ?? '');
      setTagsInput(lead.tags.join(', '));
      setError(null);
    }
  }, [lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!lead) return null;

  async function patch(body: Record<string, unknown>) {
    if (!lead || busy) return false;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/crm/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || 'Action failed.');
      return false;
    }
    onUpdated();
    return true;
  }

  async function move(stageId: string) {
    if (!lead || busy || stageId === lead.stage_id) return;
    setBusy(true);
    setError(null);
    // Move to end of destination by sending [...existing, leadId].
    const ordered = [stageId];
    const res = await fetch(`/api/admin/crm/leads/${lead.id}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, ordered_lead_ids: ordered }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || 'Could not move.');
      return;
    }
    onUpdated();
  }

  function saveNotes() {
    return patch({ notes: notes.trim() || null });
  }

  function saveTags() {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return patch({ tags });
  }

  function archive() {
    if (!confirm('Archive this lead? It will disappear from the board.')) return;
    patch({ archived: true }).then((ok) => {
      if (ok) onClose();
    });
  }

  const submission = lead.raw_submission as Record<string, unknown> | null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 50,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 160ms ease',
        }}
      />
      <aside
        role="dialog"
        aria-label="Lead details"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: 'min(460px, 96vw)',
          background: 'var(--c-bg,#071B2D)',
          borderLeft: '1px solid var(--c-border,rgba(255,255,255,0.07))',
          color: '#fff',
          zIndex: 51,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: open ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <header
          style={{
            padding: 20,
            borderBottom: '1px solid var(--c-border,rgba(255,255,255,0.07))',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                font: '700 18px/1.2 var(--font-display,sans-serif)',
                marginBottom: 4,
              }}
            >
              {[lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
                lead.email ||
                'Unnamed lead'}
            </div>
            <div
              style={{
                font: '400 12px/1.4 var(--font-text,sans-serif)',
                color: 'var(--c-text-3)',
              }}
            >
              {lead.source} · created {new Date(lead.created_at).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-2)',
              font: '400 22px/1 sans-serif',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ×
          </button>
        </header>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <section style={{ marginBottom: 20 }}>
            <label style={FIELD_LABEL}>Stage</label>
            <select
              className="admin-select"
              value={lead.stage_id}
              onChange={(e) => move(e.target.value)}
              disabled={busy}
              style={{ width: '100%' }}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.is_closed ? ` · ${s.close_type ?? 'closed'}` : ''}
                </option>
              ))}
            </select>
            {stage && (
              <div
                style={{
                  marginTop: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  font: '400 12px/1 var(--font-text,sans-serif)',
                  color: 'var(--c-text-2)',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} />
                Currently in {stage.name}
              </div>
            )}
          </section>

          <section style={{ marginBottom: 20 }}>
            <label style={FIELD_LABEL}>Contact</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Row label="Email" value={lead.email} />
              <Row label="Phone" value={lead.phone} />
            </div>
          </section>

          <section style={{ marginBottom: 20 }}>
            <label htmlFor="lead-tags" style={FIELD_LABEL}>
              Tags (comma-separated)
            </label>
            <input
              id="lead-tags"
              className="admin-search-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. vip, follow-up, mailing-list"
              style={{ width: '100%', marginBottom: 8 }}
            />
            <button
              onClick={saveTags}
              disabled={busy}
              className="w-cta-pill outline"
              style={{ cursor: busy ? 'default' : 'pointer', padding: '6px 14px' }}
            >
              Save tags
            </button>
          </section>

          <section style={{ marginBottom: 20 }}>
            <label htmlFor="lead-notes" style={FIELD_LABEL}>
              Notes
            </label>
            <textarea
              id="lead-notes"
              rows={5}
              className="admin-search-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', resize: 'vertical', marginBottom: 8 }}
            />
            <button
              onClick={saveNotes}
              disabled={busy}
              className="w-cta-pill outline"
              style={{ cursor: busy ? 'default' : 'pointer', padding: '6px 14px' }}
            >
              Save notes
            </button>
          </section>

          {submission && (
            <section style={{ marginBottom: 20 }}>
              <label style={FIELD_LABEL}>Raw submission</label>
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
                  maxHeight: 220,
                  overflowY: 'auto',
                  margin: 0,
                }}
              >
                {JSON.stringify(submission, null, 2)}
              </pre>
            </section>
          )}

          {error && (
            <p role="alert" style={{ color: '#fca5a5', font: '400 12px/1.4 var(--font-text,sans-serif)', marginTop: 12 }}>
              {error}
            </p>
          )}
        </div>

        <footer
          style={{
            padding: 16,
            borderTop: '1px solid var(--c-border,rgba(255,255,255,0.07))',
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={archive}
            disabled={busy}
            style={{
              font: '500 12px/1 var(--font-text,sans-serif)',
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid rgba(252,165,165,0.3)',
              background: 'transparent',
              color: '#fca5a5',
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            Archive lead
          </button>
          <button
            onClick={onClose}
            style={{
              font: '500 12px/1 var(--font-text,sans-serif)',
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
              background: 'transparent',
              color: 'var(--c-text-2)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </footer>
      </aside>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        font: '400 13px/1.4 var(--font-text,sans-serif)',
      }}
    >
      <span style={{ color: 'var(--c-text-3)' }}>{label}</span>
      <span style={{ color: 'var(--c-text-2)', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}
