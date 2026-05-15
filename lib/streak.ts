/**
 * Returns "YYYY-MM-DD" for a Date in the given IANA timezone.
 * Uses en-CA locale which always formats as YYYY-MM-DD.
 */
export function getDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(date);
}

/**
 * Computes new streak and longest-streak values after a quest completion.
 *
 * Rules (all comparisons use the user's local calendar day):
 *   same day as last completion  → keep streak (already counted today)
 *   one day since last completion → extend by 1
 *   2+ day gap                   → reset to 1
 */
export function computeStreakUpdate(
  currentStreak:  number,
  longestStreak:  number,
  lastCompletedAt: string | null,
  timezone:       string,
): { newStreak: number; newLongestStreak: number } {
  const todayStr = getDateInTimezone(new Date(), timezone);

  let newStreak: number;

  if (!lastCompletedAt) {
    newStreak = 1;
  } else {
    const lastStr = getDateInTimezone(new Date(lastCompletedAt), timezone);

    if (lastStr === todayStr) {
      // Already completed a quest today — streak unchanged
      newStreak = currentStreak;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateInTimezone(yesterday, timezone);

      newStreak = lastStr === yesterdayStr ? currentStreak + 1 : 1;
    }
  }

  return {
    newStreak,
    newLongestStreak: Math.max(longestStreak, newStreak),
  };
}

/**
 * The displayed streak may differ from the stored value if the cron job
 * hasn't run yet since the streak broke. Call this before rendering.
 *
 * Returns 0 if the last completion was more than one full calendar day ago
 * (in the user's timezone), meaning the streak is broken even if the DB
 * hasn't been updated yet.
 */
export function getEffectiveStreak(
  currentStreak:   number,
  lastCompletedAt: string | null,
  timezone:        string,
): number {
  if (currentStreak === 0 || !lastCompletedAt) return 0;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayStr     = getDateInTimezone(today,     timezone);
  const yesterdayStr = getDateInTimezone(yesterday, timezone);
  const lastStr      = getDateInTimezone(new Date(lastCompletedAt), timezone);

  return lastStr === todayStr || lastStr === yesterdayStr ? currentStreak : 0;
}
