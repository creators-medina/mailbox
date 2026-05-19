'use client';

import { useEffect, useState } from 'react';
import type { Comment, StaffUser } from '@/lib/crm/types';
import { relativeTime, renderMarkdown } from '@/lib/crm/format';
import Avatar from '../Avatar';

export default function TabNotes({
  leadId,
  staff,
  currentUserId,
  refreshKey,
  onActivityChange,
}: {
  leadId: string;
  staff: StaffUser[];
  currentUserId: string | null;
  refreshKey: number;
  onActivityChange: () => void;
}) {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    fetch(`/api/admin/crm/comments?lead_id=${encodeURIComponent(leadId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load notes');
        const data = (await res.json()) as { comments: Comment[] };
        if (!cancelled) setItems(data.comments);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

  async function post() {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/crm/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, body: text }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || 'Could not post.');
      return;
    }
    const data = (await res.json()) as { comment: Comment };
    setItems((prev) => [data.comment, ...(prev ?? [])]);
    setDraft('');
    onActivityChange();
  }

  async function saveEdit() {
    if (!editingId || !editingText.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/crm/comments/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: editingText.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || 'Could not save.');
      return;
    }
    const data = (await res.json()) as { comment: Comment };
    setItems((prev) => (prev ?? []).map((c) => (c.id === data.comment.id ? data.comment : c)));
    setEditingId(null);
    setEditingText('');
  }

  async function removeComment(id: string) {
    if (!confirm('Delete this note?')) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/crm/comments/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || 'Could not delete.');
      return;
    }
    setItems((prev) => (prev ?? []).filter((c) => c.id !== id));
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
        <textarea
          rows={3}
          className="admin-search-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note… Markdown supported: **bold**, *italic*, `code`, links."
          style={{ width: '100%', resize: 'vertical', marginBottom: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
            {draft.length > 0 ? `${draft.length} chars` : ''}
          </span>
          <button
            onClick={post}
            disabled={busy || !draft.trim()}
            className="w-cta-pill filled"
            style={{ border: 'none', padding: '8px 16px', cursor: busy || !draft.trim() ? 'default' : 'pointer' }}
          >
            {busy ? 'Posting…' : 'Post note'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: '#fca5a5', font: '400 12px/1.4 var(--font-text,sans-serif)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      {items === null ? (
        <SkeletonNotes />
      ) : items.length === 0 ? (
        <Empty body="No notes yet. Drop the first one above." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((c) => {
            const author = staff.find((s) => s.id === c.user_id);
            const editable = c.user_id === currentUserId;
            const isEditing = editingId === c.id;
            return (
              <article
                key={c.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Avatar userId={c.user_id} name={author?.full_name} email={author?.email} size={24} />
                  <span style={{ font: '600 12px/1 var(--font-display,sans-serif)', color: '#fff' }}>
                    {author?.full_name || author?.email || 'unknown'}
                  </span>
                  <span style={{ font: '400 11px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
                    · {relativeTime(c.created_at)}
                    {c.updated_at !== c.created_at && ' · edited'}
                  </span>
                  {editable && !isEditing && (
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setEditingText(c.body);
                        }}
                        style={inlineBtn}
                      >
                        Edit
                      </button>
                      <button onClick={() => removeComment(c.id)} style={{ ...inlineBtn, color: '#fca5a5' }}>
                        Delete
                      </button>
                    </span>
                  )}
                </header>
                {isEditing ? (
                  <div>
                    <textarea
                      rows={3}
                      className="admin-search-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      style={{ width: '100%', resize: 'vertical', marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={saveEdit}
                        disabled={busy || !editingText.trim()}
                        className="w-cta-pill filled"
                        style={{ border: 'none', padding: '6px 12px', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingText('');
                        }}
                        className="w-cta-pill outline"
                        style={{ padding: '6px 12px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="crm-note-body"
                    style={{
                      font: '400 13px/1.6 var(--font-text,sans-serif)',
                      color: 'var(--c-text-2)',
                      wordBreak: 'break-word',
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body) }}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inlineBtn: React.CSSProperties = {
  font: '500 11px/1 var(--font-text,sans-serif)',
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
  background: 'transparent',
  color: 'var(--c-text-2)',
  cursor: 'pointer',
};

function SkeletonNotes() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div
            style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 8, width: '40%' }}
          />
          <div
            style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 4, width: '90%' }}
          />
          <div
            style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '70%' }}
          />
        </div>
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
