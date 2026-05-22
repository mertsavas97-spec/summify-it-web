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
import type {
  AnalysisSourceHint,
  AnalyzeSourceContext,
} from "@/server/intelligence/types";
import { getOptionalUser } from "@/lib/auth";
import { getProfile, getUserLimits } from "@/lib/supabase/profile";
import { canRunAnalysis } from "@/lib/plan-limits";
import {
  getPracticeCardAccessForPlan,
  toPracticeAccessMeta,
} from "@/lib/learn/practiceCardAccess";
import { canAccessMode, resolveModeEntitlementPlanId } from "@/lib/mode-access";
import { getIntelligenceModeById } from "@/config/modes";
import { USER_MESSAGES } from "@/lib/user-messages";
import {
  ANON_SESSION_COOKIE,
  createAnonymousSessionId,
  readAnonymousSessionId,
} from "@/lib/analytics/anonymousSession";
import { runPostAnalysisPersistence } from "@/server/analyses/postAnalysisPersistence";
import {
  recordAnalysisCompleted,
  recordAnalysisFailed,
} from "@/server/usage/recordAnalysisAnalytics";
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

async function resolveAnonymousSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = readAnonymousSessionId(cookieStore.get(ANON_SESSION_COOKIE)?.value);
  return existing ?? createAnonymousSessionId();
}

function attachAnonymousSessionCookie(
  response: NextResponse,
  sessionId: string,
): NextResponse {
  response.cookies.set(ANON_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return response;
}

function buildSuccessDebug(
  mode: string,
  intelligence: AnalysisIntelligenceContext,
  providerUsed: "groq" | "gemini",
  fallbackUsed: boolean,
  practiceAccess?: AnalyzeApiDebugMetadata["practiceAccess"],
): AnalyzeApiDebugMetadata {
  return {
    selectedMode: mode as AnalyzeApiDebugMetadata["selectedMode"],
    pipelineType: intelligence.adaptivePlan.pipelineType,
    tokenRisk: intelligence.tokenBudget.riskLevel,
    estimatedPromptChars: intelligence.compactedUserPrompt.length,
    providerUsed,
    fallbackUsed,
    ...(intelligence.analysisLimits
      ? { analysisLimits: intelligence.analysisLimits }
      : {}),
    ...(practiceAccess ? { practiceAccess } : {}),
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
            ...(intelligence.cognition.adaptiveLearn
              ? { adaptiveLearn: intelligence.cognition.adaptiveLearn }
              : {}),
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
  let analyzeSourceHint: AnalysisSourceHint | undefined;
  let analyzeSourceContext: AnalyzeSourceContext | undefined;
  let analyzeFileType: string | null = null;
  let analyzeRawTextLength = 0;

  try {
    const body = (await request.json()) as {
      rawText?: unknown;
      mode?: unknown;
      sourceHint?: unknown;
      sourceContext?: unknown;
      fileType?: unknown;
    };

    const currentUser = await getOptionalUser();
    const [profile, limits] = currentUser
      ? await Promise.all([getProfile(currentUser.id), getUserLimits(currentUser.id)])
      : [null, null] as const;

    const planId = resolveModeEntitlementPlanId(profile, Boolean(currentUser));

    const { rawText, mode, intelligenceModeId, modeRouting, sourceHint, sourceContext } =
      validateAnalysisInput(
        body.rawText,
        body.mode,
        body.sourceHint,
        body.sourceContext,
      );
    modeForLog = intelligenceModeId;
    analyzeSourceHint = sourceHint;
    analyzeSourceContext = sourceContext;
    analyzeRawTextLength = rawText.length;
    analyzeFileType =
      typeof body.fileType === "string" ? body.fileType.trim().toLowerCase() : null;

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

    const modeDef = getIntelligenceModeById(intelligenceModeId);
    if (!canAccessMode(intelligenceModeId, planId)) {
      const payload: AnalyzeApiErrorResponse = {
        success: false,
        error:
          modeDef?.availability === "coming_soon"
            ? USER_MESSAGES.analyzeModeComingSoon(modeDef.label)
            : "This mode is available on Scholar or Pro.",
      };
      return NextResponse.json(payload, { status: 403 });
    }

    const orchestratorResult = await runAnalysisOrchestrator(
      rawText,
      mode,
      sourceHint,
      sourceContext,
      modeRouting,
      { planId },
    );
    const { result, providerUsed, fallbackUsed, intelligence: ctx } =
      orchestratorResult;
    intelligence = ctx;

    const cardAccess = getPracticeCardAccessForPlan(planId, result.learnCards);
    const clientResult = {
      ...result,
      learnCards: [...cardAccess.accessibleCards, ...cardAccess.lockedCards],
    };
    const practiceAccessMeta = toPracticeAccessMeta(planId, cardAccess);

    const response: AnalyzeApiSuccessResponse = {
      success: true,
      providerUsed,
      fallbackUsed,
      result: clientResult,
      practiceAccess: practiceAccessMeta,
      profile: intelligence.profile,
      knowledgeLayerSummary: intelligence.knowledgeLayerSummary,
      tokenBudget: intelligence.tokenBudget,
      adaptivePlan: intelligence.adaptivePlan,
      personaUiSectionLabels: intelligence.personaAdaptivePlan?.uiSectionLabels,
      ...(intelligence.limitNotice ? { limitNotice: intelligence.limitNotice } : {}),
    };

    if (isDevelopment()) {
      response.debug = buildSuccessDebug(
        mode,
        intelligence,
        providerUsed,
        fallbackUsed,
        practiceAccessMeta,
      );
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
    let savedAnalysisId: string | null = null;
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
        storedPlan: profile?.plan,
      });
      response.savedToWorkspace = persistence.savedToWorkspace;
      response.savedAnalysisId = persistence.savedAnalysisId;
      savedAnalysisId = persistence.savedAnalysisId;
    } catch {
      response.savedToWorkspace = false;
      response.savedAnalysisId = null;
    }

    const anonymousSessionId = currentUser
      ? null
      : await resolveAnonymousSessionId();

    await recordAnalysisCompleted({
      userId: currentUser?.id ?? null,
      sessionId: anonymousSessionId,
      planId,
      intelligenceMode: intelligenceModeId,
      sourceHint,
      sourceContext,
      fileType: analyzeFileType,
      analysisId: savedAnalysisId,
      charsProcessed:
        intelligence.cleanedText?.length ?? intelligence.analysisLimits?.extractedCharacters ?? analyzeRawTextLength,
      pagesProcessed: intelligence.analysisLimits?.extractedPages,
    });

    const jsonResponse = NextResponse.json(response);
    if (!currentUser) {
      const sessionId = anonymousSessionId ?? (await resolveAnonymousSessionId());
      const cookieStore = await cookies();
      const anonymousUsage = parseAnonymousUsage(
        cookieStore.get(ANONYMOUS_USAGE_COOKIE)?.value,
      );
      attachAnonymousSessionCookie(jsonResponse, sessionId);
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

      const failureUser = await getOptionalUser();
      const failureProfile = failureUser
        ? await getProfile(failureUser.id)
        : null;
      const failurePlan = resolveModeEntitlementPlanId(
        failureProfile,
        Boolean(failureUser),
      );
      const failureSessionId = failureUser ? null : await resolveAnonymousSessionId();

      await recordAnalysisFailed({
        userId: failureUser?.id,
        sessionId: failureSessionId,
        planId: failurePlan,
        intelligenceMode: modeForLog,
        sourceHint: analyzeSourceHint,
        sourceContext: analyzeSourceContext,
        fileType: analyzeFileType,
        reason: error.failureReason,
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
