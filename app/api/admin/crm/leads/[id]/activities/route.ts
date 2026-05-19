import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { listActivities } from '@/lib/crm/activity';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const activities = await listActivities(params.id);
  return Response.json({ activities });
}
