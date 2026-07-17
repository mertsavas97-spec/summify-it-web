import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { createClientIfConfigured } from "@/lib/supabase/server";
import { saveAnalysis } from "@/server/analyses/saveAnalysis";
import type { SaveAnalysisInsertPayload } from "@/server/analyses/buildSavePayload";
import type { GhostSessionPayload } from "@/lib/ghost-session";
import type { SavedAnalysisMetadata } from "@/types/saved-analysis";

const DUPLICATE_WINDOW_MINUTES = 5;

function isValidGhostPayload(body: unknown): body is GhostSessionPayload {
  if (!body || typeof body !== "object") return false;

  const candidate = body as Partial<GhostSessionPayload>;
  if (!candidate.analysisResult || typeof candidate.analysisResult !== "object") return false;
  if (typeof candidate.providerUsed !== "string" || !candidate.providerUsed.trim()) return false;
  if (typeof candidate.fallbackUsed !== "boolean") return false;
  if (!candidate.intelligenceMetadata || typeof candidate.intelligenceMetadata !== "object") return false;
  if (typeof candidate.timestamp !== "number") return false;

  const result = candidate.analysisResult;
  if (!result || typeof result.title !== "string" || typeof result.summary !== "string") return false;
  if (!Array.isArray(result.keyInsights)) return false;
  if (!Array.isArray(result.risksOrWarnings)) return false;
  if (!Array.isArray(result.actionItems)) return false;
  if (!Array.isArray(result.learnCards)) return false;

  return true;
}

export async function POST(request: Request) {
  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (!isValidGhostPayload(body)) {
      return NextResponse.json({ success: false, error: "Invalid guest payload" }, { status: 400 });
    }

    const supabase = await createClientIfConfigured();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
    }

    const duplicateCutoffIso = new Date(
      Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000,
    ).toISOString();

    const recoveredSourceLabel = body.sourceLabel?.trim() || "Recovered guest analysis";
    const title = body.analysisResult.title?.trim() || "Untitled Analysis";
    const intelligenceMode = body.intelligenceModeId?.trim() || "general-summary";
    const sourceKind = body.sourceKind?.trim() || "text";

    const { data: duplicateRecent } = await supabase
      .from("saved_analyses")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", title)
      .eq("source_label", recoveredSourceLabel)
      .gte("created_at", duplicateCutoffIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (duplicateRecent?.id) {
      return NextResponse.json({ success: true, savedAnalysisId: duplicateRecent.id, duplicate: true });
    }

    const metadata: SavedAnalysisMetadata = {
      fallbackUsed: body.fallbackUsed,
      pipelineType: body.intelligenceMetadata.adaptivePlan?.pipelineType,
      tokenRisk: body.intelligenceMetadata.tokenBudget?.riskLevel,
      documentTypeGuess: body.intelligenceMetadata.profile?.documentTypeGuess,
      knowledgeTitleGuess: body.intelligenceMetadata.knowledgeLayerSummary?.titleGuess,
      sourceLabel: recoveredSourceLabel,
    };

    const payload: SaveAnalysisInsertPayload = {
      user_id: user.id,
      title,
      source_kind: sourceKind,
      source_label: recoveredSourceLabel,
      document_type: body.intelligenceMetadata.profile?.documentTypeGuess ?? null,
      intelligence_mode: intelligenceMode,
      provider_used: body.providerUsed,
      summary: {
        title,
        summary: body.analysisResult.summary,
        keyInsights: body.analysisResult.keyInsights,
        risksOrWarnings: body.analysisResult.risksOrWarnings,
        actionItems: body.analysisResult.actionItems,
      },
      learn_cards: body.analysisResult.learnCards,
      metadata,
    };

    const savedAnalysisId = await saveAnalysis(payload);
    if (!savedAnalysisId) {
      return NextResponse.json({ success: false, error: "Failed to save analysis" }, { status: 500 });
    }

    return NextResponse.json({ success: true, savedAnalysisId });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to claim guest analysis" }, { status: 500 });
  }
}