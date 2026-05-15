import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import { supabaseAdmin } from "@/lib/supabase";
import type { OnboardingAnswers } from "@/lib/onboarding-schema";
import type { QuestTier } from "@/lib/database.types";
import {
  buildSystemPrompt,
  buildUserMessage,
  computeExpiresAt,
  XP_RANGE,
} from "@/lib/quest-prompt";

// ─── Anthropic client ─────────────────────────────────────────────────────────

const anthropic = new Anthropic();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const RequestSchema = z.object({
  tier: z.enum(["daily", "weekly", "monthly"]),
});

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

// ─── Hard-nos post-generation check ──────────────────────────────────────────

/**
 * Returns true if any hard-no keyword appears in the generated quest text.
 * Ignores keywords shorter than 3 characters to avoid false positives.
 */
function containsHardNos(output: QuestOutput, hardNos: string): boolean {
  if (!hardNos.trim()) return false;

  const keywords = hardNos
    .split(/[,;]+/)
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length >= 3);

  const questText = [
    output.title,
    output.description,
    output.flavor_text,
    output.success_criteria,
  ]
    .join(" ")
    .toLowerCase();

  return keywords.some((kw) => questText.includes(kw));
}

// ─── Generation with retry ───────────────────────────────────────────────────

async function generateWithRetry(
  tier:         QuestTier,
  answers:      OnboardingAnswers,
  recentTitles: string[],
): Promise<{ output: QuestOutput; regenerated: boolean; hardNosTriggered: boolean }> {
  const hardNos = answers.hardNos ?? "";
  let regenerated       = false;
  let hardNosTriggered  = false;

  for (let attempt = 0; attempt < 2; attempt++) {
    const isRetry = attempt > 0;

    let message;
    try {
      message = await anthropic.messages.parse({
        model:      "claude-sonnet-4-6",
        max_tokens: isRetry ? 1536 : 1024,
        system:     buildSystemPrompt(hardNos, isRetry),
        output_config: {
          format: zodOutputFormat(buildQuestOutputSchema(tier)),
        },
        messages: [
          {
            role:    "user",
            content: buildUserMessage(tier, answers, recentTitles),
          },
        ],
      });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) throw err; // surface immediately
      if (attempt === 0) { regenerated = true; continue; }
      throw err;
    }

    if (!message.parsed_output) {
      if (attempt === 0) { regenerated = true; continue; }
      throw new Error("Claude returned no parsed output after retry.");
    }

    const output = message.parsed_output;

    // Post-generation hard-nos keyword check
    if (hardNos && containsHardNos(output, hardNos) && attempt === 0) {
      hardNosTriggered = true;
      regenerated      = true;
      continue; // try again with stricter system prompt
    }

    return { output, regenerated, hardNosTriggered: hardNosTriggered && !isRetry };
  }

  throw new Error("Quest generation failed after retry.");
}

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

  // 2. Auth
  const authHeader = req.headers.get("authorization");
  const token      = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
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

  // 3. Rate limit: at most one call per tier per 5 seconds
  const fiveSecsAgo = new Date(Date.now() - 5_000).toISOString();
  const { data: recentLog } = await supabaseAdmin
    .from("quest_generation_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("tier", tier)
    .gte("created_at", fiveSecsAgo)
    .limit(1)
    .maybeSingle();

  if (recentLog) {
    return NextResponse.json(
      { error: "The forge needs a moment — try again shortly." },
      { status: 429 }
    );
  }

  // 4. Fetch profile (answers + timezone) and last 10 quest titles in parallel
  const [profileRes, recentQuestsRes] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("onboarding_answers, timezone")
      .eq("user_id", user.id)
      .single(),
    supabaseAdmin
      .from("quests")
      .select("title")
      .eq("user_id", user.id)
      .eq("tier", tier)
      .order("generated_at", { ascending: false })
      .limit(10),
  ]);

  if (profileRes.error) {
    console.error("[generate-quest] profile fetch error", profileRes.error);
    return NextResponse.json({ error: "Could not load your profile." }, { status: 500 });
  }

  if (!profileRes.data?.onboarding_answers || Object.keys(profileRes.data.onboarding_answers).length === 0) {
    return NextResponse.json(
      { error: "Complete onboarding before generating quests." },
      { status: 422 }
    );
  }

  const answers      = profileRes.data.onboarding_answers as unknown as OnboardingAnswers;
  const timezone     = profileRes.data.timezone ?? "UTC";
  const recentTitles = (recentQuestsRes.data ?? []).map((q) => q.title);

  // 5. Generate with retry
  const systemPromptForLog = buildSystemPrompt(answers.hardNos);
  const userMessageForLog  = buildUserMessage(tier, answers, recentTitles);

  let questOutput: QuestOutput;
  let regenerated       = false;
  let hardNosTriggered  = false;
  let generationError: string | null = null;

  try {
    const result = await generateWithRetry(tier, answers, recentTitles);
    questOutput      = result.output;
    regenerated      = result.regenerated;
    hardNosTriggered = result.hardNosTriggered;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      generationError = "rate_limited";
      void logGeneration(user.id, tier, systemPromptForLog, userMessageForLog, null, false, false, "Rate limited");
      return NextResponse.json(
        { error: "The quest forge is busy — try again in a moment." },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.AuthenticationError) {
      generationError = "auth_error";
      console.error("[generate-quest] Anthropic auth error — check ANTHROPIC_API_KEY");
      void logGeneration(user.id, tier, systemPromptForLog, userMessageForLog, null, false, false, "Auth error");
      return NextResponse.json({ error: "Quest generation misconfigured." }, { status: 500 });
    }
    if (err instanceof Error) {
      generationError = err.message;
    }
    void logGeneration(user.id, tier, systemPromptForLog, userMessageForLog, null, regenerated, hardNosTriggered, generationError);
    return NextResponse.json({ error: "Quest generation failed — please try again." }, { status: 502 });
  }

  // 6. Log generation
  void logGeneration(user.id, tier, systemPromptForLog, userMessageForLog, questOutput, regenerated, hardNosTriggered, null);

  // 7. Persist the quest
  const { data: quest, error: insertError } = await supabaseAdmin
    .from("quests")
    .insert({
      user_id:          user.id,
      tier,
      flavor_text:      questOutput.flavor_text,
      title:            questOutput.title,
      description:      questOutput.description,
      success_criteria: questOutput.success_criteria,
      reward_xp:        questOutput.reward_xp,
      expires_at:       computeExpiresAt(tier, timezone).toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("[generate-quest] Supabase insert error", insertError);
    return NextResponse.json({ error: "Failed to save quest." }, { status: 500 });
  }

  return NextResponse.json({ quest }, { status: 201 });
}

// ─── Logging helper ───────────────────────────────────────────────────────────

async function logGeneration(
  userId:           string,
  tier:             string,
  systemPrompt:     string,
  userMessage:      string,
  responseJson:     QuestOutput | null,
  regenerated:      boolean,
  hardNosTriggered: boolean,
  error:            string | null,
) {
  try {
    await supabaseAdmin.from("quest_generation_log").insert({
      user_id:           userId,
      tier,
      system_prompt:     systemPrompt,
      user_message:      userMessage,
      response_json:     responseJson as unknown as Record<string, unknown>,
      regenerated,
      hard_nos_triggered: hardNosTriggered,
      error,
    });
  } catch (err) {
    console.warn("[generate-quest] logging failed", err);
  }
}
