'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead, StaffUser } from '@/lib/crm/types';
import LeadCard from './LeadCard';

export default function SortableLeadCard({
  lead,
  stageColor,
  assignee,
  onOpen,
}: {
  lead: Lead;
  stageColor: string;
  assignee: StaffUser | null;
  onOpen: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} stageColor={stageColor} assignee={assignee} onOpen={onOpen} />
    </div>
  );
}
