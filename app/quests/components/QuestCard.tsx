"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/database.types";

type Quest = Database["public"]["Tables"]["quests"]["Row"];

interface Props {
  quest: Quest;
  onComplete: (quest: Quest) => void;
  completing: boolean;
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

const STATUS_STYLES: Record<Quest["status"], string> = {
  active:    "bg-[#2d4a1e]/10 text-[#2d4a1e] border-[#2d4a1e]/20",
  completed: "bg-[#c9952a]/10 text-[#a37820] border-[#c9952a]/20",
  expired:   "bg-[#b0a090]/10 text-[#8a7a6a] border-[#b0a090]/20",
};

const STATUS_LABELS: Record<Quest["status"], string> = {
  active:    "Active",
  completed: "✓ Complete",
  expired:   "Expired",
};

export default function QuestCard({ quest, onComplete, completing }: Props) {
  const isActive = quest.status === "active";
  const isPast   = !isActive;

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-5 space-y-3 transition-all duration-200",
        isActive
          ? "bg-[#faf6ef] border-[#c9952a]/30 shadow-[0_2px_12px_rgba(45,74,30,0.06)]"
          : "bg-[#f5ede0]/50 border-[#c9952a]/10 opacity-70",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "font-display text-base font-semibold leading-snug",
            isActive ? "text-[#1a1209]" : "text-[#4a3c2a]",
          )}
        >
          {quest.title}
        </h3>
        <span
          className={cn(
            "shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            STATUS_STYLES[quest.status],
          )}
        >
          {STATUS_LABELS[quest.status]}
        </span>
      </div>

      {/* Flavor text */}
      {quest.flavor_text && (
        <p
          className={cn(
            "text-xs italic leading-relaxed border-l-2 pl-3",
            isActive
              ? "text-[#c9952a] border-[#c9952a]/40"
              : "text-[#8a7a6a] border-[#b0a090]/40",
          )}
        >
          {quest.flavor_text}
        </p>
      )}

      {/* Description */}
      <p className={cn("text-sm leading-relaxed", isActive ? "text-[#4a3c2a]" : "text-[#6b5c44]")}>
        {quest.description}
      </p>

      {/* Success criteria */}
      {quest.success_criteria && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2.5",
            isActive ? "bg-[#2d4a1e]/6" : "bg-[#6b5c44]/5",
          )}
        >
          <span className={cn("mt-px text-xs shrink-0", isActive ? "text-[#2d4a1e]" : "text-[#8a7a6a]")}>
            ✦
          </span>
          <p className={cn("text-xs leading-relaxed", isActive ? "text-[#2d4a1e]" : "text-[#6b5c44]")}>
            <span className="font-semibold">Done when: </span>
            {quest.success_criteria}
          </p>
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs text-[#6b5c44]">
          <span className="font-semibold text-[#c9952a]">⚡ {quest.reward_xp} XP</span>
          {isActive && (
            <span className="opacity-70">{timeRemaining(quest.expires_at)}</span>
          )}
          {quest.status === "completed" && (
            <span className="opacity-60">
              {new Date(quest.generated_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {isActive && (
          <Button
            size="sm"
            onClick={() => onComplete(quest)}
            disabled={completing}
            className="bg-[#2d4a1e] hover:bg-[#3d5e2a] text-white text-xs px-4 py-1.5 h-auto disabled:opacity-50"
          >
            {completing ? "Saving…" : "Complete ✦"}
          </Button>
        )}

        {isPast && quest.status === "completed" && (
          <span className="text-[#c9952a] text-xs font-bold">+{quest.reward_xp} XP earned</span>
        )}
      </div>
    </div>
  );
}
