import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { MAIL_ITEM_STATUSES } from '@/lib/mail/statuses';

export type Check = {
  category: 'env' | 'column' | 'enum' | 'bucket';
  name: string;
  ok: boolean;
  detail?: string;
};

const REQUIRED_ENV = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_BUSINESS_ADDRESS_MONTHLY',
  'STRIPE_PRICE_MAIL_SCANNING_MONTHLY',
  'STRIPE_PRICE_BUSINESS_PHONE_MONTHLY',
  'STRIPE_PRICE_GOOGLE_BUSINESS_SETUP_ONE_TIME',
] as const;

const REQUIRED_COLUMNS: Array<[string, string]> = [
  ['customers', 'email'],
  ['customers', 'user_id'],
  ['customers', 'suite_number'],
  ['customers', 'business_address_line'],
  ['subscriptions', 'customer_id'],
  ['subscriptions', 'mail_scanning_enabled'],
  ['subscriptions', 'business_phone_enabled'],
  ['subscriptions', 'google_business_setup_purchased'],
  ['mail_items', 'customer_id'],
  ['mail_items', 'status'],
  ['mail_items', 'envelope_image_url'],
  ['mail_items', 'scanned_document_url'],
  ['mail_items', 'tracking_number'],
  ['mail_requests', 'mail_item_id'],
  ['mail_requests', 'customer_id'],
  ['mail_requests', 'customer_response'],
  ['mail_requests', 'completed_by'],
  ['mail_requests', 'updated_at'],
  ['customer_compliance', 'customer_id'],
  ['customer_compliance', 'form_1583_status'],
  ['customer_compliance', 'photo_id_status'],
];

const REQUIRED_BUCKETS = ['mail-envelope-images', 'mail-scans'] as const;

/* eslint-disable @typescript-eslint/no-explicit-any */

// A column existence probe via PostgREST: selecting a non-existent column
// returns an error mentioning it. limit(0) makes it a cheap metadata round-trip.
async function checkColumn(admin: any, table: string, column: string): Promise<Check> {
  const { error } = await admin.from(table).select(column).limit(0);
  if (!error) return { category: 'column', name: `${table}.${column}`, ok: true };
  return {
    category: 'column',
    name: `${table}.${column}`,
    ok: false,
    detail: error.message,
  };
}

// Enum value probe: filtering by a value the type doesn't have errors with
// "invalid input value for enum…". A working value returns 0 rows, no error.
async function checkEnumValue(admin: any, table: string, column: string, value: string): Promise<Check> {
  const { error } = await admin.from(table).select('id').eq(column, value).limit(0);
  if (!error) return { category: 'enum', name: `${table}.${column} = ${value}`, ok: true };
  return {
    category: 'enum',
    name: `${table}.${column} = ${value}`,
    ok: false,
    detail: error.message,
  };
}

async function checkBucket(admin: any, name: string): Promise<Check> {
  const { data, error } = await admin.storage.listBuckets();
  if (error) return { category: 'bucket', name, ok: false, detail: error.message };
  const b = ((data ?? []) as Array<{ name: string; public: boolean }>).find(x => x.name === name);
  if (!b) return { category: 'bucket', name, ok: false, detail: 'bucket not found' };
  if (b.public) return { category: 'bucket', name, ok: false, detail: 'bucket is public (should be private)' };
  return { category: 'bucket', name, ok: true, detail: 'private' };
}

export async function runLaunchChecks(): Promise<{ ok: boolean; checks: Check[] }> {
  const checks: Check[] = [];

  // Env vars — boolean presence only, never the values.
  for (const k of REQUIRED_ENV) {
    checks.push({ category: 'env', name: k, ok: Boolean(process.env[k]) });
  }

  const admin = createAdminClientAny();

  // Columns
  const columnResults = await Promise.all(REQUIRED_COLUMNS.map(([t, c]) => checkColumn(admin, t, c)));
  checks.push(...columnResults);

  // mail_item_status enum values (production must accept all six)
  const enumResults = await Promise.all(
    MAIL_ITEM_STATUSES.map(v => checkEnumValue(admin, 'mail_items', 'status', v)),
  );
  checks.push(...enumResults);

  // Private storage buckets
  const bucketResults = await Promise.all(REQUIRED_BUCKETS.map(b => checkBucket(admin, b)));
  checks.push(...bucketResults);

  const ok = checks.every(c => c.ok);
  return { ok, checks };
}
