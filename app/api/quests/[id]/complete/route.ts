import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { computeStreakUpdate } from "@/lib/streak";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const questId = params.id;

  // 1. Auth
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 2. Fetch quest (must belong to this user and be active) + user timezone in parallel
  const [questRes, profileRes] = await Promise.all([
    supabaseAdmin
      .from("quests")
      .select("*")
      .eq("id", questId)
      .eq("user_id", user.id)
      .single(),
    supabaseAdmin
      .from("profiles")
      .select("timezone")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (questRes.error || !questRes.data) {
    return NextResponse.json({ error: "Quest not found." }, { status: 404 });
  }

  const quest    = questRes.data;
  const timezone = profileRes.data?.timezone ?? "UTC";

  if (quest.status !== "active") {
    return NextResponse.json(
      { error: "This quest is already complete or expired." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  // 3. Mark quest complete
  const { error: questUpdateError } = await supabaseAdmin
    .from("quests")
    .update({ status: "completed", completed_at: now })
    .eq("id", questId);

  if (questUpdateError) {
    console.error("[complete] quest update error", questUpdateError);
    return NextResponse.json({ error: "Failed to complete quest." }, { status: 500 });
  }

  // 4. Fetch user_stats
  const { data: stats, error: statsFetchError } = await supabaseAdmin
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (statsFetchError || !stats) {
    console.error("[complete] stats fetch error", statsFetchError);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }

  // 5. Compute updated stats
  const { newStreak, newLongestStreak } = computeStreakUpdate(
    stats.current_streak,
    stats.longest_streak,
    stats.last_completed_at,
    timezone,
  );

  const newCounts = {
    ...stats.completed_counts,
    [quest.tier]: (stats.completed_counts[quest.tier] ?? 0) + 1,
  };
  const newTotalXp = stats.total_xp + quest.reward_xp;

  const { data: updatedStats, error: statsUpdateError } = await supabaseAdmin
    .from("user_stats")
    .update({
      total_xp:           newTotalXp,
      current_streak:     newStreak,
      longest_streak:     newLongestStreak,
      completed_counts:   newCounts,
      last_completed_at:  now,
      updated_at:         now,
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (statsUpdateError || !updatedStats) {
    console.error("[complete] stats update error", statsUpdateError);
    return NextResponse.json({ error: "Failed to update stats." }, { status: 500 });
  }

  return NextResponse.json(
    { xp_gained: quest.reward_xp, stats: updatedStats },
    { status: 200 }
  );
}
