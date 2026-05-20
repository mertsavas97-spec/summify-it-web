import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
import {
  getMaxLearnCardsForPlan,
  isModeIncludedInPlan,
} from "@/lib/plan-features";
import { USER_MESSAGES } from "@/lib/user-messages";
import { runPostAnalysisPersistence } from "@/server/analyses/postAnalysisPersistence";
import { devError, devLog, logServerError } from "@/server/logging";

const ANONYMOUS_USAGE_COOKIE = "summify_anon_usage";
const ANONYMOUS_DAILY_ANALYSIS_LIMIT = 3;

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseAnonymousUsage(value?: string): { date: string; count: number } {
  const today = utcToday();
  if (!value) return { date: today, count: 0 };

  const [date, rawCount] = value.split(".");
  if (date !== today) return { date: today, count: 0 };

  const count = Number.parseInt(rawCount ?? "0", 10);
  return {
    date: today,
    count: Number.isFinite(count) && count > 0 ? count : 0,
  };
}

function setAnonymousUsageCookie(
  response: NextResponse,
  count: number,
): NextResponse {
  response.cookies.set(ANONYMOUS_USAGE_COOKIE, `${utcToday()}.${count}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 48,
  });
  return response;
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
    ...(intelligence.cognition
      ? {
          cognition: {
            debugSummary: intelligence.cognition.debugSummary,
            adaptationLabel: intelligence.cognition.adaptationLabel,
            domain: intelligence.cognition.domain,
            personaId: intelligence.cognition.personaId,
            adaptivePlanId: intelligence.cognition.adaptivePlanId,
            structureFamily: intelligence.cognition.structureFamily,
            sectionTitles: intelligence.cognition.sectionTitles,
            suppressedDefaultSections: intelligence.cognition.suppressedDefaultSections,
            learnCardStrategySummary: intelligence.cognition.learnCardStrategySummary,
            primaryDimensions: intelligence.cognition.primaryDimensions,
          },
        }
      : {}),
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

    if (!currentUser) {
      const cookieStore = await cookies();
      const anonymousUsage = parseAnonymousUsage(
        cookieStore.get(ANONYMOUS_USAGE_COOKIE)?.value,
      );

      if (anonymousUsage.count >= ANONYMOUS_DAILY_ANALYSIS_LIMIT) {
        const payload: AnalyzeApiErrorResponse = {
          success: false,
          error: "You've used today's 3 free analyses.",
        };
        return NextResponse.json(payload, { status: 429 });
      }
    } else if (!quota.allowed) {
      const payload: AnalyzeApiErrorResponse = {
        success: false,
        error: quota.warning ?? "You've used today's 3 free analyses.",
      };
      return NextResponse.json(payload, { status: 429 });
    }

    if (!isModeIncludedInPlan(intelligenceModeId, planId)) {
      const payload: AnalyzeApiErrorResponse = {
        success: false,
        error: "This mode is available on Scholar or Pro.",
      };
      return NextResponse.json(payload, { status: 403 });
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
    const maxLearnCards = getMaxLearnCardsForPlan(planId);
    const limitedResult = {
      ...result,
      learnCards: result.learnCards.slice(0, maxLearnCards),
    };

    const response: AnalyzeApiSuccessResponse = {
      success: true,
      providerUsed,
      fallbackUsed,
      result: limitedResult,
      profile: intelligence.profile,
      knowledgeLayerSummary: intelligence.knowledgeLayerSummary,
      tokenBudget: intelligence.tokenBudget,
      adaptivePlan: intelligence.adaptivePlan,
    };

    if (isDevelopment()) {
      response.debug = buildSuccessDebug(mode, intelligence, providerUsed, fallbackUsed);
      if (intelligence.cognition?.adaptationLabel) {
        response.adaptationLabel = intelligence.cognition.adaptationLabel;
      }
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
        result: limitedResult,
        intelligence,
        storedPlan: profile?.plan,
      });
      response.savedToWorkspace = persistence.savedToWorkspace;
      response.savedAnalysisId = persistence.savedAnalysisId;
    } catch {
      response.savedToWorkspace = false;
      response.savedAnalysisId = null;
    }

    const jsonResponse = NextResponse.json(response);
    if (!currentUser) {
      const cookieStore = await cookies();
      const anonymousUsage = parseAnonymousUsage(
        cookieStore.get(ANONYMOUS_USAGE_COOKIE)?.value,
      );
      return setAnonymousUsageCookie(jsonResponse, anonymousUsage.count + 1);
    }

    return jsonResponse;
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
