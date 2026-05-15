"use client";

import { useCallback, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StatsHeader from "./StatsHeader";
import SummonButton from "./SummonButton";
import QuestCard from "./QuestCard";
import type { Database, QuestTier } from "@/lib/database.types";

type Quest     = Database["public"]["Tables"]["quests"]["Row"];
type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];

// ─── State & reducer ──────────────────────────────────────────────────────────

type GeneratingMap = Record<QuestTier, boolean>;
type ErrorMap      = Record<QuestTier, string | null>;

type State = {
  quests: Quest[];
  stats: UserStats;
  generating: GeneratingMap;
  generateErrors: ErrorMap;
  completing: string | null;   // quest ID being completed (API in-flight)
  exiting: string | null;      // quest ID playing exit animation
  xpGained: number | null;     // amount for the floating +XP text
  completeErrors: Record<string, string>; // per-quest-id complete errors
};

type Action =
  | { type: "GENERATE_START";        tier: QuestTier }
  | { type: "GENERATE_DONE";         tier: QuestTier; quest: Quest }
  | { type: "GENERATE_ERROR";        tier: QuestTier; message: string }
  | { type: "GENERATE_ERROR_CLEAR";  tier: QuestTier }
  | { type: "COMPLETE_START";        questId: string }
  | { type: "COMPLETE_SUCCESS";      questId: string; xpGained: number; stats: UserStats }
  | { type: "COMPLETE_ERROR";        questId: string; message: string }
  | { type: "QUEST_EXIT_DONE";       questId: string };

const IDLE_GENERATING: GeneratingMap = { daily: false, weekly: false, monthly: false };
const IDLE_ERRORS: ErrorMap          = { daily: null,  weekly: null,  monthly: null  };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "GENERATE_START":
      return {
        ...state,
        generating:     { ...state.generating,     [action.tier]: true },
        generateErrors: { ...state.generateErrors, [action.tier]: null },
      };

    case "GENERATE_DONE":
      return {
        ...state,
        generating: { ...state.generating, [action.tier]: false },
        quests:     [action.quest, ...state.quests],
      };

    case "GENERATE_ERROR":
      return {
        ...state,
        generating:     { ...state.generating,     [action.tier]: false },
        generateErrors: { ...state.generateErrors, [action.tier]: action.message },
      };

    case "GENERATE_ERROR_CLEAR":
      return {
        ...state,
        generateErrors: { ...state.generateErrors, [action.tier]: null },
      };

    case "COMPLETE_START":
      return { ...state, completing: action.questId };

    case "COMPLETE_SUCCESS":
      return {
        ...state,
        completing: null,
        exiting:    action.questId,
        xpGained:   action.xpGained,
        stats:      action.stats,
        // Remove any previous complete error for this quest
        completeErrors: Object.fromEntries(
          Object.entries(state.completeErrors).filter(([id]) => id !== action.questId)
        ),
      };

    case "COMPLETE_ERROR":
      return {
        ...state,
        completing:     null,
        completeErrors: { ...state.completeErrors, [action.questId]: action.message },
      };

    case "QUEST_EXIT_DONE":
      return {
        ...state,
        quests:    state.quests.filter((q) => q.id !== action.questId),
        exiting:   null,
        xpGained:  null,
      };

    default:
      return state;
  }
}

// ─── Tier sort order ──────────────────────────────────────────────────────────

const TIER_ORDER: Record<QuestTier, number> = { monthly: 0, weekly: 1, daily: 2 };

function sortedQuests(quests: Quest[]): Quest[] {
  return [...quests].sort((a, b) => {
    const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialQuests:         Quest[];
  initialStats:          UserStats;
  displayName:           string | null;
  recentlyExpiredQuests: Quest[];
}

export default function QuestDashboard({ initialQuests, initialStats, displayName, recentlyExpiredQuests }: Props) {
  const router = useRouter();
  const [expiredDismissed, setExpiredDismissed] = useState(false);

  const [state, dispatch] = useReducer(reducer, {
    quests:         initialQuests,
    stats:          initialStats,
    generating:     IDLE_GENERATING,
    generateErrors: IDLE_ERRORS,
    completing:     null,
    exiting:        null,
    xpGained:       null,
    completeErrors: {},
  });

  const { quests, stats, generating, generateErrors, completing, exiting, xpGained, completeErrors } = state;

  // ── Generate quest ─────────────────────────────────────────────────────────
  const generateQuest = useCallback(async (tier: QuestTier) => {
    dispatch({ type: "GENERATE_START", tier });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }

      const res = await fetch("/api/generate-quest", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const json = await res.json();
      if (!res.ok) {
        dispatch({ type: "GENERATE_ERROR", tier, message: json.error ?? "Quest generation failed." });
        return;
      }
      dispatch({ type: "GENERATE_DONE", tier, quest: json.quest });
    } catch (err) {
      dispatch({
        type: "GENERATE_ERROR",
        tier,
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }, [router]);

  // ── Complete quest ─────────────────────────────────────────────────────────
  const completeQuest = useCallback(async (quest: Quest) => {
    dispatch({ type: "COMPLETE_START", questId: quest.id });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth"); return; }

      const res = await fetch(`/api/quests/${quest.id}/complete`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const json = await res.json();
      if (!res.ok) {
        dispatch({ type: "COMPLETE_ERROR", questId: quest.id, message: json.error ?? "Failed to complete quest." });
        return;
      }
      dispatch({
        type:     "COMPLETE_SUCCESS",
        questId:  quest.id,
        xpGained: json.xp_gained,
        stats:    json.stats,
      });
    } catch (err) {
      dispatch({
        type:    "COMPLETE_ERROR",
        questId: quest.id,
        message: err instanceof Error ? err.message : "Failed to complete quest.",
      });
    }
  }, [router]);

  const handleExitComplete = useCallback((questId: string) => {
    dispatch({ type: "QUEST_EXIT_DONE", questId });
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const activeQuests = sortedQuests(quests);
  const hasQuestForTier = (tier: QuestTier) =>
    quests.some((q) => q.tier === tier);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Stats header */}
        <StatsHeader displayName={displayName} stats={stats} />

        {/* Expired notice */}
        {!expiredDismissed && recentlyExpiredQuests.length > 0 && (
          <div className="rounded-xl border border-[#b0a090]/50 bg-[#e8dcc8]/60 px-4 py-3 flex items-start justify-between gap-3">
            <div className="text-xs text-[#6b5c44] leading-relaxed">
              <span className="font-semibold text-[#1a1209]">
                {recentlyExpiredQuests.length} quest{recentlyExpiredQuests.length !== 1 ? "s" : ""} expired
              </span>{" "}
              since your last visit:{" "}
              {recentlyExpiredQuests.map((q) => q.title).join(", ")}.
            </div>
            <button
              onClick={() => setExpiredDismissed(true)}
              aria-label="Dismiss expired notice"
              className="shrink-0 text-[#6b5c44]/50 hover:text-[#6b5c44] text-sm leading-none mt-0.5 transition-colors"
            >
              ×
            </button>
          </div>
        )}

        {/* Summon buttons */}
        <section aria-label="Summon a quest">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b5c44]/50 mb-4">
            Choose your next adventure
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["daily", "weekly", "monthly"] as const).map((tier) => (
              <SummonButton
                key={tier}
                tier={tier}
                disabled={hasQuestForTier(tier)}
                generating={generating[tier]}
                error={generateErrors[tier]}
                onSummon={() => generateQuest(tier)}
                onErrorDismiss={() => dispatch({ type: "GENERATE_ERROR_CLEAR", tier })}
              />
            ))}
          </div>
        </section>

        {/* Quest list */}
        <section aria-label="Active quests">
          {activeQuests.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b5c44]/50 mb-4">
                Your active quests
              </p>
              <div>
                {activeQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    isCompleting={completing === quest.id}
                    isExiting={exiting === quest.id}
                    xpGained={exiting === quest.id ? xpGained : null}
                    completeError={completeErrors[quest.id] ?? null}
                    onComplete={() => completeQuest(quest)}
                    onExitComplete={() => handleExitComplete(quest.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#c9952a]/25 bg-[#faf6ef]/60 px-8 py-14 text-center space-y-3">
      <p className="text-2xl leading-none opacity-40" aria-hidden>✦</p>
      <p className="font-display text-lg font-semibold text-[#1a1209]">
        Your quest log is empty, traveler.
      </p>
      <p className="text-sm text-[#6b5c44]">
        Choose your next adventure above and let the Guide light your path.
      </p>
    </div>
  );
}
