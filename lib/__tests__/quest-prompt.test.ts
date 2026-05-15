import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  computeExpiresAt,
  formatProfile,
  buildUserMessage,
  XP_RANGE,
} from "@/lib/quest-prompt";
import type { OnboardingAnswers } from "@/lib/onboarding-schema";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseAnswers: OnboardingAnswers = {
  adventurerName: "Aria",
  lifeChapter: { choice: "working" },
  realms: ["creative", "learning"],
  daringLevel: 3,
  timeBudget: "30min",
  environment: "dense_city",
  rewardFeelings: ["making_something", "learning_something_new"],
};

// ─── computeExpiresAt ─────────────────────────────────────────────────────────

describe("computeExpiresAt", () => {
  beforeEach(() => {
    // Pin time to 2026-05-14 10:00:00 UTC
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("daily: expires at end of today in UTC (23:59:59.999 UTC)", () => {
    const result = computeExpiresAt("daily", "UTC");
    expect(result.getUTCHours()).toBe(23);
    expect(result.getUTCMinutes()).toBe(59);
    expect(result.getUTCSeconds()).toBe(59);
    expect(result.getUTCMilliseconds()).toBe(999);
    // Same UTC calendar day as the pinned time (2026-05-14)
    expect(result.getUTCDate()).toBe(14);
    expect(result.getUTCMonth()).toBe(4); // May (0-indexed)
    expect(result.getUTCFullYear()).toBe(2026);
  });

  it("weekly: expires approximately 7 days from now", () => {
    const now    = Date.now();
    const result = computeExpiresAt("weekly");
    const diff   = result.getTime() - now;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    // Allow ±1 second tolerance
    expect(diff).toBeGreaterThanOrEqual(sevenDaysMs - 1000);
    expect(diff).toBeLessThanOrEqual(sevenDaysMs + 1000);
  });

  it("monthly: expires approximately 30 days from now", () => {
    const now    = Date.now();
    const result = computeExpiresAt("monthly");
    const diff   = result.getTime() - now;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    // Allow ±1 second tolerance
    expect(diff).toBeGreaterThanOrEqual(thirtyDaysMs - 1000);
    expect(diff).toBeLessThanOrEqual(thirtyDaysMs + 1000);
  });

  it("daily expires before weekly which expires before monthly", () => {
    const daily   = computeExpiresAt("daily");
    const weekly  = computeExpiresAt("weekly");
    const monthly = computeExpiresAt("monthly");
    expect(daily.getTime()).toBeLessThan(weekly.getTime());
    expect(weekly.getTime()).toBeLessThan(monthly.getTime());
  });
});

// ─── XP_RANGE ─────────────────────────────────────────────────────────────────

describe("XP_RANGE", () => {
  it("daily is 50–150", () => {
    expect(XP_RANGE.daily).toEqual({ min: 50, max: 150 });
  });

  it("weekly is 300–600", () => {
    expect(XP_RANGE.weekly).toEqual({ min: 300, max: 600 });
  });

  it("monthly is 1500–3000", () => {
    expect(XP_RANGE.monthly).toEqual({ min: 1500, max: 3000 });
  });

  it("min is always less than max for every tier", () => {
    for (const tier of ["daily", "weekly", "monthly"] as const) {
      expect(XP_RANGE[tier].min).toBeLessThan(XP_RANGE[tier].max);
    }
  });
});

// ─── formatProfile ────────────────────────────────────────────────────────────

describe("formatProfile", () => {
  it("includes the adventurer name", () => {
    expect(formatProfile(baseAnswers)).toContain("Aria");
  });

  it("includes the life chapter", () => {
    expect(formatProfile(baseAnswers)).toContain("working");
  });

  it("includes human-readable realm labels", () => {
    const out = formatProfile(baseAnswers);
    expect(out).toContain("Creative");
    expect(out).toContain("Learning");
  });

  it("includes daring level number and label", () => {
    const out = formatProfile(baseAnswers);
    expect(out).toContain("3/5");
    expect(out).toContain("Seasoned Explorer");
  });

  it("includes human-readable time budget", () => {
    expect(formatProfile(baseAnswers)).toContain("30 minutes");
  });

  it("includes human-readable environment", () => {
    expect(formatProfile(baseAnswers)).toContain("Dense city");
  });

  it("includes reward feelings", () => {
    const out = formatProfile(baseAnswers);
    expect(out).toContain("making something");
    expect(out).toContain("learning something new");
  });

  it("omits skillPuttingOff line when not provided", () => {
    expect(formatProfile(baseAnswers)).not.toContain("putting off");
  });

  it("includes skillPuttingOff when provided", () => {
    const out = formatProfile({ ...baseAnswers, skillPuttingOff: "watercolour painting" });
    expect(out).toContain("watercolour painting");
  });

  it("omits hard nos line when not provided", () => {
    expect(formatProfile(baseAnswers)).not.toContain("HARD NOS");
  });

  it("includes hard nos when provided", () => {
    const out = formatProfile({ ...baseAnswers, hardNos: "heights, swimming" });
    expect(out).toContain("HARD NOS");
    expect(out).toContain("heights, swimming");
  });

  it("includes 'other' detail when lifeChapter is other", () => {
    const out = formatProfile({
      ...baseAnswers,
      lifeChapter: { choice: "other", other: "freelancing" },
    });
    expect(out).toContain("other");
    expect(out).toContain("freelancing");
  });
});

// ─── buildUserMessage ─────────────────────────────────────────────────────────

describe("buildUserMessage", () => {
  it("mentions the tier in uppercase", () => {
    expect(buildUserMessage("daily", baseAnswers)).toContain("DAILY");
    expect(buildUserMessage("weekly", baseAnswers)).toContain("WEEKLY");
    expect(buildUserMessage("monthly", baseAnswers)).toContain("MONTHLY");
  });

  it("includes the XP range for the tier", () => {
    const out = buildUserMessage("daily", baseAnswers);
    expect(out).toContain("50");
    expect(out).toContain("150");
  });

  it("includes weekly XP range", () => {
    const out = buildUserMessage("weekly", baseAnswers);
    expect(out).toContain("300");
    expect(out).toContain("600");
  });

  it("includes monthly XP range", () => {
    const out = buildUserMessage("monthly", baseAnswers);
    expect(out).toContain("1500");
    expect(out).toContain("3000");
  });

  it("embeds the formatted profile", () => {
    const out = buildUserMessage("daily", baseAnswers);
    expect(out).toContain("Aria");
    expect(out).toContain("Dense city");
  });

  it("includes tier scope description", () => {
    const daily = buildUserMessage("daily", baseAnswers);
    expect(daily).toContain("15");   // 15–60 min scope
    expect(daily).toContain("60");
  });
});
