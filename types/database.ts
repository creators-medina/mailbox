// Placeholder Database type.
// Replace with generated types from `supabase gen types typescript` once your
// Supabase project is configured and migrations have been applied.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          business_name: string | null;
          phone: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          profile_id: string;
          stripe_customer_id: string | null;
          status: string;
          suite_number: string | null;
          business_address_line: string | null;
          forwarding_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          stripe_customer_id?: string | null;
          status?: string;
          suite_number?: string | null;
          business_address_line?: string | null;
          forwarding_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_customer_id?: string | null;
          status?: string;
          suite_number?: string | null;
          business_address_line?: string | null;
          forwarding_address?: string | null;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          customer_id: string;
          stripe_subscription_id: string | null;
          status: string;
          base_plan: string;
          mail_scanning_enabled: boolean;
          business_phone_enabled: boolean;
          google_business_setup_purchased: boolean;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          stripe_subscription_id?: string | null;
          status: string;
          base_plan?: string;
          mail_scanning_enabled?: boolean;
          business_phone_enabled?: boolean;
          google_business_setup_purchased?: boolean;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_subscription_id?: string | null;
          status?: string;
          mail_scanning_enabled?: boolean;
          business_phone_enabled?: boolean;
          google_business_setup_purchased?: boolean;
          current_period_end?: string | null;
          updated_at?: string;
        };
      };
      mail_items: {
        Row: {
          id: string;
          customer_id: string;
          sender: string | null;
          envelope_image_url: string | null;
          scanned_document_url: string | null;
          status: string;
          received_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          sender?: string | null;
          envelope_image_url?: string | null;
          scanned_document_url?: string | null;
          status?: string;
          received_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sender?: string | null;
          envelope_image_url?: string | null;
          scanned_document_url?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
      mail_requests: {
        Row: {
          id: string;
          mail_item_id: string;
          customer_id: string;
          request_type: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mail_item_id: string;
          customer_id: string;
          request_type: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      admin_notes: {
        Row: {
          id: string;
          customer_id: string;
          mail_item_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          mail_item_id?: string | null;
          note: string;
          created_at?: string;
        };
        Update: {
          note?: string;
        };
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          message: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
