import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Handles the OAuth / email-confirmation redirect from Supabase.
 * Supabase sends the user here with ?code=... after they click the
 * confirmation link in their email.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/quests`);
    }
  }

  // If no code or exchange failed, send to auth page with an error hint
  return NextResponse.redirect(`${origin}/auth?error=confirmation_failed`);
}
