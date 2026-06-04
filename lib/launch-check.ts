import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import { MAIL_ITEM_STATUSES } from '@/lib/mail/statuses';

export type Severity = 'required' | 'warning';
export type Check = {
  category: 'env' | 'column' | 'enum' | 'bucket' | 'data';
  name: string;
  ok: boolean;
  severity: Severity;
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
  ['customers', 'id'],
  ['customers', 'email'],
  ['customers', 'user_id'],
  ['customers', 'profile_id'],
  ['customers', 'suite_number'],
  ['customers', 'business_address_line'],

  ['subscriptions', 'customer_id'],
  ['subscriptions', 'mail_scanning_enabled'],
  ['subscriptions', 'business_phone_enabled'],
  ['subscriptions', 'google_business_setup_purchased'],

  ['mail_items', 'customer_id'],
  ['mail_items', 'status'],
  ['mail_items', 'sender'],
  ['mail_items', 'title'],
  ['mail_items', 'envelope_image_url'],
  ['mail_items', 'scanned_document_url'],
  ['mail_items', 'tracking_number'],

  ['mail_requests', 'id'],
  ['mail_requests', 'customer_id'],
  ['mail_requests', 'mail_item_id'],
  ['mail_requests', 'request_type'],
  ['mail_requests', 'status'],
  ['mail_requests', 'notes'],
  ['mail_requests', 'customer_response'],
  ['mail_requests', 'completed_by'],
  ['mail_requests', 'updated_at'],

  ['customer_compliance', 'customer_id'],
  ['customer_compliance', 'form_1583_status'],
  ['customer_compliance', 'photo_id_status'],
  ['customer_compliance', 'form_1583_file_path'],
  ['customer_compliance', 'photo_id_file_path'],
  ['customer_compliance', 'form_1583_uploaded_at'],
  ['customer_compliance', 'photo_id_uploaded_at'],
  ['customer_compliance', 'rejected_reason'],
  ['customer_compliance', 'form_1583_rejected_reason'],
  ['customer_compliance', 'photo_id_rejected_reason'],
  ['customer_compliance', 'reviewed_at'],
  ['customer_compliance', 'reviewed_by'],
  ['customer_compliance', 'verified_at'],
  ['customer_compliance', 'verified_by'],
  ['customer_compliance', 'updated_at'],
];

// Columns that are nice-to-have but not strictly required by current code paths.
const OPTIONAL_COLUMNS: Array<[string, string]> = [
  ['mail_requests', 'completed_at'],
];

const REQUIRED_BUCKETS = ['mail-envelope-images', 'mail-scans', 'compliance-documents'] as const;

const VALID_MAIL_STATUSES = new Set<string>(MAIL_ITEM_STATUSES);

/* eslint-disable @typescript-eslint/no-explicit-any */

// A column existence probe via PostgREST: selecting a non-existent column
// returns an error mentioning it. limit(0) makes it a cheap metadata round-trip.
async function checkColumn(
  admin: any, table: string, column: string, severity: Severity = 'required',
): Promise<Check> {
  const { error } = await admin.from(table).select(column).limit(0);
  if (!error) return { category: 'column', name: `${table}.${column}`, ok: true, severity };
  return {
    category: 'column',
    name: `${table}.${column}`,
    ok: false,
    severity,
    detail: error.message,
  };
}

// Enum value probe: filtering by a value the type doesn't have errors with
// "invalid input value for enum…". A working value returns 0 rows, no error.
async function checkEnumValue(admin: any, table: string, column: string, value: string): Promise<Check> {
  const { error } = await admin.from(table).select('id').eq(column, value).limit(0);
  if (!error) return { category: 'enum', name: `${table}.${column} = ${value}`, ok: true, severity: 'required' };
  return {
    category: 'enum',
    name: `${table}.${column} = ${value}`,
    ok: false,
    severity: 'required',
    detail: error.message,
  };
}

async function checkBucket(admin: any, name: string): Promise<Check> {
  const { data, error } = await admin.storage.listBuckets();
  if (error) return { category: 'bucket', name, ok: false, severity: 'required', detail: error.message };
  const b = ((data ?? []) as Array<{ name: string; public: boolean }>).find(x => x.name === name);
  if (!b) return { category: 'bucket', name, ok: false, severity: 'required', detail: 'bucket not found' };
  if (b.public) return { category: 'bucket', name, ok: false, severity: 'required', detail: 'bucket is public (should be private)' };
  return { category: 'bucket', name, ok: true, severity: 'required', detail: 'private' };
}

// Warning probe: sample recent mail_items and flag any status values outside
// the canonical six. Catches drift between code and data without blocking
// launch.
async function checkUnexpectedMailItemStatuses(admin: any): Promise<Check> {
  try {
    const { data, error } = await admin.from('mail_items').select('status').limit(1000);
    if (error) {
      return { category: 'data', name: 'mail_items.status values', ok: false, severity: 'warning', detail: error.message };
    }
    const rows = (data ?? []) as Array<{ status: string }>;
    const unexpected = Array.from(new Set(
      rows.map(r => r.status).filter(s => !VALID_MAIL_STATUSES.has(s)),
    ));
    if (unexpected.length === 0) {
      return { category: 'data', name: 'mail_items.status values', ok: true, severity: 'warning', detail: 'all values in canonical set' };
    }
    return {
      category: 'data',
      name: 'mail_items.status values',
      ok: false,
      severity: 'warning',
      detail: `unexpected: ${unexpected.join(', ')}`,
    };
  } catch (err) {
    return {
      category: 'data',
      name: 'mail_items.status values',
      ok: false,
      severity: 'warning',
      detail: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function runLaunchChecks(): Promise<{ ok: boolean; checks: Check[] }> {
  const checks: Check[] = [];

  // Env vars — boolean presence only, never the values.
  for (const k of REQUIRED_ENV) {
    checks.push({ category: 'env', name: k, ok: Boolean(process.env[k]), severity: 'required' });
  }

  const admin = createAdminClientAny();

  // Required + optional columns
  const requiredColumns = await Promise.all(REQUIRED_COLUMNS.map(([t, c]) => checkColumn(admin, t, c, 'required')));
  const optionalColumns = await Promise.all(OPTIONAL_COLUMNS.map(([t, c]) => checkColumn(admin, t, c, 'warning')));
  checks.push(...requiredColumns, ...optionalColumns);

  // mail_item_status enum values (production must accept all six)
  const enumResults = await Promise.all(
    MAIL_ITEM_STATUSES.map(v => checkEnumValue(admin, 'mail_items', 'status', v)),
  );
  checks.push(...enumResults);

  // Private storage buckets
  const bucketResults = await Promise.all(REQUIRED_BUCKETS.map(b => checkBucket(admin, b)));
  checks.push(...bucketResults);

  // Warning: data sanity — sample current mail_items.status values.
  checks.push(await checkUnexpectedMailItemStatuses(admin));

  // "ok" reflects only REQUIRED checks; warnings can fail without blocking.
  const ok = checks.every(c => c.severity === 'warning' || c.ok);
  return { ok, checks };
}
