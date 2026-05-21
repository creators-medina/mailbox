import 'server-only';
import { requireStaff } from '@/lib/auth/require-staff';
import { listTemplates } from '@/lib/crm/templates';
import TemplatesManager from './TemplatesManager';

export const dynamic = 'force-dynamic';

export default async function CrmTemplatesPage() {
  await requireStaff();
  const templates = await listTemplates();

  return (
    <div>
      <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: 0 }}>
        CRM Templates
      </h1>
      <p
        style={{
          font: '400 13px/1.5 var(--font-text,sans-serif)',
          color: 'var(--c-text-3)',
          margin: '6px 0 24px',
          maxWidth: 680,
        }}
      >
        Reusable email templates for the lead Messages tab. Use{' '}
        <code>{'{{first_name}}'}</code>, <code>{'{{full_name}}'}</code>,{' '}
        <code>{'{{company}}'}</code> and other variables — they resolve against
        the lead when you pick a template in the composer.
      </p>

      <TemplatesManager initialTemplates={templates} />
    </div>
  );
}
