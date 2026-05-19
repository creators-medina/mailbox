'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lead, Stage, StaffUser } from '@/lib/crm/types';
import TabOverview from './drawer/TabOverview';
import TabActivity from './drawer/TabActivity';
import TabNotes from './drawer/TabNotes';
import TabTasks from './drawer/TabTasks';
import TabRaw from './drawer/TabRaw';

type TabKey = 'overview' | 'activity' | 'notes' | 'tasks' | 'raw';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
  { key: 'notes', label: 'Notes' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'raw', label: 'Raw' },
];

type Props = {
  open: boolean;
  lead: Lead | null;
  stage: Stage | null;
  stages: Stage[];
  staff: StaffUser[];
  pipelineName: string;
  currentUserId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function LeadDrawer({
  open,
  lead,
  stage,
  stages,
  staff,
  pipelineName,
  currentUserId,
  onClose,
  onUpdated,
}: Props) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [busy, setBusy] = useState(false);
  // Bumped whenever the lead changes server-side so child tabs refetch.
  const [activityNonce, setActivityNonce] = useState(0);
  const bumpActivity = () => setActivityNonce((n) => n + 1);

  // Reset to Overview every time a different lead is opened.
  useEffect(() => {
    if (lead) setTab('overview');
  }, [lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Forward updates to the parent and signal child tabs to refetch.
  const handleUpdated = useMemo(
    () => () => {
      onUpdated();
      bumpActivity();
    },
    [onUpdated],
  );

  if (!lead) return null;

  const headerName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
    lead.email ||
    'Unnamed lead';

  async function archiveLead() {
    if (!confirm('Archive this lead? It will disappear from the board.')) return;
    setBusy(true);
    const res = await fetch(`/api/admin/crm/leads/${lead!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: true }),
    });
    setBusy(false);
    if (!res.ok) {
      alert('Could not archive.');
      return;
    }
    handleUpdated();
    onClose();
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 50,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 160ms ease',
        }}
      />
      <aside
        role="dialog"
        aria-label="Lead details"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: 'min(520px, 96vw)',
          background: 'var(--c-bg,#071B2D)',
          borderLeft: '1px solid var(--c-border,rgba(255,255,255,0.07))',
          color: '#fff',
          zIndex: 51,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: open ? '-24px 0 60px rgba(0,0,0,0.55)' : 'none',
        }}
      >
        <header
          style={{
            padding: '20px 20px 0',
            borderBottom: '1px solid var(--c-border,rgba(255,255,255,0.07))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  font: '700 18px/1.2 var(--font-display,sans-serif)',
                  marginBottom: 4,
                }}
              >
                {headerName}
              </div>
              <div
                style={{
                  font: '400 12px/1.4 var(--font-text,sans-serif)',
                  color: 'var(--c-text-3)',
                }}
              >
                {lead.source} · created {new Date(lead.created_at).toLocaleString()}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--c-text-2)',
                font: '400 22px/1 sans-serif',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ×
            </button>
          </div>

          <nav role="tablist" style={{ display: 'flex', gap: 4 }}>
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '10px 6px',
                    marginRight: 8,
                    cursor: 'pointer',
                    color: active ? '#fff' : 'var(--c-text-3)',
                    font: `${active ? '600' : '500'} 12px/1 var(--font-text,sans-serif)`,
                    borderBottom: `2px solid ${active ? 'var(--c-gold-2,#C99A5A)' : 'transparent'}`,
                    transition: 'color 120ms ease, border-color 120ms ease',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </header>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {tab === 'overview' && (
            <TabOverview
              lead={lead}
              stage={stage}
              stages={stages}
              staff={staff}
              busy={busy}
              setBusy={setBusy}
              onUpdated={handleUpdated}
              pipelineName={pipelineName}
            />
          )}
          {tab === 'activity' && (
            <TabActivity leadId={lead.id} staff={staff} refreshKey={activityNonce} />
          )}
          {tab === 'notes' && (
            <TabNotes
              leadId={lead.id}
              staff={staff}
              currentUserId={currentUserId}
              refreshKey={activityNonce}
              onActivityChange={bumpActivity}
            />
          )}
          {tab === 'tasks' && (
            <TabTasks
              leadId={lead.id}
              staff={staff}
              refreshKey={activityNonce}
              onActivityChange={bumpActivity}
            />
          )}
          {tab === 'raw' && <TabRaw lead={lead} />}
        </div>

        <footer
          style={{
            padding: 16,
            borderTop: '1px solid var(--c-border,rgba(255,255,255,0.07))',
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={archiveLead}
            disabled={busy || lead.archived}
            style={{
              font: '500 12px/1 var(--font-text,sans-serif)',
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid rgba(252,165,165,0.3)',
              background: 'transparent',
              color: '#fca5a5',
              cursor: busy ? 'default' : 'pointer',
              opacity: lead.archived ? 0.5 : 1,
            }}
          >
            {lead.archived ? 'Already archived' : 'Archive lead'}
          </button>
          <button
            onClick={onClose}
            style={{
              font: '500 12px/1 var(--font-text,sans-serif)',
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid var(--c-border,rgba(255,255,255,0.12))',
              background: 'transparent',
              color: 'var(--c-text-2)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </footer>
      </aside>
    </>
  );
}
