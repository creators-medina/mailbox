'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MessageTemplate } from '@/lib/crm/types';
import { TEMPLATE_VARIABLES } from '@/lib/crm/template-vars';

type Draft = { name: string; subject: string; body: string };
const EMPTY: Draft = { name: '', subject: '', body: '' };

export default function TemplatesManager({
  initialTemplates,
}: {
  initialTemplates: MessageTemplate[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  function showFlash(tone: 'ok' | 'err', text: string) {
    setFlash({ tone, text });
    setTimeout(() => setFlash(null), 3000);
  }

  async function create() {
    if (!draft.name.trim() || !draft.body.trim() || busy) return;
    setBusy(true);
    const res = await fetch('/api/admin/crm/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name.trim(),
        subject: draft.subject.trim() || null,
        body: draft.body.trim(),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      showFlash('err', d?.error || 'Could not create.');
      return;
    }
    setDraft(EMPTY);
    setCreating(false);
    showFlash('ok', 'Template created.');
    router.refresh();
  }

  async function patch(id: string, body: Record<string, unknown>, ok: string) {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/admin/crm/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = (await res.json().catch(() => null)) as { error?: string } | null;
      showFlash('err', d?.error || 'Action failed.');
      return;
    }
    setEditingId(null);
    showFlash('ok', ok);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this template permanently?')) return;
    setBusy(true);
    const res = await fetch(`/api/admin/crm/templates/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      showFlash('err', 'Could not delete.');
      return;
    }
    showFlash('ok', 'Template deleted.');
    router.refresh();
  }

  return (
    <div>
      {flash && (
        <div
          role={flash.tone === 'err' ? 'alert' : 'status'}
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: flash.tone === 'err' ? 'rgba(252,165,165,0.12)' : 'rgba(16,185,129,0.12)',
            border: `1px solid ${flash.tone === 'err' ? 'rgba(252,165,165,0.3)' : 'rgba(16,185,129,0.3)'}`,
            color: flash.tone === 'err' ? '#fca5a5' : '#6ee7b7',
            font: '500 12px/1.4 var(--font-text,sans-serif)',
          }}
        >
          {flash.text}
        </div>
      )}

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-cta-pill filled"
            style={{ border: 'none', padding: '10px 18px', cursor: 'pointer' }}
          >
            + New template
          </button>
        ) : null}
        <span style={{ font: '400 11px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
          Variables: {TEMPLATE_VARIABLES.map((v) => `{{${v}}}`).join(' · ')}
        </span>
      </div>

      {creating && (
        <div className="dash-card" style={{ padding: 16, marginBottom: 20 }}>
          <TemplateForm draft={draft} setDraft={setDraft} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={create}
              disabled={busy || !draft.name.trim() || !draft.body.trim()}
              className="w-cta-pill filled"
              style={{ border: 'none', padding: '8px 16px', cursor: 'pointer' }}
            >
              {busy ? 'Saving…' : 'Create template'}
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setDraft(EMPTY);
              }}
              className="w-cta-pill outline"
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {initialTemplates.length === 0 ? (
        <div
          className="dash-card"
          style={{ padding: 32, textAlign: 'center', color: 'var(--c-text-3)' }}
        >
          No templates yet. Create one above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {initialTemplates.map((t) => {
            const editing = editingId === t.id;
            return (
              <div key={t.id} className="dash-card" style={{ padding: 16, opacity: t.is_active ? 1 : 0.6 }}>
                {editing ? (
                  <>
                    <TemplateForm draft={editDraft} setDraft={setEditDraft} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() =>
                          patch(
                            t.id,
                            {
                              name: editDraft.name.trim(),
                              subject: editDraft.subject.trim() || null,
                              body: editDraft.body.trim(),
                            },
                            'Template updated.',
                          )
                        }
                        disabled={busy || !editDraft.name.trim() || !editDraft.body.trim()}
                        className="w-cta-pill filled"
                        style={{ border: 'none', padding: '6px 14px', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="w-cta-pill outline"
                        style={{ padding: '6px 14px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ font: '600 14px/1.2 var(--font-display,sans-serif)', color: '#fff' }}>
                            {t.name}
                          </span>
                          {!t.is_active && (
                            <span
                              style={{
                                font: '500 10px/1 var(--font-text,sans-serif)',
                                background: 'rgba(255,255,255,0.08)',
                                color: 'var(--c-text-3)',
                                padding: '3px 7px',
                                borderRadius: 999,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              inactive
                            </span>
                          )}
                        </div>
                        {t.subject && (
                          <div style={{ font: '500 12px/1.4 var(--font-text,sans-serif)', color: 'var(--c-text-2)', marginTop: 6 }}>
                            {t.subject}
                          </div>
                        )}
                        <div
                          style={{
                            font: '400 12px/1.5 var(--font-text,sans-serif)',
                            color: 'var(--c-text-3)',
                            marginTop: 4,
                            whiteSpace: 'pre-wrap',
                            maxHeight: 80,
                            overflow: 'hidden',
                          }}
                        >
                          {t.body}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingId(t.id);
                            setEditDraft({ name: t.name, subject: t.subject ?? '', body: t.body });
                          }}
                          style={btn}
                        >
                          Edit
                        </button>
                        <button onClick={() => patch(t.id, { is_active: !t.is_active }, t.is_active ? 'Deactivated.' : 'Activated.')} style={btn}>
                          {t.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => remove(t.id)} style={{ ...btn, color: '#fca5a5', borderColor: 'rgba(252,165,165,0.3)' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TemplateForm({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        className="admin-search-input"
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="Template name (internal)"
        style={{ width: '100%' }}
      />
      <input
        className="admin-search-input"
        value={draft.subject}
        onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
        placeholder="Email subject (supports {{variables}})"
        style={{ width: '100%' }}
      />
      <textarea
        rows={7}
        className="admin-search-input"
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Email body. Use {{first_name}}, {{full_name}}, {{company}}, etc."
        style={{ width: '100%', resize: 'vertical' }}
      />
    </div>
  );
}

const btn: React.CSSProperties = {
  font: '500 12px/1 var(--font-text,sans-serif)',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
  background: 'transparent',
  color: 'var(--c-text-2,rgba(255,255,255,0.7))',
  cursor: 'pointer',
};
