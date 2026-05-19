'use client';

import { useEffect, useState } from 'react';
import type { Task, StaffUser, TaskPriority } from '@/lib/crm/types';
import { relativeTime } from '@/lib/crm/format';
import Avatar from '../Avatar';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: '#94A3B8',
  medium: '#3B82F6',
  high: '#F97316',
  urgent: '#EF4444',
};

type TaskDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  due_at: string; // datetime-local string
  assigned_to: string;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function taskToDraft(t: Task): TaskDraft {
  return {
    title: t.title,
    description: t.description ?? '',
    priority: t.priority,
    due_at: toLocalInput(t.due_at),
    assigned_to: t.assigned_to ?? '',
  };
}

export default function TabTasks({
  leadId,
  staff,
  refreshKey,
  onActivityChange,
  onFlash,
}: {
  leadId: string;
  staff: StaffUser[];
  refreshKey: number;
  onActivityChange: () => void;
  onFlash: (tone: 'ok' | 'err', text: string) => void;
}) {
  const [items, setItems] = useState<Task[] | null>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueAt, setDueAt] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function load() {
    setItems(null);
    setLoadErr(null);
    const res = await fetch(`/api/admin/crm/tasks?lead_id=${encodeURIComponent(leadId)}`);
    if (!res.ok) {
      setLoadErr('Failed to load tasks');
      return;
    }
    const data = (await res.json()) as { tasks: Task[] };
    setItems(data.tasks);
  }

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setLoadErr('Failed to load tasks');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, refreshKey]);

  async function create() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    const res = await fetch('/api/admin/crm/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: leadId,
        title: t,
        priority,
        due_at: fromLocalInput(dueAt),
        assigned_to: assignedTo || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      onFlash('err', data?.error || 'Could not create task.');
      return;
    }
    setTitle('');
    setDueAt('');
    setPriority('medium');
    setAssignedTo('');
    onFlash('ok', 'Task created.');
    await load();
    onActivityChange();
  }

  async function patch(id: string, body: Record<string, unknown>, okMsg?: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/crm/tasks/${id}`, {
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
    if (okMsg) onFlash('ok', okMsg);
    await load();
    if ('completed' in body && body.completed === true) onActivityChange();
    return true;
  }

  async function remove(id: string) {
    if (!confirm('Delete this task?')) return;
    setBusy(true);
    const res = await fetch(`/api/admin/crm/tasks/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      onFlash('err', 'Could not delete.');
      return;
    }
    onFlash('ok', 'Task deleted.');
    await load();
  }

  function move(id: string, direction: 'up' | 'down') {
    if (!items) return;
    const open = items.filter((t) => !t.completed_at);
    const idx = open.findIndex((t) => t.id === id);
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swap < 0 || swap >= open.length) return;
    const a = open[idx];
    const b = open[swap];
    void Promise.all([
      patch(a.id, { order_index: b.order_index }),
      patch(b.id, { order_index: a.order_index }),
    ]);
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setDraft(taskToDraft(t));
  }

  async function saveEdit() {
    if (!editingId || !draft) return;
    const ok = await patch(
      editingId,
      {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        priority: draft.priority,
        due_at: fromLocalInput(draft.due_at),
        assigned_to: draft.assigned_to || null,
      },
      'Task updated.',
    );
    if (ok) {
      setEditingId(null);
      setDraft(null);
    }
  }

  return (
    <div>
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <input
          className="admin-search-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to happen?"
          style={{ width: '100%', marginBottom: 8 }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <select
            className="admin-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            aria-label="Priority"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            type="datetime-local"
            className="admin-search-input"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            aria-label="Due"
          />
          <select
            className="admin-select"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            aria-label="Assign to"
          >
            <option value="">unassigned</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email || u.id}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={create}
            disabled={busy || !title.trim()}
            className="w-cta-pill filled"
            style={{ border: 'none', padding: '8px 16px', cursor: busy || !title.trim() ? 'default' : 'pointer' }}
          >
            {busy ? 'Saving…' : 'Add task'}
          </button>
        </div>
      </div>

      {loadErr && (
        <p role="alert" style={{ color: '#fca5a5', font: '400 12px/1.4 var(--font-text,sans-serif)', marginBottom: 12 }}>
          {loadErr}
        </p>
      )}

      {items === null ? (
        <SkeletonTasks />
      ) : items.length === 0 ? (
        <Empty body="No tasks yet. Add one above." />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((t) => {
            const open = items.filter((x) => !x.completed_at);
            const idxInOpen = open.findIndex((x) => x.id === t.id);
            const lastOpenIdx = open.length - 1;
            const assignee = staff.find((u) => u.id === t.assigned_to);
            const overdue = t.due_at && !t.completed_at && new Date(t.due_at) < new Date();
            const isEditing = editingId === t.id && draft;

            if (isEditing && draft) {
              return (
                <li
                  key={t.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
                    borderLeft: `3px solid ${PRIORITY_COLOR[draft.priority]}`,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <input
                    className="admin-search-input"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Title"
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                  <textarea
                    rows={2}
                    className="admin-search-input"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Description (optional)"
                    style={{ width: '100%', marginBottom: 8, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <select
                      className="admin-select"
                      value={draft.priority}
                      onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}
                      aria-label="Priority"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      className="admin-search-input"
                      value={draft.due_at}
                      onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
                      aria-label="Due"
                    />
                    <select
                      className="admin-select"
                      value={draft.assigned_to}
                      onChange={(e) => setDraft({ ...draft, assigned_to: e.target.value })}
                      aria-label="Assignee"
                    >
                      <option value="">unassigned</option>
                      {staff.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name || u.email || u.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={saveEdit}
                      disabled={busy || !draft.title.trim()}
                      className="w-cta-pill filled"
                      style={{ border: 'none', padding: '6px 14px', cursor: 'pointer' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setDraft(null);
                      }}
                      className="w-cta-pill outline"
                      style={{ padding: '6px 14px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
                  borderLeft: `3px solid ${PRIORITY_COLOR[t.priority]}`,
                  borderRadius: 8,
                  padding: 10,
                  opacity: t.completed_at ? 0.55 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!t.completed_at}
                  onChange={(e) => patch(t.id, { completed: e.target.checked }, e.target.checked ? 'Task completed.' : 'Task reopened.')}
                  aria-label="Complete task"
                  style={{ marginTop: 3, cursor: 'pointer' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      font: '500 13px/1.4 var(--font-text,sans-serif)',
                      color: '#fff',
                      textDecoration: t.completed_at ? 'line-through' : 'none',
                      wordBreak: 'break-word',
                    }}
                  >
                    {t.title}
                  </div>
                  {t.description && (
                    <div
                      style={{
                        font: '400 12px/1.4 var(--font-text,sans-serif)',
                        color: 'var(--c-text-2)',
                        marginTop: 2,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {t.description}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 4,
                      font: '400 11px/1 var(--font-text,sans-serif)',
                      color: 'var(--c-text-3)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        color: PRIORITY_COLOR[t.priority],
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        font: '600 10px/1 var(--font-text,sans-serif)',
                      }}
                    >
                      {t.priority}
                    </span>
                    {t.due_at && (
                      <span style={{ color: overdue ? '#fca5a5' : 'var(--c-text-3)' }}>
                        {overdue ? 'overdue ' : 'due '}
                        {new Date(t.due_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {assignee && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Avatar userId={assignee.id} name={assignee.full_name} email={assignee.email} size={16} />
                        {assignee.full_name || assignee.email}
                      </span>
                    )}
                    {t.completed_at ? <span>completed {relativeTime(t.completed_at)}</span> : null}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {!t.completed_at && (
                    <>
                      <button
                        onClick={() => move(t.id, 'up')}
                        disabled={idxInOpen <= 0}
                        style={iconBtn}
                        title="Move up"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(t.id, 'down')}
                        disabled={idxInOpen === -1 || idxInOpen === lastOpenIdx}
                        style={iconBtn}
                        title="Move down"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => startEdit(t)}
                    style={iconBtn}
                    title="Edit"
                    aria-label="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    style={{ ...iconBtn, color: '#fca5a5' }}
                    title="Delete"
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 4,
  border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
  background: 'transparent',
  color: 'var(--c-text-2)',
  cursor: 'pointer',
  font: '500 12px/1 sans-serif',
};

function SkeletonTasks() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
            borderRadius: 8,
            padding: 10,
            height: 56,
          }}
        />
      ))}
    </div>
  );
}

function Empty({ body }: { body: string }) {
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
      {body}
    </div>
  );
}
