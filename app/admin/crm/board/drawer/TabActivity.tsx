'use client';

import { useEffect, useState } from 'react';
import type { Activity, StaffUser } from '@/lib/crm/types';
import { relativeTime, initials, hashColor } from '@/lib/crm/format';
import Avatar from '../Avatar';

// Visual mapping for known activity types. Unknown types fall through to
// a neutral default — the table never enforces a closed enum so new
// kinds work without code changes.
const TYPE_ICON: Record<string, string> = {
  lead_created: '✨',
  stage_changed: '→',
  note_added: '✎',
  tag_added: '+',
  tag_removed: '–',
  email_sent: '✉',
  sms_sent: '✉',
  call_logged: '☎',
  task_created: '◻',
  task_completed: '✓',
  lead_archived: '⌫',
  lead_restored: '↺',
  assignment_changed: '◉',
  comment_added: '💬',
};

const TYPE_TONE: Record<string, string> = {
  stage_changed: '#3B82F6',
  tag_added: '#10B981',
  tag_removed: '#94A3B8',
  task_completed: '#10B981',
  lead_archived: '#94A3B8',
  lead_restored: '#10B981',
  assignment_changed: '#8B5CF6',
  comment_added: '#C99A5A',
};

export default function TabActivity({
  leadId,
  staff,
  refreshKey,
}: {
  leadId: string;
  staff: StaffUser[];
  refreshKey: number;
}) {
  const [items, setItems] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    fetch(`/api/admin/crm/leads/${leadId}/activities`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load activity');
        const data = (await res.json()) as { activities: Activity[] };
        if (!cancelled) setItems(data.activities);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

  if (error) {
    return <p style={{ color: '#fca5a5', font: '400 12px/1.4 var(--font-text,sans-serif)' }}>{error}</p>;
  }
  if (items === null) {
    return <SkeletonList />;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        body="As you move this lead through stages, log notes, or send messages, events will appear here."
      />
    );
  }

  return (
    <ol
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {items.map((a, i) => (
        <ActivityItem
          key={a.id}
          a={a}
          actorName={a.created_by ? staff.find((s) => s.id === a.created_by)?.full_name ?? null : null}
          actorEmail={a.created_by ? staff.find((s) => s.id === a.created_by)?.email ?? null : null}
          isLast={i === items.length - 1}
        />
      ))}
    </ol>
  );
}

function ActivityItem({
  a,
  actorName,
  actorEmail,
  isLast,
}: {
  a: Activity;
  actorName: string | null;
  actorEmail: string | null;
  isLast: boolean;
}) {
  const icon = TYPE_ICON[a.type] ?? '•';
  const tone = TYPE_TONE[a.type] ?? 'rgba(255,255,255,0.18)';
  return (
    <li style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <span
          aria-hidden
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'var(--c-surface,#162032)',
            border: `1px solid ${tone}`,
            color: tone,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: '600 12px/1 var(--font-display,sans-serif)',
          }}
        >
          {icon}
        </span>
        {!isLast && (
          <span
            aria-hidden
            style={{
              width: 1,
              flex: 1,
              background: 'var(--c-border,rgba(255,255,255,0.07))',
              marginTop: 4,
              minHeight: 16,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <div
          style={{
            font: '500 13px/1.3 var(--font-text,sans-serif)',
            color: '#fff',
            marginBottom: 2,
          }}
        >
          {a.title}
        </div>
        {a.description && (
          <div
            style={{
              font: '400 12px/1.4 var(--font-text,sans-serif)',
              color: 'var(--c-text-2)',
              marginBottom: 4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {a.description}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            font: '400 11px/1 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
          }}
        >
          {a.created_by ? (
            <>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: hashColor(a.created_by),
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: '700 8px/1 var(--font-display,sans-serif)',
                }}
              >
                {initials(actorName || actorEmail || '')}
              </span>
              <span>{actorName || actorEmail || 'staff'}</span>
              <span>·</span>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--c-text-3)' }}>system</span>
              <span>·</span>
            </>
          )}
          <span title={new Date(a.created_at).toLocaleString()}>
            {relativeTime(a.created_at)}
          </span>
        </div>
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 12 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: 12,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 4,
                marginBottom: 6,
                width: '60%',
              }}
            />
            <div
              style={{
                height: 10,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 4,
                width: '30%',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '24px 8px',
        border: '1px dashed var(--c-border,rgba(255,255,255,0.1))',
        borderRadius: 8,
        color: 'var(--c-text-3)',
      }}
    >
      <p style={{ font: '500 13px/1.3 var(--font-display,sans-serif)', color: 'var(--c-text-2)', margin: '0 0 4px' }}>
        {title}
      </p>
      <p style={{ font: '400 12px/1.5 var(--font-text,sans-serif)', margin: 0 }}>{body}</p>
    </div>
  );
}

// Avatar is used in the avatars row up above through hashColor + initials
// inline. The Avatar component is imported for consistency in other tabs.
export { Avatar };
