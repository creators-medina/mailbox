import 'server-only';
import { checkIsStaff } from '@/lib/auth/require-staff';
import { listConversationsForLead } from '@/lib/crm/conversations';
import { listMessagesForLead } from '@/lib/crm/messages';

// GET — all conversations + all messages for one lead.
// Combined into a single round trip so the drawer can render the thread
// without two waterfalled fetches.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await checkIsStaff())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const [conversations, messages] = await Promise.all([
    listConversationsForLead(params.id, { status: 'any' }),
    listMessagesForLead(params.id),
  ]);
  return Response.json({ conversations, messages });
}
