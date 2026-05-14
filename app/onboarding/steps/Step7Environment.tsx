"use client";

import { cn } from "@/lib/utils";
import type { Environment } from "@/lib/onboarding-schema";

interface Props {
  value: Environment | "";
  onChange: (v: Environment) => void;
}

const OPTIONS: { id: Environment; label: string; description: string; icon: string }[] = [
  { id: "dense_city", label: "Dense City", description: "Millions of neighbours, endless options", icon: "🏙️" },
  { id: "suburb", label: "Suburb", description: "Space, but the city's near", icon: "🏘️" },
  { id: "small_town", label: "Small Town", description: "Everyone knows your name", icon: "⛪" },
  { id: "rural", label: "Rural", description: "Open land, stars at night", icon: "🌾" },
];

export default function Step7Environment({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          Where does your story unfold?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          Your surroundings shape what's possible. We'll keep quests local and realistic.
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
