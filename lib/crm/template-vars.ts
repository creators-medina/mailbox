// Pure, dependency-free template variable rendering. Safe for both client
// and server (no 'server-only' import) so the composer can preview the
// resolved text the instant a template is picked.
import type { Lead } from './types';

export const TEMPLATE_VARIABLES = [
  'first_name',
  'last_name',
  'full_name',
  'email',
  'phone',
  'company',
  'source',
] as const;

export type TemplateVarKey = (typeof TEMPLATE_VARIABLES)[number];

// Build the substitution map from a lead. `company` is not a first-class
// column, so we look for it in the raw submission payload (contact form
// posts a business name) before falling back to empty.
export function buildLeadVars(lead: Lead): Record<TemplateVarKey, string> {
  const first = lead.first_name?.trim() ?? '';
  const last = lead.last_name?.trim() ?? '';
  const full = [first, last].filter(Boolean).join(' ');

  let company = '';
  const raw = lead.raw_submission;
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const candidate = r.company ?? r.business_name ?? r.businessName ?? r.organization;
    if (typeof candidate === 'string') company = candidate.trim();
  }

  return {
    first_name: first,
    last_name: last,
    full_name: full,
    email: lead.email?.trim() ?? '',
    phone: lead.phone?.trim() ?? '',
    company,
    source: lead.source ?? '',
  };
}

// Replace {{ key }} placeholders (whitespace-tolerant) with values. Unknown
// keys are left untouched so a typo is visible rather than silently dropped.
export function renderTemplate(
  text: string | null | undefined,
  vars: Record<string, string>,
): string {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi, (match, rawKey: string) => {
    const key = rawKey.toLowerCase();
    return key in vars ? vars[key] : match;
  });
}
