'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Lead, StaffUser } from '@/lib/crm/types';

export default function BoardFilters({
  staff,
  leads,
  pipelineId,
  filters,
}: {
  staff: StaffUser[];
  leads: Lead[];
  pipelineId: string;
  filters: {
    q: string;
    assigned: string;
    tag: string;
    source: string;
    archived: boolean;
  };
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(filters.q);

  // Distinct tag/source options from the leads currently on this pipeline.
  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [leads]);
  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.source));
    return Array.from(set).sort();
  }, [leads]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    next.set('p', pipelineId);
    router.push(`/admin/crm/board?${next.toString()}`);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setParam('q', q.trim() || null);
  }

  function clearAll() {
    router.push(`/admin/crm/board?p=${encodeURIComponent(pipelineId)}`);
  }

  const activeCount =
    (filters.q ? 1 : 0) +
    (filters.assigned ? 1 : 0) +
    (filters.tag ? 1 : 0) +
    (filters.source ? 1 : 0) +
    (filters.archived ? 1 : 0);

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        borderRadius: 8,
        padding: 8,
        marginBottom: 16,
      }}
    >
      <form onSubmit={submitSearch} style={{ flex: '1 1 220px', minWidth: 200 }}>
        <input
          className="admin-search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone, notes…"
          style={{ width: '100%' }}
        />
      </form>

      <select
        className="admin-select"
        value={filters.assigned}
        onChange={(e) => setParam('assigned', e.target.value)}
        aria-label="Filter by assignee"
      >
        <option value="">All assignees</option>
        <option value="__unassigned__">— Unassigned —</option>
        {staff.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name || u.email || u.id}
          </option>
        ))}
      </select>

      <select
        className="admin-select"
        value={filters.tag}
        onChange={(e) => setParam('tag', e.target.value)}
        aria-label="Filter by tag"
      >
        <option value="">All tags</option>
        {tagOptions.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <select
        className="admin-select"
        value={filters.source}
        onChange={(e) => setParam('source', e.target.value)}
        aria-label="Filter by source"
      >
        <option value="">All sources</option>
        {sourceOptions.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          font: '400 12px/1 var(--font-text,sans-serif)',
          color: 'var(--c-text-2)',
          paddingLeft: 4,
        }}
      >
        <input
          type="checkbox"
          checked={filters.archived}
          onChange={(e) => setParam('archived', e.target.checked ? '1' : null)}
        />
        Include archived
      </label>

      {activeCount > 0 && (
        <button
          onClick={clearAll}
          style={{
            font: '500 12px/1 var(--font-text,sans-serif)',
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
            background: 'transparent',
            color: 'var(--c-text-2)',
            cursor: 'pointer',
          }}
        >
          Clear ({activeCount})
        </button>
      )}
    </div>
  );
}
