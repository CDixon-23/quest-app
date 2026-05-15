"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Database, QuestTier, QuestStatus } from "@/lib/database.types";

type Quest = Database["public"]["Tables"]["quests"]["Row"];

interface Props {
  quests:      Quest[];
  total:       number;
  page:        number;
  pageSize:    number;
  tierFilter:  string;
  statusFilter: string;
}

const PAGE_SIZE = 20;

const TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "",        label: "All tiers"    },
  { value: "daily",   label: "Daily"        },
  { value: "weekly",  label: "Weekly"       },
  { value: "monthly", label: "Monthly"      },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "",          label: "All statuses" },
  { value: "completed", label: "Completed"    },
  { value: "expired",   label: "Expired"      },
];

const STATUS_PILL: Record<string, string> = {
  completed: "bg-[#d4e8cc] text-[#2d4a1e] border border-[#2d4a1e]/20",
  expired:   "bg-[#e8dcc8] text-[#6b5c44] border border-[#b0a090]/40",
};

export default function HistoryTable({
  quests,
  total,
  page,
  tierFilter,
  statusFilter,
}: Props) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    return `${pathname}?${params.toString()}`;
  }

  function handleFilter(key: string, value: string) {
    // Reset to page 1 when filters change
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasPrev    = page > 1;
  const hasNext    = page < totalPages;

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={tierFilter}
          options={TIER_OPTIONS}
          onChange={(v) => handleFilter("tier", v)}
          ariaLabel="Filter by tier"
        />
        <Select
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(v) => handleFilter("status", v)}
          ariaLabel="Filter by status"
        />
        <span className="text-xs text-[#6b5c44]/60 ml-auto">
          {total} quest{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {quests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c9952a]/25 bg-[#faf6ef]/60 px-8 py-12 text-center space-y-2">
          <p className="text-xl opacity-40" aria-hidden>✦</p>
          <p className="font-display text-base font-semibold text-[#1a1209]">
            No quests found.
          </p>
          <p className="text-sm text-[#6b5c44]">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#c9952a]/20 bg-[#faf6ef] overflow-hidden divide-y divide-[#c9952a]/10">
          {quests.map((quest) => (
            <div key={quest.id} className="px-5 py-4 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-sm font-semibold text-[#1a1209] leading-snug">
                  {quest.title}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_PILL[quest.status] ?? ""}`}
                  >
                    {quest.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[#6b5c44]/70 uppercase tracking-wide">
                <span className="capitalize">{quest.tier}</span>
                <span>·</span>
                <span>⚡ {quest.reward_xp} XP</span>
                <span>·</span>
                <span>{formatDate(quest.completed_at ?? quest.expires_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <PaginationButton
            href={hasPrev ? buildUrl({ page: String(page - 1) }) : ""}
            disabled={!hasPrev}
            label="← Previous"
            onClick={() => hasPrev && router.push(buildUrl({ page: String(page - 1) }))}
          />
          <span className="text-xs text-[#6b5c44]/60">
            Page {page} of {totalPages}
          </span>
          <PaginationButton
            href={hasNext ? buildUrl({ page: String(page + 1) }) : ""}
            disabled={!hasNext}
            label="Next →"
            onClick={() => hasNext && router.push(buildUrl({ page: String(page + 1) }))}
          />
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Select({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value:     string;
  options:   { value: string; label: string }[];
  onChange:  (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-lg border border-[#c9952a]/30 bg-[#faf6ef] text-[#1a1209] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#c9952a]/40 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function PaginationButton({
  href,
  disabled,
  label,
  onClick,
}: {
  href:     string;
  disabled: boolean;
  label:    string;
  onClick:  () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium text-[#6b5c44] hover:text-[#1a1209] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
