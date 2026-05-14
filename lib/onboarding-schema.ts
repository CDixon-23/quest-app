export type LifeChapter = "student" | "working" | "between" | "retired" | "other";

export type Realm =
  | "physical_outdoor"
  | "creative"
  | "social"
  | "learning"
  | "mindfulness"
  | "career"
  | "weird_random";

export type TimeBudget = "15min" | "30min" | "1hour";

export type Environment = "dense_city" | "suburb" | "small_town" | "rural";

export type RewardFeeling =
  | "learning_something_new"
  | "making_something"
  | "connecting_with_someone"
  | "pushing_my_limits"
  | "quiet_wins";

export interface LifeChapterAnswer {
  choice: LifeChapter;
  /** Populated only when choice === "other" */
  other?: string;
}

/**
 * Persisted verbatim to profiles.onboarding_answers (JSONB).
 * Also consumed directly by /api/generate-quest — keep this type
 * as the single source of truth for both sides.
 */
export interface OnboardingAnswers {
  /** Q1 — also written to profiles.display_name */
  adventurerName: string;
  /** Q2 */
  lifeChapter: LifeChapterAnswer;
  /** Q3 — at least one required */
  realms: Realm[];
  /** Q4 — 1 = Homebody Hobbit, 5 = Reckless Ranger */
  daringLevel: 1 | 2 | 3 | 4 | 5;
  /** Q5 */
  timeBudget: TimeBudget;
  /** Q6 — optional */
  skillPuttingOff?: string;
  /** Q7 */
  environment: Environment;
  /** Q8 — optional */
  hardNos?: string;
  /** Q9 — at least one required */
  rewardFeelings: RewardFeeling[];
}
