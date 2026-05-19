'use client';

import { useRouter } from 'next/navigation';

type Option = { id: string; name: string; is_default: boolean };

export default function PipelineSwitcher({
  pipelines,
  activeId,
}: {
  pipelines: Option[];
  activeId: string;
}) {
  const router = useRouter();

  return (
    <select
      className="admin-select"
      value={activeId}
      onChange={(e) => {
        const id = e.target.value;
        router.push(`/admin/crm/board?p=${encodeURIComponent(id)}`);
      }}
      aria-label="Switch pipeline"
      style={{ minWidth: 200 }}
    >
      {pipelines.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}{p.is_default ? ' · default' : ''}
        </option>
      ))}
    </select>
  );
}
