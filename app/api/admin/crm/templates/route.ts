import 'server-only';
import { currentStaffUserId } from '@/lib/auth/require-staff';
import { createTemplate, listTemplates } from '@/lib/crm/templates';

const CHANNELS = ['email', 'sms', 'internal'] as const;

// GET ?channel=&active=1 — list templates.
export async function GET(req: Request) {
  if (!(await currentStaffUserId())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const url = new URL(req.url);
  const channel = url.searchParams.get('channel') ?? undefined;
  const activeOnly = url.searchParams.get('active') === '1';
  const templates = await listTemplates({ channel, activeOnly });
  return Response.json({ templates });
}

// POST — create a template.
export async function POST(req: Request) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { name?: unknown; channel?: unknown; subject?: unknown; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const channel = CHANNELS.includes(body.channel as (typeof CHANNELS)[number])
    ? (body.channel as (typeof CHANNELS)[number])
    : 'email';
  const subject = typeof body.subject === 'string' ? body.subject.trim() || null : null;

  if (!name) return Response.json({ error: 'Name is required.' }, { status: 400 });
  if (!text) return Response.json({ error: 'Body is required.' }, { status: 400 });

  const template = await createTemplate({ name, channel, subject, body: text, created_by: actorId });
  if (!template) return Response.json({ error: 'Could not create template.' }, { status: 500 });
  return Response.json({ template });
}
