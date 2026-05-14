"use client";

import { Textarea } from "@/components/ui/textarea";

const MAX = 500;

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function Step6SkillPuttingOff({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold text-[#1a1209] leading-snug">
          A skill you've been putting off?
        </h2>
        <p className="text-[#6b5c44] text-sm leading-relaxed">
          Something you've always meant to try or learn. We might nudge you toward it.{" "}
          <span className="italic opacity-70">(Optional)</span>
        </p>
      </div>

      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX))}
          placeholder="e.g. watercolour painting, conversational Italian, open-water swimming…"
          rows={4}
          className="bg-[#faf6ef] border-[#c9952a]/40 focus-visible:ring-[#2d4a1e] focus-visible:border-[#2d4a1e] text-[#1a1209] placeholder:text-[#b0a090] resize-none"
        />
        <p className="text-xs text-right text-[#6b5c44]/60">
          {value.length} / {MAX}
        </p>
      </div>
    </div>
  );
}
