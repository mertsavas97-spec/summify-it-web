import { NextResponse } from "next/server";
import { getOptionalUser, getProfile } from "@/lib/auth";
import { getMaxSavedAnalysesForPlan } from "@/lib/plan-features";
import { resolvePlanId } from "@/lib/plan-limits";
import { saveAnalysis } from "@/server/analyses/saveAnalysis";
import type { SaveAnalysisInsertPayload } from "@/server/analyses/buildSavePayload";
import type { AnalysisSourceHint } from "@/server/intelligence/types";
import type { AnalysisIntelligenceMetadata } from "@/types/intelligence";
import type { IntelligenceModeId } from "@/types/modes";
import type { SavedAnalysisMetadata } from "@/types/saved-analysis";
import type { AnalysisResult } from "@/types/text-analysis";

type PersistBody = {
  result?: AnalysisResult;
  providerUsed?: string;
  fallbackUsed?: boolean;
  intelligenceModeId?: IntelligenceModeId | string;
  sourceHint?: AnalysisSourceHint | string | null;
  sourceLabel?: string | null;
  intelligence?: AnalysisIntelligenceMetadata | null;
};

function isValidResult(result: unknown): result is AnalysisResult {
  if (!result || typeof result !== "object") return false;
  const r = result as Partial<AnalysisResult>;
  return (
    typeof r.title === "string" &&
    typeof r.summary === "string" &&
    Array.isArray(r.keyInsights) &&
    Array.isArray(r.risksOrWarnings) &&
    Array.isArray(r.actionItems) &&
    Array.isArray(r.learnCards)
  );
}

/**
 * POST /api/analyses/persist
 *
 * Retry path when /api/analyze completed but dashboard insert failed.
 * Saves the already-generated result for the authenticated user.
 */
export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: PersistBody;
  try {
    body = (await request.json()) as PersistBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidResult(body.result)) {
    return NextResponse.json({ success: false, error: "Invalid analysis result" }, { status: 400 });
  }

  const providerUsed =
    typeof body.providerUsed === "string" && body.providerUsed.trim()
      ? body.providerUsed.trim()
      : "unknown";
  const fallbackUsed = Boolean(body.fallbackUsed);
  const intelligenceModeId =
    typeof body.intelligenceModeId === "string" && body.intelligenceModeId.trim()
      ? body.intelligenceModeId.trim()
      : "general-summary";
  const sourceHint =
    typeof body.sourceHint === "string" && body.sourceHint.trim()
      ? (body.sourceHint.trim() as AnalysisSourceHint)
      : null;
  const sourceLabel =
    typeof body.sourceLabel === "string" && body.sourceLabel.trim()
      ? body.sourceLabel.trim()
      : null;

  const intelligence = body.intelligence ?? null;
  const metadata: SavedAnalysisMetadata = {
    fallbackUsed,
    pipelineType: intelligence?.adaptivePlan?.pipelineType,
    tokenRisk: intelligence?.tokenBudget?.riskLevel,
    documentTypeGuess: intelligence?.profile?.documentTypeGuess,
    knowledgeTitleGuess: intelligence?.knowledgeLayerSummary?.titleGuess,
    ...(sourceHint ? { sourceType: sourceHint } : {}),
    ...(sourceLabel ? { sourceLabel } : {}),
  };

  const payload: SaveAnalysisInsertPayload = {
    user_id: user.id,
    title: body.result.title.trim() || "Untitled analysis",
    source_kind: sourceHint,
    intelligence_mode: intelligenceModeId,
    provider_used: providerUsed,
    document_type: intelligence?.profile?.documentTypeGuess ?? null,
    source_label: sourceLabel,
    summary: {
      title: body.result.title,
      summary: body.result.summary,
      keyInsights: body.result.keyInsights,
      risksOrWarnings: body.result.risksOrWarnings,
      actionItems: body.result.actionItems,
    },
    learn_cards: body.result.learnCards,
    metadata,
  };

  const profile = await getProfile(user.id);
  const planId = resolvePlanId(profile?.plan);
  const savedAnalysisId = await saveAnalysis(payload, {
    maxSavedAnalyses: getMaxSavedAnalysesForPlan(planId),
    authVerifiedUserId: user.id,
  });

  if (!savedAnalysisId) {
    return NextResponse.json(
      { success: false, error: "Failed to save analysis to dashboard" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    savedAnalysisId,
    savedToWorkspace: true,
  });
}
