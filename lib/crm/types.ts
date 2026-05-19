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
