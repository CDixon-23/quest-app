import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import { supabaseAdmin } from "@/lib/supabase";
import type { OnboardingAnswers } from "@/lib/onboarding-schema";
import type { QuestTier } from "@/lib/database.types";
import {
  QUEST_SYSTEM_PROMPT,
  buildUserMessage,
  computeExpiresAt,
  XP_RANGE,
} from "@/lib/quest-prompt";

// ─── Anthropic client (singleton per cold start) ──────────────────────────────

const anthropic = new Anthropic();
// ANTHROPIC_API_KEY is read automatically from process.env

// ─── Schemas ─────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  tier: z.enum(["daily", "weekly", "monthly"]),
});

// The shape Claude must return — drives the structured-output constraint.
function buildQuestOutputSchema(tier: QuestTier) {
  const { min, max } = XP_RANGE[tier];
  return z.object({
    flavor_text: z
      .string()
      .describe(
        "1–2 sentences that open like the first line of a legend — set the scene and make " +
          "the adventurer feel the weight and promise of the quest before they begin."
      ),
    title: z
      .string()
      .describe("Short, evocative quest title — 4 to 8 words, no punctuation at the end"),
    description: z
      .string()
      .describe(
        "2–4 sentences. State the exact task with enough colour to paint the scene. " +
          "End with the single concrete action the adventurer must take first."
      ),
    success_criteria: z
      .string()
      .describe(
        "One unambiguous sentence describing the observable finish line — " +
          "the adventurer should be able to tick this off with confidence when done."
      ),
    reward_xp: z
      .number()
      .int()
      .describe(`XP reward. Must be between ${min} and ${max} for a ${tier} quest.`),
  });
}

type QuestOutput = z.infer<ReturnType<typeof buildQuestOutputSchema>>;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse + validate request body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing or invalid `tier`. Must be daily, weekly, or monthly." },
      { status: 400 }
    );
  }
  const { tier } = parsed.data;

  // 2. Authenticate — caller must pass the Supabase JWT as a Bearer token
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 3. Fetch the user's onboarding answers
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("onboarding_answers")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    console.error("[generate-quest] profile fetch error", profileError);
    return NextResponse.json({ error: "Could not load your profile." }, { status: 500 });
  }

  if (!profile?.onboarding_answers || Object.keys(profile.onboarding_answers).length === 0) {
    return NextResponse.json(
      { error: "Complete onboarding before generating quests." },
      { status: 422 }
    );
  }

  const answers = profile.onboarding_answers as unknown as OnboardingAnswers;

  // 4. Generate the quest with Claude Sonnet
  let questOutput: QuestOutput;
  try {
    const message = await anthropic.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: QUEST_SYSTEM_PROMPT,
      output_config: {
        format: zodOutputFormat(buildQuestOutputSchema(tier)),
      },
      messages: [
        {
          role: "user",
          content: buildUserMessage(tier, answers),
        },
      ],
    });

    if (!message.parsed_output) {
      console.error("[generate-quest] Claude returned no parsed output", message.content);
      return NextResponse.json({ error: "Quest generation failed — no output." }, { status: 502 });
    }

    questOutput = message.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "The quest forge is busy — try again in a moment." },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[generate-quest] Anthropic auth error — check ANTHROPIC_API_KEY");
      return NextResponse.json({ error: "Quest generation misconfigured." }, { status: 500 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[generate-quest] Anthropic API error", err.status, err.message);
      return NextResponse.json({ error: "Quest generation failed." }, { status: 502 });
    }
    throw err; // unexpected — let Next.js handle it
  }

  // 5. Persist the quest to Supabase
  const { data: quest, error: insertError } = await supabaseAdmin
    .from("quests")
    .insert({
      user_id: user.id,
      tier,
      flavor_text: questOutput.flavor_text,
      title: questOutput.title,
      description: questOutput.description,
      success_criteria: questOutput.success_criteria,
      reward_xp: questOutput.reward_xp,
      expires_at: computeExpiresAt(tier).toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("[generate-quest] Supabase insert error", insertError);
    return NextResponse.json({ error: "Failed to save quest." }, { status: 500 });
  }

  return NextResponse.json({ quest }, { status: 201 });
}
