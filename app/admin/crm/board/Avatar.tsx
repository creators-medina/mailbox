'use client';

import { hashColor, initials } from '@/lib/crm/format';

export default function Avatar({
  userId,
  name,
  email,
  size = 28,
  title,
}: {
  userId: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  title?: string;
}) {
  if (!userId) {
    return (
      <span
        title={title ?? 'Unassigned'}
        aria-label={title ?? 'Unassigned'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px dashed rgba(255,255,255,0.18)',
          color: 'var(--c-text-3)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: `600 ${Math.round(size * 0.4)}px/1 var(--font-display,sans-serif)`,
        }}
      >
        ?
      </span>
    );
  }

  const text = initials(name || email || null);
  return (
    <span
      title={title ?? name ?? email ?? 'Staff'}
      aria-label={title ?? name ?? email ?? 'Staff'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: hashColor(userId),
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `700 ${Math.round(size * 0.4)}px/1 var(--font-display,sans-serif)`,
        textShadow: '0 1px 1px rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}
    >
      {text}
    </span>
  );
}
