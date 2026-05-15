"use client";

import type { RankInfo } from "@/lib/ranks";

interface Props {
  rankInfo: RankInfo;
  totalXp: number;
}

export default function RankBadge({ rankInfo, totalXp }: Props) {
  const { rank, nextRank, progress, xpToNext } = rankInfo;
  const isLegend = !nextRank;

  return (
    <div className="rounded-2xl border bg-[#faf6ef] p-6 space-y-5" style={{ borderColor: rank.borderColor }}>
      {/* Badge header */}
      <div className="flex items-center gap-4">
        <div
          className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 shrink-0 ${isLegend ? "legend-glow" : ""}`}
          style={{ background: rank.bgColor, borderColor: rank.borderColor }}
        >
          <span
            className="font-display text-xl font-bold leading-none"
            style={{ color: rank.color }}
          >
            {rank.name[0]}
          </span>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6b5c44]/60 mb-0.5">
            Current Rank
          </p>
          <h2
            className="font-display text-2xl font-bold leading-tight"
            style={{ color: rank.color }}
          >
            {rank.name}
          </h2>
          <p className="text-xs text-[#6b5c44] mt-0.5">{rank.description}</p>
        </div>
      </div>

      {/* XP */}
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-[#c9952a]">
          {totalXp.toLocaleString()}
        </span>
        <span className="text-sm text-[#6b5c44] uppercase tracking-widest">XP total</span>
      </div>

      {/* Progress bar */}
      {isLegend ? (
        <div className="space-y-1.5">
          <div className="h-2 rounded-full overflow-hidden bg-[#ede9fe]">
            <div className="h-full rounded-full bg-[#7c3aed] w-full" />
          </div>
          <p className="text-xs text-[#6b5c44]/70 text-center">
            Maximum rank attained — you are a Legend.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: `${rank.bgColor}` }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:      `${Math.round(progress * 100)}%`,
                background: rank.borderColor,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#6b5c44]/60 font-medium">
            <span>{rank.name}</span>
            <span>{xpToNext.toLocaleString()} XP to {nextRank!.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
