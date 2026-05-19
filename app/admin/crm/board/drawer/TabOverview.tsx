'use client';

import { useEffect, useState } from 'react';
import type { Lead, Stage, StaffUser } from '@/lib/crm/types';
import Avatar from '../Avatar';

const FIELD_LABEL: React.CSSProperties = {
  display: 'block',
  font: '500 11px/1.2 var(--font-text,sans-serif)',
  color: 'var(--c-text-3)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
};

const SECTION: React.CSSProperties = { marginBottom: 22 };

type ContactDraft = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
};

function leadToContact(lead: Lead): ContactDraft {
  return {
    first_name: lead.first_name ?? '',
    last_name: lead.last_name ?? '',
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    source: lead.source ?? '',
  };
}

export default function TabOverview({
  lead,
  stage,
  stages,
  staff,
  busy,
  setBusy,
  onUpdated,
  pipelineName,
  onFlash,
}: {
  lead: Lead;
  stage: Stage | null;
  stages: Stage[];
  staff: StaffUser[];
  busy: boolean;
  setBusy: (b: boolean) => void;
  onUpdated: () => void;
  pipelineName: string;
  onFlash: (tone: 'ok' | 'err', text: string) => void;
}) {
  const [contact, setContact] = useState<ContactDraft>(leadToContact(lead));
  const [notesDraft, setNotesDraft] = useState(lead.notes ?? '');
  const [tagsInput, setTagsInput] = useState(lead.tags.join(', '));

  // Reset drafts whenever a different lead is opened or the parent receives
  // an updated lead row from the server.
  useEffect(() => {
    setContact(leadToContact(lead));
    setNotesDraft(lead.notes ?? '');
    setTagsInput(lead.tags.join(', '));
  }, [lead.id, lead.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const contactDirty =
    contact.first_name !== (lead.first_name ?? '') ||
    contact.last_name !== (lead.last_name ?? '') ||
    contact.email !== (lead.email ?? '') ||
    contact.phone !== (lead.phone ?? '') ||
    contact.source !== (lead.source ?? '');

  const notesDirty = (notesDraft || '') !== (lead.notes ?? '');

  async function patch(body: Record<string, unknown>, ok: string) {
    if (busy) return false;
    setBusy(true);
    const res = await fetch(`/api/admin/crm/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      onFlash('err', data?.error || 'Action failed.');
      return false;
    }
    onFlash('ok', ok);
    onUpdated();
    return true;
  }

  async function move(stageId: string) {
    if (busy || stageId === lead.stage_id) return;
    setBusy(true);
    const res = await fetch(`/api/admin/crm/leads/${lead.id}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, ordered_lead_ids: [lead.id] }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      onFlash('err', data?.error || 'Could not move.');
      return;
    }
    onFlash('ok', 'Stage updated.');
    onUpdated();
  }

  function saveContact() {
    return patch(
      {
        first_name: contact.first_name.trim() || null,
        last_name: contact.last_name.trim() || null,
        email: contact.email.trim() || null,
        phone: contact.phone.trim() || null,
        source: contact.source.trim() || 'manual',
      },
      'Contact saved.',
    );
  }

  function saveNotes() {
    return patch({ notes: notesDraft.trim() || null }, 'Notes saved.');
  }

  function saveTags() {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    return patch({ tags }, 'Tags saved.');
  }

  const assignedUser = staff.find((u) => u.id === lead.assigned_to) ?? null;

  return (
    <div>
      <section style={SECTION}>
        <label style={FIELD_LABEL}>Pipeline / stage</label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            font: '500 13px/1 var(--font-text,sans-serif)',
            color: 'var(--c-text-2)',
          }}
        >
          {pipelineName}
        </div>
        <select
          className="admin-select"
          value={lead.stage_id}
          onChange={(e) => move(e.target.value)}
          disabled={busy}
          style={{ width: '100%' }}
          aria-label="Stage"
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
              color: 'var(--c-text-3)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} />
            Currently in {stage.name}
          </div>
        )}
      </section>

      <section style={SECTION}>
        <label style={FIELD_LABEL}>Assigned to</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            userId={assignedUser?.id ?? null}
            name={assignedUser?.full_name}
            email={assignedUser?.email}
            size={28}
          />
          <select
            className="admin-select"
            value={lead.assigned_to ?? ''}
            onChange={(e) => patch({ assigned_to: e.target.value || null }, 'Assignment saved.')}
            disabled={busy}
            style={{ flex: 1 }}
            aria-label="Assignee"
          >
            <option value="">— unassigned —</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email || u.id}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section style={SECTION}>
        <label style={FIELD_LABEL}>Contact</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="admin-search-input"
              value={contact.first_name}
              onChange={(e) => setContact({ ...contact, first_name: e.target.value })}
              placeholder="First name"
              aria-label="First name"
              style={{ flex: 1 }}
            />
            <input
              className="admin-search-input"
              value={contact.last_name}
              onChange={(e) => setContact({ ...contact, last_name: e.target.value })}
              placeholder="Last name"
              aria-label="Last name"
              style={{ flex: 1 }}
            />
          </div>
          <input
            type="email"
            className="admin-search-input"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            placeholder="Email"
            aria-label="Email"
          />
          <input
            type="tel"
            className="admin-search-input"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            placeholder="Phone"
            aria-label="Phone"
          />
          <input
            className="admin-search-input"
            value={contact.source}
            onChange={(e) => setContact({ ...contact, source: e.target.value })}
            placeholder="Source (e.g. contact_form, referral)"
            aria-label="Source"
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <button
              onClick={saveContact}
              disabled={busy || !contactDirty}
              className="w-cta-pill outline"
              style={{ cursor: busy || !contactDirty ? 'default' : 'pointer', padding: '6px 14px', opacity: contactDirty ? 1 : 0.5 }}
            >
              {busy ? 'Saving…' : 'Save contact'}
            </button>
            {contactDirty && (
              <button
                onClick={() => setContact(leadToContact(lead))}
                disabled={busy}
                style={inlineBtn}
              >
                Reset
              </button>
            )}
            <span
              style={{
                marginLeft: 'auto',
                font: '400 11px/1.4 var(--font-text,sans-serif)',
                color: 'var(--c-text-3)',
              }}
            >
              Status: {lead.status} · created {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      <section style={SECTION}>
        <label htmlFor="lead-tags" style={FIELD_LABEL}>Tags (comma-separated)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="lead-tags"
            className="admin-search-input"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. vip, follow-up"
            style={{ flex: 1 }}
          />
          <button
            onClick={saveTags}
            disabled={busy}
            className="w-cta-pill outline"
            style={{ cursor: busy ? 'default' : 'pointer', padding: '6px 14px' }}
          >
            Save
          </button>
        </div>
        {lead.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {lead.tags.map((t) => (
              <span
                key={t}
                style={{
                  font: '500 11px/1 var(--font-text,sans-serif)',
                  background: 'rgba(201,154,90,0.15)',
                  color: 'var(--c-gold-2,#C99A5A)',
                  padding: '4px 8px',
                  borderRadius: 999,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </section>

      <section style={SECTION}>
        <label htmlFor="lead-notes-summary" style={FIELD_LABEL}>Notes summary</label>
        <p
          style={{
            font: '400 11px/1.4 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
            margin: '0 0 6px',
          }}
        >
          One-paragraph summary that follows the lead everywhere. Use the
          Notes tab for threaded discussion.
        </p>
        <textarea
          id="lead-notes-summary"
          rows={3}
          className="admin-search-input"
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          style={{ width: '100%', resize: 'vertical', marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={saveNotes}
            disabled={busy || !notesDirty}
            className="w-cta-pill outline"
            style={{ cursor: busy || !notesDirty ? 'default' : 'pointer', padding: '6px 14px', opacity: notesDirty ? 1 : 0.5 }}
          >
            {busy ? 'Saving…' : 'Save summary'}
          </button>
          {notesDirty && (
            <button
              onClick={() => setNotesDraft(lead.notes ?? '')}
              disabled={busy}
              style={inlineBtn}
            >
              Reset
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

const inlineBtn: React.CSSProperties = {
  font: '500 11px/1 var(--font-text,sans-serif)',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
  background: 'transparent',
  color: 'var(--c-text-2,rgba(255,255,255,0.7))',
  cursor: 'pointer',
};
