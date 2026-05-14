"use client";

import { Button } from "@/components/ui/button";
import QuestCard from "./QuestCard";
import type { Database } from "@/lib/database.types";
import type { QuestTier } from "@/lib/database.types";

type Quest = Database["public"]["Tables"]["quests"]["Row"];

interface Props {
  tier: QuestTier;
  quests: Quest[];
  generating: boolean;
  completing: string | null;
  onGenerate: () => void;
  onComplete: (quest: Quest) => void;
}

const TIER_DESCRIPTION: Record<QuestTier, string> = {
  daily:   "A quest completable in your daily time window.",
  weekly:  "A multi-step challenge to spread across the week.",
  monthly: "A meaningful project that unfolds over the month.",
};

const TIER_ICON: Record<QuestTier, string> = {
  daily:   "☀️",
  weekly:  "🌙",
  monthly: "⭐",
};

export default function TierPanel({
  tier, quests, generating, completing, onGenerate, onComplete,
}: Props) {
  const active = quests.filter((q) => q.tier === tier && q.status === "active");
  const history = quests.filter((q) => q.tier === tier && q.status !== "active");

  return (
    <div className="space-y-6">
      {/* Tier description + generate button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#faf6ef]/60 border border-[#c9952a]/20 rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{TIER_ICON[tier]}</span>
          <p className="text-sm text-[#6b5c44]">{TIER_DESCRIPTION[tier]}</p>
        </div>
        <Button
          onClick={onGenerate}
          disabled={generating}
          className="shrink-0 bg-[#2d4a1e] hover:bg-[#3d5e2a] text-white font-semibold px-6 disabled:opacity-60"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <ForgeSpinner />
              Forging quest…
            </span>
          ) : (
            `Generate ${tier} quest ✦`
          )}
        </Button>
      </div>

      {/* Active quests */}
      {active.length > 0 && (
        <section className="space-y-3">
          <SectionLabel>Active</SectionLabel>
          {active.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              onComplete={onComplete}
              completing={completing === q.id}
            />
          ))}
        </section>
      )}

      {/* Empty state */}
      {active.length === 0 && !generating && (
        <div className="text-center py-10 text-[#6b5c44]/60 text-sm italic">
          No active {tier} quest — forge one above to begin.
        </div>
      )}

      {/* Loading placeholder while generating */}
      {generating && (
        <div className="rounded-xl border-2 border-dashed border-[#c9952a]/30 bg-[#faf6ef]/50 p-6 text-center">
          <p className="font-display text-sm text-[#6b5c44] animate-pulse">
            The Quest Master is inscribing your scroll…
          </p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="space-y-2">
          <SectionLabel>History</SectionLabel>
          {history.map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              onComplete={onComplete}
              completing={completing === q.id}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2d4a1e]/50">
      {children}
    </p>
  );
}

function ForgeSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
