import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import QuestDashboard from "./QuestDashboard";

/**
 * Server component — fetches initial data and passes it to the interactive
 * QuestDashboard client component. No loading spinner needed; the page
 * renders with data already populated.
 */
export default async function QuestsPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [questsRes, statsRes, profileRes, expiredRes] = await Promise.all([
    supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("generated_at", { ascending: false }),
    supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("display_name, onboarding_answers")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "expired")
      .gte("expires_at", oneDayAgo)
      .order("expires_at", { ascending: false }),
  ]);

  // No profile answers yet → send to onboarding
  const answers = profileRes.data?.onboarding_answers;
  if (!answers || Object.keys(answers).length === 0) {
    redirect("/onboarding");
  }

  // user_stats should always exist (trigger creates it on sign-up).
  // If somehow missing, redirect to a safe place rather than crashing.
  if (!statsRes.data) redirect("/onboarding");

  return (
    <QuestDashboard
      initialQuests={questsRes.data ?? []}
      initialStats={statsRes.data}
      displayName={profileRes.data?.display_name ?? null}
      recentlyExpiredQuests={expiredRes.data ?? []}
    />
  );
}
