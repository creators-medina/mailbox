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

// Normalize a placeholder key to canonical snake_case. Handles camelCase
// ({{firstName}}), spaces ({{First Name}}), hyphens, and capitalization so
// templates authored with any of those variants still resolve.
function normalizeKey(raw: string): string {
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // split camelCase
    .toLowerCase()
    .replace(/[\s-]+/g, '_')                 // spaces / hyphens -> underscore
    .replace(/_+/g, '_')                     // collapse repeats
    .replace(/^_|_$/g, '');                  // trim underscores
}

// Common synonyms mapped to canonical variable keys. Lets staff write
// {{name}}, {{business_name}}, {{phone_number}}, etc. without breaking.
const ALIASES: Record<string, TemplateVarKey> = {
  name: 'full_name',
  fullname: 'full_name',
  first: 'first_name',
  firstname: 'first_name',
  last: 'last_name',
  lastname: 'last_name',
  emailaddress: 'email',
  phonenumber: 'phone',
  mobile: 'phone',
  cell: 'phone',
  company_name: 'company',
  companyname: 'company',
  business: 'company',
  business_name: 'company',
  businessname: 'company',
  organization: 'company',
  org: 'company',
  lead_source: 'source',
};

// Replace {{ key }} placeholders with values. Tolerant of camelCase, spaces,
// hyphens, and known aliases. Unknown keys are left untouched so a genuine
// typo is visible to staff in the composer preview (stripUnresolvedVars()
// removes any survivors at send time).
export function renderTemplate(
  text: string | null | undefined,
  vars: Record<string, string>,
): string {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9 _-]+?)\s*\}\}/g, (match, rawKey: string) => {
    const norm = normalizeKey(rawKey);
    const key = norm in vars ? norm : ALIASES[norm] ?? norm;
    return key in vars ? vars[key] : match;
  });
}

// Final safety net used at send time: remove any leftover {{...}} tokens that
// never resolved, and tidy the whitespace they leave behind, so a recipient
// never sees a raw placeholder.
export function stripUnresolvedVars(text: string): string {
  return text
    .replace(/\{\{\s*[a-zA-Z0-9 _-]+?\s*\}\}/g, '')
    .replace(/[ \t]{2,}/g, ' ')      // collapse double spaces left behind
    .replace(/ +\n/g, '\n')           // trailing spaces before newlines
    .replace(/\n{3,}/g, '\n\n')       // collapse 3+ blank lines
    .trim();
}

