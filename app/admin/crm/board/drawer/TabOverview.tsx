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

export default function TabOverview({
  lead,
  stage,
  stages,
  staff,
  busy,
  setBusy,
  onUpdated,
  pipelineName,
}: {
  lead: Lead;
  stage: Stage | null;
  stages: Stage[];
  staff: StaffUser[];
  busy: boolean;
  setBusy: (b: boolean) => void;
  onUpdated: () => void;
  pipelineName: string;
}) {
  const [tagsInput, setTagsInput] = useState(lead.tags.join(', '));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTagsInput(lead.tags.join(', '));
  }, [lead.id, lead.tags]);

  async function patch(body: Record<string, unknown>) {
    if (busy) return;
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
      return;
    }
    onUpdated();
  }

  async function move(stageId: string) {
    if (busy || stageId === lead.stage_id) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/crm/leads/${lead.id}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, ordered_lead_ids: [lead.id] }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || 'Could not move.');
      return;
    }
    onUpdated();
  }

  function saveTags() {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    return patch({ tags });
  }

  const assignedUser = staff.find((u) => u.id === lead.assigned_to) ?? null;

  return (
    <div>
      <section style={SECTION}>
        <label style={FIELD_LABEL}>Pipeline / stage</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ font: '500 13px/1 var(--font-text,sans-serif)', color: 'var(--c-text-2)' }}>
            {pipelineName}
          </span>
        </div>
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
            onChange={(e) => patch({ assigned_to: e.target.value || null })}
            disabled={busy}
            style={{ flex: 1 }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Row label="Email" value={lead.email} />
          <Row label="Phone" value={lead.phone} />
          <Row label="Source" value={lead.source} />
          <Row label="Status" value={lead.status} />
          <Row label="Created" value={new Date(lead.created_at).toLocaleString()} />
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

      {error && (
        <p role="alert" style={{ color: '#fca5a5', font: '400 12px/1.4 var(--font-text,sans-serif)' }}>
          {error}
        </p>
      )}
    </div>
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
