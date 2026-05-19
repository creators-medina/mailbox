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
