"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { timeUntil } from "@/lib/time";
import type { Database } from "@/lib/database.types";

type Quest = Database["public"]["Tables"]["quests"]["Row"];

interface Props {
  quest: Quest;
  isCompleting: boolean;
  isExiting: boolean;
  xpGained: number | null;
  completeError: string | null;
  onComplete: () => void;
  onExitComplete: () => void;
}

const TIER_BADGE: Record<Quest["tier"], string> = {
  daily:   "bg-[#2d4a1e]/10 text-[#2d4a1e]   border-[#2d4a1e]/25",
  weekly:  "bg-[#7c4f2a]/10 text-[#7c4f2a]   border-[#7c4f2a]/25",
  monthly: "bg-[#c9952a]/12 text-[#a37820]   border-[#c9952a]/35",
};

const TIER_CARD_BORDER: Record<Quest["tier"], string> = {
  daily:   "border-[#2d4a1e]/20",
  weekly:  "border-[#7c4f2a]/20",
  monthly: "border-[#c9952a]/30 shadow-[0_0_18px_rgba(201,149,42,0.1)]",
};

export default function QuestCard({
  quest,
  isCompleting,
  isExiting,
  xpGained,
  completeError,
  onComplete,
  onExitComplete,
}: Props) {
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When exit animation begins, fire onExitComplete after it ends.
  useEffect(() => {
    if (!isExiting) return;
    exitTimerRef.current = setTimeout(onExitComplete, 520);
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [isExiting, onExitComplete]);

  return (
    // Outer wrapper collapses the height when exiting (grid-rows trick)
    <div
      style={{
        display: "grid",
        gridTemplateRows: isExiting ? "0fr" : "1fr",
        opacity: isExiting ? 0 : 1,
        marginBottom: isExiting ? 0 : undefined,
        transition: "grid-template-rows 500ms ease, opacity 420ms ease, margin 500ms ease",
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        {/* Inner card — subtle hover tilt, scale on exit */}
        <div
          className={cn(
            "mb-3 rounded-xl border-2 bg-[#faf6ef] p-5 space-y-3",
            "transition-transform duration-300 hover:-rotate-[0.6deg] hover:shadow-md",
            "relative overflow-hidden",
            TIER_CARD_BORDER[quest.tier],
          )}
        >
          {/* XP float animation overlay */}
          {xpGained !== null && (
            <div
              key={quest.id + "-xp"} // re-mount when key changes to restart animation
              className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none z-20"
              aria-hidden
            >
              <span className="animate-xp-float font-display text-2xl font-bold text-[#c9952a] drop-shadow-sm">
                +{xpGained} XP
              </span>
            </div>
          )}

          {/* Header: tier badge + expiry */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border",
                TIER_BADGE[quest.tier],
              )}
            >
              {quest.tier}
            </span>
            <span className="text-[10px] text-[#6b5c44]/60 tabular-nums">
              Expires in {timeUntil(quest.expires_at)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display text-base font-semibold text-[#1a1209] leading-snug">
            {quest.title}
          </h3>

          {/* Flavor text */}
          {quest.flavor_text && (
            <p className="text-xs italic text-[#c9952a] leading-relaxed border-l-2 border-[#c9952a]/35 pl-3">
              {quest.flavor_text}
            </p>
          )}

          {/* Description */}
          <p className="text-sm text-[#4a3c2a] leading-relaxed">
            {quest.description}
          </p>

          {/* Success criteria */}
          {quest.success_criteria && (
            <div className="flex items-start gap-2 bg-[#2d4a1e]/6 rounded-lg px-3 py-2.5">
              <span className="mt-px text-[#2d4a1e] text-xs shrink-0">☐</span>
              <p className="text-xs text-[#2d4a1e] leading-relaxed">
                <span className="font-semibold">Done when: </span>
                {quest.success_criteria}
              </p>
            </div>
          )}

          {/* Complete error */}
          {completeError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {completeError}
            </p>
          )}

          {/* Footer: XP + complete button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-[#c9952a]">
              ⚡ {quest.reward_xp} XP
            </span>

            <button
              onClick={onComplete}
              disabled={isCompleting || isExiting}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold text-white",
                "bg-[#2d4a1e] hover:bg-[#3d5e2a]",
                "transition-all duration-150 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isCompleting ? "Marking…" : "Mark Complete ✦"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
