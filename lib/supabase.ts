import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser client — uses cookies so the session is visible to the
 * Next.js middleware (which reads cookies, not localStorage).
 * createBrowserClient is a singleton: calling it multiple times
 * returns the same instance.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Server-side admin client (service role key).
 * Only ever used in server-side code (API routes, server actions).
 * Never imported in client components.
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
