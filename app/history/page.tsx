import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import HistoryTable from "./HistoryTable";

export const metadata = { title: "Quest Log — Quest Forge" };

const PAGE_SIZE = 20;

interface SearchParams {
  page?:   string;
  tier?:   string;
  status?: string;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const page         = Math.max(parseInt(searchParams.page ?? "1", 10), 1);
  const tierFilter   = searchParams.tier   ?? "";
  const statusFilter = searchParams.status ?? "";

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  // Build query
  let query = supabase
    .from("quests")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .in("status", ["completed", "expired"])
    .order("generated_at", { ascending: false })
    .range(from, to);

  if (tierFilter)   query = query.eq("tier",   tierFilter);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: quests, count, error } = await query;

  if (error) {
    console.error("[history] fetch error", error);
  }

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
            href="/stats"
            className="text-xs text-[#6b5c44]/60 hover:text-[#6b5c44] underline-offset-2 hover:underline transition-colors"
          >
            Stats →
          </Link>
        </div>

        {/* Heading */}
        <div>
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-[#c9952a] mb-0.5">
            ✦ &nbsp;Quest Forge&nbsp; ✦
          </p>
          <h1 className="font-display text-3xl font-bold text-[#1a1209] leading-tight">
            Quest Log
          </h1>
        </div>

        {/* Table */}
        <HistoryTable
          quests={quests ?? []}
          total={count ?? 0}
          page={page}
          pageSize={PAGE_SIZE}
          tierFilter={tierFilter}
          statusFilter={statusFilter}
        />

      </div>
    </div>
  );
}
