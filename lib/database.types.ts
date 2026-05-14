// Auto-generate the real version of this file with:
//   npx supabase gen types typescript --project-id <your-project-id> > lib/database.types.ts

export type QuestTier = "daily" | "weekly" | "monthly";
export type QuestStatus = "active" | "completed" | "expired";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          onboarding_answers: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          onboarding_answers?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          display_name?: string | null;
          onboarding_answers?: Record<string, unknown>;
        };
        Relationships: [];
      };
      quests: {
        Row: {
          id: string;
          user_id: string;
          tier: QuestTier;
          title: string;
          description: string;
          flavor_text: string | null;
          success_criteria: string | null;
          reward_xp: number;
          status: QuestStatus;
          generated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: QuestTier;
          title: string;
          description: string;
          flavor_text?: string | null;
          success_criteria?: string | null;
          reward_xp?: number;
          status?: QuestStatus;
          generated_at?: string;
          expires_at: string;
        };
        Update: {
          tier?: QuestTier;
          title?: string;
          description?: string;
          flavor_text?: string | null;
          success_criteria?: string | null;
          reward_xp?: number;
          status?: QuestStatus;
          expires_at?: string;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          user_id: string;
          total_xp: number;
          current_streak: number;
          completed_counts: { daily: number; weekly: number; monthly: number };
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_xp?: number;
          current_streak?: number;
          completed_counts?: { daily: number; weekly: number; monthly: number };
          updated_at?: string;
        };
        Update: {
          total_xp?: number;
          current_streak?: number;
          completed_counts?: { daily: number; weekly: number; monthly: number };
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      quest_tier: QuestTier;
      quest_status: QuestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
