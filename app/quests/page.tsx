"use client";

import { useEffect, useReducer, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatsBar from "./components/StatsBar";
import TierPanel from "./components/TierPanel";
import type { Database, QuestTier } from "@/lib/database.types";

type Quest     = Database["public"]["Tables"]["quests"]["Row"];
type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];

// ─── State & reducer ─────────────────────────────────────────────────────────

type State = {
  loading: boolean;
  quests: Quest[];
  stats: UserStats | null;
  displayName: string | null;
  /** Which tier is currently generating a quest (null = idle) */
  generating: QuestTier | null;
  /** ID of the quest currently being marked complete (null = idle) */
  completing: string | null;
  error: string | null;
};

type Action =
  | { type: "LOADED"; quests: Quest[]; stats: UserStats | null; displayName: string | null }
  | { type: "QUEST_ADDED"; quest: Quest }
  | { type: "QUEST_COMPLETED"; questId: string; stats: UserStats }
  | { type: "SET_GENERATING"; tier: QuestTier | null }
  | { type: "SET_COMPLETING"; questId: string | null }
  | { type: "SET_ERROR"; message: string | null }
  | { type: "DISMISS_ERROR" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOADED":
      return {
        ...state,
        loading: false,
        quests: action.quests,
        stats: action.stats,
        displayName: action.displayName,
      };
    case "QUEST_ADDED":
      return { ...state, quests: [action.quest, ...state.quests] };
    case "QUEST_COMPLETED":
      return {
        ...state,
        completing: null,
        stats: action.stats,
        quests: state.quests.map((q) =>
          q.id === action.questId ? { ...q, status: "completed" } : q
        ),
      };
    case "SET_GENERATING":
      return { ...state, generating: action.tier };
    case "SET_COMPLETING":
      return { ...state, completing: action.questId };
    case "SET_ERROR":
      return { ...state, error: action.message, generating: null, completing: null };
    case "DISMISS_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

const initial: State = {
  loading: true,
  quests: [],
  stats: null,
  displayName: null,
  generating: null,
  completing: null,
  error: null,
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function QuestsPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initial);
  const { loading, quests, stats, displayName, generating, completing, error } = state;

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/onboarding");
        return;
      }

      const [questsRes, statsRes, profileRes] = await Promise.all([
        supabase
          .from("quests")
          .select("*")
          .eq("user_id", user.id)
          .order("generated_at", { ascending: false }),
        supabase
          .from("user_stats")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("display_name, onboarding_answers")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (cancelled) return;

      // If profile has no onboarding answers yet, send them back
      const answers = profileRes.data?.onboarding_answers;
      if (!answers || Object.keys(answers).length === 0) {
        router.replace("/onboarding");
        return;
      }

      dispatch({
        type: "LOADED",
        quests: questsRes.data ?? [],
        stats: statsRes.data ?? null,
        displayName: profileRes.data?.display_name ?? null,
      });
    }

    load().catch((err) => {
      if (!cancelled) {
        console.error("[quests] load error", err);
        dispatch({ type: "SET_ERROR", message: "Failed to load your quests." });
      }
    });

    return () => { cancelled = true; };
  }, [router]);

  // ── Generate quest ─────────────────────────────────────────────────────────
  const generateQuest = useCallback(async (tier: QuestTier) => {
    dispatch({ type: "SET_GENERATING", tier });
    dispatch({ type: "DISMISS_ERROR" });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/onboarding");
        return;
      }

      const res = await fetch("/api/generate-quest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const json = await res.json();

      if (!res.ok) {
        dispatch({ type: "SET_ERROR", message: json.error ?? "Quest generation failed." });
        return;
      }

      dispatch({ type: "QUEST_ADDED", quest: json.quest });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      dispatch({ type: "SET_GENERATING", tier: null });
    }
  }, [router]);

  // ── Complete quest ─────────────────────────────────────────────────────────
  const completeQuest = useCallback(async (quest: Quest) => {
    if (!stats) return;
    dispatch({ type: "SET_COMPLETING", questId: quest.id });

    try {
      // 1. Mark quest complete
      const { error: questErr } = await supabase
        .from("quests")
        .update({ status: "completed" })
        .eq("id", quest.id);

      if (questErr) throw questErr;

      // 2. Update user_stats (read-modify-write from local state)
      const newCounts = {
        ...stats.completed_counts,
        [quest.tier]: (stats.completed_counts[quest.tier] ?? 0) + 1,
      };
      const { data: updatedStats, error: statsErr } = await supabase
        .from("user_stats")
        .update({
          total_xp: stats.total_xp + quest.reward_xp,
          completed_counts: newCounts,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", stats.user_id)
        .select()
        .single();

      if (statsErr) throw statsErr;

      dispatch({
        type: "QUEST_COMPLETED",
        questId: quest.id,
        stats: updatedStats,
      });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        message: err instanceof Error ? err.message : "Failed to complete quest.",
      });
    }
  }, [stats]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-display text-[#c9952a] text-sm tracking-widest uppercase animate-pulse">
            ✦ &nbsp;Consulting the scrolls…&nbsp; ✦
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Stats header */}
        <StatsBar displayName={displayName} stats={stats} />

        {/* Error banner */}
        {error && (
          <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => dispatch({ type: "DISMISS_ERROR" })}
              className="shrink-0 text-red-400 hover:text-red-600 font-bold text-base leading-none"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quest tabs */}
        <Tabs defaultValue="daily">
          <TabsList
            className="w-full bg-[#e8dcc8]/60 border border-[#c9952a]/20 p-1 rounded-xl h-auto mb-6"
          >
            {(["daily", "weekly", "monthly"] as const).map((tier) => (
              <TabsTrigger
                key={tier}
                value={tier}
                className="flex-1 py-2 text-sm font-semibold capitalize text-[#6b5c44] hover:text-[#1a1209] rounded-lg transition-all duration-200 data-active:bg-[#2d4a1e] data-active:text-white data-active:shadow-sm"
              >
                {tier}
              </TabsTrigger>
            ))}
          </TabsList>

          {(["daily", "weekly", "monthly"] as const).map((tier) => (
            <TabsContent key={tier} value={tier}>
              <TierPanel
                tier={tier}
                quests={quests}
                generating={generating === tier}
                completing={completing}
                onGenerate={() => generateQuest(tier)}
                onComplete={completeQuest}
              />
            </TabsContent>
          ))}
        </Tabs>

      </div>
    </div>
  );
}
