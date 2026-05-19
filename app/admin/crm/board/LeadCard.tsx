'use client';

import type { Lead, StaffUser } from '@/lib/crm/types';
import { relativeTime } from '@/lib/crm/format';
import Avatar from './Avatar';

function fullName(lead: Lead): string {
  const parts = [lead.first_name, lead.last_name].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return lead.email || 'Unnamed lead';
}

export default function LeadCard({
  lead,
  stageColor,
  assignee,
  onOpen,
  dragging = false,
}: {
  lead: Lead;
  stageColor: string;
  assignee: StaffUser | null;
  onOpen?: (id: string) => void;
  dragging?: boolean;
}) {
  return (
    <button
      type="button"
      onPointerUp={(e) => {
        if (e.button === 0 && onOpen) onOpen(lead.id);
      }}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        borderLeft: `3px solid ${stageColor}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: dragging ? 'grabbing' : 'pointer',
        color: 'inherit',
        font: 'inherit',
        boxShadow: dragging ? '0 6px 18px rgba(0,0,0,0.45)' : 'none',
        transform: dragging ? 'rotate(1.5deg)' : undefined,
        opacity: lead.archived ? 0.55 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            font: '600 13px/1.3 var(--font-display,sans-serif)',
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {fullName(lead)}
        </div>
        <Avatar
          userId={assignee?.id ?? null}
          name={assignee?.full_name}
          email={assignee?.email}
          size={22}
          title={assignee ? `Assigned to ${assignee.full_name || assignee.email}` : 'Unassigned'}
        />
      </div>
      {lead.email && (
        <div
          style={{
            font: '400 11px/1.3 var(--font-text,sans-serif)',
            color: 'var(--c-text-2)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {lead.email}
        </div>
      )}
      {lead.phone && (
        <div
          style={{
            font: '400 11px/1.3 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
          }}
        >
          {lead.phone}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            font: '500 10px/1 var(--font-text,sans-serif)',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--c-text-2)',
            padding: '3px 7px',
            borderRadius: 999,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {lead.source}
        </span>
        {lead.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            style={{
              font: '500 10px/1 var(--font-text,sans-serif)',
              background: 'rgba(201,154,90,0.15)',
              color: 'var(--c-gold-2,#C99A5A)',
              padding: '3px 7px',
              borderRadius: 999,
            }}
          >
            {t}
          </span>
        ))}
        {lead.tags.length > 3 && (
          <span style={{ font: '500 10px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
            +{lead.tags.length - 3}
          </span>
        )}
        <span
          style={{
            marginLeft: 'auto',
            font: '400 10px/1 var(--font-text,sans-serif)',
            color: 'var(--c-text-3)',
          }}
        >
          {relativeTime(lead.created_at)}
        </span>
      </div>
    </button>
  );
}
