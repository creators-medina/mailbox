import 'server-only';
import { redirect } from 'next/navigation';

export default function CrmIndex() {
  redirect('/admin/crm/pipelines');
}
