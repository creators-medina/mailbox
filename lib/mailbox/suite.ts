import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { BUSINESS, buildCustomerAddress } from '@/lib/config/business';

// Assigns the next suite number in the MB1001, MB1002, … sequence.
//
// Backed by the Postgres sequence created in migration 021. nextval() is atomic
// under concurrency by design, so two Stripe webhooks arriving together can
// never draw the same number, and no table scan is involved — which also
// removes the 200-row read cap that previously made numbering unreliable past
// 200 customers.
//
// Called by the checkout.session.completed webhook before inserting the
// customers row. Its signature is unchanged; only how the number is obtained
// has changed.

const MAX_ATTEMPTS = 5;

export async function assignSuiteNumber(): Promise<string> {
  const admin = createAdminClientAny();
  const prefix = BUSINESS.suitePrefix;

  // The sequence guarantees two concurrent callers get different numbers, but
  // it does not know about suites an admin assigned by hand — someone could
  // have typed MB1050 while the sequence was still at 1042. A cheap indexed
  // check per candidate closes that gap. Two concurrent callers cannot collide
  // with each other here because they are already holding different values.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const { data, error } = await admin.rpc('next_suite_number');

    if (error) {
      console.warn(
        `[suite] next_suite_number RPC unavailable (${error.message}) — falling back to a table scan`,
      );
      return assignSuiteNumberByScan(admin, prefix);
    }

    const next = typeof data === 'string' ? parseInt(data, 10) : Number(data);
    if (!Number.isFinite(next)) {
      console.warn('[suite] next_suite_number returned a non-numeric value — falling back to a table scan');
      return assignSuiteNumberByScan(admin, prefix);
    }

    const candidate = `${prefix}${next}`;
    const { data: taken } = await admin
      .from('customers')
      .select('id')
      .eq('suite_number', candidate)
      .limit(1)
      .maybeSingle();

    if (!taken) return candidate;

    console.warn(`[suite] ${candidate} is already assigned — drawing the next number`);
  }

  // Every candidate collided with a manually assigned suite. Fall back rather
  // than fail: provisioning a paying customer must not stop here.
  console.warn(`[suite] ${MAX_ATTEMPTS} sequence values were all taken — falling back to a table scan`);
  return assignSuiteNumberByScan(admin, prefix);
}

// Previous behaviour, kept as a fallback for two cases: a deploy that lands
// before migration 021 is applied, and the pathological collision path above.
// It carries the original race and is not the primary path — but an imperfect
// suite number is far better than a failed webhook on a completed payment.
//
// The row cap is raised from 200 to 1000 rather than removed. It cannot be
// fixed by ordering: suite_number is TEXT, so descending order is
// lexicographic and puts 'MB999' above 'MB1042'. Computing the maximum
// correctly therefore requires every matching row, and the cap is the honest
// bound on that. Above 1000 customers this degraded path can under-count — the
// sequence is what actually makes assignment correct at scale.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assignSuiteNumberByScan(admin: any, prefix: string): Promise<string> {
  const { data } = await admin
    .from('customers')
    .select('suite_number')
    .not('suite_number', 'is', null)
    .limit(1000);

  const re = new RegExp(`^${prefix}\\d+$`);

  const taken = (data ?? [])
    .map((r: { suite_number: string | null }) => r.suite_number)
    .filter((s: unknown): s is string => typeof s === 'string' && re.test(s))
    .map((s: string) => parseInt(s.slice(prefix.length), 10))
    .filter((n: number) => Number.isFinite(n));

  const next = taken.length > 0 ? Math.max(...taken) + 1 : BUSINESS.suiteStartNum;
  return `${prefix}${next}`;
}

export { buildCustomerAddress };
