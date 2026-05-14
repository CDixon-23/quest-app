"use client";

import { Textarea } from "@/components/ui/textarea";

const MAX = 500;

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function Step8HardNos({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          Anything we should never suggest?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          Hard limits, allergies, restrictions — we'll honour them, no questions asked.{" "}
          <span className="italic opacity-70">(Optional)</span>
        </p>
      </div>

      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX))}
          placeholder="e.g. no alcohol, no spending money, no public speaking, I have a bad knee…"
          rows={4}
          className="bg-[#faf6ef] border-[#c9952a]/40 focus-visible:ring-[#2d4a1e] focus-visible:border-[#2d4a1e] text-[#1a1209] placeholder:text-[#b0a090] resize-none"
        />
        <p className="text-xs text-right text-[#6b5c44]/60">
          {value.length} / {MAX}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["no alcohol", "no spending money", "no public speaking"].map((hint) => (
          <button
            key={hint}
            onClick={() => {
              const prefix = value ? value.trimEnd() + ", " : "";
              onChange((prefix + hint).slice(0, MAX));
            }}
            className="text-xs px-3 py-1 rounded-full border border-[#c9952a]/40 bg-[#faf6ef] text-[#6b5c44] hover:border-[#c9952a] hover:bg-[#f5ede0] transition-all"
          >
            + {hint}
          </button>
        ))}
      </div>
    </div>
  );
}
