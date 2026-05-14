"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const LEVEL_LABELS: Record<number, { title: string; flavor: string }> = {
  1: { title: "Homebody Hobbit", flavor: "Cozy, familiar, close to the hearth." },
  2: { title: "Cautious Traveler", flavor: "A little stretch, but nothing wild." },
  3: { title: "Seasoned Explorer", flavor: "Comfortably outside the comfort zone." },
  4: { title: "Bold Adventurer", flavor: "New territory, real stakes." },
  5: { title: "Reckless Ranger", flavor: "You'll try anything. No promises made." },
};

export default function Step4DaringLevel({ value, onChange }: Props) {
  const { title, flavor } = LEVEL_LABELS[value];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          How daring are your quests?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          We'll calibrate how far outside your comfort zone we push you.
        </p>
      </div>

      {/* Current level display */}
      <div className="text-center py-6 px-4 rounded-xl bg-[#2d4a1e] space-y-1">
        <p className="font-display text-xl font-semibold text-white">{title}</p>
        <p className="text-sm text-white/70">{flavor}</p>
      </div>

      <div className="space-y-4 px-1">
        {/* Override primary color to forest green via CSS variable */}
        <div style={{ "--primary": "96 42% 20%" } as React.CSSProperties}>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[value]}
            onValueChange={(vals) => {
              const v = typeof vals === "number" ? vals : vals[0];
              onChange(v);
            }}
          />
        </div>

        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 border-2",
                n === value
                  ? "bg-[#c9952a] border-[#c9952a] text-white scale-110"
                  : "border-[#c9952a]/30 bg-[#faf6ef] text-[#6b5c44] hover:border-[#c9952a]"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-xs text-[#6b5c44]/60 px-1">
          <span>Stay cozy</span>
          <span>Go wild</span>
        </div>
      </div>
    </div>
  );
}
