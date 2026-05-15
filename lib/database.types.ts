// Auto-generate the real version of this file with:
//   npx supabase gen types typescript --project-id <your-project-id> > lib/database.types.ts

export type QuestTier   = "daily" | "weekly" | "monthly";
export type QuestStatus = "active" | "completed" | "expired";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id:             string;
          display_name:        string | null;
          onboarding_answers:  Record<string, unknown>;
          timezone:            string;
          created_at:          string;
        };
        Insert: {
          user_id:             string;
          display_name?:       string | null;
          onboarding_answers?: Record<string, unknown>;
          timezone?:           string;
          created_at?:         string;
        };
        Update: {
          display_name?:       string | null;
          onboarding_answers?: Record<string, unknown>;
          timezone?:           string;
        };
        Relationships: [];
      };

      quests: {
        Row: {
          id:               string;
          user_id:          string;
          tier:             QuestTier;
          title:            string;
          description:      string;
          flavor_text:      string | null;
          success_criteria: string | null;
          reward_xp:        number;
          status:           QuestStatus;
          generated_at:     string;
          expires_at:       string;
          completed_at:     string | null;
        };
        Insert: {
          id?:               string;
          user_id:           string;
          tier:              QuestTier;
          title:             string;
          description:       string;
          flavor_text?:      string | null;
          success_criteria?: string | null;
          reward_xp?:        number;
          status?:           QuestStatus;
          generated_at?:     string;
          expires_at:        string;
          completed_at?:     string | null;
        };
        Update: {
          tier?:             QuestTier;
          title?:            string;
          description?:      string;
          flavor_text?:      string | null;
          success_criteria?: string | null;
          reward_xp?:        number;
          status?:           QuestStatus;
          expires_at?:       string;
          completed_at?:     string | null;
        };
        Relationships: [];
      };

      user_stats: {
        Row: {
          user_id:           string;
          total_xp:          number;
          current_streak:    number;
          longest_streak:    number;
          completed_counts:  { daily: number; weekly: number; monthly: number };
          last_completed_at: string | null;
          updated_at:        string;
        };
        Insert: {
          user_id:            string;
          total_xp?:          number;
          current_streak?:    number;
          longest_streak?:    number;
          completed_counts?:  { daily: number; weekly: number; monthly: number };
          last_completed_at?: string | null;
          updated_at?:        string;
        };
        Update: {
          total_xp?:          number;
          current_streak?:    number;
          longest_streak?:    number;
          completed_counts?:  { daily: number; weekly: number; monthly: number };
          last_completed_at?: string | null;
          updated_at?:        string;
        };
        Relationships: [];
      };

      quest_generation_log: {
        Row: {
          id:                string;
          user_id:           string;
          tier:              string;
          system_prompt:     string | null;
          user_message:      string | null;
          response_json:     Record<string, unknown> | null;
          regenerated:       boolean;
          hard_nos_triggered: boolean;
          error:             string | null;
          created_at:        string;
        };
        Insert: {
          id?:                string;
          user_id:            string;
          tier:               string;
          system_prompt?:     string | null;
          user_message?:      string | null;
          response_json?:     Record<string, unknown> | null;
          regenerated?:       boolean;
          hard_nos_triggered?: boolean;
          error?:             string | null;
          created_at?:        string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views:          Record<string, never>;
    Functions:      Record<string, never>;
    Enums: {
      quest_tier:   QuestTier;
      quest_status: QuestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
