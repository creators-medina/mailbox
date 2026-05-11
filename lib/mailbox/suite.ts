import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { BUSINESS, buildCustomerAddress } from '@/lib/config/business';

// Assigns the next suite number in the MB1001, MB1002, … sequence.
//
// MVP note: no concurrency protection. Under parallel webhook requests two
// customers could receive the same number. For production scale, replace with
// a Postgres sequence (CREATE SEQUENCE suite_seq START 1001) or an advisory lock.
export async function assignSuiteNumber(): Promise<string> {
  const admin = createAdminClientAny();

  const { data } = await admin
    .from('customers')
    .select('suite_number')
    .not('suite_number', 'is', null)
    .limit(200);

  const prefix = BUSINESS.suitePrefix;
  const re = new RegExp(`^${prefix}\\d+$`);

  const taken = (data ?? [])
    .map((r: { suite_number: string | null }) => r.suite_number)
    .filter((s): s is string => typeof s === 'string' && re.test(s))
    .map(s => parseInt(s.slice(prefix.length), 10));

  const next = taken.length > 0 ? Math.max(...taken) + 1 : BUSINESS.suiteStartNum;
  return `${prefix}${next}`;
}

export { buildCustomerAddress };
