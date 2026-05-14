"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LifeChapter, LifeChapterAnswer } from "@/lib/onboarding-schema";

interface Props {
  value: Partial<LifeChapterAnswer>;
  onChange: (v: LifeChapterAnswer) => void;
}

const CHAPTERS: { id: LifeChapter; label: string; icon: string }[] = [
  { id: "student", label: "Student", icon: "📚" },
  { id: "working", label: "Working", icon: "⚒️" },
  { id: "between", label: "Between Things", icon: "🌊" },
  { id: "retired", label: "Retired", icon: "🌅" },
  { id: "other", label: "Other", icon: "✦" },
];

export default function Step2LifeChapter({ value, onChange }: Props) {
  const select = (choice: LifeChapter) =>
    onChange({ choice, other: choice === "other" ? (value.other ?? "") : undefined });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          Which life chapter finds you now?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          Your current season shapes the quests we'll craft.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {CHAPTERS.map(({ id, label, icon }) => {
          const selected = value.choice === id;
          return (
            <button
              key={id}
              onClick={() => select(id)}
              className={cn(
                "flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium",
                "border-[#c9952a]/30 bg-[#faf6ef] hover:border-[#c9952a] hover:bg-[#f5ede0] text-[#1a1209]",
                selected &&
                  "border-[#2d4a1e] bg-[#2d4a1e] text-white hover:bg-[#2d4a1e] hover:border-[#2d4a1e]"
              )}
            >
              <span className="text-lg shrink-0">{icon}</span>
              {label}
              {selected && <span className="ml-auto text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      {value.choice === "other" && (
        <Input
          value={value.other ?? ""}
          onChange={(e) => onChange({ choice: "other", other: e.target.value })}
          placeholder="Describe your chapter..."
          maxLength={100}
          className="bg-[#faf6ef] border-[#c9952a]/40 focus-visible:ring-[#2d4a1e] focus-visible:border-[#2d4a1e] text-[#1a1209]"
          autoFocus
        />
      )}
    </div>
  );
}
