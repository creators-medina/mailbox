import 'server-only';

// A customer is authorized for mail handling only when BOTH the USPS Form 1583
// and the photo ID are verified by staff. Missing compliance row → not
// authorized. Server-only; takes the service-role admin client so it can read
// the row regardless of RLS.

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function isCustomerAuthorized(admin: any, customerId: string): Promise<boolean> {
  if (!customerId) return false;
  const { data, error } = await admin
    .from('customer_compliance')
    .select('form_1583_status, photo_id_status')
    .eq('customer_id', customerId)
    .maybeSingle();
  if (error || !data) return false;
  const row = data as { form_1583_status?: string; photo_id_status?: string };
  return row.form_1583_status === 'verified' && row.photo_id_status === 'verified';
}
