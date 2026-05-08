import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';

// Assigns the next suite number in the MB1001, MB1002, ... sequence.
//
// TODO: For high-concurrency production, replace with a Postgres sequence
// (CREATE SEQUENCE suite_seq START 1001) or an advisory lock to prevent
// duplicate assignment under parallel webhook requests.
export async function assignSuiteNumber(): Promise<string> {
  const admin = createAdminClientAny();

  const { data } = await admin
    .from('customers')
    .select('suite_number')
    .not('suite_number', 'is', null)
    .limit(200);

  const taken = (data ?? [])
    .map(r => r.suite_number)
    .filter((s): s is string => typeof s === 'string' && /^MB\d+$/.test(s))
    .map(s => parseInt(s.slice(2), 10));

  const next = taken.length > 0 ? Math.max(...taken) + 1 : 1001;
  return `MB${next}`;
}
