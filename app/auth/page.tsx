"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "sign-in" | "sign-up";

export default function AuthPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode]           = useState<Mode>("sign-in");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  // Surface errors forwarded from the callback route (e.g. bad confirmation link)
  useEffect(() => {
    if (searchParams.get("error") === "confirmation_failed") {
      setError("That confirmation link is invalid or has expired. Try signing in or requesting a new one.");
    }
  }, [searchParams]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "sign-up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // After the user clicks the confirmation link, Supabase will
            // redirect them here. The route exchanges the code for a session.
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        // Supabase may auto-confirm (if disabled in project settings) or send email.
        // Check if a session exists to detect auto-confirm.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/onboarding");
        } else {
          setSuccess(
            `We've sent a confirmation link to ${email}. Click it to begin your adventure.`
          );
        }
        return;
      }

      // Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/quests");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Wordmark */}
      <div className="text-center space-y-1">
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#c9952a]">
          ✦ &nbsp;Quest Forge&nbsp; ✦
        </p>
        <h1 className="font-display text-4xl font-bold text-[#1a1209]">
          {mode === "sign-in" ? "Return, Traveler" : "Join the Adventure"}
        </h1>
        <p className="text-sm text-[#6b5c44]">
          {mode === "sign-in"
            ? "Sign in to continue your journey."
            : "Create an account to begin your quest."}
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#faf6ef] border border-[#c9952a]/25 rounded-2xl shadow-[0_4px_32px_rgba(45,74,30,0.08)] p-8 space-y-6">

        {/* Success banner */}
        {success && (
          <div className="bg-[#2d4a1e]/8 border border-[#2d4a1e]/20 rounded-lg px-4 py-3 text-sm text-[#2d4a1e]">
            <span className="font-semibold">Check your inbox.</span>{" "}
            {success}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-[#6b5c44]"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adventurer@example.com"
                className="bg-[#f5ede0] border-[#c9952a]/40 focus-visible:ring-[#2d4a1e] focus-visible:border-[#2d4a1e] text-[#1a1209] placeholder:text-[#b0a090] h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-[#6b5c44]"
                >
                  Password
                </Label>
                {mode === "sign-in" && (
                  <button
                    type="button"
                    onClick={() => handleForgotPassword(email, setError, setSuccess)}
                    className="text-xs text-[#c9952a] hover:text-[#a37820] underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "sign-up" ? "At least 6 characters" : "••••••••"}
                minLength={6}
                className="bg-[#f5ede0] border-[#c9952a]/40 focus-visible:ring-[#2d4a1e] focus-visible:border-[#2d4a1e] text-[#1a1209] placeholder:text-[#b0a090] h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2d4a1e] hover:bg-[#3d5e2a] text-white font-semibold h-11 text-sm tracking-wide disabled:opacity-50"
            >
              {loading
                ? "One moment…"
                : mode === "sign-in"
                ? "Sign In →"
                : "Create Account →"}
            </Button>
          </form>
        )}

        {/* Mode toggle */}
        <div className="text-center">
          <Divider />
          <p className="text-sm text-[#6b5c44] mt-4">
            {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              className="text-[#c9952a] font-semibold hover:text-[#a37820] underline-offset-2 hover:underline"
            >
              {mode === "sign-in" ? "Join the adventure" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function handleForgotPassword(
  email: string,
  setError: (msg: string | null) => void,
  setSuccess: (msg: string | null) => void,
) {
  if (!email) {
    setError("Enter your email above, then click 'Forgot password?'");
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });
  if (error) {
    setError(error.message);
  } else {
    setSuccess(`Password reset instructions sent to ${email}.`);
  }
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-[#c9952a]/15" />
      <span className="text-xs text-[#c9952a]/40">✦</span>
      <div className="flex-1 h-px bg-[#c9952a]/15" />
    </div>
  );
}
