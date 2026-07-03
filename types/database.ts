export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Supabase database types (modeled after `supabase gen types typescript`).
 *
 * Notes on JSON / array columns:
 * - `channel_data`, `stats_cache`, `metrics` are modeled as `Json` since they store structured payloads.
 * - `tags` is modeled as `string[]` (typical `text[]`). If you store it as JSON instead, change to `Json`.
 */
export type Database = {
  public: {
    Tables: {
      ai_requests: {
        Row: {
          id: string;
          user_id: string;
          request_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          request_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          request_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      channels: {
        Row: {
          id: string;
          user_id: string;
          youtube_channel_id: string;
          channel_data: Json | null;
          stats_cache: Json | null;
          last_updated: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          youtube_channel_id: string;
          channel_data?: Json | null;
          stats_cache?: Json | null;
          last_updated?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          youtube_channel_id?: string;
          channel_data?: Json | null;
          stats_cache?: Json | null;
          last_updated?: string | null;
        };
        Relationships: [];
      };
      competitors: {
        Row: {
          id: string;
          user_id: string;
          youtube_channel_id: string;
          channel_name: string | null;
          channel_url: string | null;
          channel_data: Json | null;
          stats_cache: Json | null;
          last_updated: string | null;
          tracked_since: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          youtube_channel_id: string;
          channel_name?: string | null;
          channel_url?: string | null;
          channel_data?: Json | null;
          stats_cache?: Json | null;
          last_updated?: string | null;
          tracked_since?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          youtube_channel_id?: string;
          channel_name?: string | null;
          channel_url?: string | null;
          channel_data?: Json | null;
          stats_cache?: Json | null;
          last_updated?: string | null;
          tracked_since?: string;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          tags: string[] | null;
          priority: number;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          priority?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          priority?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      thumbnail_analyses: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          analysis: Json;
          overall_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          analysis: Json;
          overall_score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          analysis?: Json;
          overall_score?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          onboarding_data: Json;
          youtube_channel_id: string | null;
          youtube_tokens: Json | null;
          plan_type: string;
          lemonsqueezy_customer_id: string | null;
          lemonsqueezy_subscription_id: string | null;
          subscription_status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          onboarding_data?: Json;
          youtube_channel_id?: string | null;
          youtube_tokens?: Json | null;
          plan_type?: string;
          lemonsqueezy_customer_id?: string | null;
          lemonsqueezy_subscription_id?: string | null;
          subscription_status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          onboarding_data?: Json;
          youtube_channel_id?: string | null;
          youtube_tokens?: Json | null;
          plan_type?: string;
          lemonsqueezy_customer_id?: string | null;
          lemonsqueezy_subscription_id?: string | null;
          subscription_status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          channel_id: string;
          youtube_video_id: string;
          title: string;
          metrics: Json | null;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          channel_id: string;
          youtube_video_id: string;
          title: string;
          metrics?: Json | null;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          channel_id?: string;
          youtube_video_id?: string;
          title?: string;
          metrics?: Json | null;
          published_at?: string | null;
        };
        Relationships: [];
      };
      scheduled_videos: {
        Row: {
          id: string;
          user_id: string;
          channel_id: string;
          title: string;
          idea_id: string | null;
          scheduled_at: string;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          thumbnail_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel_id: string;
          title: string;
          idea_id?: string | null;
          scheduled_at: string;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          thumbnail_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_id?: string;
          title?: string;
          idea_id?: string | null;
          scheduled_at?: string;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          thumbnail_url?: string | null;
        };
        Relationships: [];
      };
      workflows: {
        Row: {
          id: string;
          channel_id: string;
          title: string;
          description: string | null;
          status: string;
          notes: string | null;
          due_date: string | null;
          order: number;
          youtube_video_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          title: string;
          description?: string | null;
          status?: string;
          notes?: string | null;
          due_date?: string | null;
          order?: number;
          youtube_video_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          notes?: string | null;
          due_date?: string | null;
          order?: number;
          youtube_video_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_preferences: {
        Row: {
          user_id: string;
          email: string;
          unsubscribed_all: boolean;
          weekly_digest_enabled: boolean;
          weekly_digest_frequency: string;
          competitor_alerts_enabled: boolean;
          publishing_reminders_enabled: boolean;
          goal_reached_enabled: boolean;
          onboarding_enabled: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          unsubscribed_all?: boolean;
          weekly_digest_enabled?: boolean;
          weekly_digest_frequency?: string;
          competitor_alerts_enabled?: boolean;
          publishing_reminders_enabled?: boolean;
          goal_reached_enabled?: boolean;
          onboarding_enabled?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          unsubscribed_all?: boolean;
          weekly_digest_enabled?: boolean;
          weekly_digest_frequency?: string;
          competitor_alerts_enabled?: boolean;
          publishing_reminders_enabled?: boolean;
          goal_reached_enabled?: boolean;
          onboarding_enabled?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          user_id: string | null;
          to_email: string;
          type: string;
          subject: string;
          status: string;
          resend_id: string | null;
          error: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          to_email: string;
          type: string;
          subject: string;
          status: string;
          resend_id?: string | null;
          error?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          to_email?: string;
          type?: string;
          subject?: string;
          status?: string;
          resend_id?: string | null;
          error?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

