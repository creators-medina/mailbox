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
  | 'email_received'
  | 'sms_sent'
  | 'sms_received'
  | 'call_logged'
  | 'task_created'
  | 'task_completed'
  | 'lead_archived'
  | 'lead_restored'
  | 'assignment_changed'
  | 'comment_added'
  | 'message_failed'
  | 'internal_message_added';

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

export type Channel = 'email' | 'sms' | 'internal' | 'phone' | 'system';
export type Direction = 'inbound' | 'outbound' | 'internal' | 'system';
export type ConversationStatus = 'open' | 'closed' | 'archived';
export type DeliveryStatus =
  | 'draft'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'bounced'
  | 'opened'
  | 'clicked'
  | 'received';

export type Conversation = {
  id: string;
  lead_id: string;
  channel: Channel;
  subject: string | null;
  status: ConversationStatus;
  last_message_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  lead_id: string;
  channel: Channel;
  direction: Direction;
  subject: string | null;
  body: string | null;
  body_html: string | null;
  from_address: string | null;
  to_address: string | null;
  cc_addresses: string[];
  bcc_addresses: string[];
  provider: string | null;
  provider_message_id: string | null;
  delivery_status: DeliveryStatus;
  error_message: string | null;
  metadata: Record<string, unknown>;
  sent_by: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageTemplate = {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'internal';
  subject: string | null;
  body: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageAttachment = {
  id: string;
  message_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  byte_size: number | null;
  created_at: string;
};
