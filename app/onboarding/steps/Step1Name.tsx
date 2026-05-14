"use client";

import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function Step1Name({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          What shall we call you, traveler?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          This is the name your legend will be written under.
        </p>
      </div>

      <div className="space-y-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={80}
          placeholder="e.g. Thorin Oakenshield"
          className="bg-[#faf6ef] border-[#c9952a]/40 focus-visible:ring-[#2d4a1e] focus-visible:border-[#2d4a1e] text-[#1a1209] placeholder:text-[#b0a090] text-lg h-12"
          autoFocus
        />
        <p className="text-xs text-right text-[#6b5c44]/60">{value.length} / 80</p>
      </div>
    </div>
  );
}
