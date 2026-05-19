import 'server-only';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/require-staff';
import { listPipelines } from '@/lib/crm/queries';
import NewPipelineForm from './NewPipelineForm';
import PipelineRowActions from './PipelineRowActions';

export const dynamic = 'force-dynamic';

export default async function CrmPipelinesPage() {
  await requireStaff();
  const pipelines = await listPipelines(true);

  const active = pipelines.filter((p) => !p.is_archived);
  const archived = pipelines.filter((p) => p.is_archived);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              font: '700 24px/1.2 var(--font-display,sans-serif)',
              color: '#fff',
              margin: 0,
            }}
          >
            CRM Pipelines
          </h1>
          <p
            style={{
              font: '400 13px/1.5 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)',
              margin: '6px 0 0',
              maxWidth: 640,
            }}
          >
            Pipelines and stages are stored in the database. Future CRM boards
            (leads, deals) will reference these by id, so changes here will
            flow through to every connected view.
          </p>
        </div>
      </div>

      <NewPipelineForm />

      <div className="dash-card" style={{ padding: 0, marginTop: 24, overflow: 'hidden' }}>
        {active.length === 0 ? (
          <p
            style={{
              padding: 24,
              font: '400 13px/1.5 var(--font-text,sans-serif)',
              color: 'var(--c-text-3)',
              margin: 0,
            }}
          >
            No active pipelines. Create one above to get started.
          </p>
        ) : (
          <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Order</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Default</th>
                <th style={{ width: 360 }}></th>
              </tr>
            </thead>
            <tbody>
              {active.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--c-text-3)' }}>{p.order_index}</td>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/admin/crm/pipelines/${p.id}`} className="admin-link">
                      {p.name}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--c-text-3)', fontSize: 12 }}>{p.slug}</td>
                  <td
                    style={{
                      color: 'var(--c-text-2)',
                      maxWidth: 360,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.description ?? '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {p.is_default ? (
                      <span
                        className="admin-status-badge admin-status-active"
                        style={{ fontSize: 11 }}
                      >
                        default
                      </span>
                    ) : (
                      <span style={{ color: 'var(--c-text-3)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <PipelineRowActions
                      pipelineId={p.id}
                      isDefault={p.is_default}
                      isFirst={i === 0}
                      isLast={i === active.length - 1}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {archived.length > 0 && (
        <>
          <h2
            style={{
              font: '600 14px/1.2 var(--font-display,sans-serif)',
              color: 'var(--c-text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '32px 0 12px',
            }}
          >
            Archived
          </h2>
          <div className="dash-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="admin-table" style={{ borderRadius: 0, border: 'none' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th style={{ width: 280 }}></th>
                </tr>
              </thead>
              <tbody>
                {archived.map((p) => (
                  <tr key={p.id} style={{ opacity: 0.6 }}>
                    <td>{p.name}</td>
                    <td style={{ color: 'var(--c-text-3)', fontSize: 12 }}>{p.slug}</td>
                    <td>
                      <PipelineRowActions
                        pipelineId={p.id}
                        isDefault={false}
                        isFirst
                        isLast
                        isArchived
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
