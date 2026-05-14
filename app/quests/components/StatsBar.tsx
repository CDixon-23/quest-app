"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type UserStats = Database["public"]["Tables"]["user_stats"]["Row"];

interface Props {
  displayName: string | null;
  stats: UserStats | null;
}

export default function StatsBar({ displayName, stats }: Props) {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#c9952a] mb-1">
            ✦ &nbsp;Quest Forge&nbsp; ✦
          </p>
          <h1 className="font-display text-3xl font-bold text-[#1a1209]">
            {displayName ? `Hail, ${displayName}!` : "Your Quests"}
          </h1>
        </div>

        <button
          onClick={signOut}
          className="mt-1 text-xs text-[#6b5c44]/60 hover:text-[#6b5c44] underline-offset-2 hover:underline transition-colors"
        >
          Sign out
        </button>
      </div>

      {stats && (
        <div className="bg-[#faf6ef] border border-[#c9952a]/25 rounded-2xl px-6 py-4 shadow-[0_2px_16px_rgba(45,74,30,0.06)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* XP + Streak */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-[#c9952a] leading-none">
                  {stats.total_xp.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#6b5c44] uppercase tracking-widest mt-0.5">
                  Total XP
                </div>
              </div>
              <div className="w-px h-8 bg-[#c9952a]/20" />
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-[#2d4a1e] leading-none">
                  {stats.current_streak}
                </div>
                <div className="text-[10px] text-[#6b5c44] uppercase tracking-widest mt-0.5">
                  Day Streak
                </div>
              </div>
            </div>

            {/* Completed counts */}
            <div className="flex items-center gap-1 text-sm">
              {(["daily", "weekly", "monthly"] as const).map((tier, i) => (
                <div key={tier} className="flex items-center gap-1">
                  {i > 0 && <div className="w-px h-4 bg-[#c9952a]/20 mx-1" />}
                  <div className="text-center px-2">
                    <div className="font-bold text-[#1a1209]">
                      {stats.completed_counts[tier]}
                    </div>
                    <div className="text-[10px] text-[#6b5c44] capitalize">{tier}</div>
                  </div>
                </div>
              ))}
              <span className="text-[10px] text-[#6b5c44] ml-1 self-end pb-0.5">
                completed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
