export type ChecklistStatus = 'done' | 'pending';

export type ChecklistItem = {
  label: string;
  status: ChecklistStatus;
  note?: string;
};

function DoneIcon() {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8.5l3.5 3.5L13 4" />
      </svg>
    </span>
  );
}

function PendingIcon() {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(181,138,82,0.10)', border: '1px solid rgba(181,138,82,0.30)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--c-gold-2,#C99A5A)' }} />
    </span>
  );
}

export default function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const completed = items.filter(i => i.status === 'done').length;

  return (
    <div className="dash-card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <span className="dash-card-title" style={{ margin: 0 }}>Getting started</span>
        <span style={{ font: '500 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)' }}>
          {completed} of {items.length} complete
        </span>
      </div>
      <p style={{ font: '400 13px/1.6 var(--font-text,sans-serif)', color: 'var(--c-text-2)', margin: '0 0 18px' }}>
        A few quick steps to fully activate your business address and mail services.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '13px 0',
              borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--c-border,rgba(255,255,255,0.07))',
            }}
          >
            {item.status === 'done' ? <DoneIcon /> : <PendingIcon />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                font: '600 14px/1.4 var(--font-text,sans-serif)',
                color: item.status === 'done' ? 'rgba(255,255,255,0.88)' : '#fff',
              }}>
                {item.label}
              </div>
              {item.note && (
                <div style={{ font: '400 12px/1.5 var(--font-text,sans-serif)', color: 'var(--c-text-3)', marginTop: 2 }}>
                  {item.note}
                </div>
              )}
            </div>
            <span style={{
              flexShrink: 0,
              font: '600 11px/1 var(--font-text,sans-serif)', letterSpacing: '0.04em', textTransform: 'uppercase',
              color: item.status === 'done' ? '#4ade80' : 'var(--c-gold-2,#C99A5A)',
            }}>
              {item.status === 'done' ? 'Done' : 'Pending'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
