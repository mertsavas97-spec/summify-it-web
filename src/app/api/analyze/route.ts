import { NextResponse } from "next/server";
import {
  runAnalysisOrchestrator,
  AnalysisOrchestratorError,
} from "@/server/ai/orchestrator";
import {
  validateAnalysisInput,
  AnalysisInputError,
} from "@/server/ai/validate-input";
import type {
  AnalyzeApiErrorResponse,
  AnalyzeApiDebugMetadata,
  AnalyzeApiSuccessResponse,
} from "@/server/ai/schemas";
import type { AnalysisIntelligenceContext } from "@/server/intelligence";
import { getOptionalUser } from "@/lib/auth";
import { getProfile, getUserLimits } from "@/lib/supabase/profile";
import { canRunAnalysis, resolvePlanId } from "@/lib/plan-limits";
import { getMaxLearnCardsForPlan, isModeIncludedInPlan } from "@/lib/plan-features";
import { USER_MESSAGES } from "@/lib/user-messages";
import { runPostAnalysisPersistence } from "@/server/analyses/postAnalysisPersistence";
import { devError, devLog, logServerError } from "@/server/logging";

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function buildSuccessDebug(
  mode: string,
  intelligence: AnalysisIntelligenceContext,
  providerUsed: "groq" | "gemini",
  fallbackUsed: boolean,
): AnalyzeApiDebugMetadata {
  return {
    selectedMode: mode as AnalyzeApiDebugMetadata["selectedMode"],
    pipelineType: intelligence.adaptivePlan.pipelineType,
    tokenRisk: intelligence.tokenBudget.riskLevel,
    estimatedPromptChars: intelligence.compactedUserPrompt.length,
    providerUsed,
    fallbackUsed,
  };
}

function buildFailureDebug(
  mode: string,
  error: AnalysisOrchestratorError,
  intelligence?: AnalysisIntelligenceContext,
): AnalyzeApiDebugMetadata {
  return {
    selectedMode: mode as AnalyzeApiDebugMetadata["selectedMode"],
    pipelineType: intelligence?.adaptivePlan.pipelineType ?? "unknown",
    tokenRisk: intelligence?.tokenBudget.riskLevel ?? "unknown",
    estimatedPromptChars: intelligence?.compactedUserPrompt.length,
    failureReason: error.failureReason,
    attempts: error.attempts.map((a) => ({
      provider: a.provider,
      stage: a.stage,
      reason: a.reason,
      message: a.message,
    })),
  };
}

/**
 * POST /api/analyze
 *
 * Intelligence prepass + Groq (primary) + Gemini (fallback).
 */
export async function POST(request: Request) {
  let modeForLog = "unknown";
  let intelligence: AnalysisIntelligenceContext | undefined;

  try {
    const body = (await request.json()) as {
      rawText?: unknown;
      mode?: unknown;
      sourceHint?: unknown;
      sourceContext?: unknown;
    };

    const { rawText, mode, intelligenceModeId, modeRouting, sourceHint, sourceContext } =
      validateAnalysisInput(
        body.rawText,
        body.mode,
        body.sourceHint,
        body.sourceContext,
      );
    modeForLog = intelligenceModeId;

    const currentUser = await getOptionalUser();
    const [profile, limits] = currentUser
      ? await Promise.all([getProfile(currentUser.id), getUserLimits(currentUser.id)])
      : [null, null] as const;
    const planId = currentUser ? resolvePlanId(profile?.plan) : "free";
    const quota = canRunAnalysis({
      storedPlan: profile?.plan,
      usage: limits,
      isAuthenticated: Boolean(currentUser),
    });

    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            quota.warning ??
            "You have reached your current plan limit. Upgrade to continue analyzing today.",
        } satisfies AnalyzeApiErrorResponse,
        { status: 402 },
      );
    }

    if (!isModeIncludedInPlan(intelligenceModeId, planId)) {
      return NextResponse.json(
        {
          success: false,
          error: "This intelligence mode is not included in your current plan.",
        } satisfies AnalyzeApiErrorResponse,
        { status: 403 },
      );
    }

    const orchestratorResult = await runAnalysisOrchestrator(
      rawText,
      mode,
      sourceHint,
      sourceContext,
      modeRouting,
    );
    const { result, providerUsed, fallbackUsed, intelligence: ctx } =
      orchestratorResult;
    intelligence = ctx;
    result.learnCards = result.learnCards.slice(0, getMaxLearnCardsForPlan(planId));

    const response: AnalyzeApiSuccessResponse = {
      success: true,
      providerUsed,
      fallbackUsed,
      result,
      profile: intelligence.profile,
      knowledgeLayerSummary: intelligence.knowledgeLayerSummary,
      tokenBudget: intelligence.tokenBudget,
      adaptivePlan: intelligence.adaptivePlan,
    };

    if (isDevelopment()) {
      response.debug = buildSuccessDebug(mode, intelligence, providerUsed, fallbackUsed);
    }

    if (isDevelopment()) {
      devLog("[summify.analyze] analyze_auth_user", {
        userId: currentUser?.id ?? null,
        email: currentUser?.email ?? null,
      });
    }
    try {
      const persistence = await runPostAnalysisPersistence({
        userId: currentUser?.id ?? null,
        intelligenceModeId,
        sourceHint,
        sourceContext,
        providerUsed,
        fallbackUsed,
        result,
        intelligence,
      });
      response.savedToWorkspace = persistence.savedToWorkspace;
    } catch {
      response.savedToWorkspace = false;
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AnalysisInputError) {
      const payload: AnalyzeApiErrorResponse = {
        success: false,
        error: error.message,
      };
      return NextResponse.json(payload, { status: 400 });
    }

    if (error instanceof AnalysisOrchestratorError) {
      devError("[summify.analyze] orchestrator_error", {
        mode: modeForLog,
        failureReason: error.failureReason,
        attempts: error.attempts,
        pipelineType: intelligence?.adaptivePlan.pipelineType,
        estimatedPromptChars: intelligence?.compactedUserPrompt.length,
        tokenRisk: intelligence?.tokenBudget.riskLevel,
      });

      const payload: AnalyzeApiErrorResponse = {
        success: false,
        error: error.message,
      };

      if (isDevelopment()) {
        payload.debug = buildFailureDebug(
          modeForLog,
          error,
          error.intelligence ?? intelligence,
        );
      }

      return NextResponse.json(payload, { status: 502 });
    }

    logServerError("summify.analyze");
    devError("[summify.analyze] unexpected_error", {
      mode: modeForLog,
      message: error instanceof Error ? error.message : String(error),
    });

    const payload: AnalyzeApiErrorResponse = {
      success: false,
      error: USER_MESSAGES.unexpected,
    };
    return NextResponse.json(payload, { status: 500 });
  }
}
