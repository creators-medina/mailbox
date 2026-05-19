import 'server-only';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/require-staff';
import { listPipelines, listStages, getDefaultPipeline, getPipeline } from '@/lib/crm/queries';
import { listLeadsForPipeline } from '@/lib/crm/leads';
import { listStaffUsers } from '@/lib/crm/users';
import BoardClient from './BoardClient';
import type { Lead } from '@/lib/crm/types';

export const dynamic = 'force-dynamic';

type SP = {
  p?: string;
  q?: string;
  assigned?: string;
  tag?: string;
  source?: string;
  archived?: string;
};

export default async function BoardPage({ searchParams }: { searchParams: SP }) {
  const { user } = await requireStaff();

  const pipelines = (await listPipelines(false)).filter((p) => !p.is_archived);

  if (pipelines.length === 0) {
    return <EmptyBoard reason="no-pipelines" />;
  }

  const requestedId = searchParams.p;
  let active = requestedId ? await getPipeline(requestedId) : null;
  if (!active || active.is_archived) {
    active = (await getDefaultPipeline()) ?? pipelines[0];
  }

  const stages = (await listStages(active.id, false)).filter((s) => !s.is_archived);
  const includeArchived = searchParams.archived === '1';
  const allLeads = await listLeadsForPipeline(active.id, includeArchived);
  const staff = await listStaffUsers();

  const leads = applyFilters(allLeads, searchParams);

  return (
    <BoardClient
      pipelines={pipelines.map((p) => ({ id: p.id, name: p.name, is_default: p.is_default }))}
      activePipelineId={active.id}
      activePipelineName={active.name}
      stages={stages}
      leads={leads}
      totalUnfilteredCount={allLeads.length}
      staff={staff}
      currentUserId={user.id}
      filters={{
        q: searchParams.q ?? '',
        assigned: searchParams.assigned ?? '',
        tag: searchParams.tag ?? '',
        source: searchParams.source ?? '',
        archived: includeArchived,
      }}
    />
  );
}

function applyFilters(leads: Lead[], sp: SP): Lead[] {
  let out = leads;
  if (sp.q) {
    const q = sp.q.toLowerCase();
    out = out.filter((l) => {
      const fields = [
        l.first_name,
        l.last_name,
        l.email,
        l.phone,
        l.notes,
        l.source,
      ];
      return fields.some((f) => f?.toLowerCase().includes(q));
    });
  }
  if (sp.assigned) {
    if (sp.assigned === '__unassigned__') {
      out = out.filter((l) => !l.assigned_to);
    } else {
      out = out.filter((l) => l.assigned_to === sp.assigned);
    }
  }
  if (sp.tag) {
    const t = sp.tag.toLowerCase();
    out = out.filter((l) => l.tags.some((x) => x.toLowerCase() === t));
  }
  if (sp.source) {
    out = out.filter((l) => l.source === sp.source);
  }
  return out;
}

function EmptyBoard({ reason }: { reason: 'no-pipelines' }) {
  return (
    <div>
      <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
        CRM Board
      </h1>
      <div
        className="dash-card"
        style={{
          marginTop: 24,
          padding: 48,
          textAlign: 'center',
          color: 'var(--c-text-3)',
        }}
      >
        <p style={{ font: '500 16px/1.4 var(--font-display,sans-serif)', color: 'var(--c-text-2)', margin: '0 0 6px' }}>
          {reason === 'no-pipelines' ? 'No active pipelines yet.' : 'Nothing to show.'}
        </p>
        <p style={{ font: '400 13px/1.5 var(--font-text,sans-serif)', margin: '0 0 16px' }}>
          Create a pipeline first — the board reads stages from there.
        </p>
        <Link href="/admin/crm/pipelines" className="w-cta-pill filled" style={{ display: 'inline-block', padding: '10px 18px' }}>
          Manage pipelines →
        </Link>
      </div>
    </div>
  );
}
