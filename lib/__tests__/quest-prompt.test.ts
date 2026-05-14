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

  it("daily: expires at end of today (23:59:59.999)", () => {
    const result = computeExpiresAt("daily");
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
    // Same calendar day
    const now = new Date();
    expect(result.getDate()).toBe(now.getDate());
    expect(result.getMonth()).toBe(now.getMonth());
    expect(result.getFullYear()).toBe(now.getFullYear());
  });

  it("weekly: expires 7 days from now at 23:59:59.999", () => {
    const result = computeExpiresAt("weekly");
    const expected = new Date("2026-05-14T10:00:00.000Z");
    expected.setDate(expected.getDate() + 7);
    expect(result.getDate()).toBe(expected.getDate());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("monthly: expires on the last day of the current month at 23:59:59.999", () => {
    const result = computeExpiresAt("monthly");
    // May 2026 has 31 days
    expect(result.getMonth()).toBe(4); // May (0-indexed)
    expect(result.getDate()).toBe(31);
    expect(result.getHours()).toBe(23);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("monthly: handles months with 30 days (April)", () => {
    vi.setSystemTime(new Date("2026-04-01T08:00:00.000Z"));
    const result = computeExpiresAt("monthly");
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(30);
  });

  it("monthly: handles February in a leap year", () => {
    vi.setSystemTime(new Date("2028-02-10T08:00:00.000Z"));
    const result = computeExpiresAt("monthly");
    expect(result.getDate()).toBe(29); // 2028 is a leap year
  });

  it("monthly: handles February in a non-leap year", () => {
    vi.setSystemTime(new Date("2026-02-10T08:00:00.000Z"));
    const result = computeExpiresAt("monthly");
    expect(result.getDate()).toBe(28);
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
