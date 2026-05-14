interface Props {
  current: number;
  total: number;
}

export default function OnboardingProgress({ current, total }: Props) {
  const pct = Math.round(((current - 1) / (total - 1)) * 100);

  return (
    <div className="w-full max-w-lg mx-auto mb-8">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2d4a1e]/60">
          The Journey
        </span>
        <span className="text-xs text-[#2d4a1e]/60">
          <span className="font-bold text-[#2d4a1e]">{current}</span>
          <span className="text-[#c9952a] mx-1">/</span>
          {total}
        </span>
      </div>
      <div className="h-1.5 bg-[#e0d0b8] rounded-full overflow-hidden border border-[#c9952a]/20">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #2d4a1e 0%, #c9952a 100%)",
          }}
        />
      </div>
    </div>
  );
}
