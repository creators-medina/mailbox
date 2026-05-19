'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Lead, Stage } from '@/lib/crm/types';
import SortableLeadCard from './SortableLeadCard';

export default function BoardColumn({
  stage,
  leads,
  onOpenLead,
}: {
  stage: Stage;
  leads: Lead[];
  onOpenLead: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      style={{
        flex: '0 0 300px',
        width: 300,
        background: 'var(--c-surface,#162032)',
        border: '1px solid var(--c-border,rgba(255,255,255,0.07))',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 170px)',
        position: 'sticky',
        top: 0,
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--c-border,rgba(255,255,255,0.07))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderTop: `3px solid ${stage.color}`,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: stage.color,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              font: '600 13px/1.2 var(--font-display,sans-serif)',
              color: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {stage.name}
          </div>
          {stage.is_closed && (
            <div
              style={{
                font: '500 10px/1 var(--font-text,sans-serif)',
                color: 'var(--c-text-3)',
                marginTop: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              closed · {stage.close_type ?? 'neither'}
            </div>
          )}
        </div>
        <span
          style={{
            font: '600 11px/1 var(--font-text,sans-serif)',
            background: 'rgba(255,255,255,0.08)',
            color: 'var(--c-text-2)',
            borderRadius: 999,
            padding: '4px 8px',
          }}
        >
          {leads.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        style={{
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
          flex: 1,
          background: isOver ? 'rgba(255,255,255,0.02)' : 'transparent',
          transition: 'background 120ms ease',
          minHeight: 80,
        }}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.length === 0 ? (
            <div
              style={{
                color: 'var(--c-text-3)',
                font: '400 12px/1.4 var(--font-text,sans-serif)',
                textAlign: 'center',
                padding: '24px 8px',
                border: '1px dashed var(--c-border,rgba(255,255,255,0.07))',
                borderRadius: 8,
              }}
            >
              Drop leads here.
            </div>
          ) : (
            leads.map((l) => (
              <SortableLeadCard key={l.id} lead={l} stageColor={stage.color} onOpen={onOpenLead} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
