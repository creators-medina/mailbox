import 'server-only';
import { currentStaffUserId } from '@/lib/auth/require-staff';
import { createComment, listComments } from '@/lib/crm/comments';
import { logCommentAdded } from '@/lib/crm/activity';

// GET ?lead_id=… — list comments for a lead.
export async function GET(req: Request) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead_id');
  if (!leadId) {
    return Response.json({ error: 'lead_id required' }, { status: 400 });
  }
  const comments = await listComments(leadId);
  return Response.json({ comments });
}

// POST — create comment.
export async function POST(req: Request) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { lead_id?: unknown; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const leadId = typeof body.lead_id === 'string' ? body.lead_id : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!leadId || !text) {
    return Response.json({ error: 'lead_id and body required' }, { status: 400 });
  }

  const comment = await createComment({
    lead_id: leadId,
    user_id: actorId,
    body: text,
  });
  if (!comment) {
    return Response.json({ error: 'Could not create comment' }, { status: 500 });
  }

  void logCommentAdded(leadId, text, actorId);

  return Response.json({ comment });
}
