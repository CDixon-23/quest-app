"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];

interface Props {
  displayName: string | null;
  stats: UserStats | null;
}

export default function StatsHeader({ displayName, stats }: Props) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <header className="w-full space-y-3 pb-6 border-b border-[#c9952a]/20">
      {/* Wordmark + sign out row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#c9952a] mb-0.5">
            ✦ &nbsp;Quest Forge&nbsp; ✦
          </p>
          <h1 className="font-display text-3xl font-bold text-[#1a1209] leading-tight">
            {displayName ? `Hail, ${displayName}!` : "Your Quest Log"}
          </h1>
        </div>

        <div className="flex items-center gap-4 mt-1">
          <Link
            href="/history"
            className="text-xs text-[#6b5c44]/50 hover:text-[#6b5c44] underline-offset-2 hover:underline transition-colors"
          >
            Quest Log
          </Link>
          <Link
            href="/stats"
            className="text-xs text-[#6b5c44]/50 hover:text-[#6b5c44] underline-offset-2 hover:underline transition-colors"
          >
            Stats
          </Link>
          <button
            onClick={signOut}
            className="text-xs text-[#6b5c44]/50 hover:text-[#6b5c44] underline-offset-2 hover:underline transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="flex items-center gap-6 flex-wrap">
          {/* XP */}
          <div className="flex items-center gap-2">
            <span className="text-[#c9952a] text-base leading-none">⚡</span>
            <div>
              <span className="font-display text-xl font-bold text-[#c9952a] leading-none">
                {stats.total_xp.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#6b5c44] uppercase tracking-widest ml-1.5">
                XP
              </span>
            </div>
          </div>

          <div className="w-px h-5 bg-[#c9952a]/20" />

          {/* Streak */}
          <div className="flex items-center gap-2">
            <span className="text-base leading-none" aria-hidden>
              🔥
            </span>
            <div>
              <span className="font-display text-xl font-bold text-[#2d4a1e] leading-none">
                {stats.current_streak}
              </span>
              <span className="text-[10px] text-[#6b5c44] uppercase tracking-widest ml-1.5">
                Day{stats.current_streak !== 1 ? "s" : ""} streak
              </span>
            </div>
          </div>

          <div className="w-px h-5 bg-[#c9952a]/20" />

          {/* Completed counts */}
          <div className="flex items-center gap-4 text-xs text-[#6b5c44]">
            {(["daily", "weekly", "monthly"] as const).map((tier) => (
              <div key={tier} className="text-center">
                <div className="font-bold text-[#1a1209] text-sm">
                  {stats.completed_counts[tier]}
                </div>
                <div className="capitalize text-[10px] tracking-wide">{tier}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
