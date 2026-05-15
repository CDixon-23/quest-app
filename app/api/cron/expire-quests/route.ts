import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getDateInTimezone } from "@/lib/streak";

/**
 * GET /api/cron/expire-quests
 *
 * Called hourly by Vercel Cron (see vercel.json). Also callable manually
 * for local testing by passing the CRON_SECRET in the Authorization header.
 *
 * What this does:
 *  1. Marks any active quest past its expires_at as "expired"
 *  2. Resets current_streak to 0 for users who missed a full calendar day
 *     (checked in their own timezone)
 *
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const authHeader  = req.headers.get("authorization");
  const cronSecret  = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date().toISOString();

  // ── 1. Expire overdue quests ──────────────────────────────────────────────
  const { data: expiredQuests, error: expireError } = await supabaseAdmin
    .from("quests")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", now)
    .select("id, user_id, tier");

  if (expireError) {
    console.error("[cron/expire-quests] expire error", expireError);
    return NextResponse.json({ error: "Failed to expire quests." }, { status: 500 });
  }

  const expiredCount = expiredQuests?.length ?? 0;

  // ── 2. Break streaks for users who missed a full calendar day ─────────────
  // Fetch all user_stats rows with an active streak
  const { data: statsRows, error: statsError } = await supabaseAdmin
    .from("user_stats")
    .select("user_id, current_streak, last_completed_at")
    .gt("current_streak", 0);

  if (statsError) {
    console.error("[cron/expire-quests] stats fetch error", statsError);
    // Don't fail the whole run — expiration already completed
    return NextResponse.json({ expired: expiredCount, streaks_broken: 0, warning: "Failed to check streaks." });
  }

  let streaksBroken = 0;

  if (statsRows && statsRows.length > 0) {
    // Fetch timezones for these users
    const userIds = statsRows.map((s) => s.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, timezone")
      .in("user_id", userIds);

    const tzMap: Record<string, string> = {};
    for (const p of profiles ?? []) {
      tzMap[p.user_id] = p.timezone ?? "UTC";
    }

    const toBreak: string[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const stat of statsRows) {
      if (!stat.last_completed_at) {
        toBreak.push(stat.user_id);
        continue;
      }

      const tz           = tzMap[stat.user_id] ?? "UTC";
      const todayStr     = getDateInTimezone(today,     tz);
      const yesterdayStr = getDateInTimezone(yesterday, tz);
      const lastStr      = getDateInTimezone(new Date(stat.last_completed_at), tz);

      // Streak alive only if last completion was today or yesterday in user's TZ
      if (lastStr !== todayStr && lastStr !== yesterdayStr) {
        toBreak.push(stat.user_id);
      }
    }

    if (toBreak.length > 0) {
      const { error: breakError } = await supabaseAdmin
        .from("user_stats")
        .update({ current_streak: 0 })
        .in("user_id", toBreak);

      if (breakError) {
        console.error("[cron/expire-quests] streak break error", breakError);
      } else {
        streaksBroken = toBreak.length;
      }
    }
  }

  console.log(`[cron/expire-quests] expired=${expiredCount} streaks_broken=${streaksBroken}`);

  return NextResponse.json({ expired: expiredCount, streaks_broken: streaksBroken });
}
