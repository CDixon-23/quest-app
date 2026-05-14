"use client";

import { useReducer, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { OnboardingAnswers, LifeChapterAnswer, Realm, TimeBudget, Environment, RewardFeeling } from "@/lib/onboarding-schema";
import { Button } from "@/components/ui/button";
import OnboardingProgress from "./components/OnboardingProgress";
import Step1Name from "./steps/Step1Name";
import Step2LifeChapter from "./steps/Step2LifeChapter";
import Step3Realms from "./steps/Step3Realms";
import Step4DaringLevel from "./steps/Step4DaringLevel";
import Step5TimeBudget from "./steps/Step5TimeBudget";
import Step6SkillPuttingOff from "./steps/Step6SkillPuttingOff";
import Step7Environment from "./steps/Step7Environment";
import Step8HardNos from "./steps/Step8HardNos";
import Step9RewardFeelings from "./steps/Step9RewardFeelings";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 9;

type PartialAnswers = {
  adventurerName: string;
  lifeChapter: Partial<LifeChapterAnswer>;
  realms: Realm[];
  daringLevel: number;
  timeBudget: TimeBudget | "";
  skillPuttingOff: string;
  environment: Environment | "";
  hardNos: string;
  rewardFeelings: RewardFeeling[];
};

type State = {
  step: number;
  answers: PartialAnswers;
  submitting: boolean;
  error: string | null;
};

type Action =
  | { type: "UPDATE"; payload: Partial<PartialAnswers> }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "SET_ERROR"; value: string | null };

const initial: State = {
  step: 1,
  answers: {
    adventurerName: "",
    lifeChapter: {},
    realms: [],
    daringLevel: 3,
    timeBudget: "",
    skillPuttingOff: "",
    environment: "",
    hardNos: "",
    rewardFeelings: [],
  },
  submitting: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "UPDATE":
      return { ...state, answers: { ...state.answers, ...action.payload } };
    case "NEXT":
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS) };
    case "BACK":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.value };
    case "SET_ERROR":
      return { ...state, error: action.value };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isStepValid(step: number, a: PartialAnswers): boolean {
  switch (step) {
    case 1: return a.adventurerName.trim().length > 0;
    case 2:
      return (
        !!a.lifeChapter.choice &&
        (a.lifeChapter.choice !== "other" || (a.lifeChapter.other?.trim().length ?? 0) > 0)
      );
    case 3: return a.realms.length >= 1;
    case 4: return a.daringLevel >= 1 && a.daringLevel <= 5;
    case 5: return a.timeBudget !== "";
    case 6: return true;
    case 7: return a.environment !== "";
    case 8: return true;
    case 9: return a.rewardFeelings.length >= 1;
    default: return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initial);
  const { step, answers, submitting, error } = state;
  const valid = isStepValid(step, answers);

  // Redirect already-onboarded users
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("onboarding_answers")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.onboarding_answers && Object.keys(data.onboarding_answers).length > 0) {
            router.replace("/quests");
          }
        });
    });
  }, [router]);

  const update = useCallback((payload: Partial<PartialAnswers>) => {
    dispatch({ type: "UPDATE", payload });
  }, []);

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      dispatch({ type: "NEXT" });
      return;
    }
    // Final step → submit
    dispatch({ type: "SET_SUBMITTING", value: true });
    dispatch({ type: "SET_ERROR", value: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in. Please log in and try again.");

      const completeAnswers = answers as unknown as OnboardingAnswers;

      // NOTE: `display_name` requires a migration update (see supabase/migrations/).
      // Until added, the name lives inside onboarding_answers.adventurerName.
      const { error: dbError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        display_name: completeAnswers.adventurerName,
        onboarding_answers: completeAnswers as unknown as Record<string, unknown>,
      });
      if (dbError) throw dbError;

      router.push("/quests");
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        value: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
    } finally {
      dispatch({ type: "SET_SUBMITTING", value: false });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step1Name
            value={answers.adventurerName}
            onChange={(v) => update({ adventurerName: v })}
          />
        );
      case 2:
        return (
          <Step2LifeChapter
            value={answers.lifeChapter}
            onChange={(v) => update({ lifeChapter: v })}
          />
        );
      case 3:
        return (
          <Step3Realms
            value={answers.realms}
            onChange={(v) => update({ realms: v })}
          />
        );
      case 4:
        return (
          <Step4DaringLevel
            value={answers.daringLevel}
            onChange={(v) => update({ daringLevel: v })}
          />
        );
      case 5:
        return (
          <Step5TimeBudget
            value={answers.timeBudget}
            onChange={(v) => update({ timeBudget: v })}
          />
        );
      case 6:
        return (
          <Step6SkillPuttingOff
            value={answers.skillPuttingOff}
            onChange={(v) => update({ skillPuttingOff: v })}
          />
        );
      case 7:
        return (
          <Step7Environment
            value={answers.environment}
            onChange={(v) => update({ environment: v })}
          />
        );
      case 8:
        return (
          <Step8HardNos
            value={answers.hardNos}
            onChange={(v) => update({ hardNos: v })}
          />
        );
      case 9:
        return (
          <Step9RewardFeelings
            value={answers.rewardFeelings}
            onChange={(v) => update({ rewardFeelings: v })}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="w-full max-w-lg mb-2">
        <p className="font-display text-center text-[#c9952a] text-sm font-semibold tracking-[0.25em] uppercase mb-6">
          ✦ &nbsp;Quest Forge&nbsp; ✦
        </p>
        <OnboardingProgress current={step} total={TOTAL_STEPS} />
      </div>

      {/* Step card */}
      <div className="w-full max-w-lg bg-[#faf6ef] border border-[#c9952a]/25 rounded-2xl shadow-[0_4px_32px_rgba(45,74,30,0.08)] p-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="w-full max-w-lg mt-5 flex items-center justify-between">
        {step > 1 ? (
          <Button
            variant="ghost"
            onClick={() => dispatch({ type: "BACK" })}
            disabled={submitting}
            className="text-[#6b5c44] hover:text-[#1a1209] hover:bg-[#f5ede0]"
          >
            ← Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          onClick={handleNext}
          disabled={!valid || submitting}
          className="bg-[#2d4a1e] hover:bg-[#3d5e2a] text-white px-8 py-2 font-semibold tracking-wide disabled:opacity-40"
        >
          {step === TOTAL_STEPS
            ? submitting
              ? "Forging your legend…"
              : "Begin My Adventure ✦"
            : "Continue →"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 max-w-lg text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 w-full text-center">
          {error}
        </p>
      )}
    </div>
  );
}
