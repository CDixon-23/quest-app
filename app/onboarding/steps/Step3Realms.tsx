"use client";

import { cn } from "@/lib/utils";
import type { Realm } from "@/lib/onboarding-schema";

interface Props {
  value: Realm[];
  onChange: (v: Realm[]) => void;
}

const REALMS: { id: Realm; label: string; icon: string; description: string }[] = [
  { id: "physical_outdoor", label: "Physical & Outdoor", icon: "🏔️", description: "Body, nature, movement" },
  { id: "creative", label: "Creative", icon: "🎨", description: "Art, making, expression" },
  { id: "social", label: "Social", icon: "🤝", description: "People, connection, community" },
  { id: "learning", label: "Learning", icon: "📜", description: "Knowledge, skills, curiosity" },
  { id: "mindfulness", label: "Mindfulness", icon: "🕯️", description: "Reflection, calm, inner work" },
  { id: "career", label: "Career", icon: "⚡", description: "Work, growth, ambition" },
  { id: "weird_random", label: "Weird & Random", icon: "🎲", description: "The unexpected, the absurd" },
];

export default function Step3Realms({ value, onChange }: Props) {
  const toggle = (realm: Realm) =>
    onChange(value.includes(realm) ? value.filter((r) => r !== realm) : [...value, realm]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          Which realms call to you?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          Select all that stir something in you. At least one required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {REALMS.map(({ id, label, icon, description }) => {
          const selected = value.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={cn(
                "flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200",
                "border-[#c9952a]/30 bg-[#faf6ef] hover:border-[#c9952a] hover:bg-[#f5ede0]",
                selected && "border-[#2d4a1e] bg-[#2d4a1e] hover:bg-[#2d4a1e] hover:border-[#2d4a1e]"
              )}
            >
              <span className="text-xl shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-semibold", selected ? "text-white" : "text-[#1a1209]")}>
                  {label}
                </div>
                <div className={cn("text-xs", selected ? "text-white/70" : "text-[#6b5c44]")}>
                  {description}
                </div>
              </div>
              {selected && <span className="ml-auto text-white text-xs font-bold shrink-0">✓</span>}
            </button>
          );
        })}
      </div>

      {value.length > 0 && (
        <p className="text-xs text-[#2d4a1e] font-semibold">
          {value.length} realm{value.length !== 1 ? "s" : ""} chosen
        </p>
      )}
    </div>
  );
}
