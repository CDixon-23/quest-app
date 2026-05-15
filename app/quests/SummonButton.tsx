"use client";

import { cn } from "@/lib/utils";
import type { QuestTier } from "@/lib/database.types";

interface Props {
  tier: QuestTier;
  disabled: boolean;
  generating: boolean;
  error: string | null;
  onSummon: () => void;
  onErrorDismiss: () => void;
}

const TIER_CONFIG: Record<QuestTier, {
  icon: string;
  label: string;
  scope: string;
  xpRange: string;
  accentColor: string;
  badgeClass: string;
}> = {
  daily: {
    icon: "☀",
    label: "Summon Daily Quest",
    scope: "15 – 60 min",
    xpRange: "50 – 150 XP",
    accentColor: "#2d4a1e",
    badgeClass: "bg-[#2d4a1e]/12 text-[#2d4a1e] border-[#2d4a1e]/30",
  },
  weekly: {
    icon: "◈",
    label: "Summon Weekly Quest",
    scope: "Multi-day",
    xpRange: "300 – 600 XP",
    accentColor: "#7c4f2a",
    badgeClass: "bg-[#7c4f2a]/12 text-[#7c4f2a] border-[#7c4f2a]/30",
  },
  monthly: {
    icon: "✦",
    label: "Summon Monthly Quest",
    scope: "Full month",
    xpRange: "1,500 – 3,000 XP",
    accentColor: "#a37820",
    badgeClass: "bg-[#c9952a]/12 text-[#a37820] border-[#c9952a]/30",
  },
};

export default function SummonButton({
  tier,
  disabled,
  generating,
  error,
  onSummon,
  onErrorDismiss,
}: Props) {
  const cfg = TIER_CONFIG[tier];
  const isInteractive = !disabled && !generating;

  return (
    <div className="flex flex-col gap-2">
      {/* Tooltip wrapper — keeps hover even when button is disabled */}
      <div className="relative group">
        <button
          onClick={onSummon}
          disabled={!isInteractive}
          aria-label={cfg.label}
          className={cn(
            "w-full flex flex-col items-center gap-2 px-4 py-5 rounded-xl",
            "border-2 transition-all duration-200",
            "bg-[#faf6ef] text-left",
            isInteractive
              ? [
                  "border-[#c9952a]/40 cursor-pointer",
                  "hover:border-[#c9952a]/80 hover:bg-[#f5ede0]",
                  "hover:shadow-[0_4px_20px_rgba(201,149,42,0.18)]",
                  "active:scale-[0.98]",
                ]
              : "border-[#c9952a]/15 bg-[#faf6ef]/60 cursor-default opacity-60",
          )}
        >
          {/* Top: tier badge */}
          <div className="w-full flex items-center justify-between">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border",
                cfg.badgeClass,
              )}
            >
              {tier}
            </span>

            {generating && (
              <span className="flex items-center gap-1.5 text-xs text-[#6b5c44]">
                <Spinner />
                Forging…
              </span>
            )}

            {disabled && !generating && (
              <span className="text-[10px] text-[#6b5c44]/50 italic">active</span>
            )}
          </div>

          {/* Icon + label row */}
          <div className="w-full flex items-center gap-3">
            <span
              className="text-2xl leading-none shrink-0"
              style={{ color: cfg.accentColor }}
              aria-hidden
            >
              {cfg.icon}
            </span>
            <span className="font-display text-sm font-semibold text-[#1a1209] leading-snug">
              {generating ? "The Guide is writing your scroll…" : cfg.label}
            </span>
          </div>

          {/* Scope + XP */}
          <div className="w-full flex items-center gap-3 text-[11px] text-[#6b5c44]">
            <span>{cfg.scope}</span>
            <span className="text-[#c9952a]/50">·</span>
            <span className="font-medium" style={{ color: cfg.accentColor }}>
              {cfg.xpRange}
            </span>
          </div>
        </button>

        {/* Tooltip — shown on hover when disabled */}
        {disabled && !generating && (
          <div
            className={cn(
              "absolute -top-11 left-1/2 -translate-x-1/2 z-10",
              "px-3 py-1.5 rounded-lg text-xs text-white whitespace-nowrap",
              "bg-[#1a1209] shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none",
            )}
          >
            You already have an active {tier} quest
            {/* Arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#1a1209]" />
          </div>
        )}
      </div>

      {/* Inline error */}
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          <span>{error}</span>
          <button
            onClick={onErrorDismiss}
            className="shrink-0 text-red-400 hover:text-red-600 font-bold leading-none"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-3.5 w-3.5 text-[#6b5c44]"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
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
