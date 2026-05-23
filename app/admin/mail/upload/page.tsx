import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import UploadForm from './UploadForm';

type CustomerOption = {
  id: string;
  suite_number: string | null;
  display: string;
};

export const dynamic = 'force-dynamic';

export default async function MailUploadPage({
  searchParams,
}: {
  searchParams: { customer_id?: string };
}) {
  const admin = createAdminClientAny();

  const { data } = await admin
    .from('customers')
    .select('id, suite_number, profiles(full_name, business_name)')
    .in('status', ['active', 'pending'])
    .order('suite_number');

  const customers: CustomerOption[] = ((data ?? []) as unknown as Array<{
    id: string;
    suite_number: string | null;
    profiles: { full_name: string | null; business_name: string | null } | null;
  }>).map(c => ({
    id: c.id,
    suite_number: c.suite_number,
    display: c.profiles?.business_name || c.profiles?.full_name || c.id,
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <a href="/admin/mail" style={{ font: '400 12px/1 var(--font-text,sans-serif)', color: 'var(--c-text-3)', textDecoration: 'none' }}>
          ← Mail queue
        </a>
        <h1 style={{ font: '700 24px/1.2 var(--font-display,sans-serif)', color: '#fff', margin: '8px 0 0' }}>
          Upload mail item
        </h1>
      </div>

      <div className="dash-card" style={{ maxWidth: 640 }}>
        <UploadForm customers={customers} defaultCustomerId={searchParams.customer_id} />
      </div>
    </div>
  );
}
