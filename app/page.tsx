import { redirect } from "next/navigation";

/**
 * Root route — the middleware redirects authenticated users to /quests
 * and unauthenticated users to /auth before this ever renders.
 * This redirect is a fallback for any edge case the middleware misses.
 */
export default function Home() {
  redirect("/quests");
}
