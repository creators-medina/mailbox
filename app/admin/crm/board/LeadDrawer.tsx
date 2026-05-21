'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lead, Stage, StaffUser } from '@/lib/crm/types';
import TabOverview from './drawer/TabOverview';
import TabActivity from './drawer/TabActivity';
import TabNotes from './drawer/TabNotes';
import TabTasks from './drawer/TabTasks';
import TabMessages from './drawer/TabMessages';
import TabRaw from './drawer/TabRaw';

type TabKey = 'overview' | 'activity' | 'messages' | 'notes' | 'tasks' | 'raw';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'activity', label: 'Activity' },
  { key: 'messages', label: 'Messages' },
  { key: 'notes', label: 'Notes' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'raw', label: 'Raw' },
];

type Flash = { tone: 'ok' | 'err'; text: string } | null;

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
  const [activityNonce, setActivityNonce] = useState(0);
  const bumpActivity = () => setActivityNonce((n) => n + 1);
  const [flash, setFlash] = useState<Flash>(null);

  // Auto-dismiss flash messages after 3.5s.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(t);
  }, [flash]);

  // Reset to Overview every time a different lead is opened.
  useEffect(() => {
    if (lead) {
      setTab('overview');
      setFlash(null);
    }
  }, [lead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: Esc to close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleUpdated = useMemo(
    () => () => {
      onUpdated();
      bumpActivity();
    },
    [onUpdated],
  );

  const showFlash = (tone: 'ok' | 'err', text: string) => setFlash({ tone, text });

  if (!lead) return null;

  const headerName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
    lead.email ||
    'Unnamed lead';

  async function toggleArchive() {
    const restoring = lead!.archived;
    if (!restoring) {
      if (!confirm('Archive this lead? It will disappear from the board.')) return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/crm/leads/${lead!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !restoring }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      showFlash('err', data?.error || `Could not ${restoring ? 'restore' : 'archive'} lead.`);
      return;
    }
    handleUpdated();
    showFlash('ok', restoring ? 'Lead restored.' : 'Lead archived.');
    if (!restoring) onClose();
  }

  return (
    <>
      <style jsx global>{`
        @media (max-width: 640px) {
          .crm-drawer {
            width: 100vw !important;
            border-left: none !important;
          }
        }
      `}</style>
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
        className="crm-drawer"
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
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  font: '700 18px/1.2 var(--font-display,sans-serif)',
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {headerName}
                {lead.archived && (
                  <span
                    style={{
                      marginLeft: 8,
                      font: '500 10px/1 var(--font-text,sans-serif)',
                      background: 'rgba(252,165,165,0.15)',
                      color: '#fca5a5',
                      padding: '3px 7px',
                      borderRadius: 999,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      verticalAlign: 'middle',
                    }}
                  >
                    archived
                  </span>
                )}
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

          <nav
            role="tablist"
            style={{
              display: 'flex',
              gap: 4,
              overflowX: 'auto',
              scrollbarWidth: 'thin',
            }}
          >
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  style={{
                    flexShrink: 0,
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

        {flash && (
          <div
            role={flash.tone === 'err' ? 'alert' : 'status'}
            style={{
              padding: '10px 16px',
              background:
                flash.tone === 'err'
                  ? 'rgba(252,165,165,0.12)'
                  : 'rgba(16,185,129,0.12)',
              borderBottom: `1px solid ${
                flash.tone === 'err' ? 'rgba(252,165,165,0.3)' : 'rgba(16,185,129,0.3)'
              }`,
              color: flash.tone === 'err' ? '#fca5a5' : '#6ee7b7',
              font: '500 12px/1.4 var(--font-text,sans-serif)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span aria-hidden style={{ flexShrink: 0 }}>{flash.tone === 'err' ? '⚠' : '✓'}</span>
            <span style={{ flex: 1 }}>{flash.text}</span>
            <button
              onClick={() => setFlash(null)}
              aria-label="Dismiss"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                opacity: 0.6,
                cursor: 'pointer',
                font: '400 14px/1 sans-serif',
              }}
            >
              ×
            </button>
          </div>
        )}

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
              onFlash={showFlash}
            />
          )}
          {tab === 'activity' && (
            <TabActivity leadId={lead.id} staff={staff} refreshKey={activityNonce} />
          )}
          {tab === 'messages' && (
            <TabMessages
              lead={lead}
              staff={staff}
              refreshKey={activityNonce}
              onActivityChange={bumpActivity}
              onFlash={showFlash}
            />
          )}
          {tab === 'notes' && (
            <TabNotes
              leadId={lead.id}
              staff={staff}
              currentUserId={currentUserId}
              refreshKey={activityNonce}
              onActivityChange={bumpActivity}
              onFlash={showFlash}
            />
          )}
          {tab === 'tasks' && (
            <TabTasks
              leadId={lead.id}
              staff={staff}
              refreshKey={activityNonce}
              onActivityChange={bumpActivity}
              onFlash={showFlash}
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
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={toggleArchive}
            disabled={busy}
            style={{
              font: '500 12px/1 var(--font-text,sans-serif)',
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${lead.archived ? 'rgba(110,231,183,0.35)' : 'rgba(252,165,165,0.3)'}`,
              background: 'transparent',
              color: lead.archived ? '#6ee7b7' : '#fca5a5',
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy
              ? lead.archived
                ? 'Restoring…'
                : 'Archiving…'
              : lead.archived
              ? 'Restore lead'
              : 'Archive lead'}
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
