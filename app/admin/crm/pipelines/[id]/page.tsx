import 'server-only';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth/require-staff';
import { getPipeline, listStages } from '@/lib/crm/queries';
import PipelineHeaderForm from './PipelineHeaderForm';
import NewStageForm from './NewStageForm';
import StageRow from './StageRow';

export const dynamic = 'force-dynamic';

export default async function PipelineDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const pipeline = await getPipeline(params.id);
  if (!pipeline) notFound();

  const stages = await listStages(params.id, true);
  const active = stages.filter((s) => !s.is_archived);
  const archived = stages.filter((s) => s.is_archived);

  return (
    <div>
      <Link
        href="/admin/crm/pipelines"
        className="admin-link"
        style={{ font: '500 12px/1 var(--font-text,sans-serif)' }}
      >
        ← All pipelines
      </Link>

      <h1
        style={{
          font: '700 24px/1.2 var(--font-display,sans-serif)',
          color: '#fff',
          margin: '12px 0 6px',
        }}
      >
        {pipeline.name}
        {pipeline.is_default && (
          <span
            className="admin-status-badge admin-status-active"
            style={{ fontSize: 11, marginLeft: 10, verticalAlign: 'middle' }}
          >
            default
          </span>
        )}
      </h1>
      <p
        style={{
          font: '400 13px/1.5 var(--font-text,sans-serif)',
          color: 'var(--c-text-3)',
          margin: '0 0 24px',
        }}
      >
        Slug: <code>{pipeline.slug}</code>
      </p>

      <PipelineHeaderForm
        pipelineId={pipeline.id}
        initialName={pipeline.name}
        initialDescription={pipeline.description ?? ''}
      />

      <h2
        style={{
          font: '600 14px/1.2 var(--font-display,sans-serif)',
          color: 'var(--c-text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '32px 0 12px',
        }}
      >
        Stages
      </h2>

      <NewStageForm pipelineId={pipeline.id} />

      <div className="dash-card" style={{ padding: 0, marginTop: 16, overflow: 'hidden' }}>
        {active.length === 0 ? (
          <p
            style={{
              padding: 24,
              font: '400 13px/1.5 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)',
              margin: 0,
            }}
          >
            No stages yet. Add one above.
          </p>
        ) : (
          <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Order</th>
                <th style={{ width: 70 }}>Color</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Closed</th>
                <th>Close type</th>
                <th style={{ width: 280 }}></th>
              </tr>
            </thead>
            <tbody>
              {active.map((s, i) => (
                <StageRow
                  key={s.id}
                  stage={s}
                  isFirst={i === 0}
                  isLast={i === active.length - 1}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {archived.length > 0 && (
        <>
          <h3
            style={{
              font: '600 13px/1.2 var(--font-display,sans-serif)',
              color: 'var(--c-text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '24px 0 8px',
            }}
          >
            Archived stages
          </h3>
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
              <thead>
                <tr>
                  <th style={{ width: 70 }}>Color</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th style={{ width: 240 }}></th>
                </tr>
              </thead>
              <tbody>
                {archived.map((s) => (
                  <StageRow key={s.id} stage={s} isFirst isLast />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
