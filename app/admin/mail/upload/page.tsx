import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import UploadForm from './UploadForm';

type CustomerOption = {
  id: string;
  suite_number: string | null;
  display: string;
  complianceVerified: boolean;
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

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    suite_number: string | null;
    profiles: { full_name: string | null; business_name: string | null } | null;
  }>;

  // Compliance lookup for the listed customers (verified = both items verified).
  const { data: compData } = await admin
    .from('customer_compliance')
    .select('customer_id, form_1583_status, photo_id_status')
    .in('customer_id', rows.map(r => r.id).length ? rows.map(r => r.id) : ['00000000-0000-0000-0000-000000000000']);

  const verifiedSet = new Set(
    ((compData ?? []) as Array<{ customer_id: string; form_1583_status: string; photo_id_status: string }>)
      .filter(c => c.form_1583_status === 'verified' && c.photo_id_status === 'verified')
      .map(c => c.customer_id)
  );

  const customers: CustomerOption[] = rows.map(c => ({
    id: c.id,
    suite_number: c.suite_number,
    display: c.profiles?.business_name || c.profiles?.full_name || c.id,
    complianceVerified: verifiedSet.has(c.id),
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

      <div
        style={{
          maxWidth: 640, marginBottom: 20,
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(248,113,113,0.06)',
          border: '1px solid rgba(248,113,113,0.35)',
          font: '400 13px/1.55 var(--font-text,sans-serif)', color: 'var(--c-text-2)',
        }}
      >
        <strong style={{ color: '#f87171' }}>Do not process mail without a verified Form 1583 and photo ID.</strong>{' '}
        USPS rules prohibit accepting or handling mail for an unverified
        customer. The selected customer&rsquo;s status (✓ verified / ⚠ not
        verified) is shown below the customer field — only proceed when it
        shows ✓.
      </div>

      <div className="dash-card" style={{ maxWidth: 640 }}>
        <UploadForm customers={customers} defaultCustomerId={searchParams.customer_id} />
      </div>
    </div>
  );
}
