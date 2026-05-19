export type Pipeline = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_default: boolean;
  is_archived: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type Stage = {
  id: string;
  pipeline_id: string;
  name: string;
  slug: string;
  color: string;
  order_index: number;
  is_closed: boolean;
  close_type: 'won' | 'lost' | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type CloseType = 'won' | 'lost' | null;

export type Lead = {
  id: string;
  pipeline_id: string;
  stage_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  tags: string[];
  notes: string | null;
  raw_submission: unknown;
  assigned_to: string | null;
  order_index: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ActivityType =
  | 'lead_created'
  | 'stage_changed'
  | 'note_added'
  | 'tag_added'
  | 'tag_removed'
  | 'email_sent'
  | 'sms_sent'
  | 'call_logged'
  | 'task_created'
  | 'task_completed'
  | 'lead_archived'
  | 'lead_restored'
  | 'assignment_changed'
  | 'comment_added';

export type Activity = {
  id: string;
  lead_id: string;
  type: string; // intentionally `string` so future types render generically
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type Task = {
  id: string;
  lead_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  completed_at: string | null;
  priority: TaskPriority;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  lead_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type StaffUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};
