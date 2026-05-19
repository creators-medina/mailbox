'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Lead, Stage } from '@/lib/crm/types';
import PipelineSwitcher from './PipelineSwitcher';
import BoardColumn from './BoardColumn';
import LeadCard from './LeadCard';
import LeadDrawer from './LeadDrawer';

type PipelineOption = { id: string; name: string; is_default: boolean };

type Props = {
  pipelines: PipelineOption[];
  activePipelineId: string;
  activePipelineName: string;
  stages: Stage[];
  leads: Lead[];
};

export default function BoardClient({
  pipelines,
  activePipelineId,
  activePipelineName,
  stages,
  leads: initialLeads,
}: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Group leads by stage id. Stages with no leads still render via the
  // stages array — this map only holds the ordered cards.
  const byStage = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const s of stages) map.set(s.id, []);
    const sorted = [...leads].sort((a, b) => {
      if (a.order_index !== b.order_index) return a.order_index - b.order_index;
      return a.created_at.localeCompare(b.created_at);
    });
    for (const l of sorted) {
      if (!map.has(l.stage_id)) continue;
      map.get(l.stage_id)!.push(l);
    }
    return map;
  }, [stages, leads]);

  const activeLead = activeDragId
    ? leads.find((l) => l.id === activeDragId) ?? null
    : null;
  const openLead = openLeadId ? leads.find((l) => l.id === openLeadId) ?? null : null;
  const openLeadStage = openLead ? stages.find((s) => s.id === openLead.stage_id) ?? null : null;

  function findContainer(id: string): string | null {
    if (stages.some((s) => s.id === id)) return id;
    const lead = leads.find((l) => l.id === id);
    return lead?.stage_id ?? null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveDragId(String(e.active.id));
  }

  // While dragging across columns, update local state immediately so the
  // card visually moves before drop. Persistence happens on drag end.
  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const from = findContainer(activeId);
    const to = findContainer(overId);
    if (!from || !to || from === to) return;

    setLeads((prev) => {
      const moving = prev.find((l) => l.id === activeId);
      if (!moving) return prev;

      // Place at the position of the hovered card, or end of column if hovered
      // on the empty column area.
      const next = prev.map((l) => (l.id === activeId ? { ...l, stage_id: to } : l));

      const inDest = next
        .filter((l) => l.stage_id === to && l.id !== activeId)
        .sort((a, b) => a.order_index - b.order_index);

      const overLead = next.find((l) => l.id === overId);
      let insertAt: number;
      if (!overLead || overLead.stage_id !== to) {
        insertAt = inDest.length;
      } else {
        insertAt = inDest.findIndex((l) => l.id === overId);
        if (insertAt < 0) insertAt = inDest.length;
      }

      const reordered = [...inDest.slice(0, insertAt), moving, ...inDest.slice(insertAt)];
      reordered.forEach((l, i) => {
        const target = next.find((n) => n.id === l.id);
        if (target) target.order_index = i;
      });

      return next;
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveDragId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromStageBefore = initialLeads.find((l) => l.id === activeId)?.stage_id;
    const toStage = findContainer(overId);
    if (!toStage) return;

    // Reorder within destination column based on current local state.
    setLeads((prev) => {
      const dest = prev
        .filter((l) => l.stage_id === toStage)
        .sort((a, b) => a.order_index - b.order_index)
        .map((l) => l.id);

      // If active is hovering directly over another card, place it there.
      const overLead = prev.find((l) => l.id === overId);
      const orderedIds = dest.includes(activeId)
        ? dest
        : [...dest, activeId];

      // If we're hovering on a specific card in the same column and the
      // local state hasn't placed `active` adjacent to it yet, swap.
      if (overLead && overLead.id !== activeId && overLead.stage_id === toStage) {
        const a = orderedIds.indexOf(activeId);
        const b = orderedIds.indexOf(overId);
        if (a !== -1 && b !== -1 && a !== b) {
          orderedIds.splice(a, 1);
          orderedIds.splice(b, 0, activeId);
        }
      }

      // Persist server-side. Failure rolls back via router.refresh().
      void persistMove(activeId, toStage, orderedIds);

      // Renumber locally to match what the server will write.
      return prev.map((l) =>
        l.stage_id === toStage
          ? { ...l, order_index: orderedIds.indexOf(l.id) }
          : l,
      );
    });

    // Avoid an unused-var warning when the source equals destination.
    void fromStageBefore;
  }

  async function persistMove(leadId: string, stageId: string, orderedIds: string[]) {
    const res = await fetch(`/api/admin/crm/leads/${leadId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId, ordered_lead_ids: orderedIds }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(data?.error || 'Could not save move.');
      router.refresh();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
            CRM Board
          </h1>
          <p
            style={{
              font: '400 13px/1.5 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)',
              margin: '4px 0 0',
            }}
          >
            {activePipelineName} · {stages.length} stages · {leads.length} leads
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <PipelineSwitcher pipelines={pipelines} activeId={activePipelineId} />
        </div>
      </div>

      {stages.length === 0 ? (
        <div
          className="dash-card"
          style={{ padding: 48, textAlign: 'center', color: 'var(--c-text-3)' }}
        >
          <p style={{ font: '500 16px/1.4 var(--font-display,sans-serif)', color: 'var(--c-text-2)', margin: '0 0 6px' }}>
            This pipeline has no active stages.
          </p>
          <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', margin: 0 }}>
            Add some on the pipeline edit page to start using the board.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <div
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              alignItems: 'flex-start',
              paddingBottom: 8,
              flex: 1,
            }}
          >
            {stages.map((stage) => (
              <BoardColumn
                key={stage.id}
                stage={stage}
                leads={byStage.get(stage.id) ?? []}
                onOpenLead={setOpenLeadId}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? (
              <LeadCard lead={activeLead} stageColor={stageColorFor(stages, activeLead.stage_id)} dragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <LeadDrawer
        open={!!openLead}
        lead={openLead}
        stage={openLeadStage}
        stages={stages}
        onClose={() => setOpenLeadId(null)}
        onUpdated={() => router.refresh()}
      />
    </div>
  );
}

function stageColorFor(stages: Stage[], stageId: string): string {
  return stages.find((s) => s.id === stageId)?.color ?? '#6B7280';
}
