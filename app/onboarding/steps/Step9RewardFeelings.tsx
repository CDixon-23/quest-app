"use client";

import { cn } from "@/lib/utils";
import type { RewardFeeling } from "@/lib/onboarding-schema";

interface Props {
  value: RewardFeeling[];
  onChange: (v: RewardFeeling[]) => void;
}

const FEELINGS: { id: RewardFeeling; label: string; icon: string }[] = [
  { id: "learning_something_new", label: "Learning something new", icon: "🧠" },
  { id: "making_something", label: "Making something", icon: "🛠️" },
  { id: "connecting_with_someone", label: "Connecting with someone", icon: "💛" },
  { id: "pushing_my_limits", label: "Pushing my limits", icon: "🔥" },
  { id: "quiet_wins", label: "Quiet wins", icon: "🌿" },
];

export default function Step9RewardFeelings({ value, onChange }: Props) {
  const toggle = (f: RewardFeeling) =>
    onChange(value.includes(f) ? value.filter((r) => r !== f) : [...value, f]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          What does "rewarding" feel like to you?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          We'll weight your quests toward what actually satisfies you. At least one required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {FEELINGS.map(({ id, label, icon }) => {
          const selected = value.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={cn(
                "flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-lg border-2 transition-all duration-200",
                "border-[#c9952a]/30 bg-[#faf6ef] hover:border-[#c9952a] hover:bg-[#f5ede0]",
                selected && "border-[#2d4a1e] bg-[#2d4a1e] hover:bg-[#2d4a1e] hover:border-[#2d4a1e]"
              )}
            >
              <span className="text-xl shrink-0">{icon}</span>
              <span className={cn("text-sm font-medium", selected ? "text-white" : "text-[#1a1209]")}>
                {label}
              </span>
              {selected && <span className="ml-auto text-white text-xs font-bold shrink-0">✓</span>}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-[#2d4a1e] font-semibold">
          {value.length} feeling{value.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}
