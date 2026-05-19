import 'server-only';
import { createAdminClientAny } from '@/lib/supabase/admin';
import type { StaffUser } from './types';

// Assignable users = anyone with role admin or staff. Email comes off
// profiles (added in migration 002) for display purposes.
export async function listStaffUsers(): Promise<StaffUser[]> {
  const admin = createAdminClientAny();
  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email, role')
    .in('role', ['admin', 'staff'])
    .order('full_name', { ascending: true });
  return (data ?? []) as StaffUser[];
}

export async function getStaffUserMap(): Promise<Map<string, StaffUser>> {
  const users = await listStaffUsers();
  return new Map(users.map((u) => [u.id, u]));
}
