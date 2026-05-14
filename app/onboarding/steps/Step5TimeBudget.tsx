"use client";

import { cn } from "@/lib/utils";
import type { TimeBudget } from "@/lib/onboarding-schema";

interface Props {
  value: TimeBudget | "";
  onChange: (v: TimeBudget) => void;
}

const OPTIONS: { id: TimeBudget; label: string; description: string; icon: string }[] = [
  { id: "15min", label: "15 minutes", description: "A quick side quest", icon: "⏱️" },
  { id: "30min", label: "30 minutes", description: "A proper foray", icon: "🕰️" },
  { id: "1hour", label: "1 hour", description: "A full expedition", icon: "🗺️" },
];

export default function Step5TimeBudget({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          How long can you spare each day?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          Your daily quests will be sized to fit this window.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.map(({ id, label, description, icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                "flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200",
                "border-[#c9952a]/30 bg-[#faf6ef] hover:border-[#c9952a] hover:bg-[#f5ede0]",
                selected && "border-[#2d4a1e] bg-[#2d4a1e] hover:bg-[#2d4a1e] hover:border-[#2d4a1e]"
              )}
            >
              <span className="text-2xl shrink-0">{icon}</span>
              <div>
                <div className={cn("text-base font-semibold", selected ? "text-white" : "text-[#1a1209]")}>
                  {label}
                </div>
                <div className={cn("text-xs", selected ? "text-white/70" : "text-[#6b5c44]")}>
                  {description}
                </div>
              </div>
              {selected && <span className="ml-auto text-white font-bold shrink-0">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
