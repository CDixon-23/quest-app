import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getRankInfo } from "@/lib/ranks";
import { getEffectiveStreak } from "@/lib/streak";
import RankBadge from "./RankBadge";
import XPChart from "./XPChart";

export const metadata = { title: "Stats — Quest Forge" };

export default async function StatsPage() {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [statsRes, profileRes, completedQuestsRes] = await Promise.all([
    supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("display_name, timezone")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("quests")
      .select("tier, reward_xp, completed_at, status")
      .eq("user_id", user.id)
      .in("status", ["completed", "expired"])
      .order("completed_at", { ascending: true }),
  ]);

  if (!statsRes.data) redirect("/onboarding");

  const stats    = statsRes.data;
  const timezone = profileRes.data?.timezone ?? "UTC";

  // ── 30-day XP chart data ──────────────────────────────────────────────────
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Build a map of date → XP earned that day
  const xpByDay: Record<string, number> = {};
  for (const q of completedQuestsRes.data ?? []) {
    if (q.status !== "completed" || !q.completed_at) continue;
    const completedDate = new Date(q.completed_at);
    if (completedDate < thirtyDaysAgo) continue;
    const dateKey = completedDate.toISOString().slice(0, 10);
    xpByDay[dateKey] = (xpByDay[dateKey] ?? 0) + q.reward_xp;
  }

  // Fill in all 30 days (even zero-xp days get an entry so the chart is continuous)
  const chartData: { date: string; xp: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    chartData.push({ date: key, xp: xpByDay[key] ?? 0 });
  }

  // ── Completion rates per tier ─────────────────────────────────────────────
  const tierTotals: Record<string, { completed: number; expired: number }> = {
    daily:   { completed: 0, expired: 0 },
    weekly:  { completed: 0, expired: 0 },
    monthly: { completed: 0, expired: 0 },
  };
  for (const q of completedQuestsRes.data ?? []) {
    if (!tierTotals[q.tier]) continue;
    if (q.status === "completed") tierTotals[q.tier].completed++;
    else if (q.status === "expired") tierTotals[q.tier].expired++;
  }

  const rankInfo       = getRankInfo(stats.total_xp);
  const effectiveStreak = getEffectiveStreak(stats.current_streak, stats.last_completed_at, timezone);

  return (
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link
            href="/quests"
            className="text-xs text-[#6b5c44]/60 hover:text-[#6b5c44] underline-offset-2 hover:underline transition-colors"
          >
            ← Quest Forge
          </Link>
          <Link
            href="/history"
            className="text-xs text-[#6b5c44]/60 hover:text-[#6b5c44] underline-offset-2 hover:underline transition-colors"
          >
            Quest Log →
          </Link>
        </div>

        {/* Heading */}
        <div>
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#c9952a] mb-0.5">
            ✦ &nbsp;Quest Forge&nbsp; ✦
          </p>
          <h1 className="font-display text-3xl font-bold text-[#1a1209] leading-tight">
            Your Chronicle
          </h1>
        </div>

        {/* Rank badge */}
        <RankBadge rankInfo={rankInfo} totalXp={stats.total_xp} />

        {/* Streak row */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon="🔥"
            value={effectiveStreak}
            label={`Day${effectiveStreak !== 1 ? "s" : ""} Current Streak`}
            accent="#2d4a1e"
          />
          <StatCard
            icon="🏆"
            value={stats.longest_streak}
            label={`Day${stats.longest_streak !== 1 ? "s" : ""} Best Streak`}
            accent="#c9952a"
          />
        </div>

        {/* Completion rates */}
        <div className="rounded-2xl border border-[#c9952a]/20 bg-[#faf6ef] p-6 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6b5c44]/60">
            Completion Rates
          </p>
          {(["daily", "weekly", "monthly"] as const).map((tier) => {
            const { completed, expired } = tierTotals[tier];
            const total = completed + expired;
            const rate  = total > 0 ? Math.round((completed / total) * 100) : null;
            return (
              <div key={tier} className="space-y-1.5">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="capitalize font-medium text-[#1a1209]">{tier}</span>
                  <span className="text-xs text-[#6b5c44]">
                    {completed} / {total} quest{total !== 1 ? "s" : ""}
                    {rate !== null && (
                      <span className="ml-2 font-bold text-[#c9952a]">{rate}%</span>
                    )}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#e8dcc8] overflow-hidden">
                  {rate !== null && (
                    <div
                      className="h-full rounded-full bg-[#c9952a]"
                      style={{ width: `${rate}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* XP chart */}
        <XPChart data={chartData} />

      </div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: string;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-[#c9952a]/20 bg-[#faf6ef] p-5 flex items-center gap-3">
      <span className="text-2xl leading-none" aria-hidden>{icon}</span>
      <div>
        <div className="font-display text-2xl font-bold leading-none" style={{ color: accent }}>
          {value}
        </div>
        <div className="text-[10px] text-[#6b5c44] uppercase tracking-wide mt-0.5">{label}</div>
      </div>
    </div>
  );
}
