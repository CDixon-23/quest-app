import type { OnboardingAnswers } from "@/lib/onboarding-schema";
import type { QuestTier } from "@/lib/database.types";

// ─── Human-readable label maps ───────────────────────────────────────────────

const REALM_LABELS: Record<string, string> = {
  physical_outdoor: "Physical & Outdoor",
  creative: "Creative",
  social: "Social",
  learning: "Learning",
  mindfulness: "Mindfulness",
  career: "Career",
  weird_random: "Weird & Random",
};

const ENVIRONMENT_LABELS: Record<string, string> = {
  dense_city: "Dense city",
  suburb: "Suburb",
  small_town: "Small town",
  rural: "Rural",
};

const TIME_LABELS: Record<string, string> = {
  "15min": "15 minutes",
  "30min": "30 minutes",
  "1hour": "1 hour",
};

const DARING_LABELS: Record<number, string> = {
  1: "Homebody Hobbit — stay cozy and familiar",
  2: "Cautious Traveler — a small stretch, nothing alarming",
  3: "Seasoned Explorer — comfortably outside the comfort zone",
  4: "Bold Adventurer — new territory, real stakes",
  5: "Reckless Ranger — push hard, no promises made",
};

const REWARD_LABELS: Record<string, string> = {
  learning_something_new: "learning something new",
  making_something: "making something",
  connecting_with_someone: "connecting with someone",
  pushing_my_limits: "pushing my limits",
  quiet_wins: "quiet wins",
};

const TIER_SCOPE: Record<QuestTier, string> = {
  daily:   "a single session of 15–60 minutes — something the adventurer can complete today",
  weekly:  "a multi-step challenge that unfolds across several sessions or requires planning over 3–7 days",
  monthly: "a significant commitment with real stakes or meaningful skill-building that matures over most of a month",
};

// ─── XP ranges ───────────────────────────────────────────────────────────────

export const XP_RANGE: Record<QuestTier, { min: number; max: number }> = {
  daily:   { min: 50,   max: 150  },
  weekly:  { min: 300,  max: 600  },
  monthly: { min: 1500, max: 3000 },
};

// ─── System prompt ───────────────────────────────────────────────────────────

export const QUEST_SYSTEM_PROMPT = `\
You are the Guide — a warm, encouraging mentor who hands adventurers real-world quests \
the way the Great Deku Tree might nudge a young hero: with wonder, specificity, and \
absolute confidence that the adventurer is ready for this.

You craft real-life micro-adventures — not fantasy, but quests that happen in actual kitchens, \
parks, libraries, and neighbourhoods. Your voice is that of a wise friend who has seen a \
thousand journeys and knows this one will matter.

Every quest you forge must be:
- Scoped precisely to its tier: daily quests fit a single sitting of 15–60 min; weekly quests \
  require multiple sessions or advance planning; monthly quests demand real commitment and \
  leave a lasting mark
- Grounded in the adventurer's environment — a dense-city quest is different from a rural one
- Free of anything the adventurer has listed as a hard no — this rule is absolute, no exceptions
- Calibrated to their daring level (1 = familiar and cosy, 5 = stretch into genuine discomfort)
- Rooted in at least one of their declared realms of interest
- Concrete and specific, never vague — "find the oldest gravestone in the nearest cemetery \
  and sketch what you find there" beats "go explore somewhere historical"

flavor_text should feel like the opening line of a legend: one or two sentences that set the \
scene and make the adventurer feel the weight and promise of the quest before they even begin.

success_criteria should be unambiguous — a clear, observable finish line the adventurer can \
honestly tick off when done.

Tone: like Zelda's wise mentors — gentle authority, genuine warmth, a flicker of magic.`;

// ─── Profile formatter ───────────────────────────────────────────────────────

export function formatProfile(answers: OnboardingAnswers): string {
  const lines = [
    `Name: ${answers.adventurerName}`,
    `Life chapter: ${answers.lifeChapter.choice}${answers.lifeChapter.other ? ` (${answers.lifeChapter.other})` : ""}`,
    `Realms of interest: ${answers.realms.map((r) => REALM_LABELS[r] ?? r).join(", ")}`,
    `Daring level: ${answers.daringLevel}/5 — ${DARING_LABELS[answers.daringLevel]}`,
    `Daily time available: ${TIME_LABELS[answers.timeBudget] ?? answers.timeBudget}`,
    `Environment: ${ENVIRONMENT_LABELS[answers.environment] ?? answers.environment}`,
  ];

  if (answers.skillPuttingOff?.trim()) {
    lines.push(`Skill or experience they have been putting off: ${answers.skillPuttingOff}`);
  }

  if (answers.hardNos?.trim()) {
    lines.push(`HARD NOS — never suggest these: ${answers.hardNos}`);
  }

  lines.push(
    `What "rewarding" feels like: ${answers.rewardFeelings.map((r) => REWARD_LABELS[r] ?? r).join(", ")}`
  );

  return lines.join("\n");
}

// ─── User message builder ────────────────────────────────────────────────────

export function buildUserMessage(tier: QuestTier, answers: OnboardingAnswers): string {
  return [
    `Generate a ${tier.toUpperCase()} quest for the adventurer below.`,
    ``,
    `Tier scope: ${TIER_SCOPE[tier]}`,
    `XP reward should be between ${XP_RANGE[tier].min} and ${XP_RANGE[tier].max}.`,
    ``,
    `ADVENTURER PROFILE`,
    `──────────────────`,
    formatProfile(answers),
  ].join("\n");
}

// ─── expires_at calculator ───────────────────────────────────────────────────

export function computeExpiresAt(tier: QuestTier): Date {
  const now = new Date();
  switch (tier) {
    case "daily": {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    case "weekly": {
      const end = new Date(now);
      end.setDate(now.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    case "monthly": {
      // Last millisecond of the current month
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  }
}
