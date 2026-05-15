/**
 * Returns a human-readable string for time remaining until an ISO timestamp.
 * Examples: "4 hours", "2 days", "47 minutes"
 * Returns "expired" if the timestamp is in the past.
 */
export function timeUntil(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export function isExpired(isoString: string): boolean {
  return new Date(isoString).getTime() <= Date.now();
}
