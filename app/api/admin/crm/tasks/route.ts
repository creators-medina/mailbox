import 'server-only';
import { currentStaffUserId } from '@/lib/auth/require-staff';
import { createTask, listTasks } from '@/lib/crm/tasks';
import { logTaskCreated } from '@/lib/crm/activity';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

export async function GET(req: Request) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const url = new URL(req.url);
  const leadId = url.searchParams.get('lead_id');
  if (!leadId) return Response.json({ error: 'lead_id required' }, { status: 400 });
  const tasks = await listTasks(leadId);
  return Response.json({ tasks });
}

export async function POST(req: Request) {
  const actorId = await currentStaffUserId();
  if (!actorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: {
    lead_id?: unknown;
    title?: unknown;
    description?: unknown;
    due_at?: unknown;
    priority?: unknown;
    assigned_to?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const leadId = typeof body.lead_id === 'string' ? body.lead_id : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!leadId || !title) {
    return Response.json({ error: 'lead_id and title required' }, { status: 400 });
  }
  const priority: Priority = PRIORITIES.includes(body.priority as Priority)
    ? (body.priority as Priority)
    : 'medium';

  const task = await createTask({
    lead_id: leadId,
    title,
    description: typeof body.description === 'string' ? body.description.trim() || null : null,
    due_at: typeof body.due_at === 'string' && body.due_at ? body.due_at : null,
    priority,
    assigned_to: typeof body.assigned_to === 'string' ? body.assigned_to : null,
    created_by: actorId,
  });

  if (!task) return Response.json({ error: 'Could not create task' }, { status: 500 });

  void logTaskCreated(leadId, task.title, actorId, { task_id: task.id, priority });

  return Response.json({ task });
}
